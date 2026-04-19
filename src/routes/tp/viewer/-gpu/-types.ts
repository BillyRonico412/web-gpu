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
