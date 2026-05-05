import postProcessShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-post-process-shader.wgsl?raw"
import {
	type DisplayModeEnum,
	type TechnicalConfig,
	type TexView,
	technicalKeys,
} from "@/routes/tp/viewer/-gpu/logic/-types"

export const createPostProcessPassRessources = (device: GPUDevice) => {
	// display mode
	const postProcessUniformUintSize = 4
	const postProcessUniformUintData = new Uint32Array(
		postProcessUniformUintSize / 4,
	)
	const postProcessUniformUintBuffer = device.createBuffer({
		label: "Post process uniform buffer",
		size: postProcessUniformUintSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	// technical config + near and far plane for depth linearization
	const postProcessUniformFloatSize = technicalKeys.length * 4 + 4 + 4
	const postProcessUniformFloatData = new Float32Array(
		postProcessUniformFloatSize / 4,
	)
	const postProcessUniformFloatBuffer = device.createBuffer({
		label: "Post process uniform float buffer",
		size: postProcessUniformFloatSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	const postProcessUniformBindGroupLayout = device.createBindGroupLayout({
		label: "Post process uniform bind group layout",
		entries: [
			// display mode + near and far plane for depth linearization
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
		],
	})

	const createPostProcessUniformBindGroup = (params: {
		displayMode: DisplayModeEnum
		near: number
		far: number
		technicalConfig: TechnicalConfig
	}) => {
		postProcessUniformUintData[0] = params.displayMode
		device.queue.writeBuffer(
			postProcessUniformUintBuffer,
			0,
			postProcessUniformUintData,
		)

		technicalKeys.forEach((key, index) => {
			const config = params.technicalConfig[key]
			postProcessUniformFloatData[index] = config ? 1 : 0
		})
		postProcessUniformFloatData[technicalKeys.length] = params.near
		postProcessUniformFloatData[technicalKeys.length + 1] = params.far

		device.queue.writeBuffer(
			postProcessUniformFloatBuffer,
			0,
			postProcessUniformFloatData,
		)

		const postProcessUniformBindGroup = device.createBindGroup({
			label: "Post process uniform bind group",
			layout: postProcessUniformBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: postProcessUniformUintBuffer,
					},
				},
				{
					binding: 1,
					resource: {
						buffer: postProcessUniformFloatBuffer,
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
			// Part ID texture
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
		partIdTextView: TexView
		normalTexView: TexView
		depthTexView: TexView
	}) => {
		const { colorTexView, partIdTextView, normalTexView } = params

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
					resource: partIdTextView.texture,
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

	const postProcessStorateBindGroupLayout = device.createBindGroupLayout({
		label: "Storage bind group layout",
		entries: [
			// Visibility state
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {
					type: "read-only-storage",
				},
			},
		],
	})

	const postProcessCreateStorageBindGroup = (params: {
		visibilityStateBuffer: GPUBuffer
	}) => {
		const bindGroup = device.createBindGroup({
			label: "Storage bind group",
			layout: postProcessStorateBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: params.visibilityStateBuffer,
					},
				},
			],
		})
		return bindGroup
	}

	const postProcessPipelineLayout = device.createPipelineLayout({
		label: "Post process pipeline layout",
		bindGroupLayouts: [
			postProcessUniformBindGroupLayout,
			postProcessTextureBindGroupLayout,
			postProcessStorateBindGroupLayout,
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
		partIdTexView: TexView
		normalTexView: TexView
		depthTexView: TexView
		displayMode: DisplayModeEnum
		near: number
		far: number
		technicalConfig: TechnicalConfig
		visibilityStateBuffer: GPUBuffer
	}) => {
		const {
			visibilityStateBuffer,
			commandEncoder,
			context,
			colorTexView,
			partIdTexView,
			normalTexView,
			depthTexView,
			displayMode,
			near,
			far,
			technicalConfig,
		} = params
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: context.getCurrentTexture().createView(),
					loadOp: "clear",
					storeOp: "store",
				},
			],
		}

		const postProcessUniformBindGroup = createPostProcessUniformBindGroup({
			displayMode,
			near,
			far,
			technicalConfig,
		})

		const postProcessTextureBindGroup = createPostProcessTextureBindGroup({
			colorTexView,
			partIdTextView: partIdTexView,
			normalTexView,
			depthTexView,
		})

		const postProcessStorageBindGroup = postProcessCreateStorageBindGroup({
			visibilityStateBuffer,
		})

		const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor)
		renderPass.setPipeline(postProcessPipeline)
		renderPass.setBindGroup(0, postProcessUniformBindGroup)
		renderPass.setBindGroup(1, postProcessTextureBindGroup)
		renderPass.setBindGroup(2, postProcessStorageBindGroup)
		renderPass.draw(6)
		renderPass.end()
	}

	return {
		doPostProcessPass,
	}
}
