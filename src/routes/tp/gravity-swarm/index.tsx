import { createFileRoute } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { atomEffect } from "jotai-effect"
import { Controller } from "@/routes/tp/gravity-swarm/-controller"
import { initGravitySwarm, resizeCanvas } from "@/routes/tp/gravity-swarm/-wgpu"

export const Route = createFileRoute("/tp/gravity-swarm/")({
	component: RouteComponent,
})

const canvasEffect = atomEffect(() => {
	resizeCanvas()
	window.addEventListener("resize", resizeCanvas)
	return () => {
		window.removeEventListener("resize", resizeCanvas)
	}
})

const runEffect = atomEffect(() => {
	;(async () => {
		const { draw } = await initGravitySwarm()
		let animationFrameId: number | undefined
		const redraw = () => {
			animationFrameId = window.requestAnimationFrame(() => {
				draw()
				redraw()
			})
		}
		redraw()
		return () => {
			if (animationFrameId) {
				window.cancelAnimationFrame(animationFrameId)
			}
		}
	})()
})

function RouteComponent() {
	useAtom(canvasEffect)
	useAtom(runEffect)
	return (
		<div className="w-dvw h-dvh">
			<canvas id="gravity-swarm-canvas" className="w-full h-full" />
			<Controller />
		</div>
	)
}
