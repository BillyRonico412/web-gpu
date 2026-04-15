import { createFileRoute } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { atomEffect } from "jotai-effect"
import {
	CANVAS_ID,
	cameraActionAtom,
	interpolateNormalsAtom,
	lightDirectionAtom,
	objTextAtom,
	projectionMatrixAtom,
	viewerObjAtom,
	viewMatrixAtom,
} from "@/routes/tp/viewer-obj/-atom"
import { ChooseObjDialog } from "@/routes/tp/viewer-obj/-choose-obj-dialog"
import { Controllers } from "@/routes/tp/viewer-obj/-controllers"
import { canvasEventEffect } from "@/routes/tp/viewer-obj/-event"
import { initViewerObj } from "@/routes/tp/viewer-obj/-wgpu"

export const Route = createFileRoute("/tp/viewer-obj/")({
	component: RouteComponent,
})

const canvasEffect = atomEffect((get) => {
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
	const handleResize = () => {
		const viewerObj = get(viewerObjAtom)
		const dpr = window.devicePixelRatio || 1
		canvas.width = canvas.clientWidth * dpr
		canvas.height = canvas.clientHeight * dpr
		if (!viewerObj) {
			return
		}
		const viewMatrix = get(viewMatrixAtom)
		const projectionMatrix = get(projectionMatrixAtom)
		const lightDirection = get(lightDirectionAtom)
		const interpolateNormals = get(interpolateNormalsAtom)
		viewerObj.updateDepthTexture()
		viewerObj.draw({
			viewMatrix,
			projectionMatrix,
			lightDirection,
			interpolateNormals,
		})
	}
	handleResize()
	window.addEventListener("resize", handleResize)
	return () => {
		window.removeEventListener("resize", handleResize)
	}
})

const initViewerObjEffect = atomEffect((get, set) => {
	const objText = get(objTextAtom)
	if (objText === undefined) {
		return
	}
	;(async () => {
		const viewerObj = await initViewerObj(objText)
		set(viewerObjAtom, viewerObj)
		set(cameraActionAtom, { type: "fitToView" })
	})()
})

const drawEffect = atomEffect((get) => {
	const viewerObj = get(viewerObjAtom)
	if (!viewerObj) {
		return
	}
	const viewMatrix = get(viewMatrixAtom)
	const projectionMatrix = get(projectionMatrixAtom)
	const lightDirection = get(lightDirectionAtom)
	const interpolateNormals = get(interpolateNormalsAtom)
	viewerObj.draw({
		viewMatrix,
		projectionMatrix,
		lightDirection,
		interpolateNormals,
	})
})

function RouteComponent() {
	useAtom(canvasEffect)
	useAtom(initViewerObjEffect)
	useAtom(drawEffect)
	useAtom(canvasEventEffect)
	return (
		<main className="relative w-dvw h-dvh">
			<ChooseObjDialog />
			<div className="w-full h-full">
				<canvas
					id={CANVAS_ID}
					className="w-full h-full"
					onContextMenu={(e) => e.preventDefault()}
				/>
			</div>
			<div className="absolute top-4 right-4 z-10">
				<Controllers />
			</div>
		</main>
	)
}
