import { useAtom, useSetAtom } from "jotai"
import {
	Axis3D,
	CornerDownLeft,
	CornerDownRight,
	Telescope,
} from "lucide-react"
import { vec3 } from "wgpu-matrix"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"

export const CameraSection = () => {
	const [projectionType, setProjectionType] = useAtom(
		cameraAtoms.projectionTypeAtom,
	)
	const turnUp = useSetAtom(cameraAtoms.turnUpAtom)
	const setUp = useSetAtom(cameraAtoms.upAtom)
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
						<Telescope className="size-3" />
						Perspective
					</ToggleGroupItem>
					<ToggleGroupItem value="orthographic" className="flex-1">
						<Axis3D className="size-3" />
						Orthographic
					</ToggleGroupItem>
				</ToggleGroup>
			</Field>
			<Field>
				<FieldLabel>
					<span>Up Vector</span>
					<Button
						className="ml-auto"
						variant="outline"
						onClick={() => {
							setUp(vec3.fromValues(0, 1, 0))
						}}
					>
						Reset up
					</Button>
				</FieldLabel>
				<div className="space-y-2">
					<Field orientation="horizontal">
						<FieldLabel>Rotate around X</FieldLabel>
						<ButtonGroup>
							<Button onClick={() => turnUp("x", "ccw")}>
								<CornerDownLeft />
							</Button>
							<Button onClick={() => turnUp("x", "cw")}>
								<CornerDownRight />
							</Button>
						</ButtonGroup>
					</Field>
					<Field orientation="horizontal">
						<FieldLabel>Rotate around Z</FieldLabel>
						<ButtonGroup>
							<Button onClick={() => turnUp("z", "ccw")}>
								<CornerDownLeft />
							</Button>
							<Button onClick={() => turnUp("z", "cw")}>
								<CornerDownRight />
							</Button>
						</ButtonGroup>
					</Field>
				</div>
			</Field>
		</FieldGroup>
	)
}
