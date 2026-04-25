import { WebIO } from "@gltf-transform/core"
import { expose } from "comlink"
import { mat4, vec3, vec4 } from "wgpu-matrix"
import type { Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"

const DEFAULT_MATERIAL = {
	color: vec3.create(0.8, 0.8, 0.8),
	metallic: 0,
	roughness: 1,
}

const padTo4 = (array: Float32Array) => {
	const newArrayLength = array.length + array.length / 3
	const newArray = new Float32Array(newArrayLength)
	for (let i = 0, j = 0; i < array.length; i += 3, j += 4) {
		newArray[j] = array[i]
		newArray[j + 1] = array[i + 1]
		newArray[j + 2] = array[i + 2]
		newArray[j + 3] = 0
	}
	return newArray
}

const parseGlb = async (glbBuffer: ArrayBuffer): Promise<Object3D[]> => {
	const io = new WebIO({
		credentials: "include",
	})

	const document = await io.readBinary(new Uint8Array(glbBuffer))
	const root = document.getRoot()

	const objects: Object3D[] = []
	const nodes = root.listNodes()

	for (const node of nodes) {
		const localMatrix = node.getMatrix()
		const mesh = node.getMesh()
		if (!mesh) {
			continue
		}
		const primitives = mesh.listPrimitives()
		for (
			let primitiveIndex = 0;
			primitiveIndex < primitives.length;
			primitiveIndex++
		) {
			const primitive = primitives[primitiveIndex]
			const positionAccessor = primitive.getAttribute("POSITION")
			if (!positionAccessor) {
				continue
			}

			const positionArray = positionAccessor.getArray()
			if (!positionArray) {
				continue
			}

			const normalAccessor = primitive.getAttribute("NORMAL")
			if (!normalAccessor) {
				console.warn(
					`Primitive ${primitiveIndex} of mesh ${mesh.getName()} has no NORMAL attribute, normals will be set to (0, 0, 0, 0)`,
				)
				continue
			}

			const normalArray = normalAccessor.getArray()
			if (!normalArray) {
				console.warn(
					`Primitive ${primitiveIndex} of mesh ${mesh.getName()} has no NORMAL array, normals will be set to (0, 0, 0, 0)`,
				)
				continue
			}

			const indexAccessor = primitive.getIndices()
			if (!indexAccessor) {
				console.warn(
					`Primitive ${primitiveIndex} of mesh ${mesh.getName()} has no indices, a default index buffer will be generated`,
				)
				continue
			}

			const indexArray = indexAccessor.getArray()
			if (!indexArray) {
				console.warn(
					`Primitive ${primitiveIndex} of mesh ${mesh.getName()} has no index array, a default index buffer will be generated`,
				)
				continue
			}
			const vertexes = padTo4(new Float32Array(positionArray))
			const normals = padTo4(new Float32Array(normalArray))
			const vertexIndexes = new Uint32Array(indexArray)
			const normalIndexes = new Uint32Array(indexArray)

			const material = primitive.getMaterial()
			const baseColor = material?.getBaseColorFactor() ?? [0.8, 0.8, 0.8, 1]
			const objectMaterial = {
				color: vec4.create(
					baseColor[0],
					baseColor[1],
					baseColor[2],
					baseColor[3],
				),
				metallic: material?.getMetallicFactor() ?? 0,
				roughness: material?.getRoughnessFactor() ?? 1,
			}

			objects.push({
				name: `${mesh.getName() || "Mesh"}_${primitiveIndex}`,
				vertexes,
				normals,
				vertexIndexes,
				normalIndexes,
				matrix: mat4.clone(localMatrix),
				material: objectMaterial ?? DEFAULT_MATERIAL,
			})
		}
	}

	return objects
}

const glbParserWorkerApi = {
	parseGlb,
}

expose(glbParserWorkerApi)

export type GlbParserWorkerApiType = typeof glbParserWorkerApi
