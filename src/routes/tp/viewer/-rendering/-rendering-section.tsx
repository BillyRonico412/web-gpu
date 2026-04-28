import { useAtom, useSetAtom } from "jotai"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ResetButton } from "@/routes/tp/viewer/-components/-reset-button"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import { renderingAtoms } from "@/routes/tp/viewer/-rendering/-rendering-atoms"

export const RenderingSection = () => {
	const [fxaa, setFxaa] = useAtom(renderingAtoms.fxaaAtom)
	const [shadingMode, setShadingMode] = useAtom(renderingAtoms.shadingModeAtom)
	const [culling, setCulling] = useAtom(renderingAtoms.cullingAtom)
	const [backgroundHex, setBackgroundHex] = useAtom(
		renderingAtoms.backgroundHexAtom,
	)
	const reset = useSetAtom(renderingAtoms.resetAtom)

	return (
		<FieldGroup>
			<Field orientation="horizontal">
				<FieldLabel>FXAA</FieldLabel>
				<Switch
					checked={fxaa}
					onCheckedChange={(checked) => setFxaa(checked)}
				/>
			</Field>
			<Field>
				<FieldLabel>Shading mode</FieldLabel>
				<ToggleGroup
					multiple={false}
					value={[shadingMode]}
					onValueChange={(value) => {
						if (value.length !== 1) {
							return
						}
						setShadingMode(value[0] as ShadingModeType)
					}}
				>
					<ToggleGroupItem value="flat" className="flex-1">
						Flat
					</ToggleGroupItem>
					<ToggleGroupItem value="auto" className="flex-1">
						Auto
					</ToggleGroupItem>
				</ToggleGroup>
			</Field>
			<Field orientation="horizontal">
				<FieldLabel>Culling</FieldLabel>
				<Switch
					checked={culling}
					onCheckedChange={(checked) => setCulling(checked)}
				/>
			</Field>
			<Field orientation="horizontal">
				<FieldLabel>Color</FieldLabel>
				<Input
					type="color"
					value={backgroundHex}
					onChange={(e) => {
						setBackgroundHex(e.target.value)
					}}
					className="size-8 p-0 border-0"
				/>
			</Field>
			<ResetButton onClick={reset} />
		</FieldGroup>
	)
}
