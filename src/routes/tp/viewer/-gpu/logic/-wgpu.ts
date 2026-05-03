import { wrap } from "comlink"
import type { Mat4, Vec3, Vec4 } from "wgpu-matrix"
import { initWebGPU } from "@/lib/webgpu"
import { CANVAS_ID } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { emitter } from "@/routes/tp/viewer/-gpu/logic/-event-emitter"
import {
	createFlatNormalBufferResource,
	type NormalWorkerApi,
	type ShadingModeType,
} from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import {
	createObjectBufferResources,
	type ObjectResourceWorkerApi,
} from "@/routes/tp/viewer/-gpu/logic/-object-resources"
import { createRenderResources } from "@/routes/tp/viewer/-gpu/logic/-render-resources"
import type {
	DisplayModeType,
	Object3D,
	PickParams,
	TechnicalConfig,
} from "@/routes/tp/viewer/-gpu/logic/-types"
import { createPickingPassRessources } from "@/routes/tp/viewer/-gpu/logic/pass/-picking-pass"
import { createPostProcessPassRessources } from "@/routes/tp/viewer/-gpu/logic/pass/-post-process-pass"
import { createRenderPassRessource } from "@/routes/tp/viewer/-gpu/logic/pass/-render-pass"

const normalWorker = new Worker(
	new URL("../logic/-normal-resources.ts", import.meta.url),
	{ type: "module" },
)
const normalProxy = wrap<NormalWorkerApi>(normalWorker)

const objectWorker = new Worker(
	new URL("../logic/-object-resources.ts", import.meta.url),
	{ type: "module" },
)
const objectProxy = wrap<ObjectResourceWorkerApi>(objectWorker)

export type Viewer = Awaited<ReturnType<typeof initViewer>>

export const initViewer = async (objects3D: Object3D[]) => {
	try {
		emitter.emit("updateLoadingState", "init-webgpu")
		const { device } = await initWebGPU()
		const canvas = document.querySelector(`#${CANVAS_ID}`) as HTMLCanvasElement
		const context = canvas.getContext("webgpu")
		if (!context) {
			throw new Error("WebGPU is not supported in this browser.")
		}
		context.configure({
			device,
			format: navigator.gpu.getPreferredCanvasFormat(),
			alphaMode: "premultiplied",
		})

		emitter.emit("updateLoadingState", "create-object-resources")
		const objectResources = await objectProxy.createObjectResources({
			objects3D,
		})
		const objectBufferResources = createObjectBufferResources(
			device,
			objectResources,
		)

		emitter.emit("updateLoadingState", "create-normal-resources")
		const flatNormalResources = await normalProxy.computeNormal({
			vertex: objectResources.vertexData,
			vertexIndex: objectResources.vertexIndexesData,
		})
		const flatNormalBufferResources = createFlatNormalBufferResource(
			device,
			flatNormalResources,
		)

		emitter.emit("updateLoadingState", "create-render-resources")
		const {
			createRenderDepthTexture,
			createColorTexture,
			createGeometryIdTexture,
			createNormalTexture,
		} = createRenderResources(device)

		let renderDepthTexView = createRenderDepthTexture(canvas)
		let colorMsTexView = createColorTexture({
			canvas,
		})
		let normalMsTexView = createNormalTexture({
			canvas,
		})
		let geometryIdTexView = createGeometryIdTexture({
			canvas,
		})

		const { doRenderPass, renderPassCleanUp } =
			createRenderPassRessource(device)

		const { doPostProcessPass } = createPostProcessPassRessources(device)

		const { doPickingPass, pickingBitSetBuffer } = createPickingPassRessources({
			device,
			objects3D,
		})

		const draw = (params: {
			viewMatrix: Mat4
			projectionMatrix: Mat4
			lightDirection: Vec3
			background: Vec4
			shadingMode: ShadingModeType
			cameraPosition: Vec3
			ambient: number
			specularIntensity: number
			culling: boolean
			displayMode: DisplayModeType
			near: number
			far: number
			technicalConfig: TechnicalConfig
			geometricIds: Set<number>
		}) => {
			const {
				viewMatrix,
				background,
				projectionMatrix,
				lightDirection,
				shadingMode,
				cameraPosition,
				ambient,
				specularIntensity,
				culling,
				displayMode,
				near,
				far,
				technicalConfig,
			} = params

			const commandEncoder = device.createCommandEncoder()

			doRenderPass({
				commandEncoder,
				objectBufferResources,
				flatNormalBufferResources,
				renderDepthTexView,
				background,
				context,
				objects3D,
				shadingMode,
				colorMsTexView,
				geometryIdTexView,
				normalTexView: normalMsTexView,
				culling,
				uniform: {
					mvp: { viewMatrix, projectionMatrix },
					lightDirection,
					cameraPosition,
					ambient,
					specularIntensity,
				},
			})

			doPostProcessPass({
				commandEncoder,
				colorTexView: colorMsTexView.base,
				geometryIdTexView,
				context,
				normalTexView: normalMsTexView.base,
				depthTexView: renderDepthTexView,
				displayMode,
				near,
				far,
				technicalConfig,
			})

			device.queue.submit([commandEncoder.finish()])
		}

		const updateTextureByCanvasResize = () => {
			renderDepthTexView.texture.destroy()
			renderDepthTexView = createRenderDepthTexture(canvas)

			normalMsTexView.base.texture.destroy()
			normalMsTexView.ms.texture.destroy()
			normalMsTexView = createNormalTexture({
				canvas,
			})

			colorMsTexView.base.texture.destroy()
			colorMsTexView.ms.texture.destroy()
			colorMsTexView = createColorTexture({
				canvas,
			})

			geometryIdTexView.texture.destroy()
			geometryIdTexView = createGeometryIdTexture({
				canvas,
			})
		}

		const pickRect = async (pickParams: PickParams): Promise<number[]> => {
			try {
				const commandEncoder = device.createCommandEncoder()
				doPickingPass({
					commandEncoder,
					geometryIdTexView,
					pickParams,
				})
				device.queue.submit([commandEncoder.finish()])
				await pickingBitSetBuffer.mapAsync(GPUMapMode.READ)
				const arrayBuffer = pickingBitSetBuffer.getMappedRange()
				const pickingBitSet = new Uint32Array(arrayBuffer)
				const geometricIds: number[] = []
				for (let i = 0; i < pickingBitSet.length; i++) {
					if (pickingBitSet[i] === 0) {
						continue
					}
					geometricIds.push(i)
				}
				console.log("Picked geometric IDs:", geometricIds)
				return geometricIds
			} finally {
				pickingBitSetBuffer.unmap()
			}
		}

		const cleanup = () => {
			objectBufferResources.vertexBuffer.destroy()
			objectBufferResources.vertexIndexBuffer.destroy()
			flatNormalBufferResources.flatNormalBuffer.destroy()
			flatNormalBufferResources.flatNormalIndexBuffer.destroy()
			objectBufferResources.materialBuffer.destroy()
			objectBufferResources.materialIndexBuffer.destroy()
			renderDepthTexView.texture.destroy()
			colorMsTexView.base.texture.destroy()
			colorMsTexView.ms.texture.destroy()
			geometryIdTexView.texture.destroy()
			normalMsTexView.base.texture.destroy()
			normalMsTexView.ms.texture.destroy()
			renderPassCleanUp()
		}

		return {
			draw,
			updateTextureByCanvasResize,
			aabb: objectResources.aabb,
			objects3D,
			cleanup,
			pickRect,
		}
	} finally {
		emitter.emit("updateLoadingState", "done")
	}
}
