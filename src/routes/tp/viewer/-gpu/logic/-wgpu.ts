import { wrap } from "comlink"
import { type Mat4, mat4, type Vec3 } from "wgpu-matrix"
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

const createUniformBuffer = (device: GPUDevice) => {
	const uniformSize = 28 * 4 // 112 bytes: mvp matrix + light direction + camera position + light params
	const uniformBuffer = device.createBuffer({
		label: "Uniform buffer",
		size: uniformSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	const updateUniformBuffer = (params: {
		mvp: { viewMatrix: Mat4; projectionMatrix: Mat4 }
		cameraPosition: Vec3
		lightDirection: Vec3
		ambient: number
		specularIntensity: number
	}) => {
		const { mvp, lightDirection, cameraPosition, ambient, specularIntensity } =
			params
		const modelMatrix = mat4.identity()
		const mvpMatrix = mat4.multiply(
			mat4.multiply(mvp.projectionMatrix, mvp.viewMatrix),
			modelMatrix,
		)
		const buffer = new ArrayBuffer(uniformSize)
		const float32View = new Float32Array(buffer)
		float32View.set(mvpMatrix, 0)
		float32View.set(lightDirection, 16)
		float32View.set(cameraPosition, 20)
		float32View.set([ambient, specularIntensity], 23)
		device.queue.writeBuffer(uniformBuffer, 0, buffer)
	}
	return { uniformBuffer, updateUniformBuffer }
}

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
			createRenderPipeline,
			doRenderPass,
			createDepthTexture,
			createColorTexture,
			createGeometryIdTexture,
			createNormalTexture,
			doPostProcessPass,
		} = createRenderResources(device)

		const { uniformBuffer, updateUniformBuffer } = createUniformBuffer(device)
		let depthTexView = createDepthTexture(canvas)
		let colorTexView = createColorTexture({
			canvas,
		})
		let geometryIdTexView = createGeometryIdTexture({
			canvas,
		})
		let normalTexView = createNormalTexture({
			canvas,
		})

		let renderPipeline = createRenderPipeline({
			culling: true,
		})

		const draw = (params: {
			viewMatrix: Mat4
			projectionMatrix: Mat4
			lightDirection: Vec3
			backgroundVec3: Vec3
			fxaa: boolean
			shadingMode: ShadingModeType
			cameraPosition: Vec3
			ambient: number
			specularIntensity: number
		}) => {
			const {
				viewMatrix,
				backgroundVec3,
				projectionMatrix,
				lightDirection,
				fxaa,
				shadingMode,
				cameraPosition,
				ambient,
				specularIntensity,
			} = params
			updateUniformBuffer({
				mvp: { viewMatrix, projectionMatrix },
				lightDirection,
				cameraPosition,
				ambient,
				specularIntensity,
			})

			const commandEncoder = device.createCommandEncoder()

			doRenderPass({
				renderPipeline,
				commandEncoder,
				uniformBuffer,
				objectBufferResources,
				flatNormalBufferResources,
				depthTexView,
				backgroundVec3,
				context,
				objects3D,
				shadingMode,
				colorTexView,
				geometryIdTexView,
				normalTexView,
			})

			doPostProcessPass({
				commandEncoder,
				fxaa,
				colorTexView,
				depthTexView,
				geometryIdTexView,
				normalTexView,
				context,
			})

			device.queue.submit([commandEncoder.finish()])
		}

		const updateTextureByCanvasResize = () => {
			depthTexView.texture.destroy()
			depthTexView = createDepthTexture(canvas)

			normalTexView.texture.destroy()
			normalTexView = createNormalTexture({
				canvas,
			})

			colorTexView.texture.destroy()
			colorTexView = createColorTexture({
				canvas,
			})

			geometryIdTexView.texture.destroy()
			geometryIdTexView = createGeometryIdTexture({
				canvas,
			})

			depthTexView.texture.destroy()
			depthTexView = createDepthTexture(canvas)
		}

		const updateRenderPipeline = (params: {
			culling: boolean
			fxaa: boolean
		}) => {
			const { culling } = params
			renderPipeline = createRenderPipeline({
				culling,
			})
		}

		const cleanup = () => {
			objectBufferResources.vertexBuffer.destroy()
			objectBufferResources.vertexIndexBuffer.destroy()
			flatNormalBufferResources.flatNormalBuffer.destroy()
			flatNormalBufferResources.flatNormalIndexBuffer.destroy()
			objectBufferResources.materialBuffer.destroy()
			objectBufferResources.materialIndexBuffer.destroy()
			uniformBuffer.destroy()
			depthTexView.texture.destroy()
			colorTexView.texture.destroy()
			geometryIdTexView.texture.destroy()
			normalTexView.texture.destroy()
			normalWorker.terminate()
			objectWorker.terminate()
		}

		return {
			draw,
			updateTextureByCanvasResize,
			updateRenderPipeline,
			aabb: objectResources.aabb,
			objects3D,
			cleanup,
		}
	} finally {
		emitter.emit("updateLoadingState", "done")
	}
}
