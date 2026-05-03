import { atomEffect } from "jotai-effect"
import { match, P } from "ts-pattern"
import { cameraAtoms, NEAR } from "@/routes/tp/viewer/-camera/-camera-atoms"
import { waitMessageAtom } from "@/routes/tp/viewer/-components/-wait-message"
import { CANVAS_ID, gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { emitter } from "@/routes/tp/viewer/-gpu/logic/-event-emitter"
import { initViewer } from "@/routes/tp/viewer/-gpu/logic/-wgpu"
import { lightAtoms } from "@/routes/tp/viewer/-light/-light-atoms"
import { renderingAtoms } from "@/routes/tp/viewer/-rendering/-rendering-atoms"

const initViewerEffect = atomEffect((get, set) => {
	const parts = get(gpuAtoms.objects3DAtom)
	if (parts === undefined) {
		return
	}
	;(async () => {
		const viewer = await initViewer(parts)
		set(gpuAtoms.viewerAtom, (prev) => {
			if (prev) {
				prev.cleanup()
			}
			return viewer
		})
		set(cameraAtoms.cameraActionAtom, { type: "fitToView" })
	})()
})

const drawEffect = atomEffect((get) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	get(gpuAtoms.drawTriggerAtom)
	const viewMatrix = get(cameraAtoms.viewMatrixAtom)
	const projectionMatrix = get(cameraAtoms.projectionMatrixAtom)
	const lightDirection = get(lightAtoms.lightDirectionAtom)
	const background = get(renderingAtoms.backgroundAtom)
	const shadingMode = get(renderingAtoms.shadingModeAtom)
	const cameraPosition = get(cameraAtoms.eyeAtom)
	const ambient = get(lightAtoms.ambientAtom)
	const specularIntensity = get(lightAtoms.specularIntensityAtom)
	const culling = get(renderingAtoms.cullingAtom)
	const displayMode = get(renderingAtoms.displayModeAtom)
	const far = get(cameraAtoms.farAtom)
	const technicalConfig = get(renderingAtoms.technicalConfigAtom)
	viewer.draw({
		culling,
		viewMatrix,
		projectionMatrix,
		lightDirection,
		background,
		shadingMode,
		cameraPosition,
		ambient,
		specularIntensity,
		displayMode,
		far,
		near: NEAR,
		technicalConfig,
	})
})

const canvasEffect = atomEffect((get, set) => {
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
	const handleResize = () => {
		const viewer = get(gpuAtoms.viewerAtom)
		const dpr = window.devicePixelRatio || 1
		canvas.width = canvas.clientWidth * dpr
		canvas.height = canvas.clientHeight * dpr
		if (!viewer) {
			return
		}
		viewer.updateTextureByCanvasResize()
		set(gpuAtoms.drawTriggerAtom, (prev) => prev + 1)
	}
	handleResize()
	const resizeObserver = new ResizeObserver(handleResize)
	resizeObserver.observe(canvas)
	return () => {
		resizeObserver.unobserve(canvas)
	}
})

const loadingStateEffect = atomEffect((_, set) => {
	emitter.on("updateLoadingState", (state) => {
		match(state)
			.with(P.union("idle", "done"), () => {
				set(waitMessageAtom, undefined)
			})
			.with("init-webgpu", () => {
				set(waitMessageAtom, "Initializing WebGPU...")
			})
			.with("create-object-resources", () => {
				set(waitMessageAtom, "Creating object resources...")
			})
			.with("create-normal-resources", () => {
				set(waitMessageAtom, "Computing normals...")
			})
			.with("create-render-resources", () => {
				set(waitMessageAtom, "Creating render resources...")
			})
			.exhaustive()
	})
})

export const gpuEffects = {
	initViewerEffect,
	drawEffect,
	canvasEffect,
	loadingStateEffect,
}
