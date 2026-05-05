import { emitter } from "@/routes/tp/viewer/-gpu/logic/-event-emitter"
import type {
	Part,
	PartBufferResources,
	PartResources,
} from "@/routes/tp/viewer/-gpu/logic/-types"

export const createPartManager = (params: {
	device: GPUDevice
	parts: Part[]
	partResources: PartResources
	partBufferResources: PartBufferResources
}) => {
	const { device, parts, partResources, partBufferResources } = params

	const updateVisibilityState = (
		partIds: number[],
		mask: number,
		value: number,
	) => {
		for (const partId of partIds) {
			partResources.visibilityStateData[partId - 1] =
				(partResources.visibilityStateData[partId - 1] & ~mask) | (value & mask)
			device.queue.writeBuffer(
				partBufferResources.visibilityStateBuffer,
				(partId - 1) * 4,
				new Uint32Array([partResources.visibilityStateData[partId - 1]]),
			)
		}
		emitter.emit("updateVisibilityState", {
			partIds,
		})
	}

	const getVisibilityState = (partId: number): number => {
		return partResources.visibilityStateData[partId - 1]
	}

	const getPartCount = () => {
		return parts.length
	}

	const getPartInfo = (partId: number) => {
		const part = parts[partId - 1]
		return {
			...part,
		}
	}

	return {
		updateVisibilityState,
		getVisibilityState,
		getPartCount,
		getPartInfo,
	}
}
