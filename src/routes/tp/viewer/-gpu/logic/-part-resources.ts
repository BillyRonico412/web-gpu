import { expose } from "comlink"
import { vec3 } from "wgpu-matrix"
import type {
	Part,
	PartBufferResources,
	PartResources,
} from "@/routes/tp/viewer/-gpu/logic/-types"
import { type AABB, aabb } from "@/routes/tp/viewer/-gpu/logic/utils/AABB"

const getAABB = (part: Part): AABB => {
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

	for (let i = 0; i < part.vertexes.length; i += 4) {
		const vertex = vec3.fromValues(
			part.vertexes[i],
			part.vertexes[i + 1],
			part.vertexes[i + 2],
		)
		const vertexTransformed = vec3.transformMat4(vertex, part.matrix)
		vec3.min(min, vertexTransformed, min)
		vec3.max(max, vertexTransformed, max)
	}

	return aabb.create(min, max)
}

const createObjectResources = async (params: {
	parts: Part[]
}): Promise<PartResources> => {
	const { parts } = params
	// Vertexes buffer
	const allVertexesSize = parts.reduce(
		(acc, partItem) => acc + partItem.vertexes.length,
		0,
	)

	const vertexData = new Float32Array(allVertexesSize)
	let vertexOffset = 0
	for (const partItem of parts) {
		vertexData.set(partItem.vertexes, vertexOffset)
		vertexOffset += partItem.vertexes.length
	}

	// Vertex indexes buffer
	const allVertexIndexesSize = parts.reduce(
		(acc, partItem) => acc + partItem.vertexIndexes.length,
		0,
	)

	const vertexIndexesData = new Uint32Array(allVertexIndexesSize)
	let vertexIndexOffset = 0
	let startVertexIndex = 0
	for (const partItem of parts) {
		for (
			let i = 0;
			i < partItem.vertexIndexes.length;
			i++, vertexIndexOffset++
		) {
			const vertexIndex = partItem.vertexIndexes[i]
			vertexIndexesData[vertexIndexOffset] = vertexIndex + startVertexIndex
		}
		startVertexIndex += partItem.vertexes.length / 4
	}

	// Normals buffer
	const allNormalsSize = parts.reduce(
		(acc, partItem) => acc + partItem.normals.length,
		0,
	)

	const normalData = new Float32Array(allNormalsSize)
	let normalOffset = 0
	for (const partItem of parts) {
		normalData.set(partItem.normals, normalOffset)
		normalOffset += partItem.normals.length
	}

	// Normal indexes buffer
	const allNormalIndexesSize = parts.reduce(
		(acc, partItem) => acc + partItem.normalIndexes.length,
		0,
	)

	const normalIndexesData = new Uint32Array(allNormalIndexesSize)
	let normalIndexOffset = 0
	let startNormalIndex = 0
	for (const partItem of parts) {
		for (
			let i = 0;
			i < partItem.normalIndexes.length;
			i++, normalIndexOffset++
		) {
			const normalIndex = partItem.normalIndexes[i]
			normalIndexesData[normalIndexOffset] = normalIndex + startNormalIndex
		}
		startNormalIndex += partItem.normals.length / 4
	}

	// Part ID buffer
	const partIdData = new Uint32Array(allVertexIndexesSize)
	let partIdOffset = 0
	for (let objIndex = 0; objIndex < parts.length; objIndex++) {
		const partItem = parts[objIndex]
		for (let i = 0; i < partItem.vertexIndexes.length; i++, partIdOffset++) {
			partIdData[partIdOffset] = partItem.partId
		}
	}

	// Material buffer
	const allMaterialsSize = parts.length * 8
	const materialData = new Float32Array(allMaterialsSize)
	let materialOffset = 0
	for (const partItem of parts) {
		const material = partItem.material
		materialData.set(material.color, materialOffset)
		materialData[materialOffset + 4] = material.metallic
		materialData[materialOffset + 5] = material.roughness
		materialOffset += 8
	}

	// Matrix buffer
	const allMatricesSize = parts.length * 16
	const matrixData = new Float32Array(allMatricesSize)
	let matrixOffset = 0
	for (const partItem of parts) {
		matrixData.set(partItem.matrix, matrixOffset)
		matrixOffset += 16
	}

	const aabbMap = parts.map(getAABB)

	const assemblyAabb = aabb.create()
	for (const partAabb of aabbMap) {
		aabb.union(assemblyAabb, partAabb, assemblyAabb)
	}

	return {
		vertexData,
		vertexIndexesData,
		normalData,
		normalIndexesData,
		materialData,
		matrixData,
		partIdData,
		aabbMap,
		assemblyAabb,
	}
}

export const createObjectBufferResources = (
	device: GPUDevice,
	objectResources: PartResources,
): PartBufferResources => {
	const {
		vertexData,
		vertexIndexesData,
		normalData,
		normalIndexesData,
		materialData,
		matrixData,
		partIdData,
	} = objectResources

	const vertexBuffer = device.createBuffer({
		label: "Vertex buffer",
		size: vertexData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(vertexBuffer, 0, vertexData)

	const vertexIndexBuffer = device.createBuffer({
		label: "Face buffer",
		size: vertexIndexesData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(vertexIndexBuffer, 0, vertexIndexesData)

	const normalBuffer = device.createBuffer({
		label: "Normal buffer",
		size: normalData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(normalBuffer, 0, normalData)

	const normalIndexBuffer = device.createBuffer({
		label: "Normal index buffer",
		size: normalIndexesData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(normalIndexBuffer, 0, normalIndexesData)

	const materialBuffer = device.createBuffer({
		label: "Material buffer",
		size: materialData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(materialBuffer, 0, materialData)

	const matrixBuffer = device.createBuffer({
		label: "Matrix buffer",
		size: matrixData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(matrixBuffer, 0, matrixData)

	// Part ID buffer
	const partIdBuffer = device.createBuffer({
		label: "Part ID buffer",
		size: partIdData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(partIdBuffer, 0, partIdData)

	return {
		vertexBuffer,
		vertexIndexBuffer,
		normalBuffer,
		normalIndexBuffer,
		materialBuffer,
		matrixBuffer,
		partIdBuffer,
	}
}

const api = {
	createObjectResources,
}
expose(api)

export type PartResourceWorkerApi = typeof api
