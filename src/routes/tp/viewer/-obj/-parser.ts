import { expose } from "comlink"
import { mat4, vec4 } from "wgpu-matrix"
import type { Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"

const getNbResources = (
	lines: string[],
): {
	nbVertexes: number
	nbNormals: number
	nbIndex: number
} => {
	let nbVertexes = 0
	let nbNormals = 0
	let nbIndex = 0
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		const parts = line.split(/\s+/)
		if (parts[0] === "v") {
			nbVertexes++
		} else if (parts[0] === "vn") {
			nbNormals++
		} else if (parts[0] === "f") {
			nbIndex += (parts.length - 3) * 3
		}
	}
	return {
		nbVertexes,
		nbNormals,
		nbIndex,
	}
}

const DEFAULT_MATERIAL = {
	color: vec4.create(0.8, 0.8, 0.8, 1.0),
	metallic: 0,
	roughness: 1,
}

const parseObj = async (objText: string): Promise<Object3D[]> => {
	const objects: Object3D[] = []
	const lines = objText.split("\n")

	const { nbVertexes, nbNormals, nbIndex } = getNbResources(lines)

	const currentObject: Object3D = {
		vertexes: new Float32Array(nbVertexes * 4),
		normals: new Float32Array(nbNormals * 4),
		vertexIndexes: new Uint32Array(nbIndex),
		normalIndexes: new Uint32Array(nbIndex),
		material: DEFAULT_MATERIAL,
		matrix: mat4.identity(),
		name: "Object",
		geometricId: 1,
	}
	let vertexOffset = 0
	let normalOffset = 0
	let vertexIndexOffset = 0
	let normalIndexOffset = 0
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		const parts = line.split(/\s+/)
		if (parts[0] === "v") {
			for (let i = 1; i < 4; i++) {
				currentObject.vertexes.set([Number(parts[i])], vertexOffset + i - 1)
			}
			vertexOffset += 4
		} else if (parts[0] === "vn") {
			for (let i = 1; i < 4; i++) {
				currentObject.normals.set([Number(parts[i])], normalOffset + i - 1)
			}
			normalOffset += 4
		} else if (parts[0] === "f") {
			const currentIndexes = parts.slice(1).map((it) => {
				const [vertexIndex, , normalIndex] = it
					.split("/")
					.map((part) => Number(part) - 1)
				return { vertexIndex, normalIndex }
			})
			const v0 = currentIndexes[0].vertexIndex
			const n0 = currentIndexes[0].normalIndex
			for (let i = 1; i < currentIndexes.length - 1; i++) {
				currentObject.vertexIndexes.set(
					[
						v0,
						currentIndexes[i].vertexIndex,
						currentIndexes[i + 1].vertexIndex,
					],
					vertexIndexOffset,
				)
				vertexIndexOffset += 3
				currentObject.normalIndexes.set(
					[
						n0,
						currentIndexes[i].normalIndex,
						currentIndexes[i + 1].normalIndex,
					],
					normalIndexOffset,
				)
				normalIndexOffset += 3
			}
		}
	}
	if (currentObject) {
		objects.push(currentObject)
	}

	return objects
}

const objParserWorkerApi = {
	parseObj,
}
expose(objParserWorkerApi)

export type ObjParserWorkerAPiType = typeof objParserWorkerApi
