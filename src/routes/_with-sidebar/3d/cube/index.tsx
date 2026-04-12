import { createFileRoute } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { atomEffect } from "jotai-effect"
import {
	angleRotateXAtom,
	angleRotateYAtom,
	angleRotateZAtom,
	cubeAtom,
	distanceCameraAtom,
	fovAngleAtom,
} from "@/routes/_with-sidebar/3d/cube/-atom"
import { Controllers } from "@/routes/_with-sidebar/3d/cube/-controllers"
import { initCube } from "@/routes/_with-sidebar/3d/cube/-wgpu"

export const Route = createFileRoute("/_with-sidebar/3d/cube/")({
	component: RouteComponent,
})

const canvasEffect = atomEffect((get) => {
	const canvas = document.querySelector("#cube-canvas") as HTMLCanvasElement
	const handleResize = () => {
		const cube = get(cubeAtom)
		const dpr = window.devicePixelRatio || 1
		canvas.width = canvas.clientWidth * dpr
		canvas.height = canvas.clientHeight * dpr
		if (!cube) {
			return
		}
		const angleRotateX = get(angleRotateXAtom)
		const angleRotateY = get(angleRotateYAtom)
		const angleRotateZ = get(angleRotateZAtom)
		const distanceCamera = get(distanceCameraAtom)
		const fovAngle = get(fovAngleAtom)
		cube.draw({
			angleRotateX,
			angleRotateY,
			angleRotateZ,
			distanceCamera,
			fovAngle,
		})
	}
	handleResize()
	window.addEventListener("resize", handleResize)
	return () => {
		window.removeEventListener("resize", handleResize)
	}
})

const initCubeEffect = atomEffect((_, set) => {
	;(async () => {
		const cube = await initCube()
		set(cubeAtom, cube)
	})()
})

const drawEffect = atomEffect((get) => {
	const cube = get(cubeAtom)
	if (!cube) {
		return
	}
	const angleRotateX = get(angleRotateXAtom)
	const angleRotateY = get(angleRotateYAtom)
	const angleRotateZ = get(angleRotateZAtom)
	const distanceCamera = get(distanceCameraAtom)
	const fovAngle = get(fovAngleAtom)
	cube.draw({
		angleRotateX,
		angleRotateY,
		angleRotateZ,
		distanceCamera,
		fovAngle,
	})
})

function RouteComponent() {
	useAtom(canvasEffect)
	useAtom(initCubeEffect)
	useAtom(drawEffect)
	return (
		<div className="relative h-full w-full flex justify-center items-center">
			<div className="h-[90%] w-[90%] border relative">
				<canvas id="cube-canvas" className="w-full h-full" />
				<div className="absolute top-4 right-4">
					<Controllers />
				</div>
			</div>
		</div>
	)
}
