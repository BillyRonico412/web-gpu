import { produce } from "immer"
import { useAtom, useSetAtom } from "jotai"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ColorPicker } from "@/routes/tp/viewer/-components/-color-picker"
import { ResetButton } from "@/routes/tp/viewer/-components/-reset-button"
import type { ShadingModeType } from "@/routes/tp/viewer/-gpu/logic/-normal-resources"
import {
	DisplayModeEnum,
	technicalKeys,
} from "@/routes/tp/viewer/-gpu/logic/-types"
import { renderingAtoms } from "@/routes/tp/viewer/-rendering/-rendering-atoms"

const displayModeOptions: { label: string; value: number }[] = [
	{ label: "Basic", value: DisplayModeEnum.BASIC },
	{ label: "Basic with edges", value: DisplayModeEnum.BASIC_WITH_EDGES },
	{ label: "Technical", value: DisplayModeEnum.TECHNICAL },
	{ label: "Normal", value: DisplayModeEnum.NORMAL },
	{ label: "Cel shading", value: DisplayModeEnum.CEL_SHADING },
]

export const RenderingSection = () => {
	const [shadingMode, setShadingMode] = useAtom(renderingAtoms.shadingModeAtom)
	const [culling, setCulling] = useAtom(renderingAtoms.cullingAtom)
	const [background, setBackground] = useAtom(renderingAtoms.backgroundAtom)
	const [displayMode, setDisplayMode] = useAtom(renderingAtoms.displayModeAtom)
	const [technicalConfig, setTechnicalConfig] = useAtom(
		renderingAtoms.technicalConfigAtom,
	)
	const reset = useSetAtom(renderingAtoms.resetAtom)

	return (
		<FieldGroup>
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
				<FieldLabel>Display mode</FieldLabel>
				<NativeSelect
					value={displayMode}
					onChange={(e) => {
						setDisplayMode(Number(e.target.value) as DisplayModeEnum)
					}}
				>
					{displayModeOptions.map((option) => (
						<NativeSelectOption key={option.value} value={option.value}>
							{option.label}
						</NativeSelectOption>
					))}
				</NativeSelect>
			</Field>
			<div className="flex flex-col gap-2">
				{displayMode === DisplayModeEnum.TECHNICAL &&
					technicalKeys.map((key) => (
						<Field orientation="horizontal" key={key}>
							<FieldLabel>
								{key.charAt(0).toUpperCase() + key.slice(1)}
							</FieldLabel>
							<Switch
								size="sm"
								checked={technicalConfig[key]}
								onCheckedChange={(checked) =>
									setTechnicalConfig(
										produce((draft) => {
											draft[key] = checked
										}),
									)
								}
							/>
						</Field>
					))}
			</div>
			<Field orientation="horizontal">
				<FieldLabel>Culling</FieldLabel>
				<Switch
					checked={culling}
					onCheckedChange={(checked) => setCulling(checked)}
				/>
			</Field>
			<Field orientation="horizontal">
				<FieldLabel>Background color</FieldLabel>
				<ColorPicker color={background} onChange={setBackground} />
			</Field>
			<ResetButton onClick={reset} />
		</FieldGroup>
	)
}
