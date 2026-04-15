import { atomEffect } from "jotai-effect"
import { CANVAS_ID, cameraActionAtom } from "@/routes/tp/viewer-obj/-atom"

export const canvasEventEffect = atomEffect((_, set) => {
	const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement

	const handleMouseMove = (e: MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.buttons === 2) {
			set(cameraActionAtom, {
				type: "rotate",
				deltaX: e.movementX,
				deltaY: e.movementY,
			})
		}
		if (e.buttons === 4) {
			set(cameraActionAtom, {
				type: "pan",
				deltaX: e.movementX,
				deltaY: e.movementY,
				ctrlKey: e.ctrlKey,
				shiftKey: e.shiftKey,
			})
		}
	}

	const handleWheel = (e: WheelEvent) => {
		e.stopPropagation()
		e.preventDefault()
		set(cameraActionAtom, {
			type: "zoom",
			delta: e.deltaY,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey,
		})
	}

	const handleDblClick = (e: MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		set(cameraActionAtom, { type: "fitToView" })
	}

	let lastTouch = { x: 0, y: 0 }
	let lastDist = 0

	const handleTouchStart = (e: TouchEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.touches.length === 1) {
			const touch = e.touches[0]
			lastTouch = { x: touch.clientX, y: touch.clientY }
		} else if (e.touches.length === 2) {
			const touch1 = e.touches[0]
			const touch2 = e.touches[1]
			lastDist = Math.hypot(
				touch2.clientX - touch1.clientX,
				touch2.clientY - touch1.clientY,
			)
		}
	}

	const handleTouchMove = (e: TouchEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.touches.length === 1) {
			const touch = e.touches[0]
			const deltaX = touch.clientX - lastTouch.x
			const deltaY = touch.clientY - lastTouch.y
			set(cameraActionAtom, {
				type: "rotate",
				deltaX,
				deltaY,
			})
			lastTouch = { x: touch.clientX, y: touch.clientY }
		} else if (e.touches.length === 2) {
			const touch1 = e.touches[0]
			const touch2 = e.touches[1]
			const dist = Math.hypot(
				touch2.clientX - touch1.clientX,
				touch2.clientY - touch1.clientY,
			)
			const delta = dist - lastDist * -10
			set(cameraActionAtom, {
				type: "zoom",
				delta,
				ctrlKey: false,
				shiftKey: false,
			})
			lastDist = dist
		}
	}

	canvas.addEventListener("mousemove", handleMouseMove)
	canvas.addEventListener("wheel", handleWheel, { passive: false })
	canvas.addEventListener("dblclick", handleDblClick)
	canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
	canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
	return () => {
		canvas.removeEventListener("mousemove", handleMouseMove)
		canvas.removeEventListener("wheel", handleWheel)
		canvas.removeEventListener("dblclick", handleDblClick)
		canvas.removeEventListener("touchstart", handleTouchStart)
		canvas.removeEventListener("touchmove", handleTouchMove)
	}
})
