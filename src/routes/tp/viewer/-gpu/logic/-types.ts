import type { Mat4, Vec3, Vec4 } from "wgpu-matrix"

export type Object3D = {
	name: string
	vertexes: Float32Array
	vertexIndexes: Uint32Array
	normals: Float32Array
	normalIndexes: Uint32Array
	matrix: Mat4
	material: {
		color: Vec4
		metallic: number
		roughness: number
	}
}

export type AABB = {
	min: Vec3
	max: Vec3
	center: Vec3
	radius: number
}

export type ObjectResources = {
	vertexBuffer: GPUBuffer
	vertexIndexBuffer: GPUBuffer
	normalBuffer: GPUBuffer
	normalIndexBuffer: GPUBuffer
	flatNormalBuffer: GPUBuffer
	flatNormalIndexBuffer: GPUBuffer
	materialBuffer: GPUBuffer
	materialIndexBuffer: GPUBuffer
	aabb: AABB
}
