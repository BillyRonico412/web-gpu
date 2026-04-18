import { atomEffect } from "jotai-effect"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"
import { CANVAS_ID, gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { initViewer } from "@/routes/tp/viewer/-gpu/-wgpu"
import { lightAtoms } from "@/routes/tp/viewer/-light/-light-atoms"
import { renderingAtoms } from "@/routes/tp/viewer/-rendering/-rendering-atoms"

const initViewerEffect = atomEffect((get, set) => {
	const fileData = get(gpuAtoms.fileDataAtom)
	if (fileData === undefined) {
		return
	}
	;(async () => {
		const viewer = await initViewer(fileData)
		set(gpuAtoms.viewerAtom, viewer)
		set(cameraAtoms.cameraActionAtom, { type: "fitToView" })
	})()
})

const msaaCountEffect = atomEffect((get) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return
	}
	const msaa = get(renderingAtoms.msaaAtom)
	viewer.updateMsaaView(msaa)
	viewer.updateDepthTexture(msaa)
	viewer.updateRenderPipeline(msaa)

	const viewMatrix = get.peek(cameraAtoms.viewMatrixAtom)
	const projectionMatrix = get.peek(cameraAtoms.projectionMatrixAtom)
	const lightDirection = get.peek(lightAtoms.lightDirectionAtom)
	const interpolateNormals = get.peek(lightAtoms.interpolateNormalsAtom)
	const backgroundVec3 = get.peek(gpuAtoms.backgroundVec3Atom)
	viewer.draw({
		viewMatrix,
		projectionMatrix,
		lightDirection,
		interpolateNormals,
		backgroundVec3,
		msaa,
	})
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
	msaaCountEffect,
}
