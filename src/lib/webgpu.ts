export const initWebGPU = async () => {
	if (!navigator.gpu) {
		throw new Error("WebGPU is not supported in this browser.")
	}
	const adapter = await navigator.gpu.requestAdapter()
	if (!adapter) {
		throw new Error("Failed to get GPU adapter.")
	}
	const device = await adapter.requestDevice({
		label: "Device",
	})
	return { adapter, device }
}
