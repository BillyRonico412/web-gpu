import { createFileRoute } from "@tanstack/react-router"
import { produce } from "immer"
import { useAtom, useSetAtom } from "jotai"
import { atomEffect } from "jotai-effect"
import { uniformAtom } from "@/routes/tp/gravity-swarm/-atom"
import { Controller } from "@/routes/tp/gravity-swarm/-controller"
import {
	ClickState,
	initGravitySwarm,
	resizeCanvas,
} from "@/routes/tp/gravity-swarm/-wgpu"

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
	const setUniform = useSetAtom(uniformAtom)
	useAtom(canvasEffect)
	useAtom(runEffect)
	return (
		<div className="w-dvw h-dvh">
			<canvas
				id="gravity-swarm-canvas"
				className="w-full h-full"
				onContextMenu={(e) => {
					e.preventDefault()
				}}
				onMouseDown={(e) => {
					setUniform(
						produce((draft) => {
							if (e.button === 0) {
								draft.clickState = ClickState.Left
							} else if (e.button === 2) {
								draft.clickState = ClickState.Right
							}
							draft.clickPosition = [
								e.clientX * devicePixelRatio,
								e.clientY * devicePixelRatio,
							]
						}),
					)
				}}
				onMouseMove={(e) => {
					setUniform(
						produce((draft) => {
							draft.clickPosition = [e.clientX, e.clientY]
						}),
					)
				}}
				onMouseUp={() => {
					setUniform(
						produce((draft) => {
							draft.clickState = ClickState.None
						}),
					)
				}}
			/>
			<Controller />
		</div>
	)
}
