import mitt from "mitt"

export type Events = {
	updateLoadingState:
		| "idle"
		| "init-webgpu"
		| "create-render-resources"
		| "create-object-resources"
		| "create-normal-resources"
		| "done"
}

export const emitter = mitt<Events>()
