import { createFileRoute } from "@tanstack/react-router"
import { atom, useAtom, useSetAtom } from "jotai"
import { atomEffect } from "jotai-effect"
import type { MouseEvent } from "react"
import { themeAtom } from "@/components/theme-provider"
import {
	cellPixelDensityAtom,
	gameOfLifeAtom,
	generationTimeAtom,
	isRunningAtom,
} from "@/routes/tp/game-of-life/-atom"
import { Controllers } from "@/routes/tp/game-of-life/-components/-controllers"
import { Info } from "@/routes/tp/game-of-life/-components/-info"
import { Sliders } from "@/routes/tp/game-of-life/-components/-sliders"
import {
	drawLines,
	initGameOfLife,
	resizeCanvas,
} from "@/routes/tp/game-of-life/-wgpu"

export const Route = createFileRoute("/tp/game-of-life/")({
	component: RouteComponent,
})

const canvasEffect = atomEffect((get) => {
	const gameOfLife = get(gameOfLifeAtom)
	const handleResize = () => {
		resizeCanvas()
		drawLines()
		if (gameOfLife) {
			gameOfLife.updateUniformBuffer()
			gameOfLife.updateStorages()
		}
	}
	handleResize()
	window.addEventListener("resize", handleResize)
	return () => {
		window.removeEventListener("resize", handleResize)
	}
})

const initEffect = atomEffect((_, set) => {
	void (async () => {
		const gameOfLife = await initGameOfLife()
		set(gameOfLifeAtom, gameOfLife)
	})()
})

const renderEffect = atomEffect((get) => {
	const isRunning = get(isRunningAtom)
	const generationTime = get(generationTimeAtom)
	const gameOfLife = get(gameOfLifeAtom)
	if (!gameOfLife) {
		return
	}
	if (!isRunning) {
		gameOfLife.draw()
		return
	}
	let intervalId: number | undefined
	intervalId = window.setInterval(() => {
		gameOfLife.computeAndDraw()
	}, generationTime)
	return () => {
		if (intervalId) {
			window.clearInterval(intervalId)
		}
	}
})

const onClickCanvasAtom = atom(null, (get, _, e: MouseEvent) => {
	const gameOfLife = get(gameOfLifeAtom)
	const isRunning = get(isRunningAtom)
	if (!gameOfLife || isRunning) {
		return
	}
	gameOfLife.toggle(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
})

const updateUniformBufferEffect = atomEffect((get) => {
	const gameOfLife = get(gameOfLifeAtom)
	if (!gameOfLife) {
		return
	}
	get(themeAtom)
	drawLines()
	gameOfLife.updateUniformBuffer()
	gameOfLife.draw()
})

const updateStoragesEffect = atomEffect((get) => {
	const gameOfLife = get(gameOfLifeAtom)
	if (!gameOfLife) {
		return
	}
	get(cellPixelDensityAtom)
	drawLines()
	gameOfLife.updateUniformBuffer()
	gameOfLife.updateStorages()
	gameOfLife.draw()
})

function RouteComponent() {
	const onClickCanvas = useSetAtom(onClickCanvasAtom)
	useAtom(initEffect)
	useAtom(canvasEffect)
	useAtom(renderEffect)
	useAtom(updateUniformBufferEffect)
	useAtom(updateStoragesEffect)
	return (
		<div className="relative">
			<canvas
				id="grid"
				className="w-dvw h-dvh absolute top-0 left-0 pointer-events-none"
			/>
			<canvas
				id="game-of-life"
				className="w-dvw h-dvh"
				onClick={onClickCanvas}
			/>
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
				<Controllers />
			</div>
			<div className="absolute top-4 right-4">
				<Sliders />
			</div>
			<div className="absolute top-4 left-4">
				<Info />
			</div>
		</div>
	)
}
