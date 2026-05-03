import type { Mat4, Vec4 } from "wgpu-matrix"
import type { AABB } from "@/routes/tp/viewer/-gpu/logic/utils/AABB"

export type DisplayModeType =
	| "basic"
	| "basic-with-edges"
	| "technical"
	| "normal"

export type Part = {
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
	partId: number
}

export type PartResources = {
	vertexData: Float32Array
	vertexIndexesData: Uint32Array
	normalData: Float32Array
	normalIndexesData: Uint32Array
	partIdData: Uint32Array
	materialData: Float32Array
	matrixData: Float32Array
	visibilityStateData: Uint32Array
	customMaterialData: Float32Array
	aabbMap: AABB[]
	assemblyAabb: AABB
}

export type FlatNormalResources = {
	flatNormal: Float32Array
	flatNormalIndex: Uint32Array
}

export type PartBufferResources = {
	vertexBuffer: GPUBuffer
	vertexIndexBuffer: GPUBuffer
	normalBuffer: GPUBuffer
	normalIndexBuffer: GPUBuffer
	materialBuffer: GPUBuffer
	matrixBuffer: GPUBuffer
	visibilityStateBuffer: GPUBuffer
	customMaterialBuffer: GPUBuffer
	partIdBuffer: GPUBuffer
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

export const technicalKeys = ["part", "normal", "depth"] as const
export type TechnicalConfigKey = (typeof technicalKeys)[number]

export type TechnicalConfig = Record<TechnicalConfigKey, boolean>

export type PickParams = {
	x: number
	y: number
	width: number
	height: number
}

export enum VisibilityState {
	Visible = 1 << 0,
	Highlighted = 1 << 1,
	Hidden = 1 << 2,
	Ghost = 1 << 3,
	CustomMaterial = 1 << 4,
}
