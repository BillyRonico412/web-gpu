import { useAtom, useAtomValue } from "jotai"
import {
	BookOpenText,
	Pause,
	Play,
	Redo,
	RotateCcw,
	Shuffle,
} from "lucide-react"
import { match } from "ts-pattern"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { gameOfLifeAtom, isRunningAtom } from "@/routes/tp/game-of-life/-atom"

export const Controllers = () => {
	const [isRunning, setIsRunning] = useAtom(isRunningAtom)
	const gameOfLife = useAtomValue(gameOfLifeAtom)
	if (!gameOfLife) {
		return null
	}
	return (
		<Card>
			<CardContent className="flex items-center gap-2">
				<Button onClick={() => setIsRunning(!isRunning)} size="icon-lg">
					{match(isRunning)
						.with(true, () => <Pause />)
						.with(false, () => <Play />)
						.exhaustive()}
				</Button>
				<Button
					size="icon-lg"
					disabled={isRunning}
					onClick={() => {
						if (isRunning) {
							return
						}
						gameOfLife.computeAndDraw()
					}}
				>
					<Redo />
				</Button>
				<Button
					size="icon-lg"
					disabled={isRunning}
					onClick={() => {
						if (isRunning) {
							return
						}
						gameOfLife.reset()
					}}
				>
					<RotateCcw />
				</Button>
				<Button
					size="icon-lg"
					disabled={isRunning}
					onClick={() => {
						if (isRunning) {
							return
						}
						gameOfLife.randomize()
					}}
				>
					<Shuffle />
				</Button>
				<Button size="icon-lg">
					<BookOpenText />
				</Button>
				<ThemeToggle />
			</CardContent>
		</Card>
	)
}
