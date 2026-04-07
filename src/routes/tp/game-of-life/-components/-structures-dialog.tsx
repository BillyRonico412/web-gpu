import { useMutation } from "@tanstack/react-query"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { match, P } from "ts-pattern"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { gameOfLifeAtom } from "@/routes/tp/game-of-life/-atom"
import {
	getRandomStructure,
	pageAtom,
	type StructureType,
	structuresQueryAtom,
} from "@/routes/tp/game-of-life/-structures/-structures"

const openDialogAtom = atom(false)

export const StructuresDialog = (props: { children: ReactNode }) => {
	const structuresQuery = useAtomValue(structuresQueryAtom)
	const [isOpen, setIsOpen] = useAtom(openDialogAtom)
	const gameOfLife = useAtomValue(gameOfLifeAtom)
	const randomMutation = useMutation({
		mutationFn: getRandomStructure,
		onSuccess: (structure) => {
			if (!gameOfLife) {
				return
			}
			if (
				gameOfLife.canvas.width < structure.x ||
				gameOfLife.canvas.height < structure.y
			) {
				toast.error(
					`The structure is too big for the current canvas size (${gameOfLife.canvas.width}x${gameOfLife.canvas.height})`,
				)
				return
			}
			gameOfLife.updateStorageByStructure(structure)
			gameOfLife.draw()
			setIsOpen(false)
		},
	})
	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open)
			}}
		>
			<DialogTrigger>{props.children}</DialogTrigger>
			<DialogContent className="h-[80dvh] w-[80vw] flex flex-col max-w-2xl!">
				<DialogHeader>
					<DialogTitle className="px-2">Structure's catalog</DialogTitle>
				</DialogHeader>
				<ScrollArea className="flex-1 overflow-hidden">
					{match(structuresQuery)
						.with({ isLoading: true }, () => <p>Loading...</p>)
						.with({ isError: true }, () => <p>Error loading structures</p>)
						.with({ data: P.nullish }, () => <p>Error loading structures</p>)
						.with({ data: [] }, () => <p>No structures found</p>)
						.otherwise(({ data }) => (
							<div className="p-2 flex flex-col gap-2">
								{data.map((structure) => (
									<StructureCard key={structure.name} structure={structure} />
								))}
							</div>
						))}
				</ScrollArea>
				<StructurePagination />
				<DialogFooter>
					<Button
						onClick={() => {
							randomMutation.mutate()
						}}
					>
						Get random structure
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							setIsOpen(false)
						}}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

const StructureCard = (props: { structure: StructureType }) => {
	const gameOfLife = useAtomValue(gameOfLifeAtom)
	const setIsOpen = useSetAtom(openDialogAtom)
	if (!gameOfLife) {
		return null
	}
	return (
		<Card
			className="cursor-pointer hover:bg-primary/5"
			onClick={() => {
				if (
					gameOfLife.canvas.width < props.structure.x ||
					gameOfLife.canvas.height < props.structure.y
				) {
					toast.error(
						`The structure is too big for the current canvas size (${gameOfLife.canvas.width}x${gameOfLife.canvas.height})`,
					)
					return
				}
				gameOfLife.updateStorageByStructure(props.structure)
				gameOfLife.draw()
				setIsOpen(false)
			}}
		>
			<CardHeader>
				<CardTitle>
					{props.structure.name} by {props.structure.author}
				</CardTitle>
				<CardDescription>
					{props.structure.description}
					<br />
					Size: {props.structure.x}x{props.structure.y}
				</CardDescription>
			</CardHeader>
		</Card>
	)
}

const StructurePagination = () => {
	const [page, setPage] = useAtom(pageAtom)
	return (
		<Pagination>
			<PaginationContent>
				{page > 1 && (
					<PaginationItem>
						<PaginationPrevious
							onClick={() => {
								if (page > 1) {
									setPage(page - 1)
								}
							}}
						/>
					</PaginationItem>
				)}
				<PaginationItem>
					<PaginationLink isActive={true}>{page}</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext
						onClick={() => {
							setPage(page + 1)
						}}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	)
}
