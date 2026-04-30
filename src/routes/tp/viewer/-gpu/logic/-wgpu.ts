import { wrap } from "comlink"
import type { Mat4, Vec3 } from "wgpu-matrix"
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
import type { Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"
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

		const draw = (params: {
			viewMatrix: Mat4
			projectionMatrix: Mat4
			lightDirection: Vec3
			backgroundVec3: Vec3
			shadingMode: ShadingModeType
			cameraPosition: Vec3
			ambient: number
			specularIntensity: number
			culling: boolean
			geometryEdgeDetection: boolean
		}) => {
			const {
				viewMatrix,
				backgroundVec3,
				projectionMatrix,
				lightDirection,
				shadingMode,
				cameraPosition,
				ambient,
				specularIntensity,
				culling,
				geometryEdgeDetection,
			} = params

			const commandEncoder = device.createCommandEncoder()

			doRenderPass({
				commandEncoder,
				objectBufferResources,
				flatNormalBufferResources,
				renderDepthTexView,
				backgroundVec3,
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
				geometryEdgeDetection,
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
		}
	} finally {
		emitter.emit("updateLoadingState", "done")
	}
}
