import { expose } from "comlink"
import { vec3 } from "wgpu-matrix"

export type ShadingModeType = "flat" | "smooth" | "auto"

export type NormalResources = {
	mixNormals: Float32Array
	flatNormalIndexes: Uint32Array
	smoothNormalIndexes: Uint32Array
	autoNormalIndexes: Uint32Array
}

export const computeNormal = (
	vertex: Float32Array,
	vertexIndex: Uint32Array,
): NormalResources => {
	const nbTriangles = vertexIndex.length / 3
	const flatNormals = new Float32Array(nbTriangles * 4)
	const flatNormalIndexes = new Uint32Array(vertexIndex.length)

	// Compute flat normals
	for (let i = 0; i < nbTriangles; i++) {
		const idx0 = vertexIndex[i * 3 + 0]
		const idx1 = vertexIndex[i * 3 + 1]
		const idx2 = vertexIndex[i * 3 + 2]

		const v0 = vec3.fromValues(
			vertex[idx0 * 4 + 0],
			vertex[idx0 * 4 + 1],
			vertex[idx0 * 4 + 2],
		)
		const v1 = vec3.fromValues(
			vertex[idx1 * 4 + 0],
			vertex[idx1 * 4 + 1],
			vertex[idx1 * 4 + 2],
		)
		const v2 = vec3.fromValues(
			vertex[idx2 * 4 + 0],
			vertex[idx2 * 4 + 1],
			vertex[idx2 * 4 + 2],
		)

		const edge1 = vec3.sub(v1, v0)
		const edge2 = vec3.sub(v2, v0)
		const normal = vec3.cross(edge1, edge2)

		flatNormals.set(normal, i * 4)
		flatNormalIndexes.set([i, i, i], i * 3)
	}

	// Compute smooth normals
	const smoothNormals = new Float32Array(vertex.length)
	const smoothNormalIndexes = new Uint32Array(vertexIndex.length)

	for (let i = 0; i < vertexIndex.length; i++) {
		const currentVertexIndex = vertexIndex[i]
		const normalIndex = flatNormalIndexes[i]
		const currentFlatNormal = flatNormals.subarray(
			normalIndex * 4,
			normalIndex * 4 + 3,
		)
		const currentSmoothNormal = smoothNormals.subarray(
			currentVertexIndex * 4,
			currentVertexIndex * 4 + 3,
		)
		const normalSum = vec3.add(currentSmoothNormal, currentFlatNormal)
		const nbNormal = smoothNormals[currentVertexIndex * 4 + 3] + 1
		smoothNormals.set(normalSum, currentVertexIndex * 4)
		smoothNormals.set([nbNormal], currentVertexIndex * 4 + 3)
		smoothNormalIndexes[i] = currentVertexIndex
	}

	// Compute the average for smooth normals
	const nbVertices = vertex.length / 4
	for (let i = 0; i < nbVertices; i++) {
		const normal = smoothNormals.subarray(i * 4, i * 4 + 3)
		const count = smoothNormals[i * 4 + 3]
		const averagedNormal = vec3.scale(normal, 1 / count)
		smoothNormals.set(averagedNormal, i * 4)
	}

	// Normalize flat and smooth normals
	for (let i = 0; i < flatNormals.length / 4; i++) {
		const normal = flatNormals.subarray(i * 4, i * 4 + 3)
		const normalizedNormal = vec3.normalize(normal)
		flatNormals.set(normalizedNormal, i * 4)
	}

	for (let i = 0; i < smoothNormals.length / 4; i++) {
		const normal = smoothNormals.subarray(i * 4, i * 4 + 3)
		const normalizedNormal = vec3.normalize(normal)
		smoothNormals.set(normalizedNormal, i * 4)
	}

	// Mix flat and smooth normals into a single buffer
	const mixNormals = new Float32Array(flatNormals.length + smoothNormals.length)
	mixNormals.set(flatNormals, 0)
	mixNormals.set(smoothNormals, flatNormals.length)

	// Compute auto normals
	const THRESHOLD = 0.866 // 30 degrés (cosinus)
	const autoNormalIndexes = new Uint32Array(vertexIndex.length)
	for (let i = 0; i < vertexIndex.length; i++) {
		const flatNormalIndex = flatNormalIndexes[i]
		const smoothNormalIndex = smoothNormalIndexes[i]
		const flatNormal = flatNormals.subarray(
			flatNormalIndex * 4,
			flatNormalIndex * 4 + 3,
		)
		const smoothNormal = smoothNormals.subarray(
			smoothNormalIndex * 4,
			smoothNormalIndex * 4 + 3,
		)
		const dot = vec3.dot(flatNormal, smoothNormal)
		if (dot < THRESHOLD) {
			autoNormalIndexes[i] = flatNormalIndex
		} else {
			autoNormalIndexes[i] = smoothNormalIndex + nbTriangles
		}
	}

	// Adjust smooth normal indexes to point to the correct position in the mixed buffer
	for (let i = 0; i < smoothNormalIndexes.length; i++) {
		smoothNormalIndexes[i] += nbTriangles
	}

	return {
		mixNormals,
		flatNormalIndexes,
		smoothNormalIndexes,
		autoNormalIndexes,
	}
}

const api = {
	computeNormal,
}
expose(api)

export type NormalWorkerApi = typeof api
