import { expose } from "comlink"
import { vec3 } from "wgpu-matrix"
import type { FlatNormalResources } from "@/routes/tp/viewer/-gpu/logic/-types"

export type ShadingModeType = "flat" | "auto"

export const computeNormal = (params: {
	vertex: Float32Array
	vertexIndex: Uint32Array
}): FlatNormalResources => {
	const { vertex, vertexIndex } = params
	const nbTriangles = vertexIndex.length / 3
	const flatNormal = new Float32Array(nbTriangles * 4)
	const flatNormalIndex = new Uint32Array(vertexIndex.length)

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

		flatNormal.set(normal, i * 4)
		flatNormalIndex.set([i, i, i], i * 3)
	}

	return {
		flatNormal,
		flatNormalIndex,
	}
}

export const createFlatNormalBufferResource = (
	device: GPUDevice,
	flatNormalResources: FlatNormalResources,
) => {
	const { flatNormal, flatNormalIndex } = flatNormalResources
	// Flat Normal buffer
	const flatNormalBuffer = device.createBuffer({
		label: "Mix normal buffer",
		size: flatNormal.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(flatNormalBuffer, 0, flatNormal)

	const flatNormalIndexBuffer = device.createBuffer({
		label: "Flat normal index buffer",
		size: flatNormalIndex.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(flatNormalIndexBuffer, 0, flatNormalIndex)
	return {
		flatNormalBuffer,
		flatNormalIndexBuffer,
	}
}

const api = {
	computeNormal,
}
expose(api)

export type NormalWorkerApi = typeof api
