import { type Mat4, mat4, type Vec3 } from "wgpu-matrix"
import { initWebGPU } from "@/lib/webgpu"
import { CANVAS_ID } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import { createObjectResources } from "@/routes/tp/viewer/-gpu/logic/-object-resources"
import { createRenderResources } from "@/routes/tp/viewer/-gpu/logic/-render-resources"
import type { Object3D } from "@/routes/tp/viewer/-gpu/logic/-types"

const createUniformBuffer = (device: GPUDevice) => {
	const uniformSize = 16 * 4 + 4 * 4 + 4 * 4 // mvp matrix + light direction + camera position
	const uniformBuffer = device.createBuffer({
		label: "Uniform buffer",
		size: uniformSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	const updateUniformBuffer = (params: {
		mvp: { viewMatrix: Mat4; projectionMatrix: Mat4 }
		cameraPosition: Vec3
		lightDirection: Vec3
	}) => {
		const { mvp, lightDirection, cameraPosition } = params
		const modelMatrix = mat4.identity()
		const mvpMatrix = mat4.multiply(
			mat4.multiply(mvp.projectionMatrix, mvp.viewMatrix),
			modelMatrix,
		)
		const uniformData = new Float32Array(uniformSize / 4)
		uniformData.set(mvpMatrix, 0)
		uniformData.set(lightDirection, 16)
		uniformData.set(cameraPosition, 20)
		device.queue.writeBuffer(uniformBuffer, 0, uniformData)
	}
	return { uniformBuffer, updateUniformBuffer }
}

export type Viewer = Awaited<ReturnType<typeof initViewer>>

export const initViewer = async (objects3D: Object3D[]) => {
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
	const objectResources = await createObjectResources({
		device,
		objects3D,
	})
	const {
		createRenderPipeline,
		doRenderPass,
		createDepthTexture,
		createViewTexture,
	} = createRenderResources(device)
	const { uniformBuffer, updateUniformBuffer } = createUniformBuffer(device)
	let depthTexture = createDepthTexture(canvas, true)
	let viewTexture = createViewTexture({
		canvas,
		msaa: true,
		context,
	})
	let renderPipeline = createRenderPipeline({
		culling: true,
		msaa: true,
	})

	const draw = (params: {
		viewMatrix: Mat4
		projectionMatrix: Mat4
		lightDirection: Vec3
		backgroundVec3: Vec3
		msaa: boolean
		shadingMode: ShadingModeType
		cameraPosition: Vec3
	}) => {
		const {
			viewMatrix,
			backgroundVec3,
			projectionMatrix,
			lightDirection,
			msaa,
			shadingMode,
			cameraPosition,
		} = params
		updateUniformBuffer({
			mvp: { viewMatrix, projectionMatrix },
			lightDirection,
			cameraPosition,
		})
		const commandEncoder = device.createCommandEncoder()
		doRenderPass({
			renderPipeline,
			commandEncoder,
			uniformBuffer,
			objectResources,
			viewTexture,
			depthTexture,
			backgroundVec3,
			context,
			msaa,
			objects3D,
			shadingMode,
		})
		device.queue.submit([commandEncoder.finish()])
	}

	const updateDepthTexture = (msaa: boolean) => {
		depthTexture.destroy()
		depthTexture = createDepthTexture(canvas, msaa)
	}

	const updateRenderPipeline = (params: {
		culling: boolean
		msaa: boolean
	}) => {
		const { culling, msaa } = params
		renderPipeline = createRenderPipeline({
			culling,
			msaa,
		})
	}

	const updateViewTexture = (msaa: boolean) => {
		if (viewTexture) {
			viewTexture.destroy()
		}
		viewTexture = createViewTexture({
			canvas,
			msaa,
			context,
		})
	}

	const cleanup = () => {
		objectResources.vertexBuffer.destroy()
		objectResources.vertexIndexBuffer.destroy()
		objectResources.flatNormalBuffer.destroy()
		objectResources.flatNormalIndexBuffer.destroy()
		objectResources.materialBuffer.destroy()
		objectResources.materialIndexBuffer.destroy()
		uniformBuffer.destroy()
		depthTexture.destroy()
		if (viewTexture) {
			viewTexture.destroy()
		}
	}

	return {
		draw,
		updateDepthTexture,
		updateRenderPipeline,
		updateViewTexture,
		aabb: objectResources.aabb,
		objects3D,
		cleanup,
	}
}
