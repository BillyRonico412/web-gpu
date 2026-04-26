import { useAtom, useSetAtom } from "jotai"
import { LampDesk, Sun } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ResetButton } from "@/routes/tp/viewer/-components/-reset-button"
import { lightAtoms } from "@/routes/tp/viewer/-light/-light-atoms"

export const LightSection = () => {
	const [lightMode, setLightMode] = useAtom(lightAtoms.lightModeAtom)
	const [ambient, setAmbient] = useAtom(lightAtoms.ambientAtom)
	const [specularIntensity, setSpecularIntensity] = useAtom(
		lightAtoms.specularIntensityAtom,
	)
	const [specularEnabled, setSpecularEnabled] = useAtom(
		lightAtoms.specularEnabledAtom,
	)
	const reset = useSetAtom(lightAtoms.resetAtom)
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
			<Field>
				<FieldLabel>Ambient ({ambient.toFixed(2)})</FieldLabel>
				<Slider
					min={0}
					max={1}
					step={0.01}
					value={[ambient]}
					onValueChange={(value) =>
						setAmbient(Array.isArray(value) ? value[0] : value)
					}
				/>
			</Field>
			<Field>
				<div className="flex items-center justify-between">
					<FieldLabel>Specular</FieldLabel>
					<Switch
						checked={specularEnabled}
						onCheckedChange={setSpecularEnabled}
					/>
				</div>
			</Field>
			{specularEnabled && (
				<Field>
					<FieldLabel>
						Specular Intensity ({specularIntensity.toFixed(2)})
					</FieldLabel>
					<Slider
						min={0}
						max={2}
						step={0.01}
						value={[specularIntensity]}
						onValueChange={(value) =>
							setSpecularIntensity(Array.isArray(value) ? value[0] : value)
						}
					/>
				</Field>
			)}
			<ResetButton onClick={reset} />
		</FieldGroup>
	)
}
