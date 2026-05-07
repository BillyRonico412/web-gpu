import renderShaderCode from "@/routes/tp/image-editor/-render-shader.wgsl?raw"

const loadImage = (url: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.onerror = (err) => reject(err)
		img.src = url
	})
}

export const createShaderResources = (device: GPUDevice) => {
	const createTextureFromImage = async (url: string): Promise<GPUTexture> => {
		const img = await loadImage(url)
		const imageBitmap = await createImageBitmap(img)
		const texture = device.createTexture({
			size: [imageBitmap.width, imageBitmap.height, 1],
			format: "rgba8unorm",
			usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
		})
		device.queue.copyExternalImageToTexture(
			{ source: imageBitmap },
			{ texture },
			[imageBitmap.width, imageBitmap.height, 1],
		)
		return texture
	}

	const createSampler = (): GPUSampler => {
		return device.createSampler({
			magFilter: "linear",
			minFilter: "linear",
		})
	}

	const textureBindGroupLayout = device.createBindGroupLayout({
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				sampler: {},
			},
			{
				binding: 1,
				visibility: GPUShaderStage.FRAGMENT,
				texture: {},
			},
		],
	})

	const createTextureBindGroup = (
		sampler: GPUSampler,
		textureView: GPUTextureView,
	) => {
		return device.createBindGroup({
			layout: textureBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: sampler,
				},
				{
					binding: 1,
					resource: textureView,
				},
			],
		})
	}

	const uniformData = new ArrayBuffer()
	const uniformBuffer = device.createBuffer({
		size: uniformData.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})
	device.queue.writeBuffer(uniformBuffer, 0, uniformData)

	const uniformBindGroupLayout = device.createBindGroupLayout({
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
				buffer: {
					type: "uniform",
				},
			},
		],
	})

	const createUniformBindGroup = () => {
		return device.createBindGroup({
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
	}

	const shaderModule = device.createShaderModule({
		code: renderShaderCode,
	})

	const renderPipeline = device.createRenderPipeline({
		layout: device.createPipelineLayout({
			bindGroupLayouts: [uniformBindGroupLayout, textureBindGroupLayout],
		}),
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
	})

	const doRenderPass = (
		commandEncoder: GPUCommandEncoder,
		textureView: GPUTextureView,
		sampler: GPUSampler,
	) => {
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: textureView,
					loadOp: "clear",
					clearValue: { r: 0, g: 0, b: 0, a: 1 },
					storeOp: "store",
				},
			],
		}
		const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
		passEncoder.setPipeline(renderPipeline)
		const uniformBindGroup = createUniformBindGroup()
		const textureBindGroup = createTextureBindGroup(sampler, textureView)
		passEncoder.setBindGroup(0, uniformBindGroup)
		passEncoder.setBindGroup(1, textureBindGroup)
		passEncoder.draw(6, 1, 0, 0)
		passEncoder.end()
	}

	return {
		createTextureFromImage,
		createSampler,
		doRenderPass,
	}
}
