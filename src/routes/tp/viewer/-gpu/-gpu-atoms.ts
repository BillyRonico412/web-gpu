import hexRgb from "hex-rgb"
import { atom } from "jotai"
import { withAtomEffect } from "jotai-effect"
import { toast } from "sonner"
import { vec3 } from "wgpu-matrix"
import { parseGLB } from "@/routes/tp/viewer/-glb/-parser"
import type { Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"
import type { Viewer } from "@/routes/tp/viewer/-gpu/logic/-wgpu"
import { parseObj } from "@/routes/tp/viewer/-obj/-parser"

export const CANVAS_ID = "viewer-canvas"

const drawTriggerAtom = atom(0)
const objects3DAtom = atom<Object3D[] | undefined>(undefined)
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
	input.accept = ".obj, .glb"
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement).files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = async (e) => {
				if (!e.target) {
					toast.error("Failed to read file")
					return
				}
				const content = e.target.result
				if (typeof content === "string" && file.name.endsWith(".obj")) {
					const objects3D = await parseObj(content)
					set(objects3DAtom, objects3D)
				} else if (
					content instanceof ArrayBuffer &&
					file.name.endsWith(".glb")
				) {
					const uint8Array = new Uint8Array(content)
					const objects3D = await parseGLB(uint8Array)
					set(objects3DAtom, objects3D)
				} else {
					toast.error("Unsupported file type or content")
				}
			}
			if (file.name.endsWith(".obj")) {
				reader.readAsText(file)
			} else if (file.name.endsWith(".glb")) {
				reader.readAsArrayBuffer(file)
			}
		}
	}
	input.click()
})

export const gpuAtoms = {
	objects3DAtom,
	viewerAtom,
	canvasSizeAtom,
	loadFileAtom,
	backgroundHexAtom,
	backgroundVec3Atom,
	drawTriggerAtom,
}
