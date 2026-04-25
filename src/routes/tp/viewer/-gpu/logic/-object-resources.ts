import { wrap } from "comlink"
import { vec3 } from "wgpu-matrix"
import type { NormalWorkerApi } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import type {
	AABB,
	Object3D,
	ObjectResources,
} from "@/routes/tp/viewer/-gpu/logic/-types"

const normalWorker = new Worker(
	new URL("../logic/-normal-resources.ts", import.meta.url),
	{ type: "module" },
)
const proxy = wrap<NormalWorkerApi>(normalWorker)

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

export const createObjectResources = async (params: {
	device: GPUDevice
	objects3D: Object3D[]
}): Promise<ObjectResources> => {
	const { device, objects3D } = params
	// Vertexes buffer
	const allVertexesSize = objects3D.reduce(
		(acc, obj) => acc + obj.vertexes.length,
		0,
	)
	const vertexBuffer = device.createBuffer({
		label: "Vertex buffer",
		size: allVertexesSize * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	const vertexData = new Float32Array(allVertexesSize)
	let vertexOffset = 0
	for (const obj of objects3D) {
		vertexData.set(obj.vertexes, vertexOffset)
		vertexOffset += obj.vertexes.length
	}
	device.queue.writeBuffer(vertexBuffer, 0, vertexData)

	// Vertex indexes buffer
	const allVertexIndexesSize = objects3D.reduce(
		(acc, obj) => acc + obj.vertexIndexes.length,
		0,
	)
	const vertexIndexBuffer = device.createBuffer({
		label: "Face buffer",
		size: allVertexIndexesSize * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
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
	device.queue.writeBuffer(vertexIndexBuffer, 0, vertexIndexesData)

	// Normals buffer
	const allNormalsSize = objects3D.reduce(
		(acc, obj) => acc + obj.normals.length,
		0,
	)
	const normalBuffer = device.createBuffer({
		label: "Normal buffer",
		size: allNormalsSize * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
	const normalData = new Float32Array(allNormalsSize)
	let normalOffset = 0
	for (const obj of objects3D) {
		normalData.set(obj.normals, normalOffset)
		normalOffset += obj.normals.length
	}
	device.queue.writeBuffer(normalBuffer, 0, normalData)

	// Normal indexes buffer
	const allNormalIndexesSize = objects3D.reduce(
		(acc, obj) => acc + obj.normalIndexes.length,
		0,
	)
	const normalIndexBuffer = device.createBuffer({
		label: "Normal index buffer",
		size: allNormalIndexesSize * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})
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
	device.queue.writeBuffer(normalIndexBuffer, 0, normalIndexesData)

	const { flatNormal, flatNormalIndex } = await proxy.computeNormal(
		vertexData,
		vertexIndexesData,
	)

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
		materialData.set(material.color, materialOffset)
		materialData[materialOffset + 4] = material.metallic
		materialData[materialOffset + 5] = material.roughness
		materialOffset += 8
	}
	device.queue.writeBuffer(materialBuffer, 0, materialData)

	// Material indexes buffer
	const materialIndexBuffer = device.createBuffer({
		label: "Material index buffer",
		size: allVertexIndexesSize * 4,
		usage:
			GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
	})

	const materialIndexesData = new Uint32Array(allVertexIndexesSize)
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
		flatNormalBuffer,
		flatNormalIndexBuffer,
		materialBuffer,
		materialIndexBuffer,
		aabb,
	}
}
