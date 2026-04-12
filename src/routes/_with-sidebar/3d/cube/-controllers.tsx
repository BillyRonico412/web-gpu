import { useAtom } from "jotai"
import { RefreshCcw, SlidersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import {
	angleRotateXAtom,
	angleRotateYAtom,
	angleRotateZAtom,
	distanceCameraAtom,
	fovAngleAtom,
} from "@/routes/_with-sidebar/3d/cube/-atom"

export const Controllers = () => {
	const [angleRotateX, setAngleRotateX] = useAtom(angleRotateXAtom)
	const [angleRotateY, setAngleRotateY] = useAtom(angleRotateYAtom)
	const [angleRotateZ, setAngleRotateZ] = useAtom(angleRotateZAtom)
	const [distanceCamera, setDistanceCamera] = useAtom(distanceCameraAtom)
	const [fovAngle, setFovAngle] = useAtom(fovAngleAtom)
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SlidersIcon className="size-4" />
					Sliders
					<Button
						className="ml-auto"
						size="icon-xs"
						onClick={() => {
							setAngleRotateX(30)
							setAngleRotateY(60)
							setAngleRotateZ(90)
							setDistanceCamera(10)
						}}
					>
						<RefreshCcw />
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<Field>
					<FieldLabel>Rotation x: {angleRotateX}°</FieldLabel>
					<Slider
						min={0}
						max={360}
						step={1}
						value={angleRotateX}
						onValueChange={(value) => {
							if (typeof value === "number") {
								setAngleRotateX(value)
							}
						}}
					/>
				</Field>
				<Field>
					<FieldLabel>Rotation y: {angleRotateY}°</FieldLabel>
					<Slider
						min={0}
						max={360}
						step={1}
						value={angleRotateY}
						onValueChange={(value) => {
							if (typeof value === "number") {
								setAngleRotateY(value)
							}
						}}
					/>
				</Field>
				<Field>
					<FieldLabel>Rotation z: {angleRotateZ}°</FieldLabel>
					<Slider
						min={0}
						max={360}
						step={1}
						value={angleRotateZ}
						onValueChange={(value) => {
							if (typeof value === "number") {
								setAngleRotateZ(value)
							}
						}}
					/>
				</Field>
				<Field>
					<FieldLabel>Distance camera: {distanceCamera}</FieldLabel>
					<Slider
						min={1}
						max={150}
						step={1}
						value={distanceCamera}
						onValueChange={(value) => {
							if (typeof value === "number") {
								setDistanceCamera(value)
							}
						}}
					/>
				</Field>
				<Field>
					<FieldLabel>Fov angle: {fovAngle}°</FieldLabel>
					<Slider
						min={1}
						max={179}
						step={1}
						value={fovAngle}
						onValueChange={(value) => {
							if (typeof value === "number") {
								setFovAngle(value)
							}
						}}
					/>
				</Field>
			</CardContent>
		</Card>
	)
}
