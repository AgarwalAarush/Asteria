import { useEffect, useState } from 'react'

export function ThemeToggle() {
	const [isDark, setIsDark] = useState(false)

	useEffect(() => {
		const stored = typeof window !== 'undefined' ? localStorage.getItem('asteria-theme') : null
		const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
		const dark = stored ? stored === 'dark' : prefersDark
		setIsDark(dark)
		if (dark) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [])

	const toggle = () => {
		setIsDark(prev => {
			const next = !prev
			if (next) {
				document.documentElement.classList.add('dark')
				localStorage.setItem('asteria-theme', 'dark')
			} else {
				document.documentElement.classList.remove('dark')
				localStorage.setItem('asteria-theme', 'light')
			}
			return next
		})
	}

	return (
		<button
			onClick={toggle}
			className="px-3 py-1 text-sm rounded-md border hover:bg-accent transition-colors"
			aria-label="Toggle theme"
		>
			☀️
		</button>
	)
}
