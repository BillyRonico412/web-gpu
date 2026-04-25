import { useAtom } from "jotai"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import { renderingAtoms } from "@/routes/tp/viewer/-rendering/-rendering-atoms"

export const RenderingSection = () => {
	const [msaa, setMsaa] = useAtom(renderingAtoms.msaaAtom)
	const [shadingMode, setShadingMode] = useAtom(renderingAtoms.shadingModeAtom)
	const [culling, setCulling] = useAtom(renderingAtoms.cullingAtom)
	return (
		<FieldGroup>
			<Field orientation="horizontal">
				<FieldLabel>MSAA</FieldLabel>
				<Switch
					checked={msaa}
					onCheckedChange={(checked) => setMsaa(checked)}
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
		</FieldGroup>
	)
}
