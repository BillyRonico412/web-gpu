import { atom } from "jotai"
import { withAtomEffect } from "jotai-effect"
import { mat4, utils, type Vec3, vec3 } from "wgpu-matrix"
import type { ViewerObj } from "@/routes/tp/viewer-obj/-wgpu"

export const CANVAS_ID = "viewer-obj-canvas"

export const objTextAtom = atom<string | undefined>()
export const viewerObjAtom = atom<ViewerObj | undefined>()

export const targetAtom = atom<Vec3>(vec3.create(0, 0, 0))
export const radiusAtom = atom(50)
export const azimuthAtom = atom(0)
export const elevationAtom = atom(0)
export const viewMatrixAtom = atom((get) => {
	const target = get(targetAtom)
	const radius = get(radiusAtom)
	const azimuth = get(azimuthAtom)
	const elevation = get(elevationAtom)
	const eye = vec3.create(
		target[0] +
			radius *
				Math.cos(utils.degToRad(elevation)) *
				Math.sin(utils.degToRad(azimuth)),
		target[1] + radius * Math.sin(utils.degToRad(elevation)),
		target[2] +
			radius *
				Math.cos(utils.degToRad(elevation)) *
				Math.cos(utils.degToRad(azimuth)),
	)
	const up = vec3.create(0, 1, 0)
	return mat4.lookAt(eye, target, up)
})

const canvasSizeAtom = withAtomEffect(
	atom({ width: 0, height: 0 }),
	(_, set) => {
		const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
		const handleResize = () => {
			const dpr = window.devicePixelRatio || 1
			const width = canvas.clientWidth * dpr
			const height = canvas.clientHeight * dpr
			set(canvasSizeAtom, { width, height })
		}
		handleResize()
		window.addEventListener("resize", handleResize)
		return () => {
			window.removeEventListener("resize", handleResize)
		}
	},
)

export const fovAtom = atom(45)
export const projectionMatrixAtom = atom((get) => {
	const fov = get(fovAtom)
	const canvasSize = get(canvasSizeAtom)
	const aspect = canvasSize.width / canvasSize.height
	return mat4.perspective(utils.degToRad(fov), aspect, 0.1, 1000)
})

export const lightDirectionAtom = atom(vec3.create(1, -2, -1))

export const fitToViewAtom = atom(null, (get, set) => {
	const viewerObj = get(viewerObjAtom)
	if (!viewerObj) {
		return
	}
	const aabb = viewerObj.getAABBObj()
	if (!aabb) {
		return
	}
	const fov = get(fovAtom)
	const radius = (aabb.radius * 2) / Math.sin(utils.degToRad(fov))
	set(targetAtom, aabb.center)
	set(radiusAtom, radius)
	set(azimuthAtom, 0)
	set(elevationAtom, 0)
})

export const cameraMoveHandlerAtom = atom(
	null,
	(get, set, event: MouseEvent) => {
		const viewerObj = get(viewerObjAtom)
		if (!viewerObj) {
			return
		}
		if (event.buttons === 2) {
			const deltaX = -event.movementX
			const deltaY = event.movementY
			const nextAzimuth = get(azimuthAtom) + deltaX * 0.5
			const nextElevation = get(elevationAtom) + deltaY * 0.5
			set(azimuthAtom, ((nextAzimuth % 360) + 360) % 360)
			set(elevationAtom, Math.max(-89.9, Math.min(89.9, nextElevation)))
		}
	},
)

export const cameraWheelHandlerAtom = atom(
	null,
	(get, set, event: WheelEvent) => {
		const viewerObj = get(viewerObjAtom)
		if (!viewerObj) {
			return
		}
		const delta = event.deltaY
		const nextRadius = get(radiusAtom) + delta * 0.01
		set(radiusAtom, Math.max(0.1, nextRadius))
	},
)

export const loadObjFileAtom = atom(null, (_, set) => {
	const input = document.createElement("input")
	input.type = "file"
	input.accept = ".obj"
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement).files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = async (e) => {
				const content = e.target?.result
				if (typeof content === "string") {
					set(objTextAtom, content)
				}
			}
			reader.readAsText(file)
		}
	}
	input.click()
})
