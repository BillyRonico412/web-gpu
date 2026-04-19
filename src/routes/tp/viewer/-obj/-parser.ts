import { mat4, type Vec3, vec3 } from "wgpu-matrix"
import { computeFlatshadingNormals } from "@/routes/tp/viewer/-gpu/-compute-normal"
import type { Object3D } from "@/routes/tp/viewer/-gpu/-types"

export const parseObj = async (objText: string): Promise<Object3D[]> => {
	const vertexes: Vec3[] = []
	const vertexIndexes: number[] = []
	const lines = objText.split("\n")
	for (const line of lines) {
		const parts = line.trim().split(/\s+/)
		if (parts[0] === "v") {
			const vertex = vec3.create()
			parts.slice(1, 4).forEach((it, i) => {
				vertex[i] = Number(it)
			})
			vertexes.push(vertex)
		} else if (parts[0] === "f") {
			const currentVertexIndexes = parts.slice(1).map((it) => {
				const [vertexIndex] = it.split("/").map((part) => Number(part) - 1)
				return vertexIndex
			})
			for (let i = 1; i < currentVertexIndexes.length - 1; i++) {
				vertexIndexes.push(
					currentVertexIndexes[0],
					currentVertexIndexes[i],
					currentVertexIndexes[i + 1],
				)
			}
		}
	}
	const { normals, normalIndexes } = await computeFlatshadingNormals(
		vertexes,
		vertexIndexes,
	)
	return [
		{
			name: "Object",
			material: {
				color: vec3.create(0.8, 0.8, 0.8),
				metallic: 0,
				roughness: 1,
			},
			matrix: mat4.identity(),
			vertexes,
			normals,
			vertexIndexes,
			normalIndexes,
		},
	]
}
