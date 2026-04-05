import { useAtomValue } from "jotai"
import { InfoIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	cellPixelDensityAtom,
	gameOfLifeAtom,
	timeAtom,
} from "@/routes/tp/game-of-life/-atom"

export const Info = () => {
	const gameOfLife = useAtomValue(gameOfLifeAtom)
	const cellPixelDensity = useAtomValue(cellPixelDensityAtom)
	const time = useAtomValue(timeAtom)
	if (!gameOfLife) {
		return null
	}
	const cellsPerRow = Math.floor(gameOfLife.canvas.width / cellPixelDensity)
	const cellsPerColumn = Math.floor(gameOfLife.canvas.height / cellPixelDensity)
	const nbCells = cellsPerRow * cellsPerColumn
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<InfoIcon className="size-4" />
					Grid info
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-1">
				<div>
					Canvas size: {gameOfLife.canvas.width} x {gameOfLife.canvas.height}
				</div>
				<div>
					Grid size: {cellsPerRow} x {cellsPerColumn}
				</div>
				<div>Nb of cells: {nbCells}</div>
				<div>Generation: {time}</div>
			</CardContent>
		</Card>
	)
}
