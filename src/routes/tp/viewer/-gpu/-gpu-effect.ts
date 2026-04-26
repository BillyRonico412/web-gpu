import { atomEffect } from "jotai-effect"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"
import { CANVAS_ID, gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { initViewer } from "@/routes/tp/viewer/-gpu/logic/-wgpu"
import { lightAtoms } from "@/routes/tp/viewer/-light/-light-atoms"
import { renderingAtoms } from "@/routes/tp/viewer/-rendering/-rendering-atoms"

const initViewerEffect = atomEffect((get, set) => {
	const objects3D = get(gpuAtoms.objects3DAtom)
	if (objects3D === undefined) {
		return
	}
	;(async () => {
		const viewer = await initViewer(objects3D)
		set(gpuAtoms.viewerAtom, (prev) => {
			if (prev) {
				prev.cleanup()
			}
			return viewer
		})
		set(cameraAtoms.cameraActionAtom, { type: "fitToView" })
	})()
})

const msaaEffect = atomEffect((get, set) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const msaa = get(renderingAtoms.msaaAtom)
	const culling = get(renderingAtoms.cullingAtom)
	viewer.updateViewTexture(msaa)
	viewer.updateDepthTexture(msaa)
	viewer.updateRenderPipeline({ msaa, culling })
	set(gpuAtoms.drawTriggerAtom, (prev) => prev + 1)
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
	const backgroundVec3 = get(renderingAtoms.backgroundVec3Atom)
	const msaa = get.peek(renderingAtoms.msaaAtom)
	const shadingMode = get(renderingAtoms.shadingModeAtom)
	const cameraPosition = get(cameraAtoms.eyeAtom)
	const ambient = get(lightAtoms.ambientAtom)
	const specularIntensity = get(lightAtoms.specularIntensityAtom)
	const specularEnabled = get(lightAtoms.specularEnabledAtom)
	viewer.draw({
		viewMatrix,
		projectionMatrix,
		lightDirection,
		backgroundVec3,
		msaa,
		shadingMode,
		cameraPosition,
		ambient,
		specularIntensity,
		specularEnabled,
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
		const msaa = get(renderingAtoms.msaaAtom)
		viewer.updateDepthTexture(msaa)
		viewer.updateViewTexture(msaa)
		set(gpuAtoms.drawTriggerAtom, (prev) => prev + 1)
	}
	handleResize()
	const resizeObserver = new ResizeObserver(handleResize)
	resizeObserver.observe(canvas)
	return () => {
		resizeObserver.unobserve(canvas)
	}
})

export const gpuEffects = {
	initViewerEffect,
	drawEffect,
	canvasEffect,
	msaaEffect,
}
