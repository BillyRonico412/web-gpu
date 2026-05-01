import { match } from "ts-pattern"
import postProcessShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-post-process-shader.wgsl?raw"
import type {
	DisplayModeType,
	TexView,
} from "@/routes/tp/viewer/-gpu/logic/-types"

export const createPostProcessPassRessources = (device: GPUDevice) => {
	const postProcessUniformSize = 4
	const postProcessUniformData = new Uint32Array(postProcessUniformSize / 4)
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

	const createPostProcessUniformBindGroup = (displayMode: DisplayModeType) => {
		postProcessUniformData[0] = match(displayMode)
			.with("basic", () => 0)
			.with("basic-with-edges", () => 1)
			.with("technical", () => 2)
			.with("normal", () => 3)
			.with("geometry", () => 4)
			.exhaustive()

		console.log("Post process uniform data:", postProcessUniformData[0])

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
			// Depth texture
			{
				binding: 4,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {
					sampleType: "unfilterable-float",
					multisampled: true,
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
				{
					binding: 4,
					resource: params.depthTexView.texture,
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
		displayMode: DisplayModeType
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
			params.displayMode,
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
