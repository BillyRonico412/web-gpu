import { type Vec3, vec3 } from "wgpu-matrix"
import type { Part } from "@/routes/tp/viewer/-gpu/logic/-types"

export type AABB = {
	min: Vec3
	max: Vec3
}

const create = (min?: Vec3, max?: Vec3): AABB => {
	return {
		min:
			min ??
			vec3.create(
				Number.POSITIVE_INFINITY,
				Number.POSITIVE_INFINITY,
				Number.POSITIVE_INFINITY,
			),
		max:
			max ??
			vec3.create(
				Number.NEGATIVE_INFINITY,
				Number.NEGATIVE_INFINITY,
				Number.NEGATIVE_INFINITY,
			),
	}
}

const getCenter = (aabb: AABB, dest?: Vec3): Vec3 => {
	const center = dest ?? vec3.create()
	vec3.add(aabb.min, aabb.max, center)
	vec3.scale(center, 0.5, center)
	return center
}

const getRadius = (aabb: AABB): number => {
	return vec3.distance(aabb.min, aabb.max) / 2
}

const union = (aabb1: AABB, aabb2: AABB, dest?: AABB): AABB => {
	const min = vec3.min(aabb1.min, aabb2.min)
	const max = vec3.max(aabb1.max, aabb2.max)
	if (dest) {
		dest.min = min
		dest.max = max
		return dest
	}
	return create(min, max)
}

const createFromPart = (params: {
	vertexes: Float32Array
	matrix: Float32Array
}): AABB => {
	const { vertexes, matrix } = params
	const min = vec3.create(
		Number.POSITIVE_INFINITY,
		Number.POSITIVE_INFINITY,
		Number.POSITIVE_INFINITY,
	)
	const max = vec3.create(
		Number.NEGATIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
		Number.NEGATIVE_INFINITY,
	)

	for (let i = 0; i < vertexes.length; i += 4) {
		const vertex = vec3.fromValues(
			vertexes[i],
			vertexes[i + 1],
			vertexes[i + 2],
		)
		const vertexTransformed = vec3.transformMat4(vertex, matrix)
		vec3.min(min, vertexTransformed, min)
		vec3.max(max, vertexTransformed, max)
	}

	return aabb.create(min, max)
}

export const aabb = {
	create,
	getCenter,
	getRadius,
	union,
	createFromPart,
}
