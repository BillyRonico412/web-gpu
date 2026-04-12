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
import { loadObjFileAtom, objTextAtom } from "@/routes/tp/viewer-obj/-atom"

import bodyPart from "@/routes/tp/viewer-obj/-obj/bp.obj?raw"
import bunny from "@/routes/tp/viewer-obj/-obj/bunny.obj?raw"
import cruiser from "@/routes/tp/viewer-obj/-obj/cruiser.obj?raw"
import f16 from "@/routes/tp/viewer-obj/-obj/f-16.obj?raw"

const opts: Record<string, { name: string; data: string }> = {
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

const selectObjAtom = atom<OptKey | undefined>(undefined)

export const ChooseObjDialog = () => {
	const [objText, setObjText] = useAtom(objTextAtom)
	const loadObjFile = useSetAtom(loadObjFileAtom)
	const [selectedOpt, setSelectedOpt] = useAtom(selectObjAtom)

	if (objText) {
		return null
	}

	return (
		<Dialog open={true}>
			<DialogContent>
				<h2 className="text-lg font-semibold">Choose an OBJ file</h2>
				<Field>
					<FieldLabel>Select an obj file to view.</FieldLabel>
					<Select
						onValueChange={(value) => {
							setSelectedOpt(value as OptKey)
						}}
					>
						<SelectTrigger>
							<SelectValue>
								{selectedOpt ? opts[selectedOpt].name : "Select an obj file"}
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
								setObjText(opts[selectedOpt].data)
							}
						}}
					>
						<MousePointerClick />
						Choose File
					</Button>
					<Button
						onClick={() => {
							loadObjFile()
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
