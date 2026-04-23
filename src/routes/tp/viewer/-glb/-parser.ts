import { type Mat4, mat4, quat, type Vec3, vec3, vec4 } from "wgpu-matrix"
import { type GLTF, gltfSchema } from "@/routes/tp/viewer/-glb/-utils"
import { createNormalBuffer } from "@/routes/tp/viewer/-gpu/logic/-compute-normal"
import type { Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"

const textDecoder = new TextDecoder()

const GLB_MAGIC = 0x46546c67
const GLB_VERSION = 2

export const parseGLBToJsonAndBin = (
	data: Uint8Array,
): {
	json: GLTF
	bin: Uint8Array
} => {
	const dataView = new DataView(data.buffer)
	let offset = 0
	const magic = dataView.getUint32(offset, true)
	if (magic !== GLB_MAGIC) {
		throw new Error("Invalid GLB file: incorrect magic number")
	}
	offset += 4
	const version = dataView.getUint32(offset, true)
	if (version !== GLB_VERSION) {
		throw new Error(`Unsupported GLB version: ${version}`)
	}
	offset += 4
	const length = dataView.getUint32(offset, true)
	offset += 4
	if (length !== data.length) {
		throw new Error("Invalid GLB file: length mismatch")
	}
	const jsonChunkLength = dataView.getUint32(offset, true)
	offset += 4
	const jsonChunkType = dataView.getUint32(offset, true)
	offset += 4
	if (jsonChunkType !== 0x4e4f534a) {
		throw new Error("Invalid GLB file: expected JSON chunk")
	}
	const jsonChunkData = new Uint8Array(data.buffer, offset, jsonChunkLength)
	const jsonText = textDecoder.decode(jsonChunkData)
	const json = gltfSchema.parse(JSON.parse(jsonText))
	offset += jsonChunkLength
	const binChunkLength = dataView.getUint32(offset, true)
	offset += 4
	const binChunkType = dataView.getUint32(offset, true)
	offset += 4
	if (binChunkType !== 0x004e4942) {
		throw new Error("Invalid GLB file: expected BIN chunk")
	}
	const bin = new Uint8Array(data.buffer, offset, binChunkLength)
	return {
		json,
		bin,
	}
}

const float32ToVec3Array = (float32Array: Float32Array): Vec3[] => {
	const vec3Array: Vec3[] = []
	for (let i = 0; i < float32Array.length; i += 3) {
		vec3Array.push(
			vec3.fromValues(
				float32Array[i],
				float32Array[i + 1],
				float32Array[i + 2],
			),
		)
	}
	return vec3Array
}

export const parseGLB = async (data: Uint8Array): Promise<Object3D[]> => {
	const { json, bin } = parseGLBToJsonAndBin(data)
	const objects: Object3D[] = []
	for (const node of json.nodes) {
		if (node.mesh === undefined) {
			continue
		}
		let matrix: Mat4
		if (node.matrix) {
			matrix = mat4.create(
				node.matrix[0],
				node.matrix[1],
				node.matrix[2],
				node.matrix[3],
				node.matrix[4],
				node.matrix[5],
				node.matrix[6],
				node.matrix[7],
				node.matrix[8],
				node.matrix[9],
				node.matrix[10],
				node.matrix[11],
				node.matrix[12],
				node.matrix[13],
				node.matrix[14],
				node.matrix[15],
			)
		} else {
			const translation = node.translation || vec3.fromValues(0, 0, 0)
			const rotation = node.rotation || quat.fromValues(0, 0, 0, 1)
			const scale = node.scale || vec3.fromValues(1, 1, 1)
			const translationMat = mat4.translation(translation)
			const rotationMat = mat4.fromQuat(rotation)
			const scaleMat = mat4.scaling(scale)
			matrix = mat4.multiply(
				mat4.multiply(translationMat, rotationMat),
				scaleMat,
			)
		}
		const mesh = json.meshes[node.mesh]
		for (let i = 0; i < mesh.primitives.length; i++) {
			const primitive = mesh.primitives[i]
			let name: string
			if (mesh.primitives.length === 1) {
				name = node.name || `Mesh ¤ ${node.mesh}`
			} else {
				name = node.name ? `${node.name} ¤ ${i}` : `Mesh ¤ ${node.mesh} ¤ ${i}`
			}
			const material = {
				color: vec4.fromValues(1, 1, 1, 1),
				metallic: 0,
				roughness: 1,
			}
			if (json.materials && primitive.material !== undefined) {
				const mat = json.materials[primitive.material]
				if (mat.pbrMetallicRoughness) {
					const pbr = mat.pbrMetallicRoughness
					if (pbr.baseColorFactor) {
						material.color = vec4.fromValues(
							pbr.baseColorFactor[0],
							pbr.baseColorFactor[1],
							pbr.baseColorFactor[2],
							pbr.baseColorFactor[3],
						)
					}
					if (pbr.metallicFactor !== undefined) {
						material.metallic = pbr.metallicFactor
					}
					if (pbr.roughnessFactor !== undefined) {
						material.roughness = pbr.roughnessFactor
					}
				}
			}

			const positionAccessorIndex = primitive.attributes.POSITION
			const positionAccessor = json.accessors[positionAccessorIndex]
			const positionBufferView = json.bufferViews[positionAccessor.bufferView]
			const positionByteOffset =
				bin.byteOffset +
				positionBufferView.byteOffset +
				positionAccessor.byteOffset
			const positionByteLength = positionAccessor.count * 3 * 4
			const vertexesFloat32Array = new Float32Array(
				bin.buffer.slice(
					positionByteOffset,
					positionByteOffset + positionByteLength,
				),
			)
			const vertexIndexes: number[] = []
			if (primitive.indices !== undefined) {
				const indexAccessor = json.accessors[primitive.indices]
				const indexBufferView = json.bufferViews[indexAccessor.bufferView]
				const indexByteOffset =
					bin.byteOffset + indexBufferView.byteOffset + indexAccessor.byteOffset
				const indexByteLength = indexAccessor.count * 4
				const indices = new Uint32Array(
					bin.buffer.slice(indexByteOffset, indexByteOffset + indexByteLength),
				)
				for (let i = 0; i < indices.length; i++) {
					vertexIndexes.push(indices[i])
				}
			} else {
				for (let i = 0; i < positionAccessor.count; i++) {
					vertexIndexes.push(i)
				}
			}
			const vertexes = float32ToVec3Array(vertexesFloat32Array)
			const { normalIndexes, normals } = await createNormalBuffer(
				float32ToVec3Array(vertexesFloat32Array),
				vertexIndexes,
			)
			objects.push({
				name,
				material,
				matrix,
				vertexes,
				normals,
				vertexIndexes,
				normalIndexes,
			})
		}
	}
	return objects
}
