import renderShaderCode from "@/routes/tp/image-editor/-render-shader.wgsl?raw"
import type { AppliedFilter } from "@/routes/tp/image-editor/-types"

const loadImage = (url: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.onerror = (err) => reject(err)
		img.src = url
	})
}

export const createRenderManager = (
	device: GPUDevice,
	context: GPUCanvasContext,
) => {
	const createTextureFromImage = async (url: string): Promise<GPUTexture> => {
		const img = await loadImage(url)
		const imageBitmap = await createImageBitmap(img)
		const texture = device.createTexture({
			size: [imageBitmap.width, imageBitmap.height, 1],
			format: "rgba8unorm",
			usage:
				GPUTextureUsage.TEXTURE_BINDING |
				GPUTextureUsage.COPY_DST |
				GPUTextureUsage.RENDER_ATTACHMENT,
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

	const uniformData = new ArrayBuffer(8 + 4 + 4)
	const uniformDataUint32 = new Uint32Array(uniformData)
	const uniformBuffer = device.createBuffer({
		size: uniformData.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

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

	const createUniformBindGroup = (
		canvas: HTMLCanvasElement,
		appliedFilter: AppliedFilter,
	) => {
		uniformDataUint32[0] = canvas.width
		uniformDataUint32[1] = canvas.height
		uniformDataUint32[2] = appliedFilter
		device.queue.writeBuffer(uniformBuffer, 0, uniformData)
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
			bindGroupLayouts: [textureBindGroupLayout, uniformBindGroupLayout],
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
		primitive: {
			topology: "triangle-list",
		},
	})

	const doRenderPass = (params: {
		commandEncoder: GPUCommandEncoder
		textureView: GPUTextureView
		sampler: GPUSampler
		canvas: HTMLCanvasElement
		appliedFilter: AppliedFilter
	}) => {
		const { commandEncoder, textureView, sampler, canvas, appliedFilter } =
			params
		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [
				{
					view: context.getCurrentTexture().createView(),
					loadOp: "clear",
					clearValue: { r: 0, g: 0, b: 0, a: 1 },
					storeOp: "store",
				},
			],
		}
		const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
		passEncoder.setPipeline(renderPipeline)
		const uniformBindGroup = createUniformBindGroup(canvas, appliedFilter)
		const textureBindGroup = createTextureBindGroup(sampler, textureView)
		passEncoder.setBindGroup(0, textureBindGroup)
		passEncoder.setBindGroup(1, uniformBindGroup)
		passEncoder.draw(6)
		passEncoder.end()
	}

	return {
		createTextureFromImage,
		createSampler,
		doRenderPass,
	}
}
