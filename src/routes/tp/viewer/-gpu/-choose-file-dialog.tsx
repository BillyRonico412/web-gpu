import { atom, useAtom, useSetAtom } from "jotai"
import { FileDown, MousePointerClick } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { parseGLB } from "@/routes/tp/viewer/-glb/-parser"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { parseObj } from "@/routes/tp/viewer/-obj/-parser"

type Option = {
	name: string
	url: string
}

const files: Option[] = [
	{
		name: "Cube",
		url: "/obj/cube.obj",
	},
	{
		name: "Suzanne",
		url: "/obj/suzanne.obj",
	},
	{
		name: "Body Part",
		url: "/obj/bp.obj",
	},
	{
		name: "Bunny",
		url: "/obj/bunny.obj",
	},
	{
		name: "Cube (.glb)",
		url: "/glb/cube.glb",
	},
]

const selectedFileAtom = atom<Option | undefined>(undefined)
export const chooseFileDialogOpenAtom = atom(false)

export const ChooseFileDialog = () => {
	const setObjects3D = useSetAtom(gpuAtoms.objects3DAtom)
	const loadFile = useSetAtom(gpuAtoms.loadFileAtom)
	const [selectedFile, setSelectedFile] = useAtom(selectedFileAtom)
	const [open, setOpen] = useAtom(chooseFileDialogOpenAtom)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<h2 className="text-lg font-semibold">Choose a file</h2>
				<Field>
					<FieldLabel>Select a file to view.</FieldLabel>
					<Select
						onValueChange={(value: Option | null) => {
							if (!value) {
								setSelectedFile(undefined)
								return
							}
							setSelectedFile(value)
						}}
					>
						<SelectTrigger>
							<SelectValue>
								{selectedFile ? selectedFile.name : "Select a file"}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{files.map((file) => (
								<SelectItem key={file.url} value={file}>
									{file.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<div className="flex flex-col gap-2">
					<Button
						disabled={!selectedFile}
						onClick={async () => {
							if (selectedFile) {
								const data = await fetch(selectedFile.url)
								if (!data.ok) {
									toast.error("Failed to load file")
									return
								}
								if (selectedFile.url.endsWith(".glb")) {
									const arrayBuffer = await data.arrayBuffer()
									const uint8Array = new Uint8Array(arrayBuffer)
									const objects3D = await parseGLB(uint8Array)
									setObjects3D(objects3D)
								} else if (selectedFile.url.endsWith(".obj")) {
									const text = await data.text()
									const objects3D = await parseObj(text)
									setObjects3D(objects3D)
								}
								setOpen(false)
							}
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
