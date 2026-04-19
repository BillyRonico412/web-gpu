import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { Camera, SlidersIcon, X } from "lucide-react"
import { vec3 } from "wgpu-matrix"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cameraAtoms } from "@/routes/tp/viewer/-camera/-camera-atoms"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"
import { lightAtoms } from "@/routes/tp/viewer/-light/-light-atoms"

const ViewerInfo = () => {
	const viewer = useAtomValue(gpuAtoms.viewerAtom)
	if (!viewer) {
		return null
	}
	return (
		<Field>
			<FieldLabel>Triangle count: {viewer.obj.vertexIndexes.length}</FieldLabel>
		</Field>
	)
}

const LightDirectionSlider = () => {
	const [lightDirection, setLightDirection] = useAtom(
		lightAtoms.lightDirectionAtom,
	)
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
	const cameraAction = useSetAtom(cameraAtoms.cameraActionAtom)
	return (
		<Button
			variant="outline"
			size="sm"
			onClick={() => {
				cameraAction({ type: "fitToView" })
			}}
		>
			<Camera />
			Fit to view
		</Button>
	)
}

const InterpolateNormalsSwitch = () => {
	const [interpolateNormals, setInterpolateNormals] = useAtom(
		lightAtoms.interpolateNormalsAtom,
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

const isOpenAtom = atom(false)

export const Controllers = () => {
	const [isOpen, setIsOpen] = useAtom(isOpenAtom)
	if (!isOpen) {
		return (
			<Button
				variant="outline"
				onClick={() => {
					setIsOpen(true)
				}}
			>
				<SlidersIcon className="size-4" />
				Show controllers
			</Button>
		)
	}
	return (
		<Card className="min-w-64">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SlidersIcon className="size-4" />
					<span>Controllers</span>
					<Button
						variant="destructive"
						size="icon-xs"
						className="ml-auto"
						onClick={() => {
							setIsOpen(false)
						}}
					>
						<X />
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<ViewerInfo />
				<LightDirectionSlider />
				<InterpolateNormalsSwitch />
				<div className="flex flex-col gap-2">
					<FitToViewButton />
				</div>
			</CardContent>
		</Card>
	)
}
