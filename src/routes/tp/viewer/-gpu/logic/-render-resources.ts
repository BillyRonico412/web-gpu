import type { Vec3 } from "wgpu-matrix"
import postProcessShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-post-process-shader.wgsl?raw"
import renderShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-render-shader.wgsl?raw"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import type {
	FlatNormalBufferResources,
	Object3D,
	ObjectBufferResources,
} from "@/routes/tp/viewer/-gpu/logic/-types"

export type TexView = {
	texture: GPUTexture
	view: GPUTextureView
}

export const createRenderResources = (device: GPUDevice) => {
	const createDepthTexture = (canvas: HTMLCanvasElement): TexView => {
		const depthTexture = device.createTexture({
			label: "Depth texture",
			size: [canvas.width, canvas.height],
			format: "depth24plus",
			usage:
				GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		})
		return {
			texture: depthTexture,
			view: depthTexture.createView(),
		}
	}

	const createColorTexture = (params: {
		canvas: HTMLCanvasElement
	}): TexView => {
		const colorTexture = device.createTexture({
			label: "Color texture",
			size: [params.canvas.width, params.canvas.height],
			format: navigator.gpu.getPreferredCanvasFormat(),
			usage:
				GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		})
		return {
			texture: colorTexture,
			view: colorTexture.createView(),
		}
	}

	const createGeometryIdTexture = (params: {
		canvas: HTMLCanvasElement
	}): TexView => {
		const geometryIdTexture = device.createTexture({
			label: "Geometry ID texture",
			size: [params.canvas.width, params.canvas.height],
			format: "r32uint",
			usage:
				GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		})
		return {
			texture: geometryIdTexture,
			view: geometryIdTexture.createView(),
		}
	}

	const createNormalTexture = (params: {
		canvas: HTMLCanvasElement
	}): TexView => {
		const normalTexture = device.createTexture({
			label: "Normal texture",
			size: [params.canvas.width, params.canvas.height],
			format: "rgba16float",
			usage:
				GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
		})
		return {
			texture: normalTexture,
			view: normalTexture.createView(),
		}
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
			// Geometric id buffer
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
					// Geometry
					{
						format: "r32uint",
					},
					// Normal
					{
						format: "rgba16float",
					},
				],
			},
			primitive: {
				topology: "triangle-list",
				cullMode: culling ? "back" : "none",
			},
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
		objectBufferResources: ObjectBufferResources
		flatNormalBufferResources: FlatNormalBufferResources
		colorTexView: TexView
		geometryIdTexView: TexView
		depthTexView: TexView
		normalTexView: TexView
		backgroundVec3: Vec3
		context: GPUCanvasContext
		objects3D: Object3D[]
		shadingMode: ShadingModeType
	}) => {
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: params.colorTexView.view,
					loadOp: "clear",
					storeOp: "store",
					clearValue: {
						r: params.backgroundVec3[0],
						g: params.backgroundVec3[1],
						b: params.backgroundVec3[2],
						a: 1,
					},
				},
				{
					view: params.geometryIdTexView.view,
					loadOp: "clear",
					storeOp: "store",
				},
				{
					view: params.normalTexView.view,
					loadOp: "clear",
					storeOp: "store",
				},
			],
			depthStencilAttachment: {
				view: params.depthTexView.view,
				depthLoadOp: "clear",
				depthStoreOp: "store",
				depthClearValue: 1,
			},
		}
		const renderPass =
			params.commandEncoder.beginRenderPass(renderPassDescriptor)
		renderPass.setPipeline(params.renderPipeline)

		const renderMatrixBindGroup = createUniformBindGroup(params.uniformBuffer)
		const storageBindGroup = createRenderStorageBindGroup({
			objectResources: params.objectBufferResources,
			shadingMode: params.shadingMode,
			flatNormalResources: params.flatNormalBufferResources,
		})

		renderPass.setBindGroup(0, renderMatrixBindGroup)
		renderPass.setBindGroup(1, storageBindGroup)
		renderPass.setVertexBuffer(0, params.objectBufferResources.vertexBuffer)
		let nbDrawnVertices = 0
		for (const obj of params.objects3D) {
			nbDrawnVertices += obj.vertexIndexes.length
		}
		renderPass.draw(nbDrawnVertices)
		renderPass.end()
	}

	const postProcessUniformBindGroupLayout = device.createBindGroupLayout({
		label: "Post process uniform bind group layout",
		entries: [
			// Enable FXAA
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
		],
	})

	const createPostProcessUniformBindGroup = (params: { fxaa: boolean }) => {
		const { fxaa } = params
		const fxaaData = new Uint32Array([fxaa ? 1 : 0])
		const fxaaBuffer = device.createBuffer({
			label: "FXAA uniform buffer",
			size: fxaaData.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		})
		device.queue.writeBuffer(fxaaBuffer, 0, fxaaData.buffer)

		const postProcessUniformBindGroup = device.createBindGroup({
			label: "Post process uniform bind group",
			layout: postProcessUniformBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: fxaaBuffer,
					},
				},
			],
		})
		return postProcessUniformBindGroup
	}

	const postProcessTextureBindGroupLayout = device.createBindGroupLayout({
		label: "Post process bind group layout",
		entries: [
			// Basic sampler
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {
					type: "filtering",
				},
			},
			// Color texture
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {
					sampleType: "float",
				},
			},
			// Geometry ID texture
			{
				binding: 2,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {
					sampleType: "uint",
				},
			},
			// Normal texture
			{
				binding: 3,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {
					sampleType: "float",
				},
			},
			// Depth texture
			{
				binding: 4,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {
					sampleType: "depth",
				},
			},
		],
	})

	const sampler = device.createSampler({
		label: "Post process sampler",
		magFilter: "linear",
		minFilter: "linear",
	})

	const createPostProcessTextureBindGroup = (params: {
		colorTexView: TexView
		geometryIdTexView: TexView
		normalTexView: TexView
		depthTexView: TexView
	}) => {
		const { colorTexView, geometryIdTexView, normalTexView, depthTexView } =
			params

		const postProcessBindGroup = device.createBindGroup({
			label: "Post process bind group",
			layout: postProcessTextureBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: sampler,
				},
				{
					binding: 1,
					resource: colorTexView.texture,
				},
				{
					binding: 2,
					resource: geometryIdTexView.texture,
				},
				{
					binding: 3,
					resource: normalTexView.texture,
				},
				{
					binding: 4,
					resource: depthTexView.texture,
				},
			],
		})
		return postProcessBindGroup
	}

	const postProcessPipelineLayout = device.createPipelineLayout({
		label: "Post process pipeline layout",
		bindGroupLayouts: [
			postProcessUniformBindGroupLayout,
			postProcessTextureBindGroupLayout,
		],
	})

	const postProcessShaderModule = device.createShaderModule({
		label: "Post process shader module",
		code: postProcessShaderCode,
	})

	const postProcessPipeline = device.createRenderPipeline({
		label: "Post process pipeline",
		layout: postProcessPipelineLayout,
		vertex: {
			module: postProcessShaderModule,
			entryPoint: "vs_main",
		},
		fragment: {
			module: postProcessShaderModule,
			entryPoint: "fs_main",
			targets: [
				{
					format: navigator.gpu.getPreferredCanvasFormat(),
				},
			],
		},
		primitive: {
			topology: "triangle-list",
		},
	})

	const doPostProcessPass = (params: {
		commandEncoder: GPUCommandEncoder
		context: GPUCanvasContext
		colorTexView: TexView
		geometryIdTexView: TexView
		normalTexView: TexView
		depthTexView: TexView
		fxaa: boolean
	}) => {
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: params.context.getCurrentTexture().createView(),
					loadOp: "clear",
					storeOp: "store",
				},
			],
		}

		const postProcessUniformBindGroup = createPostProcessUniformBindGroup({
			fxaa: params.fxaa,
		})

		const postProcessTextureBindGroup = createPostProcessTextureBindGroup({
			colorTexView: params.colorTexView,
			geometryIdTexView: params.geometryIdTexView,
			normalTexView: params.normalTexView,
			depthTexView: params.depthTexView,
		})

		const renderPass =
			params.commandEncoder.beginRenderPass(renderPassDescriptor)
		renderPass.setPipeline(postProcessPipeline)
		renderPass.setBindGroup(0, postProcessUniformBindGroup)
		renderPass.setBindGroup(1, postProcessTextureBindGroup)
		renderPass.draw(6)
		renderPass.end()
	}

	return {
		createRenderPipeline,
		doRenderPass,
		createDepthTexture,
		createColorTexture,
		createGeometryIdTexture,
		createNormalTexture,
		doPostProcessPass,
	}
}
