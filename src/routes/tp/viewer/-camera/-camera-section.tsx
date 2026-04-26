import { useAtom, useSetAtom } from "jotai"
import { Axis3D, Fullscreen, RedoDot, Telescope, UndoDot } from "lucide-react"
import { vec3 } from "wgpu-matrix"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"
import { ResetButton } from "@/routes/tp/viewer/-components/-reset-button"

export const CameraSection = () => {
	const [projectionType, setProjectionType] = useAtom(
		cameraAtoms.projectionTypeAtom,
	)
	const turnUp = useSetAtom(cameraAtoms.turnUpAtom)
	const setUp = useSetAtom(cameraAtoms.upAtom)
	const cameraAction = useSetAtom(cameraAtoms.cameraActionAtom)
	const reset = useSetAtom(cameraAtoms.cameraResetAtom)
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
								<UndoDot />
							</Button>
							<Button onClick={() => turnUp("x", "cw")}>
								<RedoDot />
							</Button>
						</ButtonGroup>
					</Field>
					<Field orientation="horizontal">
						<FieldLabel>Rotate around Z</FieldLabel>
						<ButtonGroup>
							<Button onClick={() => turnUp("z", "ccw")}>
								<UndoDot />
							</Button>
							<Button onClick={() => turnUp("z", "cw")}>
								<RedoDot />
							</Button>
						</ButtonGroup>
					</Field>
				</div>
			</Field>
			<Field>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						cameraAction({ type: "fitToView" })
					}}
				>
					<Fullscreen />
					Fit to view
				</Button>
			</Field>
			<ResetButton onClick={reset} />
		</FieldGroup>
	)
}
