import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { atomEffect } from "jotai-effect"
import type { ReactNode } from "react"

type Theme = "dark" | "light"

export const themeAtom = atomWithStorage<Theme>("theme", "dark")
const themeEffect = atomEffect((get) => {
	const theme = get(themeAtom)
	const root = window.document.documentElement
	root.classList.remove("light", "dark")
	root.classList.add(theme)
})

export function ThemeProvider(props: { children: ReactNode }) {
	useAtom(themeEffect)

	return props.children
}
