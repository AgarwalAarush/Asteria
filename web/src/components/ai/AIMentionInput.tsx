'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Node as RFNode } from 'reactflow'
import { ReactFlowNodeDataType } from '@/lib/schemas'

interface AIMentionInputProps {
  nodes: Array<RFNode<ReactFlowNodeDataType>>
  placeholder?: string
  className?: string
  onChange?: (plainText: string, mentions: Array<{ id: string; title: string }>, html: string) => void
  onFocusChange?: (focused: boolean) => void
  initialMentions?: Array<{ id: string; title: string }>
}

function extractPlainTextFromHTML(root: HTMLElement): { text: string; mentions: Array<{ id: string; title: string }> } {
  const mentions: Array<{ id: string; title: string }> = []
  let text = ''
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
  let current: Node | null = walker.currentNode
  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement
      if (el.dataset && el.dataset.nodeId) {
        const id = el.dataset.nodeId
        const title = el.dataset.title || el.textContent || ''
        mentions.push({ id: id!, title })
        text += `@${title}`
        current = walker.nextSibling()
        continue
      }
    }
    if (current.nodeType === Node.TEXT_NODE) {
      text += current.nodeValue || ''
    }
    current = walker.nextNode()
  }
  return { text, mentions }
}

export function AIMentionInput({ nodes, placeholder, className = '', onChange, onFocusChange, initialMentions = [] }: AIMentionInputProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [query, setQuery] = useState<string>('')
  const [isSuggestOpen, setIsSuggestOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [menuPos, setMenuPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
  const [mode, setMode] = useState<'node' | 'tag'>('node')
  const isInitializingRef = useRef(false)
  const lastInitialMentionsRef = useRef<string>('')
  const allTags = useMemo(() => {
    const t = new Set<string>()
    nodes.forEach(n => (n.data.tags || []).forEach(tag => t.add(tag)))
    return Array.from(t).sort()
  }, [nodes])

  const filteredNodes = useMemo(() => {
    if (mode !== 'node') return []
    if (!query) return nodes.slice(0, 8)
    const q = query.toLowerCase()
    return nodes.filter(n => n.data.title.toLowerCase().includes(q)).slice(0, 8)
  }, [nodes, query, mode])

  const filteredTags = useMemo(() => {
    if (mode !== 'tag') return []
    if (!query) return allTags.slice(0, 8)
    const q = query.toLowerCase()
    return allTags.filter(tag => tag.toLowerCase().includes(q)).slice(0, 8)
  }, [allTags, query, mode])

  const updateExternalValue = useCallback(() => {
    if (!editorRef.current || isInitializingRef.current) return
    const { text, mentions } = extractPlainTextFromHTML(editorRef.current)
    onChange?.(text, mentions, editorRef.current.innerHTML)
  }, [onChange])

  const closeSuggestions = () => {
    setIsSuggestOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }

  const handleInput = () => {
    if (!editorRef.current) return
    const sel = document.getSelection()
    let activeQuery = ''
    if (sel && sel.anchorNode) {
      const range = sel.getRangeAt(0)
      // Get text content up to the caret within the current line
      const preRange = range.cloneRange()
      preRange.setStart(editorRef.current, 0)
      const preText = preRange.toString()
      // Find last '@' after a whitespace or line start
      const lastAt = preText.lastIndexOf('@')
      if (lastAt !== -1) {
        const afterAt = preText.slice(lastAt + 1)
        const hasSpace = /\s/.test(afterAt)
        if (!hasSpace) {
          // Determine mode and actual query (support @tag:...)
          if (afterAt.startsWith('tag:')) {
            setMode('tag')
            activeQuery = afterAt.slice(4)
          } else {
            setMode('node')
            activeQuery = afterAt
          }
          // Position menu at the '@' horizontal position
          // Walk to the text node at index lastAt
          const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT)
          let remaining = lastAt
          let nodeAt: Text | null = null
          let offsetAt = 0
          while (walker.nextNode()) {
            const t = walker.currentNode as Text
            const len = (t.nodeValue || '').length
            if (remaining <= len) {
              nodeAt = t
              offsetAt = remaining
              break
            }
            remaining -= len
          }
          let left = 0, top = 0
          if (nodeAt) {
            const atRange = document.createRange()
            atRange.setStart(nodeAt, Math.max(0, offsetAt))
            atRange.setEnd(nodeAt, Math.max(0, Math.min(offsetAt + 1, (nodeAt.nodeValue || '').length)))
            const atRect = atRange.getBoundingClientRect()
            const containerRect = containerRef.current!.getBoundingClientRect()
            left = Math.max(0, atRect.left - containerRect.left)
            top = Math.max(0, atRect.bottom - containerRect.top)
          }
          setMenuPos({ left, top })
        }
      }
    }
    if (activeQuery !== '') {
      setQuery(activeQuery)
      setIsSuggestOpen(true)
    } else {
      closeSuggestions()
    }
    updateExternalValue()
  }

  const insertMention = (node: RFNode<ReactFlowNodeDataType>) => {
    if (!editorRef.current) return
    const sel = document.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)

    // Replace the current @query with the mention span
    const pre = range.cloneRange()
    pre.setStart(editorRef.current, 0)
    const preText = pre.toString()
    const atIndex = preText.lastIndexOf('@')
    if (atIndex !== -1) {
      // Walk backwards to find the node/offset at @ position
      const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT)
      let remaining = atIndex
      let nodeAt: Text | null = null
      let offsetAt = 0
      while (walker.nextNode()) {
        const t = walker.currentNode as Text
        const len = (t.nodeValue || '').length
        if (remaining <= len) {
          nodeAt = t
          offsetAt = remaining
          break
        }
        remaining -= len
      }
      if (nodeAt) {
        const replaceRange = document.createRange()
        replaceRange.setStart(nodeAt, offsetAt)
        replaceRange.setEnd(sel.anchorNode!, sel.anchorOffset!)
        replaceRange.deleteContents()

        const span = document.createElement('span')
        span.contentEditable = 'false'
        span.dataset.nodeId = node.id
        span.dataset.title = node.data.title
        span.className = 'inline-flex items-center px-1 py-0 rounded-md border border-gray-200 dark:border-[#262626] bg-gray-100 dark:bg-[#191919] text-gray-900 dark:text-white align-middle'
        span.textContent = `@${node.data.title}`

        const space = document.createTextNode(' ')
        replaceRange.insertNode(space)
        replaceRange.insertNode(span)

        // Move caret after the inserted span and space
        const newRange = document.createRange()
        newRange.setStartAfter(space)
        newRange.collapse(true)
        sel.removeAllRanges()
        sel.addRange(newRange)
      }
    }
    closeSuggestions()
    updateExternalValue()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isSuggestOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const len = mode === 'tag' ? filteredTags.length : filteredNodes.length
      setSelectedIndex(i => (i + 1) % Math.max(len, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const len = mode === 'tag' ? filteredTags.length : filteredNodes.length
      setSelectedIndex(i => (i - 1 + Math.max(len, 1)) % Math.max(len, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (mode === 'tag') {
        const tag = filteredTags[selectedIndex]
        if (tag) insertTagMention(tag)
      } else {
        const node = filteredNodes[selectedIndex]
        if (node) insertMention(node)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeSuggestions()
    }
  }

  const insertTagMention = (tag: string) => {
    if (!editorRef.current) return
    const sel = document.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)

    const pre = range.cloneRange()
    pre.setStart(editorRef.current, 0)
    const preText = pre.toString()
    const atIndex = preText.lastIndexOf('@')
    if (atIndex !== -1) {
      const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT)
      let remaining = atIndex
      let nodeAt: Text | null = null
      let offsetAt = 0
      while (walker.nextNode()) {
        const t = walker.currentNode as Text
        const len = (t.nodeValue || '').length
        if (remaining <= len) {
          nodeAt = t
          offsetAt = remaining
          break
        }
        remaining -= len
      }
      if (nodeAt) {
        const replaceRange = document.createRange()
        replaceRange.setStart(nodeAt, offsetAt)
        replaceRange.setEnd(sel.anchorNode!, sel.anchorOffset!)
        replaceRange.deleteContents()

        const span = document.createElement('span')
        span.contentEditable = 'false'
        span.dataset.tag = tag
        span.className = 'inline-flex items-center px-1 py-0 rounded-md border border-gray-200 dark:border-[#262626] bg-gray-100 dark:bg-[#191919] text-gray-900 dark:text-white align-middle'
        span.textContent = `@tag:${tag}`

        const space = document.createTextNode(' ')
        replaceRange.insertNode(space)
        replaceRange.insertNode(span)

        const newRange = document.createRange()
        newRange.setStartAfter(space)
        newRange.collapse(true)
        sel.removeAllRanges()
        sel.addRange(newRange)
      }
    }
    closeSuggestions()
    updateExternalValue()
  }

  // Populate editor with initial mentions
  useEffect(() => {
    if (!editorRef.current) return
    
    // Check if initialMentions actually changed
    const currentMentionsString = JSON.stringify(initialMentions)
    if (currentMentionsString === lastInitialMentionsRef.current) return
    
    // Set flag to prevent infinite loop
    isInitializingRef.current = true
    
    // Clear existing content
    editorRef.current.innerHTML = ''
    
    // Only populate if we have mentions
    if (initialMentions.length > 0) {
      // Add each mention as a span
      initialMentions.forEach((mention, index) => {
        const span = document.createElement('span')
        span.contentEditable = 'false'
        span.dataset.nodeId = mention.id
        span.dataset.title = mention.title
        span.className = 'inline-flex items-center px-1 py-0 rounded-md border border-gray-200 dark:border-[#262626] bg-gray-100 dark:bg-[#191919] text-gray-900 dark:text-white align-middle'
        span.textContent = `@${mention.title}`
        
        editorRef.current!.appendChild(span)
        
        // Add space after each mention except the last
        if (index < initialMentions.length - 1) {
          editorRef.current!.appendChild(document.createTextNode(' '))
        }
      })
      
      // Add a space at the end if we have mentions
      editorRef.current.appendChild(document.createTextNode(' '))
    }
    
    // Update the reference and clear the flag
    lastInitialMentionsRef.current = currentMentionsString
    isInitializingRef.current = false
    
    // Only call updateExternalValue if we actually have mentions to avoid empty triggers
    if (initialMentions.length > 0) {
      updateExternalValue()
    }
  }, [initialMentions, updateExternalValue])

  useEffect(() => {
    const onClickOutside = (ev: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(ev.target as any)) {
        closeSuggestions()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {!isFocused && (!editorRef.current || editorRef.current.innerText.trim() === '') && (
        <div className="pointer-events-none absolute inset-x-0 top-0 text-gray-500 dark:text-gray-400">
          {placeholder}
        </div>
      )}
      <div
        ref={editorRef}
        className="min-h-[80px] w-full outline-none whitespace-pre-wrap break-words"
        contentEditable
        onInput={handleInput}
        onFocus={() => { setIsFocused(true); onFocusChange?.(true) }}
        onBlur={() => { setIsFocused(false); onFocusChange?.(false); closeSuggestions() }}
        onKeyDown={handleKeyDown}
      />

      {isSuggestOpen && (
        <div
          className="absolute bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#262626] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
          style={{ left: menuPos.left, top: menuPos.top, minWidth: '12rem' }}
        >
          {mode === 'tag'
            ? filteredTags.map((tag, idx) => (
                <button
                  key={tag}
                  className={`w-full px-2 py-1.5 text-left text-sm text-gray-900 dark:text-white first:rounded-t-lg last:rounded-b-lg ${idx === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                  onMouseDown={(e) => { e.preventDefault(); insertTagMention(tag) }}
                >
                  {tag}
                </button>
              ))
            : filteredNodes.map((n, idx) => (
                <button
                  key={n.id}
                  className={`w-full px-2 py-1.5 text-left text-sm text-gray-900 dark:text-white first:rounded-t-lg last:rounded-b-lg ${idx === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(n) }}
                >
                  {n.data.title}
                </button>
              ))}
        </div>
      )}
    </div>
  )
}

export default AIMentionInput


