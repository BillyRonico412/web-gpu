import { z } from "zod"

export const gltfSchema = z.object({
	asset: z.object({
		version: z.string(),
		generator: z.string().optional(),
	}),
	// Les tranches de données binaires
	bufferViews: z.array(
		z.object({
			buffer: z.number(),
			byteOffset: z.number().default(0),
			byteLength: z.number(),
			target: z.number().optional(), // 34962 pour Vertex, 34963 pour Index
		}),
	),
	// Comment interpréter les tranches (Float, Uint16, etc.)
	accessors: z.array(
		z.object({
			bufferView: z.number(),
			byteOffset: z.number().default(0),
			componentType: z.number(), // 5126 (Float), 5123 (Uint16), 5125 (Uint32)
			count: z.number(),
			type: z.enum(["SCALAR", "VEC2", "VEC3", "VEC4"]),
			min: z.array(z.number()).optional(),
			max: z.array(z.number()).optional(),
		}),
	),
	// La géométrie
	meshes: z.array(
		z.object({
			name: z.string().optional(),
			primitives: z.array(
				z.object({
					attributes: z.record(z.string(), z.number()), // ex: { "POSITION": 1 }
					indices: z.number().optional(),
					material: z.number().optional(),
					mode: z.number().default(4), // 4 = Triangles
				}),
			),
		}),
	),
	// Les materiaux utilises par les meshes
	materials: z
		.array(
			z.object({
				name: z.string().optional(),
				pbrMetallicRoughness: z
					.object({
						baseColorFactor: z.array(z.number()).length(4).optional(),
						baseColorTexture: z
							.object({
								index: z.number(),
								texCoord: z.number().default(0),
							})
							.optional(),
						metallicFactor: z.number().optional(),
						roughnessFactor: z.number().optional(),
						metallicRoughnessTexture: z
							.object({
								index: z.number(),
								texCoord: z.number().default(0),
							})
							.optional(),
					})
					.optional(),
				normalTexture: z
					.object({
						index: z.number(),
						texCoord: z.number().default(0),
						scale: z.number().optional(),
					})
					.optional(),
				occlusionTexture: z
					.object({
						index: z.number(),
						texCoord: z.number().default(0),
						strength: z.number().optional(),
					})
					.optional(),
				emissiveTexture: z
					.object({
						index: z.number(),
						texCoord: z.number().default(0),
					})
					.optional(),
				emissiveFactor: z.array(z.number()).length(3).optional(),
				alphaMode: z.enum(["OPAQUE", "MASK", "BLEND"]).optional(),
				alphaCutoff: z.number().optional(),
				doubleSided: z.boolean().optional(),
			}),
		)
		.optional(),
	// La hiérarchie des pièces (moteur, ailes, etc.)
	nodes: z.array(
		z.object({
			name: z.string().optional(),
			children: z.array(z.number()).optional(),
			matrix: z.array(z.number()).length(16).optional(),
			mesh: z.number().optional(),
			translation: z.array(z.number()).length(3).optional(),
			rotation: z.array(z.number()).length(4).optional(),
			scale: z.array(z.number()).length(3).optional(),
		}),
	),
	scene: z.number().optional(),
	scenes: z.array(
		z.object({
			nodes: z.array(z.number()),
		}),
	),
})

// Type TypeScript généré automatiquement
export type GLTF = z.infer<typeof gltfSchema>
