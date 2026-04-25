import { wrap } from "comlink"
import hexRgb from "hex-rgb"
import { atom } from "jotai"
import { withAtomEffect } from "jotai-effect"
import { toast } from "sonner"
import { vec3 } from "wgpu-matrix"
import { asyncReadTextFile } from "@/lib/file"
import type { Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"
import type { Viewer } from "@/routes/tp/viewer/-gpu/logic/-wgpu"
import type { ObjParserWorkerAPiType } from "@/routes/tp/viewer/-obj/-parser"

const parseObjWorker = new Worker(
	new URL("../-obj/-parser.ts", import.meta.url),
	{ type: "module" },
)
const parseObjProxy = wrap<ObjParserWorkerAPiType>(parseObjWorker)

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
	input.multiple = true
	input.onchange = async (e) => {
		const files = (e.target as HTMLInputElement).files
		if (!files || files.length === 0) {
			toast.error("No file selected")
			return
		}
		if (files.length > 1) {
			toast.error("Please select 1 files (.obj and .glb)")
			return
		}

		let objFile: File | undefined

		const file = files[0]
		if (file.name.endsWith(".obj")) {
			objFile = file
		}

		if (!objFile) {
			toast.error("Please select a .obj file")
			return
		}

		if (objFile) {
			const objContent = await asyncReadTextFile(objFile)
			const objects3D = await parseObjProxy.parseObj(objContent)
			set(objects3DAtom, objects3D)
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
