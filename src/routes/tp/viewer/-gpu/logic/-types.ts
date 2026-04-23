import type { Mat4, Vec3, Vec4 } from "wgpu-matrix"

export type Object3D = {
	name: string
	material: {
		color: Vec4
		metallic: number
		roughness: number
	}
	matrix: Mat4
	vertexes: Vec3[]
	normals: Vec3[]
	vertexIndexes: number[]
	normalIndexes: number[]
}

export type AABB = {
	min: Vec3
	max: Vec3
	center: Vec3
	radius: number
}

export type ObjectResources = {
	vertexBuffer: GPUBuffer
	vertexIndexesBuffer: GPUBuffer
	normalBuffer: GPUBuffer
	normalIndexesBuffer: GPUBuffer
	materialBuffer: GPUBuffer
	materialIndexesBuffer: GPUBuffer
	aabb: AABB
}
