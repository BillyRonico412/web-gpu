import hexRgb from "hex-rgb"
import { atom } from "jotai"
import { withAtomEffect } from "jotai-effect"
import { vec3 } from "wgpu-matrix"
import type { Viewer } from "@/routes/tp/viewer/-gpu/-wgpu"
import bodyPart from "@/routes/tp/viewer/-obj/bp.obj?raw"

export const CANVAS_ID = "viewer-canvas"

const fileDataAtom = atom<string>(bodyPart)
const viewerAtom = atom<Viewer | undefined>()
const backgroundHexAtom = atom<string>("#444")
const backgroundVec3Atom = atom((get) => {
	const hex = get(backgroundHexAtom)
	const rgb = hexRgb(hex)
	return vec3.create(rgb.red / 255, rgb.green / 255, rgb.blue / 255)
})

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
	backgroundHexAtom,
	backgroundVec3Atom,
}
