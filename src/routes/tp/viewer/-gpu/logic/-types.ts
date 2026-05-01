import type { Mat4, Vec3, Vec4 } from "wgpu-matrix"

export type DisplayModeType =
	| "basic"
	| "basic-with-edges"
	| "technical"
	| "normal"
	| "geometry"

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
	geometricId: number
}

export type AABB = {
	min: Vec3
	max: Vec3
	center: Vec3
	radius: number
}

export type ObjectResources = {
	vertexData: Float32Array
	vertexIndexesData: Uint32Array
	normalData: Float32Array
	normalIndexesData: Uint32Array
	materialData: Float32Array
	materialIndexesData: Uint32Array
	matrixData: Float32Array
	matrixIndexesData: Uint32Array
	geometricIdData: Uint32Array
	aabb: AABB
}

export type FlatNormalResources = {
	flatNormal: Float32Array
	flatNormalIndex: Uint32Array
}

export type ObjectBufferResources = {
	vertexBuffer: GPUBuffer
	vertexIndexBuffer: GPUBuffer
	normalBuffer: GPUBuffer
	normalIndexBuffer: GPUBuffer
	materialBuffer: GPUBuffer
	materialIndexBuffer: GPUBuffer
	matrixBuffer: GPUBuffer
	matrixIndexBuffer: GPUBuffer
	geometricIdBuffer: GPUBuffer
}

export type FlatNormalBufferResources = {
	flatNormalBuffer: GPUBuffer
	flatNormalIndexBuffer: GPUBuffer
}

export type TexView = {
	texture: GPUTexture
	view: GPUTextureView
}

export type MsTexView = {
	base: TexView
	ms: TexView
}
