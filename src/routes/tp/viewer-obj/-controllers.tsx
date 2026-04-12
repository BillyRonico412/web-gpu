import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { Camera, SlidersIcon, Torus } from "lucide-react"
import { vec3 } from "wgpu-matrix"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
	fitToViewAtom,
	interpolateNormalsAtom,
	lightDirectionAtom,
	objTextAtom,
	viewerObjAtom,
} from "@/routes/tp/viewer-obj/-atom"

const ObjInfo = () => {
	const viewerObj = useAtomValue(viewerObjAtom)
	if (!viewerObj) {
		return null
	}
	return (
		<Field>
			<FieldLabel>Triangle count: {viewerObj.obj.faceData.length}</FieldLabel>
		</Field>
	)
}

const LightDirectionSlider = () => {
	const [lightDirection, setLightDirection] = useAtom(lightDirectionAtom)
	return (
		<div className="flex flex-col gap-1">
			<p>
				Light direction ({lightDirection[0]}, {lightDirection[1]},{" "}
				{lightDirection[2]})
			</p>
			<Field orientation="horizontal">
				<FieldLabel>X</FieldLabel>
				<Slider
					min={-10}
					max={10}
					step={1}
					value={lightDirection[0]}
					onValueChange={(value) => {
						if (typeof value === "number") {
							setLightDirection(
								vec3.create(value, lightDirection[1], lightDirection[2]),
							)
						}
					}}
				/>
			</Field>
			<Field orientation="horizontal">
				<FieldLabel>Y</FieldLabel>
				<Slider
					min={-10}
					max={10}
					step={1}
					value={lightDirection[1]}
					onValueChange={(value) => {
						if (typeof value === "number") {
							setLightDirection(
								vec3.create(lightDirection[0], value, lightDirection[2]),
							)
						}
					}}
				/>
			</Field>
			<Field orientation="horizontal">
				<FieldLabel>Z</FieldLabel>
				<Slider
					min={-10}
					max={10}
					step={1}
					value={lightDirection[2]}
					onValueChange={(value) => {
						if (typeof value === "number") {
							setLightDirection(
								vec3.create(lightDirection[0], lightDirection[1], value),
							)
						}
					}}
				/>
			</Field>
		</div>
	)
}

const FitToViewButton = () => {
	const fitToView = useSetAtom(fitToViewAtom)
	return (
		<Button
			variant="outline"
			size="sm"
			onClick={() => {
				fitToView()
			}}
		>
			<Camera />
			Fit to view
		</Button>
	)
}

const LoadObjButton = () => {
	const setObjText = useSetAtom(objTextAtom)

	return (
		<Button
			size="sm"
			onClick={() => {
				setObjText(undefined)
			}}
		>
			<Torus />
			Load another obj
		</Button>
	)
}

const InterpolateNormalsSwitch = () => {
	const [interpolateNormals, setInterpolateNormals] = useAtom(
		interpolateNormalsAtom,
	)
	return (
		<Field orientation="horizontal">
			<FieldLabel>Interpolate normals</FieldLabel>
			<Switch
				checked={interpolateNormals}
				onCheckedChange={(checked) => {
					setInterpolateNormals(checked)
				}}
			/>
		</Field>
	)
}

export const Controllers = () => {
	return (
		<Card className="min-w-64">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SlidersIcon className="size-4" />
					Controllers
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<ObjInfo />
				<LightDirectionSlider />
				<InterpolateNormalsSwitch />
				<div className="flex flex-col gap-2">
					<FitToViewButton />
					<LoadObjButton />
				</div>
			</CardContent>
		</Card>
	)
}
