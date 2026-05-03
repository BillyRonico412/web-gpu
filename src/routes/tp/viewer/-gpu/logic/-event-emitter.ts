import mitt from "mitt"

export type Events = {
	updateLoadingState:
		| "idle"
		| "init-webgpu"
		| "create-render-resources"
		| "create-object-resources"
		| "create-normal-resources"
		| "done"
	updateVisibilityState: {
		partIds: number[]
	}
}

export const emitter = mitt<Events>()
