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

export function AIMentionInput({ nodes, placeholder, className = '', onChange, onFocusChange }: AIMentionInputProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [query, setQuery] = useState<string>('')
  const [isSuggestOpen, setIsSuggestOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredNodes = useMemo(() => {
    if (!query) return nodes.slice(0, 8)
    const q = query.toLowerCase()
    return nodes.filter(n => n.data.title.toLowerCase().includes(q)).slice(0, 8)
  }, [nodes, query])

  const updateExternalValue = useCallback(() => {
    if (!editorRef.current) return
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
          activeQuery = afterAt
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
        span.className = 'inline-flex items-center px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-[#262626] bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-white text-[11px] align-middle'
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
      setSelectedIndex(i => (i + 1) % Math.max(filteredNodes.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => (i - 1 + Math.max(filteredNodes.length, 1)) % Math.max(filteredNodes.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const node = filteredNodes[selectedIndex]
      if (node) insertMention(node)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeSuggestions()
    }
  }

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
        <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#262626] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {filteredNodes.map((n, idx) => (
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


