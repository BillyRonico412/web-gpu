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

const opts: Record<string, { name: string; url: string }> = {
	armadillo: {
		name: "Armadillo",
		url: "./-obj/armadillo.obj?raw",
	},
	bodyPart: {
		name: "Body Part",
		url: "./-obj/bp.obj?raw",
	},
	bunny: {
		name: "Bunny",
		url: "./-obj/bunny.obj?raw",
	},
	cruiser: {
		name: "Cruiser",
		url: "./-obj/cruiser.obj?raw",
	},
	f16: {
		name: "F-16",
		url: "./-obj/f-16.obj?raw",
	},
	sikorsky: {
		name: "Sikorsky",
		url: "./-obj/sikorsky.obj?raw",
	},
	tyra: {
		name: "Tyra",
		url: "./-obj/tyra.obj?raw",
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
						onClick={async () => {
							if (!selectedOpt) {
								return
							}
							const response = await import(opts[selectedOpt].url)
							setObjText(response.default)
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
