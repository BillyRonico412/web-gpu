import { atomEffect } from "jotai-effect"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"
import { CANVAS_ID, gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { initViewer } from "@/routes/tp/viewer/-gpu/-wgpu"
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

const msaaEffect = atomEffect((get) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const msaa = get(renderingAtoms.msaaAtom)
	viewer.updateMsaaView(msaa)
	viewer.updateDepthTexture(msaa)
	viewer.updateRenderPipeline(msaa)
})

const drawEffect = atomEffect((get) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const viewMatrix = get(cameraAtoms.viewMatrixAtom)
	const projectionMatrix = get(cameraAtoms.projectionMatrixAtom)
	const lightDirection = get(lightAtoms.lightDirectionAtom)
	const interpolateNormals = get(lightAtoms.interpolateNormalsAtom)
	const backgroundVec3 = get(gpuAtoms.backgroundVec3Atom)
	const msaa = get(renderingAtoms.msaaAtom)
	viewer.draw({
		viewMatrix,
		projectionMatrix,
		lightDirection,
		interpolateNormals,
		backgroundVec3,
		msaa,
	})
})

const canvasEffect = atomEffect((get) => {
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
	const handleResize = () => {
		const viewer = get(gpuAtoms.viewerAtom)
		const dpr = window.devicePixelRatio || 1
		canvas.width = canvas.clientWidth * dpr
		canvas.height = canvas.clientHeight * dpr
		if (!viewer) {
			return
		}
		const viewMatrix = get(cameraAtoms.viewMatrixAtom)
		const projectionMatrix = get(cameraAtoms.projectionMatrixAtom)
		const lightDirection = get(lightAtoms.lightDirectionAtom)
		const interpolateNormals = get(lightAtoms.interpolateNormalsAtom)
		const backgroundVec3 = get(gpuAtoms.backgroundVec3Atom)
		const msaa = get(renderingAtoms.msaaAtom)
		viewer.updateDepthTexture(msaa)
		viewer.updateMsaaView(msaa)
		viewer.draw({
			viewMatrix,
			projectionMatrix,
			lightDirection,
			interpolateNormals,
			backgroundVec3,
			msaa,
		})
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
	msaaCountEffect: msaaEffect,
}
