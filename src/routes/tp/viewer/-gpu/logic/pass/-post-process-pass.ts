import postProcessShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-post-process-shader.wgsl?raw"
import type { TexView } from "@/routes/tp/viewer/-gpu/logic/-types"

export const createPostProcessPassRessources = (device: GPUDevice) => {
	const postProcessUniformSize = 4
	const postProcessUniformData = new Float32Array(postProcessUniformSize / 4)
	const postProcessUniformBuffer = device.createBuffer({
		label: "Post process uniform buffer",
		size: postProcessUniformSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	const postProcessUniformBindGroupLayout = device.createBindGroupLayout({
		label: "Post process uniform bind group layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
		],
	})

	const createPostProcessUniformBindGroup = (edgeDetectionEnabled: boolean) => {
		postProcessUniformData[0] = edgeDetectionEnabled ? 1 : 0
		device.queue.writeBuffer(
			postProcessUniformBuffer,
			0,
			postProcessUniformData,
		)
		const postProcessUniformBindGroup = device.createBindGroup({
			label: "Post process uniform bind group",
			layout: postProcessUniformBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: postProcessUniformBuffer,
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
					sampleType: "unfilterable-float",
					multisampled: true,
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
		const { colorTexView, geometryIdTexView, normalTexView } = params

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
		geometryEdgeDetection: boolean
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

		const postProcessUniformBindGroup = createPostProcessUniformBindGroup(
			params.geometryEdgeDetection,
		)

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
		doPostProcessPass,
	}
}
