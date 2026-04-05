import { useAtom, useAtomValue } from "jotai"
import { SlidersIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import {
	cellPixelDensityAtom,
	generationTimeAtom,
	isRunningAtom,
} from "@/routes/tp/game-of-life/-atom"

export const Sliders = () => {
	const [cellPixelDensity, setCellPixelDensity] = useAtom(cellPixelDensityAtom)
	const [generationTime, setGenerationTime] = useAtom(generationTimeAtom)
	const isRunning = useAtomValue(isRunningAtom)
	if (isRunning) {
		return null
	}
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SlidersIcon className="size-4" />
					Sliders
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<Field>
					<FieldLabel>Cell Pixel Density: {cellPixelDensity}px</FieldLabel>
					<Slider
						min={1}
						max={20}
						step={1}
						value={cellPixelDensity}
						onValueChange={(value) => {
							if (typeof value === "number") {
								setCellPixelDensity(value)
							}
						}}
					/>
				</Field>
				<Field>
					<FieldLabel>
						Generation Time:
						{generationTime}ms
					</FieldLabel>
					<Slider
						min={50}
						max={2000}
						step={50}
						value={generationTime}
						onValueChange={(value) => {
							if (typeof value === "number") {
								setGenerationTime(value)
							}
						}}
					/>
				</Field>
			</CardContent>
		</Card>
	)
}
