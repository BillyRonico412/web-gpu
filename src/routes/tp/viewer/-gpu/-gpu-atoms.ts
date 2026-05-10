import { wrap } from "comlink"
import { atom } from "jotai"
import { withAtomEffect } from "jotai-effect"
import { toast } from "sonner"
import { asyncReadTextFile } from "@/lib/file"
import { waitMessageAtom } from "@/routes/tp/viewer/-components/-wait-message"
import type { GlbParserWorkerApiType } from "@/routes/tp/viewer/-glb/-parser"
import type { Assembly } from "@/routes/tp/viewer/-gpu/logic/-types"
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
const assemblyAtom = atom<Assembly | undefined>(undefined)
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
		try {
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
				set(waitMessageAtom, "Loading .obj file...")
				const objContent = await asyncReadTextFile(selectedObjFile)
				set(waitMessageAtom, "Parsing .obj file...")
				const assembly = await parseObjProxy.parseObj(objContent)
				set(assemblyAtom, assembly)
				return
			}

			if (selectedGlbFile) {
				set(waitMessageAtom, "Loading .glb file...")
				const glbContent = await selectedGlbFile.arrayBuffer()
				set(waitMessageAtom, "Parsing .glb file...")
				const assembly = await parseGlbProxy.parseGlb(glbContent)
				set(assemblyAtom, assembly)
				return
			}
		} finally {
			set(waitMessageAtom, undefined)
		}
	}
	input.click()
})

export const gpuAtoms = {
	assemblyAtom,
	viewerAtom,
	canvasSizeAtom,
	loadFileAtom,
	drawTriggerAtom,
}
