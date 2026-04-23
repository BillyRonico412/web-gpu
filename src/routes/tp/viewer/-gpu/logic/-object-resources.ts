import { vec3 } from "wgpu-matrix"
import { createNormalBuffer } from "@/routes/tp/viewer/-gpu/logic/-compute-normal"
import type {
	AABB,
	Object3D,
	ObjectResources,
} from "@/routes/tp/viewer/-gpu/logic/-types"
import type { ShadingModeType } from "@/routes/tp/viewer/-rendering/-rendering-atoms"

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

	objects3D
		.flatMap((o) => o.vertexes)
		.forEach((vertex) => {
			vec3.min(min, vertex, min)
			vec3.max(max, vertex, max)
		})
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

export const createObjectResources = (params: {
	device: GPUDevice
	objects3D: Object3D[]
	shadingMode: ShadingModeType
}): ObjectResources => {
	const { device, objects3D, shadingMode } = params
	// Vertexes buffer
	const allVertexes = objects3D.flatMap((o) => o.vertexes)
	const vertexBuffer = device.createBuffer({
		label: "Vertex buffer",
		size: allVertexes.length * 4 * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	const vertexData = new Float32Array(allVertexes.length * 4)
	let vertexOffset = 0
	for (const obj of objects3D) {
		for (let i = 0; i < obj.vertexes.length; i++, vertexOffset++) {
			const vertex = obj.vertexes[i]
			vertexData.set(vertex, vertexOffset * 4)
		}
	}
	device.queue.writeBuffer(vertexBuffer, 0, vertexData)

	// Vertex indexes buffer
	const allVertexIndexes = objects3D.flatMap((o) => o.vertexIndexes)
	const vertexIndexBuffer = device.createBuffer({
		label: "Face buffer",
		size: allVertexIndexes.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	const vertexIndexesData = new Uint32Array(allVertexIndexes.length)
	let vertexIndexOffset = 0
	let startVertexIndex = 0
	for (const obj of objects3D) {
		for (let i = 0; i < obj.vertexIndexes.length; i++, vertexIndexOffset++) {
			const vertexIndex = obj.vertexIndexes[i]
			vertexIndexesData[vertexIndexOffset] = vertexIndex + startVertexIndex
		}
		startVertexIndex += obj.vertexes.length
	}
	device.queue.writeBuffer(vertexIndexBuffer, 0, vertexIndexesData)

	const { normalBuffer, normalIndexBuffer } = createNormalBuffer({
		device,
		objects3D,
		vertexBuffer,
		vertexIndexBuffer,
		shadingMode,
	})

	// Material buffer
	const allMaterials = objects3D.map((o) => o.material)
	const materialBuffer = device.createBuffer({
		label: "Material buffer",
		size: allMaterials.length * 4 * 8,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	const materialData = new Float32Array(allMaterials.length * 8)
	let materialOffset = 0
	for (const obj of objects3D) {
		const material = obj.material
		materialData.set(material.color, materialOffset * 8)
		materialData[materialOffset * 8 + 4] = material.metallic
		materialData[materialOffset * 8 + 5] = material.roughness
		materialOffset++
	}
	device.queue.writeBuffer(materialBuffer, 0, materialData)

	// Material indexes buffer
	const materialIndexBuffer = device.createBuffer({
		label: "Material index buffer",
		size: allVertexIndexes.length * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})

	const materialIndexesData = new Uint32Array(allVertexIndexes.length)
	let materialIndexOffset = 0
	for (let objIndex = 0; objIndex < objects3D.length; objIndex++) {
		const obj = objects3D[objIndex]
		for (let i = 0; i < obj.vertexIndexes.length; i++, materialIndexOffset++) {
			materialIndexesData[materialIndexOffset] = objIndex
		}
	}
	device.queue.writeBuffer(materialIndexBuffer, 0, materialIndexesData)

	const aabb = getAABB(objects3D)

	return {
		vertexBuffer,
		vertexIndexBuffer,
		normalBuffer,
		normalIndexBuffer,
		materialBuffer,
		materialIndexBuffer,
		aabb,
	}
}
