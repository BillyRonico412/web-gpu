import { atom } from "jotai"
import { match } from "ts-pattern"
import { mat4, utils, type Vec3, vec3 } from "wgpu-matrix"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"

const targetAtom = atom<Vec3>(vec3.create(0, 0, 0))
const radiusAtom = atom(50)
const azimuthAtom = atom(0)
const elevationAtom = atom(0)
const projectionTypeAtom = atom<"perspective" | "orthographic">("perspective")
const upAtom = atom<Vec3>(vec3.create(0, 1, 0))

const viewMatrixAtom = atom((get) => {
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
	const up = get(upAtom)
	return mat4.lookAt(eye, target, up)
})

const fovAtom = atom(45)
const farAtom = atom((get) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return 1000
	}
	const aabb = viewer.getAABB()
	if (!aabb) {
		return 1000
	}
	return aabb.radius * 10
})

const projectionMatrixAtom = atom((get) => {
	const far = get(farAtom)
	const canvasSize = get(gpuAtoms.canvasSizeAtom)
	const aspect = canvasSize.width / canvasSize.height
	const projectionType = get(projectionTypeAtom)
	switch (projectionType) {
		case "perspective": {
			const fov = get(fovAtom)
			return mat4.perspective(utils.degToRad(fov), aspect, 0.1, far)
		}
		case "orthographic": {
			const radius = get(radiusAtom)
			return mat4.ortho(
				-radius * aspect,
				radius * aspect,
				-radius,
				radius,
				0.1,
				far,
			)
		}
	}
})

type CameraActionType =
	| {
			type: "rotate"
			deltaX: number
			deltaY: number
	  }
	| {
			type: "zoom"
			delta: number
			ctrlKey: boolean
			shiftKey: boolean
	  }
	| {
			type: "pan"
			deltaX: number
			deltaY: number
			ctrlKey: boolean
			shiftKey: boolean
	  }
	| {
			type: "fitToView"
	  }

export const cameraActionAtom = atom(
	null,
	(get, set, cameraAction: CameraActionType) => {
		match(cameraAction)
			.with({ type: "rotate" }, (cameraAction) => {
				const { deltaX, deltaY } = cameraAction
				const nextAzimuth = get(azimuthAtom) - deltaX * 0.5
				const nextElevation = get(elevationAtom) + deltaY * 0.5
				set(azimuthAtom, ((nextAzimuth % 360) + 360) % 360)
				set(elevationAtom, Math.max(-89.9, Math.min(89.9, nextElevation)))
			})
			.with({ type: "zoom" }, (cameraAction) => {
				const viewer = get(gpuAtoms.viewerAtom)
				if (!viewer) {
					return
				}
				const aabb = viewer.getAABB()
				if (!aabb) {
					return
				}
				const { delta, ctrlKey, shiftKey } = cameraAction
				const far = get(farAtom)
				let zoomSpeed = 0.001
				if (ctrlKey) {
					zoomSpeed *= 0.1
				} else if (shiftKey) {
					zoomSpeed *= 10
				}
				const nextRadius = get(radiusAtom) + delta * aabb.radius * zoomSpeed
				if (nextRadius < 0.1 || nextRadius > far) {
					return
				}
				set(radiusAtom, Math.max(0.1, nextRadius))
			})
			.with({ type: "pan" }, (cameraAction) => {
				const viewer = get(gpuAtoms.viewerAtom)
				if (!viewer) {
					return
				}
				const aabb = viewer.getAABB()
				if (!aabb) {
					return
				}
				const { deltaX, deltaY } = cameraAction
				const target = get(targetAtom)
				const viewMatrix = get(viewMatrixAtom)
				const right = vec3.fromValues(
					viewMatrix[0],
					viewMatrix[4],
					viewMatrix[8],
				)
				const up = vec3.fromValues(viewMatrix[1], viewMatrix[5], viewMatrix[9])
				let panSpeed = 0.001
				if (cameraAction.ctrlKey) {
					panSpeed *= 0.1
				} else if (cameraAction.shiftKey) {
					panSpeed *= 10
				}
				const panRight = vec3.scale(right, -deltaX * aabb.radius * panSpeed)
				const panUp = vec3.scale(up, deltaY * aabb.radius * panSpeed)
				const pan = vec3.add(panRight, panUp)
				const nextTarget = vec3.add(target, pan)
				set(targetAtom, nextTarget)
			})
			.with({ type: "fitToView" }, () => {
				const viewer = get(gpuAtoms.viewerAtom)
				if (!viewer) {
					return
				}
				const aabb = viewer.getAABB()
				if (!aabb) {
					return
				}
				const fov = get(fovAtom)
				const radius = (aabb.radius * 2) / Math.sin(utils.degToRad(fov))
				set(targetAtom, aabb.center)
				set(radiusAtom, radius)
			})
			.exhaustive()
	},
)

const turnUpAtom = atom(
	null,
	(get, set, axis: "x" | "z", direction: "cw" | "ccw") => {
		const up = get(upAtom)
		const angle = direction === "cw" ? -Math.PI / 2 : Math.PI / 2
		set(targetAtom, vec3.create(0, 0, 0))
		set(azimuthAtom, 0)
		set(elevationAtom, 0)
		const rotationMatrix = mat4.create()
		if (axis === "x") {
			mat4.rotateX(rotationMatrix, angle)
		} else {
			mat4.rotateZ(rotationMatrix, angle)
		}
		const nextUp = vec3.transformMat4(up, rotationMatrix)
		set(upAtom, nextUp)
	},
)

export const cameraAtoms = {
	targetAtom,
	radiusAtom,
	azimuthAtom,
	elevationAtom,
	viewMatrixAtom,
	fovAtom,
	projectionMatrixAtom,
	farAtom,
	cameraActionAtom,
	projectionTypeAtom,
	upAtom,
	turnUpAtom,
}
