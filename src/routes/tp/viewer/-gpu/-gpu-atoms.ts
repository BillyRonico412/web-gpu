import { wrap } from "comlink"
import { atom } from "jotai"
import { withAtomEffect } from "jotai-effect"
import { toast } from "sonner"
import { asyncReadTextFile } from "@/lib/file"
import {
	waitFunctionArrayBufferAtom,
	waitFunctionObject3DAtom,
	waitFunctionStringAtom,
} from "@/routes/tp/viewer/-components/-wait-message"
import type { GlbParserWorkerApiType } from "@/routes/tp/viewer/-glb/-parser"
import type { Part } from "@/routes/tp/viewer/-gpu/logic/-types"
import type { Viewer } from "@/routes/tp/viewer/-gpu/logic/-wgpu"
import type { ObjParserWorkerAPiType } from "@/routes/tp/viewer/-obj/-parser"

const parseObjWorker = new Worker(
	new URL("../-obj/-parser.ts", import.meta.url),
	{ type: "module" },
)
const parseObjProxy = wrap<ObjParserWorkerAPiType>(parseObjWorker)
const parseGlbWorker = new Worker(
	new URL("../-glb/-parser.ts", import.meta.url),
	{ type: "module" },
)
const parseGlbProxy = wrap<GlbParserWorkerApiType>(parseGlbWorker)

export const CANVAS_ID = "viewer-canvas"

const drawTriggerAtom = atom(0)
const objects3DAtom = atom<Part[] | undefined>(undefined)
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

		let selectedObjFile: File | undefined
		let selectedGlbFile: File | undefined

		const file = files[0]
		if (file.name.endsWith(".obj")) {
			selectedObjFile = file
		}
		if (file.name.endsWith(".glb")) {
			selectedGlbFile = file
		}

		if (!selectedObjFile && !selectedGlbFile) {
			toast.error("Please select a .obj or .glb file")
			return
		}

		if (selectedObjFile) {
			const objContent = await set(waitFunctionStringAtom, {
				async fn() {
					return await asyncReadTextFile(selectedObjFile)
				},
				message: "Loading .obj file...",
			})
			const parts = await set(waitFunctionObject3DAtom, {
				async fn() {
					return await parseObjProxy.parseObj(objContent)
				},
				message: "Parsing .obj file...",
			})
			set(objects3DAtom, parts)
			return
		}

		if (selectedGlbFile) {
			const glbContent = await set(waitFunctionArrayBufferAtom, {
				async fn() {
					return await selectedGlbFile.arrayBuffer()
				},
				message: "Loading .glb file...",
			})
			const parts = await set(waitFunctionObject3DAtom, {
				async fn() {
					return await parseGlbProxy.parseGlb(glbContent)
				},
				message: "Parsing .glb file...",
			})
			set(objects3DAtom, parts)
			return
		}
	}
	input.click()
})

export const gpuAtoms = {
	objects3DAtom,
	viewerAtom,
	canvasSizeAtom,
	loadFileAtom,
	drawTriggerAtom,
}
