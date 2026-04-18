import { useAtom } from "jotai"
import { LampDesk, Sun } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { lightAtoms } from "@/routes/tp/viewer/-light/-light-atoms"

export const LightSection = () => {
	const [lightMode, setLightMode] = useAtom(lightAtoms.lightModeAtom)
	return (
		<FieldGroup>
			<Field>
				<FieldLabel>Mode</FieldLabel>
				<ToggleGroup
					multiple={false}
					value={[lightMode]}
					onValueChange={(value) => {
						if (value.length !== 1) {
							return
						}
						setLightMode(value[0] as "headlight" | "directional")
					}}
				>
					<ToggleGroupItem value="headlight" className="flex-1">
						<LampDesk className="size-3" />
						Headlight
					</ToggleGroupItem>
					<ToggleGroupItem value="directional" className="flex-1">
						<Sun className="size-3" />
						Directional
					</ToggleGroupItem>
				</ToggleGroup>
			</Field>
		</FieldGroup>
	)
}
