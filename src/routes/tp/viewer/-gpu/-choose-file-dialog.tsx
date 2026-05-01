import { wrap } from "comlink"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { FileDown, MousePointerClick } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
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
const options: Record<string, Option> = {
	cube: {
		name: "Cube",
		url: "/obj/cube.obj",
	},
	cylinder: {
		name: "Cylinder",
		url: "/obj/cylinder.obj",
	},
	suzanne: {
		name: "Suzanne",
		url: "/obj/suzanne.obj",
	},
	bp: {
		name: "Body Part",
		url: "/obj/bp.obj",
	},
	bunny: {
		name: "Bunny",
		url: "/obj/bunny.obj",
	},
	f16: {
		name: "F16",
		url: "/obj/f-16.obj",
	},
	cubeGlb: {
		name: "Cube(.glb)",
		url: "/glb/cube.glb",
	},
}

const selectedKeyAtom = atom<keyof typeof options>("cube")
const selectedFileAtom = atom((get) => {
	const key = get(selectedKeyAtom)
	return options[key]
})
export const chooseFileDialogOpenAtom = atom(false)

export const ChooseFileDialog = () => {
	const setObjects3D = useSetAtom(gpuAtoms.objects3DAtom)
	const loadFile = useSetAtom(gpuAtoms.loadFileAtom)
	const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtom)
	const selectedFile = useAtomValue(selectedFileAtom)
	const [open, setOpen] = useAtom(chooseFileDialogOpenAtom)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<h2 className="text-lg font-semibold">Choose a file</h2>
				<Field>
					<FieldLabel>Select a file to view.</FieldLabel>
					<NativeSelect
						value={selectedKey}
						onChange={(e) => {
							setSelectedKey(e.target.value as keyof typeof options)
						}}
					>
						{Object.entries(options).map(([key, value]) => (
							<NativeSelectOption key={key} value={key}>
								{value.name}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</Field>
				<div className="flex flex-col gap-2">
					<Button
						onClick={async () => {
							const data = await fetch(selectedFile.url)
							if (!data.ok) {
								toast.error("Failed to load file")
								return
							}
							if (selectedFile.url.endsWith(".obj")) {
								const text = await data.text()
								const objects3D = await parseObjProxy.parseObj(text)
								setObjects3D(objects3D)
							} else if (selectedFile.url.endsWith(".glb")) {
								const arrayBuffer = await data.arrayBuffer()
								const objects3D = await parseGlbProxy.parseGlb(arrayBuffer)
								setObjects3D(objects3D)
							}
							setOpen(false)
						}}
					>
						<MousePointerClick />
						Choose File
					</Button>
					<Button
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
