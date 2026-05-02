import { type Mat4, mat4, type Vec3, type Vec4 } from "wgpu-matrix"
import renderShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-render-shader.wgsl?raw"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import type {
	FlatNormalBufferResources,
	MsTexView,
	Object3D,
	ObjectBufferResources,
	TexView,
} from "@/routes/tp/viewer/-gpu/logic/-types"

type RenderUniform = {
	mvp: { viewMatrix: Mat4; projectionMatrix: Mat4 }
	cameraPosition: Vec3
	lightDirection: Vec3
	ambient: number
	specularIntensity: number
}

export const createRenderPassRessource = (device: GPUDevice) => {
	// 112 bytes: mvp matrix + light direction + camera position + light params
	const renderUniformSize = 16 * 4 + 4 * 4 + 4 * 4 + 4 * 4

	const renderUniformData = new Float32Array(renderUniformSize / 4)
	const renderUniformBuffer = device.createBuffer({
		label: "Uniform buffer",
		size: renderUniformSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	const uniformBindGroupLayout = device.createBindGroupLayout({
		label: "Render matrix bind group layout",
		entries: [
			// Mvp matrix
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
		],
	})

	const createUniformBindGroup = (renderUniform: RenderUniform) => {
		const { mvp, lightDirection, cameraPosition, ambient, specularIntensity } =
			renderUniform
		const modelMatrix = mat4.identity()
		const mvpMatrix = mat4.multiply(
			mat4.multiply(mvp.projectionMatrix, mvp.viewMatrix),
			modelMatrix,
		)
		renderUniformData.set(mvpMatrix, 0)
		renderUniformData.set(lightDirection, 16)
		renderUniformData.set(cameraPosition, 20)
		renderUniformData.set([ambient, specularIntensity], 23)
		device.queue.writeBuffer(renderUniformBuffer, 0, renderUniformData)

		const uniformBindGroup = device.createBindGroup({
			label: "Render matrix bind group",
			layout: uniformBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: renderUniformBuffer,
					},
				},
			],
		})
		return uniformBindGroup
	}

	const renderStorageBindGroupLayout = device.createBindGroupLayout({
		label: "Storage bind group layout",
		entries: [
			// Vertex buffer
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Normal buffer
			{
				binding: 1,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Vertex index buffer
			{
				binding: 2,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Normal index buffer
			{
				binding: 3,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Material buffer
			{
				binding: 4,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Material index buffer
			{
				binding: 5,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Matrix buffer
			{
				binding: 6,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},

			// Matrix index buffer
			{
				binding: 7,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Geometric ID buffer
			{
				binding: 8,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "read-only-storage",
				},
			},
		],
	})

	const createRenderStorageBindGroup = (params: {
		objectResources: ObjectBufferResources
		flatNormalResources: FlatNormalBufferResources
		shadingMode: ShadingModeType
	}) => {
		const {
			vertexBuffer,
			vertexIndexBuffer,
			normalBuffer,
			normalIndexBuffer,
			materialBuffer,
			materialIndexBuffer,
			matrixBuffer,
			matrixIndexBuffer,
			geometricIdBuffer,
		} = params.objectResources

		const { flatNormalBuffer, flatNormalIndexBuffer } =
			params.flatNormalResources

		let normalBufferUsed: GPUBuffer
		let normalIndexBufferUsed: GPUBuffer
		switch (params.shadingMode) {
			case "flat":
				normalBufferUsed = flatNormalBuffer
				normalIndexBufferUsed = flatNormalIndexBuffer
				break
			case "auto":
				normalBufferUsed = normalBuffer
				normalIndexBufferUsed = normalIndexBuffer
				break
		}

		const renderStorageBindGroup = device.createBindGroup({
			label: "Render storage bind group",
			layout: renderStorageBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: vertexBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: normalBufferUsed,
					},
				},
				{
					binding: 2,
					resource: {
						buffer: vertexIndexBuffer,
					},
				},
				{
					binding: 3,
					resource: {
						buffer: normalIndexBufferUsed,
					},
				},
				{
					binding: 4,
					resource: {
						buffer: materialBuffer,
					},
				},
				{
					binding: 5,
					resource: {
						buffer: materialIndexBuffer,
					},
				},
				{
					binding: 6,
					resource: {
						buffer: matrixBuffer,
					},
				},
				{
					binding: 7,
					resource: {
						buffer: matrixIndexBuffer,
					},
				},
				{
					binding: 8,
					resource: {
						buffer: geometricIdBuffer,
					},
				},
			],
		})
		return renderStorageBindGroup
	}

	const renderPipelineLayout = device.createPipelineLayout({
		label: "Render pipeline layout",
		bindGroupLayouts: [uniformBindGroupLayout, renderStorageBindGroupLayout],
	})
	const shaderModule = device.createShaderModule({
		label: "Shader module",
		code: renderShaderCode,
	})

	const createRenderPipeline = (params: { culling: boolean }) => {
		const { culling } = params
		const renderPipeline = device.createRenderPipeline({
			label: "Render pipeline",
			layout: renderPipelineLayout,
			vertex: {
				module: shaderModule,
				entryPoint: "vs_main",
			},
			fragment: {
				module: shaderModule,
				entryPoint: "fs_main",
				targets: [
					// Color
					{
						format: navigator.gpu.getPreferredCanvasFormat(),
					},
					// Normal
					{
						format: "rgba16float",
					},
					// Geometry ID
					{
						format: "r32float",
					},
				],
			},
			multisample: {
				count: 4,
			},
			primitive: {
				topology: "triangle-list",
				cullMode: culling ? "back" : "none",
			},
			depthStencil: {
				format: "depth24plus",
				depthWriteEnabled: true,
				depthCompare: "greater",
			},
		})
		return renderPipeline
	}

	const doRenderPass = (params: {
		commandEncoder: GPUCommandEncoder
		objectBufferResources: ObjectBufferResources
		flatNormalBufferResources: FlatNormalBufferResources
		colorMsTexView: MsTexView
		geometryIdTexView: TexView
		renderDepthTexView: TexView
		normalTexView: MsTexView
		background: Vec4
		context: GPUCanvasContext
		objects3D: Object3D[]
		shadingMode: ShadingModeType
		uniform: RenderUniform
		culling: boolean
	}) => {
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: params.colorMsTexView.ms.view,
					resolveTarget: params.colorMsTexView.base.view,
					loadOp: "clear",
					storeOp: "store",
					clearValue: {
						r: params.background[0],
						g: params.background[1],
						b: params.background[2],
						a: params.background[3],
					},
				},
				{
					view: params.normalTexView.ms.view,
					resolveTarget: params.normalTexView.base.view,
					loadOp: "clear",
					storeOp: "store",
				},
				{
					view: params.geometryIdTexView.view,
					loadOp: "clear",
					storeOp: "store",
				},
			],
			depthStencilAttachment: {
				view: params.renderDepthTexView.view,
				depthLoadOp: "clear",
				depthStoreOp: "store",
				depthClearValue: 0,
			},
		}
		const renderPipeline = createRenderPipeline({ culling: params.culling })
		const renderPass =
			params.commandEncoder.beginRenderPass(renderPassDescriptor)
		renderPass.setPipeline(renderPipeline)

		const uniformBindGroup = createUniformBindGroup(params.uniform)
		const storageBindGroup = createRenderStorageBindGroup({
			objectResources: params.objectBufferResources,
			shadingMode: params.shadingMode,
			flatNormalResources: params.flatNormalBufferResources,
		})

		renderPass.setBindGroup(0, uniformBindGroup)
		renderPass.setBindGroup(1, storageBindGroup)
		renderPass.setVertexBuffer(0, params.objectBufferResources.vertexBuffer)
		let nbDrawnVertices = 0
		for (const obj of params.objects3D) {
			nbDrawnVertices += obj.vertexIndexes.length
		}
		renderPass.draw(nbDrawnVertices)
		renderPass.end()
	}

	const renderPassCleanUp = () => {
		renderUniformBuffer.destroy()
	}

	return {
		doRenderPass,
		renderPassCleanUp,
	}
}
