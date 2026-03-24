import { atom, getDefaultStore } from "jotai"
import {
	ClickState,
	type UpdateUniformDataParams,
} from "@/routes/tp/gravity-swarm/-wgpu"

export const jotaiStore = getDefaultStore()
export const uniformAtom = atom<Omit<UpdateUniformDataParams, "canvas">>({
	clickPosition: [0, 0],
	clickState: ClickState.None,
})
