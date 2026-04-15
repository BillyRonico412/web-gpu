import { atom, useAtom, useSetAtom } from "jotai"
import { FileDown, MousePointerClick } from "lucide-react"
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
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import bodyPart from "@/routes/tp/viewer/-obj/bp.obj?raw"
import bunny from "@/routes/tp/viewer/-obj/bunny.obj?raw"
import cruiser from "@/routes/tp/viewer/-obj/cruiser.obj?raw"
import cube from "@/routes/tp/viewer/-obj/cube.obj?raw"
import f16 from "@/routes/tp/viewer/-obj/f-16.obj?raw"
import suzanne from "@/routes/tp/viewer/-obj/suzanne.obj?raw"

const opts: Record<string, { name: string; data: string }> = {
	cube: {
		name: "Cube",
		data: cube,
	},
	suzanne: {
		name: "Suzanne",
		data: suzanne,
	},
	bodyPart: {
		name: "Body Part",
		data: bodyPart,
	},
	bunny: {
		name: "Bunny",
		data: bunny,
	},
	cruiser: {
		name: "Cruiser",
		data: cruiser,
	},
	f16: {
		name: "F-16",
		data: f16,
	},
}

type OptKey = keyof typeof opts

const selectFileAtom = atom<OptKey | undefined>(undefined)

export const ChooseFileDialog = () => {
	const [fileData, setFileData] = useAtom(gpuAtoms.fileDataAtom)
	const loadFile = useSetAtom(gpuAtoms.loadFileAtom)
	const [selectedOpt, setSelectedOpt] = useAtom(selectFileAtom)

	if (fileData) {
		return null
	}

	return (
		<Dialog open={true}>
			<DialogContent>
				<h2 className="text-lg font-semibold">Choose a file</h2>
				<Field>
					<FieldLabel>Select a file to view.</FieldLabel>
					<Select
						onValueChange={(value) => {
							setSelectedOpt(value as OptKey)
						}}
					>
						<SelectTrigger>
							<SelectValue>
								{selectedOpt ? opts[selectedOpt].name : "Select a file"}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							{Object.entries(opts).map(([key, value]) => (
								<SelectItem key={key} value={key}>
									{value.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				<div className="flex flex-col gap-2">
					<Button
						disabled={!selectedOpt}
						onClick={() => {
							if (selectedOpt) {
								setFileData(opts[selectedOpt].data)
							}
						}}
					>
						<MousePointerClick />
						Choose File
					</Button>
					<Button
						onClick={() => {
							loadFile()
						}}
					>
						<FileDown />
						Load local file
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
