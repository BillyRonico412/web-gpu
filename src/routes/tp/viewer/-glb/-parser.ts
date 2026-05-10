import { type Node, WebIO } from "@gltf-transform/core"
import { expose } from "comlink"
import { mat4, vec3, vec4 } from "wgpu-matrix"
import type {
	Assembly,
	HierarchyNode,
	Part,
} from "@/routes/tp/viewer/-gpu/logic/-types"
import { aabb } from "@/routes/tp/viewer/-gpu/logic/utils/AABB"

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

const parseGlb = async (glbBuffer: ArrayBuffer): Promise<Assembly> => {
	const io = new WebIO({
		credentials: "include",
	})

	const document = await io.readBinary(new Uint8Array(glbBuffer))
	const root = document.getRoot()

	const defaultScene = root.getDefaultScene()

	if (!defaultScene) {
		throw new Error("GLB file has no default scene")
	}

	const parts: Part[] = []
	const hierarchyNodes: HierarchyNode[] = [
		{
			id: 0,
			name: "Root",
			parentIndex: null,
			childIndexes: [],
			partIndexes: [],
			isOpen: true,
		},
	]

	const getPartByNode = (node: Node, nodeIndex: number): Part[] => {
		const worldMatrix = mat4.clone(node.getWorldMatrix())
		const mesh = node.getMesh()
		const partsFromNode: Part[] = []

		if (!mesh) {
			return []
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

			const partAabb = aabb.createFromPart({
				vertexes,
				matrix: worldMatrix,
			})
			partsFromNode.push({
				partId: parts.length + partsFromNode.length + 1,
				vertexes,
				normals,
				vertexIndexes,
				normalIndexes,
				matrix: worldMatrix,
				material: objectMaterial ?? DEFAULT_MATERIAL,
				aabb: partAabb,
				nodeIndex,
			})
		}
		return partsFromNode
	}

	const traverseNode = (node: Node, parentIndex: number) => {
		const currentNodeIndex = hierarchyNodes.length

		const currentNode: HierarchyNode = {
			id: currentNodeIndex,
			name: node.getName() || `Node_${currentNodeIndex}`,
			parentIndex,
			childIndexes: [],
			partIndexes: [],
			isOpen: true,
		}

		const partsFromNode = getPartByNode(node, currentNodeIndex)

		for (const partNode of partsFromNode) {
			currentNode.partIndexes.push(partNode.partId)
			parts.push(partNode)
		}
		for (const child of node.listChildren()) {
			traverseNode(child, currentNodeIndex)
		}

		hierarchyNodes.push(currentNode)
		hierarchyNodes[parentIndex].childIndexes.push(currentNodeIndex)
	}

	for (const child of defaultScene.listChildren()) {
		traverseNode(child, 0)
	}

	return {
		hierarchyNodes,
		parts,
	}
}

const glbParserWorkerApi = {
	parseGlb,
}

expose(glbParserWorkerApi)

export type GlbParserWorkerApiType = typeof glbParserWorkerApi
