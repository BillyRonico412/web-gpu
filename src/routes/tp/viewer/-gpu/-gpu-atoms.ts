import { atom } from "jotai"
import { withAtomEffect } from "jotai-effect"
import type { Viewer } from "@/routes/tp/viewer/-gpu/-wgpu"

export const CANVAS_ID = "viewer-canvas"

const fileDataAtom = atom<string | undefined>()
const viewerAtom = atom<Viewer | undefined>()

const canvasSizeAtom = withAtomEffect(
	atom({ width: 0, height: 0 }),
	(_, set) => {
		const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
		const handleResize = () => {
			const dpr = window.devicePixelRatio || 1
			const width = canvas.clientWidth * dpr
			const height = canvas.clientHeight * dpr
			set(canvasSizeAtom, { width, height })
		}
		handleResize()
		window.addEventListener("resize", handleResize)
		return () => {
			window.removeEventListener("resize", handleResize)
		}
	},
)

const loadFileAtom = atom(null, (_, set) => {
	const input = document.createElement("input")
	input.type = "file"
	input.accept = ".obj"
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement).files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = async (e) => {
				const content = e.target?.result
				if (typeof content === "string") {
					set(fileDataAtom, content)
				}
			}
			reader.readAsText(file)
		}
	}
	input.click()
})

export const gpuAtoms = {
	fileDataAtom,
	viewerAtom,
	canvasSizeAtom,
	loadFileAtom,
}
