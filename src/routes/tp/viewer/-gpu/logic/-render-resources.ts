import type { Vec3 } from "wgpu-matrix"
import renderShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-render-shader.wgsl?raw"
import type {
	Object3D,
	ObjectResources,
} from "@/routes/tp/viewer/-gpu/logic/-types"

export const createRenderResources = (device: GPUDevice) => {
	const createDepthTexture = (canvas: HTMLCanvasElement, msaa: boolean) => {
		const depthTexture = device.createTexture({
			label: "Depth texture",
			size: [canvas.width, canvas.height],
			format: "depth24plus",
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
			sampleCount: msaa ? 4 : undefined,
		})
		return depthTexture
	}

	const createMsaaTexture = (canvas: HTMLCanvasElement, msaa: boolean) => {
		if (!msaa) {
			return
		}
		const msaaTexture = device.createTexture({
			label: "MSAA texture",
			size: [canvas.width, canvas.height],
			format: navigator.gpu.getPreferredCanvasFormat(),
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
			sampleCount: 4,
		})
		return msaaTexture
	}

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

	const createUniformBindGroup = (uniformBuffer: GPUBuffer) => {
		const uniformBindGroup = device.createBindGroup({
			label: "Render matrix bind group",
			layout: uniformBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: uniformBuffer,
					},
				},
			],
		})
		return uniformBindGroup
	}

	const storageBindGroupLayout = device.createBindGroupLayout({
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
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
			// Material index buffer
			{
				binding: 5,
				visibility: GPUShaderStage.VERTEX,
				buffer: {
					type: "read-only-storage",
				},
			},
		],
	})

	const createRenderStorageBindGroup = (params: ObjectResources) => {
		const {
			vertexBuffer,
			normalBuffer,
			vertexIndexesBuffer,
			normalIndexesBuffer,
			materialBuffer,
			materialIndexesBuffer,
		} = params
		const renderStorageBindGroup = device.createBindGroup({
			label: "Render storage bind group",
			layout: storageBindGroupLayout,
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
						buffer: normalBuffer,
					},
				},
				{
					binding: 2,
					resource: {
						buffer: vertexIndexesBuffer,
					},
				},
				{
					binding: 3,
					resource: {
						buffer: normalIndexesBuffer,
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
						buffer: materialIndexesBuffer,
					},
				},
			],
		})
		return renderStorageBindGroup
	}

	const renderPipelineLayout = device.createPipelineLayout({
		label: "Render pipeline layout",
		bindGroupLayouts: [uniformBindGroupLayout, storageBindGroupLayout],
	})
	const shaderModule = device.createShaderModule({
		label: "Shader module",
		code: renderShaderCode,
	})

	const createRenderPipeline = (msaa: boolean) => {
		let multisample: GPUMultisampleState | undefined
		if (msaa) {
			multisample = {
				count: 4,
			}
		}
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
					{
						format: navigator.gpu.getPreferredCanvasFormat(),
					},
				],
			},
			primitive: {
				topology: "triangle-list",
				cullMode: "back",
			},
			multisample,
			depthStencil: {
				format: "depth24plus",
				depthWriteEnabled: true,
				depthCompare: "less",
			},
		})
		return renderPipeline
	}

	const doRenderPass = (params: {
		renderPipeline: GPURenderPipeline
		commandEncoder: GPUCommandEncoder
		uniformBuffer: GPUBuffer
		objectResources: ObjectResources
		msaaTexture: GPUTexture | undefined
		depthTexture: GPUTexture
		backgroundVec3: Vec3
		context: GPUCanvasContext
		msaa: boolean
		objects3D: Object3D[]
	}) => {
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: params.msaaTexture
						? params.msaaTexture.createView()
						: params.context.getCurrentTexture().createView(),
					loadOp: "clear",
					storeOp: "store",
					clearValue: {
						r: params.backgroundVec3[0],
						g: params.backgroundVec3[1],
						b: params.backgroundVec3[2],
						a: 1,
					},
					resolveTarget: params.msaa
						? params.context.getCurrentTexture().createView()
						: undefined,
				},
			],
			depthStencilAttachment: {
				view: params.depthTexture.createView(),
				depthLoadOp: "clear",
				depthStoreOp: "store",
				depthClearValue: 1,
			},
		}
		const renderPass =
			params.commandEncoder.beginRenderPass(renderPassDescriptor)
		renderPass.setPipeline(params.renderPipeline)

		const renderMatrixBindGroup = createUniformBindGroup(params.uniformBuffer)
		const storageBindGroup = createRenderStorageBindGroup(
			params.objectResources,
		)

		renderPass.setBindGroup(0, renderMatrixBindGroup)
		renderPass.setBindGroup(1, storageBindGroup)
		renderPass.setVertexBuffer(0, params.objectResources.vertexBuffer)
		let nbDrawnVertices = 0
		for (const obj of params.objects3D) {
			nbDrawnVertices += obj.vertexIndexes.length
		}
		renderPass.draw(nbDrawnVertices)
		renderPass.end()
	}

	return {
		createRenderPipeline,
		doRenderPass,
		createDepthTexture,
		createMsaaTexture,
	}
}
