import { atom } from "jotai"
import { atomWithReset, RESET } from "jotai/utils"
import { match } from "ts-pattern"
import { mat4, utils, type Vec3, vec3 } from "wgpu-matrix"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { aabb } from "@/routes/tp/viewer/-gpu/logic/utils/AABB"

export const NEAR = 0.1

const targetAtom = atom<Vec3>(vec3.create(0, 0, 0))
const radiusAtom = atom(50)
const azimuthAtom = atom(0)
const elevationAtom = atom(0)
const projectionTypeAtom = atomWithReset<"perspective" | "orthographic">(
	"perspective",
)
const upAtom = atomWithReset<Vec3>(vec3.fromValues(0, 1, 0))
const eyeAtom = atom((get) => {
	const target = get(targetAtom)
	const radius = get(radiusAtom)
	const azimuth = utils.degToRad(get(azimuthAtom))
	const elevation = utils.degToRad(get(elevationAtom))
	const up = get(upAtom)

	// Axe polaire = up normalisé
	const polarAxis = vec3.normalize(up)

	// Vecteur de référence stable non parallèle à polarAxis
	const ref =
		Math.abs(vec3.dot(polarAxis, vec3.fromValues(0, 0, 1))) < 0.99
			? vec3.fromValues(0, 0, 1)
			: vec3.fromValues(1, 0, 0)

	// Base orthonormée perpendiculaire à up
	const right = vec3.normalize(vec3.cross(polarAxis, ref))
	const forward = vec3.cross(right, polarAxis)

	// Position en coordonnées sphériques relatives à up
	const equatorial = vec3.add(
		vec3.scale(right, Math.sin(azimuth)),
		vec3.scale(forward, Math.cos(azimuth)),
	)
	const dir = vec3.add(
		vec3.scale(equatorial, Math.cos(elevation)),
		vec3.scale(polarAxis, Math.sin(elevation)),
	)

	return vec3.add(target, vec3.scale(dir, radius))
})

const viewMatrixAtom = atom((get) => {
	const target = get(targetAtom)
	const eye = get(eyeAtom)
	const up = get(upAtom)
	return mat4.lookAt(eye, target, up)
})

const fovAtom = atom(45)
const farAtom = atom((get) => {
	const viewer = get(gpuAtoms.viewerAtom)
	if (!viewer) {
		return 1000
	}
	const assemblyAabb = viewer.assemblyAabb
	if (!assemblyAabb) {
		return 1000
	}
	const assemblyAabbRadius = aabb.getRadius(assemblyAabb)
	return assemblyAabbRadius * 10
})

const projectionMatrixAtom = atom((get) => {
	const far = get(farAtom)
	const canvasSize = get(gpuAtoms.canvasSizeAtom)
	const aspect = canvasSize.width / canvasSize.height
	const projectionType = get(projectionTypeAtom)
	switch (projectionType) {
		case "perspective": {
			const fov = get(fovAtom)
			return mat4.perspective(utils.degToRad(fov), aspect, far, 0.1)
		}
		case "orthographic": {
			const radius = get(radiusAtom)
			return mat4.ortho(
				-radius * aspect,
				radius * aspect,
				-radius,
				radius,
				far,
				0.1,
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
		const viewer = get(gpuAtoms.viewerAtom)
		if (!viewer) {
			return
		}
		const assemblyAabb = viewer.assemblyAabb
		if (!assemblyAabb) {
			return
		}
		const assemblyAabbRadius = aabb.getRadius(assemblyAabb)
		const assemblyAabbCenter = aabb.getCenter(assemblyAabb)
		match(cameraAction)
			.with({ type: "rotate" }, (cameraAction) => {
				const { deltaX, deltaY } = cameraAction
				const nextAzimuth = get(azimuthAtom) - deltaX * 0.5
				const nextElevation = get(elevationAtom) + deltaY * 0.5
				set(azimuthAtom, ((nextAzimuth % 360) + 360) % 360)
				set(elevationAtom, Math.max(-89.9, Math.min(89.9, nextElevation)))
			})
			.with({ type: "zoom" }, (cameraAction) => {
				const { delta, ctrlKey, shiftKey } = cameraAction
				const far = get(farAtom)
				let zoomSpeed = 0.001
				if (ctrlKey) {
					zoomSpeed *= 0.1
				} else if (shiftKey) {
					zoomSpeed *= 10
				}
				const nextRadius =
					get(radiusAtom) + delta * assemblyAabbRadius * zoomSpeed
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
				const assemblyAabb = viewer.assemblyAabb
				if (!assemblyAabb) {
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
				const panRight = vec3.scale(
					right,
					-deltaX * assemblyAabbRadius * panSpeed,
				)
				const panUp = vec3.scale(up, deltaY * assemblyAabbRadius * panSpeed)
				const pan = vec3.add(panRight, panUp)
				const nextTarget = vec3.add(target, pan)
				set(targetAtom, nextTarget)
			})
			.with({ type: "fitToView" }, () => {
				const viewer = get(gpuAtoms.viewerAtom)
				if (!viewer) {
					return
				}
				const assemblyAabb = viewer.assemblyAabb
				if (!assemblyAabb) {
					return
				}
				const fov = get(fovAtom)
				const radius = (assemblyAabbRadius * 2) / Math.sin(utils.degToRad(fov))
				set(targetAtom, assemblyAabbCenter)
				set(radiusAtom, radius)
			})
			.exhaustive()
	},
)

const turnUpAtom = atom(
	null,
	(get, set, axis: "x" | "z", direction: "cw" | "ccw") => {
		const up = get(upAtom)
		const center = vec3.create()
		const angle = direction === "cw" ? -Math.PI / 2 : Math.PI / 2
		let rotatedUp: Vec3
		if (axis === "x") {
			rotatedUp = vec3.rotateX(up, center, angle)
		} else {
			rotatedUp = vec3.rotateZ(up, center, angle)
		}
		set(upAtom, rotatedUp)
	},
)

const cameraResetAtom = atom(null, (_, set) => {
	set(projectionTypeAtom, RESET)
	set(upAtom, RESET)
})

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
	eyeAtom,
	cameraResetAtom,
}
