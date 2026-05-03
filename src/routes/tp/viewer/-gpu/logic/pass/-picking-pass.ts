import pickingShaderCode from "@/routes/tp/viewer/-gpu/-shaders/-picking-shader.wgsl?raw"
import type {
	Part,
	PickParams,
	TexView,
} from "@/routes/tp/viewer/-gpu/logic/-types"

export const createPickingPassRessources = (params: {
	device: GPUDevice
	parts: Part[]
}) => {
	const { device, parts } = params
	// x, y, width, height
	const pickingUniformSize = 4 + 4 + 4 + 4
	const pickingUniformData = new Uint32Array(4)
	const pickingUniformBuffer = device.createBuffer({
		label: "Picking uniform buffer",
		size: pickingUniformSize,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	})

	const pickingBindGroupLayout = device.createBindGroupLayout({
		label: "Picking bind group layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: "uniform",
				},
			},
		],
	})

	const createUniformPickingBindGroup = (params: PickParams) => {
		pickingUniformData[0] = params.x
		pickingUniformData[1] = params.y
		pickingUniformData[2] = params.width
		pickingUniformData[3] = params.height
		device.queue.writeBuffer(pickingUniformBuffer, 0, pickingUniformData)
		const pickingBindGroup = device.createBindGroup({
			label: "Picking bind group",
			layout: pickingBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: pickingUniformBuffer,
					},
				},
			],
		})
		return pickingBindGroup
	}

	const textureBindGroupLayout = device.createBindGroupLayout({
		label: "Picking texture bind group layout",
		entries: [
			// Part ID texture
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				texture: {
					sampleType: "unfilterable-float",
					multisampled: true,
				},
			},
		],
	})

	const createTextureBindGroup = (partIdTexView: TexView) => {
		const textureBindGroup = device.createBindGroup({
			label: "Picking texture bind group",
			layout: textureBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: partIdTexView.view,
				},
			],
		})
		return textureBindGroup
	}

	const stagingBuffer = device.createBuffer({
		label: "Picking result buffer",
		size: 4 * parts.length,
		usage:
			GPUBufferUsage.STORAGE |
			GPUBufferUsage.COPY_SRC |
			GPUBufferUsage.COPY_DST,
	})

	const pickingBitSetBuffer = device.createBuffer({
		size: 4 * parts.length,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
	})

	const storageBindGroupLayout = device.createBindGroupLayout({
		label: "Picking storage bind group layout",
		entries: [
			{
				binding: 0,
				visibility: GPUShaderStage.COMPUTE,
				buffer: {
					type: "storage",
				},
			},
		],
	})

	const createStorageBindGroup = () => {
		const storageBindGroup = device.createBindGroup({
			label: "Picking storage bind group",
			layout: storageBindGroupLayout,
			entries: [
				{
					binding: 0,
					resource: {
						buffer: stagingBuffer,
					},
				},
			],
		})
		return storageBindGroup
	}

	const pickingPipelineLayout = device.createPipelineLayout({
		label: "Picking pipeline layout",
		bindGroupLayouts: [
			pickingBindGroupLayout,
			textureBindGroupLayout,
			storageBindGroupLayout,
		],
	})

	const pickingShaderModule = device.createShaderModule({
		label: "Picking compute shader module",
		code: pickingShaderCode,
	})

	const pickingPipeline = device.createComputePipeline({
		label: "Picking compute pipeline",
		layout: pickingPipelineLayout,
		compute: {
			module: pickingShaderModule,
			entryPoint: "cs_main",
		},
	})

	const doPickingPass = (params: {
		commandEncoder: GPUCommandEncoder
		partIdTexView: TexView
		pickParams: PickParams
	}) => {
		const { commandEncoder, partIdTexView, pickParams } = params
		commandEncoder.clearBuffer(stagingBuffer)
		const pickingBindGroup = createUniformPickingBindGroup(pickParams)
		const textureBindGroup = createTextureBindGroup(partIdTexView)
		const storageBindGroup = createStorageBindGroup()
		const passEncoder = commandEncoder.beginComputePass({
			label: "Picking compute pass",
		})
		passEncoder.setPipeline(pickingPipeline)
		passEncoder.setBindGroup(0, pickingBindGroup)
		passEncoder.setBindGroup(1, textureBindGroup)
		passEncoder.setBindGroup(2, storageBindGroup)
		const workgroupSize = 16
		const dispatchX = Math.ceil(pickParams.width / workgroupSize)
		const dispatchY = Math.ceil(pickParams.height / workgroupSize)
		passEncoder.dispatchWorkgroups(dispatchX, dispatchY)
		passEncoder.end()
		commandEncoder.copyBufferToBuffer(
			stagingBuffer,
			0,
			pickingBitSetBuffer,
			0,
			4 * parts.length,
		)
	}

	return {
		doPickingPass,
		pickingBitSetBuffer,
	}
}
