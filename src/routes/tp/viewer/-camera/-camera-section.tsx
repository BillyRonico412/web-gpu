import { useAtom } from "jotai"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"

export const CameraSection = () => {
	const [projectionType, setProjectionType] = useAtom(
		cameraAtoms.projectionTypeAtom,
	)
	return (
		<FieldGroup>
			<Field>
				<FieldLabel>Projection</FieldLabel>
				<ToggleGroup
					multiple={false}
					value={[projectionType]}
					onValueChange={(value) => {
						if (value.length !== 1) {
							return
						}
						setProjectionType(value[0] as "perspective" | "orthographic")
					}}
				>
					<ToggleGroupItem value="perspective" className="flex-1">
						Perspective
					</ToggleGroupItem>
					<ToggleGroupItem value="orthographic" className="flex-1">
						Orthographic
					</ToggleGroupItem>
				</ToggleGroup>
			</Field>
		</FieldGroup>
	)
}
