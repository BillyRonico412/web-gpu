import { wrap } from "comlink"
import { atom, useAtom, useSetAtom } from "jotai"
import { FileDown, MousePointerClick } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import {
	NativeSelect,
	NativeSelectOptGroup,
	NativeSelectOption,
} from "@/components/ui/native-select"
import { waitMessageAtom } from "@/routes/tp/viewer/-components/-wait-message"
import type { GlbParserWorkerApiType } from "@/routes/tp/viewer/-glb/-parser"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import type { ObjParserWorkerAPiType } from "@/routes/tp/viewer/-obj/-parser"

const parseObjWorker = new Worker(
	new URL("../-obj/-parser.ts", import.meta.url),
	{ type: "module" },
)
const parseObjProxy = wrap<ObjParserWorkerAPiType>(parseObjWorker)
const parseGlbWorker = new Worker(
	new URL("../-glb/-parser.ts", import.meta.url),
	{ type: "module" },
)
const parseGlbProxy = wrap<GlbParserWorkerApiType>(parseGlbWorker)

type Option = {
	name: string
	url: string
}
const objOpts: Record<string, Option> = {
	cube: {
		name: "Cube",
		url: "/obj/cube.obj",
	},
	suzanne: {
		name: "Suzanne",
		url: "/obj/suzanne.obj",
	},
	bp: {
		name: "Body Part",
		url: "/obj/bp.obj",
	},
}

const glbOpts: Record<string, Option> = {
	bike: {
		name: "Bike",
		url: "https://raw.githubusercontent.com/BillyRonico412/glb/main/bike.glb",
	},
	tank: {
		name: "Tank",
		url: "https://raw.githubusercontent.com/BillyRonico412/glb/main/tank.glb",
	},
	engine1: {
		name: "Engine 1",
		url: "https://raw.githubusercontent.com/BillyRonico412/glb/main/engine-1.glb",
	},
	engine2: {
		name: "Engine 2",
		url: "https://raw.githubusercontent.com/BillyRonico412/glb/main/engine-2.glb",
	},
	grue: {
		name: "Grue",
		url: "https://raw.githubusercontent.com/BillyRonico412/glb/main/grue.glb",
	},
	wheel: {
		name: "Wheel",
		url: "https://raw.githubusercontent.com/BillyRonico412/glb/main/wheel.glb",
	},
}

const selectedKeyAtom = atom<keyof typeof objOpts>("cube")
const selectedFileAtom = atom((get) => {
	const key = get(selectedKeyAtom)
	return objOpts[key] || glbOpts[key]
})
const chooseFileAtom = atom(null, (get, set) => {
	const selectedFile = get(selectedFileAtom)
	if (!selectedFile) {
		toast.error("No file selected")
		return
	}
	setTimeout(async () => {
		try {
			set(chooseFileDialogOpenAtom, false)
			set(waitMessageAtom, `Dowloading ${selectedFile.name}...`)
			const data = await fetch(selectedFile.url)
			if (!data.ok) {
				toast.error("Failed to load file")
				return
			}
			if (selectedFile.url.endsWith(".obj")) {
				const text = await data.text()
				const parts = await parseObjProxy.parseObj(text)
				set(gpuAtoms.assemblyAtom, parts)
			} else if (selectedFile.url.endsWith(".glb")) {
				const arrayBuffer = await data.arrayBuffer()
				const parts = await parseGlbProxy.parseGlb(arrayBuffer)
				set(gpuAtoms.assemblyAtom, parts)
			}
		} finally {
			set(waitMessageAtom, undefined)
		}
	})
})

export const chooseFileDialogOpenAtom = atom(false)

export const ChooseFileDialog = () => {
	const loadFile = useSetAtom(gpuAtoms.loadFileAtom)
	const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtom)
	const [open, setOpen] = useAtom(chooseFileDialogOpenAtom)
	const chooseFile = useSetAtom(chooseFileAtom)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<h2 className="text-lg font-semibold">Choose a file</h2>
				<Field>
					<FieldLabel>Select a file to view.</FieldLabel>
					<NativeSelect
						value={selectedKey}
						onChange={(e) => {
							setSelectedKey(e.target.value as keyof typeof objOpts)
						}}
					>
						<NativeSelectOptGroup label="obj">
							{Object.entries(objOpts).map(([key, value]) => (
								<NativeSelectOption key={key} value={key}>
									{value.name}
								</NativeSelectOption>
							))}
						</NativeSelectOptGroup>
						<NativeSelectOptGroup label="glb">
							{Object.entries(glbOpts).map(([key, value]) => (
								<NativeSelectOption key={key} value={key}>
									{value.name}
								</NativeSelectOption>
							))}
						</NativeSelectOptGroup>
					</NativeSelect>
				</Field>
				<div className="flex flex-col gap-2">
					<Button onClick={chooseFile}>
						<MousePointerClick />
						Choose File
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							loadFile()
							setOpen(false)
						}}
					>
						<FileDown />
						Load file
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
