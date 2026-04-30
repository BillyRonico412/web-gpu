import { expose } from "comlink"
import { vec3 } from "wgpu-matrix"
import type {
	AABB,
	Object3D,
	ObjectBufferResources,
	ObjectResources,
} from "@/routes/tp/viewer/-gpu/logic/-types"

const getAABB = (objects3D: Object3D[]): AABB => {
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

	for (const object3D of objects3D) {
		for (let i = 0; i < object3D.vertexes.length; i += 4) {
			const vertex = vec3.fromValues(
				object3D.vertexes[i],
				object3D.vertexes[i + 1],
				object3D.vertexes[i + 2],
			)
			vec3.min(min, vertex, min)
			vec3.max(max, vertex, max)
		}
	}

	const center = vec3.create()
	vec3.add(min, max, center)
	vec3.scale(center, 0.5, center)
	const radius = vec3.distance(min, max) / 2
	return {
		min,
		max,
		center,
		radius,
	}
}

const createObjectResources = async (params: {
	objects3D: Object3D[]
}): Promise<ObjectResources> => {
	const { objects3D } = params
	// Vertexes buffer
	const allVertexesSize = objects3D.reduce(
		(acc, obj) => acc + obj.vertexes.length,
		0,
	)

	const vertexData = new Float32Array(allVertexesSize)
	let vertexOffset = 0
	for (const obj of objects3D) {
		vertexData.set(obj.vertexes, vertexOffset)
		vertexOffset += obj.vertexes.length
	}

	// Vertex indexes buffer
	const allVertexIndexesSize = objects3D.reduce(
		(acc, obj) => acc + obj.vertexIndexes.length,
		0,
	)

	const vertexIndexesData = new Uint32Array(allVertexIndexesSize)
	let vertexIndexOffset = 0
	let startVertexIndex = 0
	for (const obj of objects3D) {
		for (let i = 0; i < obj.vertexIndexes.length; i++, vertexIndexOffset++) {
			const vertexIndex = obj.vertexIndexes[i]
			vertexIndexesData[vertexIndexOffset] = vertexIndex + startVertexIndex
		}
		startVertexIndex += obj.vertexes.length / 4
	}

	// Normals buffer
	const allNormalsSize = objects3D.reduce(
		(acc, obj) => acc + obj.normals.length,
		0,
	)

	const normalData = new Float32Array(allNormalsSize)
	let normalOffset = 0
	for (const obj of objects3D) {
		normalData.set(obj.normals, normalOffset)
		normalOffset += obj.normals.length
	}

	// Normal indexes buffer
	const allNormalIndexesSize = objects3D.reduce(
		(acc, obj) => acc + obj.normalIndexes.length,
		0,
	)

	const normalIndexesData = new Uint32Array(allNormalIndexesSize)
	let normalIndexOffset = 0
	let startNormalIndex = 0
	for (const obj of objects3D) {
		for (let i = 0; i < obj.normalIndexes.length; i++, normalIndexOffset++) {
			const normalIndex = obj.normalIndexes[i]
			normalIndexesData[normalIndexOffset] = normalIndex + startNormalIndex
		}
		startNormalIndex += obj.normals.length / 4
	}

	// Material buffer
	const allMaterials = objects3D.map((o) => o.material)

	const materialData = new Float32Array(allMaterials.length * 8)
	let materialOffset = 0
	for (const obj of objects3D) {
		const material = obj.material
		materialData.set(material.color, materialOffset)
		materialData[materialOffset + 4] = material.metallic
		materialData[materialOffset + 5] = material.roughness
		materialOffset += 8
	}

	// Material indexes buffer
	const materialIndexesData = new Uint32Array(allVertexIndexesSize)
	let materialIndexOffset = 0
	for (let objIndex = 0; objIndex < objects3D.length; objIndex++) {
		const obj = objects3D[objIndex]
		for (let i = 0; i < obj.vertexIndexes.length; i++, materialIndexOffset++) {
			materialIndexesData[materialIndexOffset] = objIndex
		}
	}

	// Matrix buffer
	const allMatricesSize = objects3D.length * 16
	const matrixData = new Float32Array(allMatricesSize)
	let matrixOffset = 0
	for (const obj of objects3D) {
		matrixData.set(obj.matrix, matrixOffset)
		matrixOffset += 16
	}

	// Matrix indexes buffer
	const matrixIndexesData = new Uint32Array(allVertexIndexesSize)
	let matrixIndexOffset = 0
	for (let objIndex = 0; objIndex < objects3D.length; objIndex++) {
		const obj = objects3D[objIndex]
		for (let i = 0; i < obj.vertexIndexes.length; i++, matrixIndexOffset++) {
			matrixIndexesData[matrixIndexOffset] = objIndex
		}
	}

	// Geometric ID buffer
	const geometricIdData = new Uint32Array(allVertexIndexesSize)
	let geometricIdOffset = 0
	for (let objIndex = 0; objIndex < objects3D.length; objIndex++) {
		const obj = objects3D[objIndex]
		for (let i = 0; i < obj.vertexIndexes.length; i++, geometricIdOffset++) {
			geometricIdData[geometricIdOffset] = obj.geometricId
		}
	}

	const aabb = getAABB(objects3D)

	return {
		vertexData,
		vertexIndexesData,
		normalData,
		normalIndexesData,
		materialData,
		materialIndexesData,
		matrixData,
		matrixIndexesData,
		geometricIdData,
		aabb,
	}
}

export const createObjectBufferResources = (
	device: GPUDevice,
	objectResources: ObjectResources,
): ObjectBufferResources => {
	const {
		vertexData,
		vertexIndexesData,
		normalData,
		normalIndexesData,
		materialData,
		materialIndexesData,
		matrixData,
		matrixIndexesData,
		geometricIdData,
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

	const materialIndexBuffer = device.createBuffer({
		label: "Material index buffer",
		size: materialIndexesData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(materialIndexBuffer, 0, materialIndexesData)

	const matrixBuffer = device.createBuffer({
		label: "Matrix buffer",
		size: matrixData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(matrixBuffer, 0, matrixData)

	const matrixIndexBuffer = device.createBuffer({
		label: "Matrix index buffer",
		size: matrixIndexesData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(matrixIndexBuffer, 0, matrixIndexesData)

	// Geometric ID buffer
	const geometricIdBuffer = device.createBuffer({
		label: "Geometric ID buffer",
		size: geometricIdData.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(geometricIdBuffer, 0, geometricIdData)

	return {
		vertexBuffer,
		vertexIndexBuffer,
		normalBuffer,
		normalIndexBuffer,
		materialBuffer,
		materialIndexBuffer,
		matrixBuffer,
		matrixIndexBuffer,
		geometricIdBuffer,
	}
}

const api = {
	createObjectResources,
}
expose(api)

export type ObjectResourceWorkerApi = typeof api
