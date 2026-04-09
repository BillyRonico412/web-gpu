import { useMutation } from "@tanstack/react-query"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import type { AtomWithQueryResult } from "jotai-tanstack-query"
import { AlertCircleIcon } from "lucide-react"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { match, P } from "ts-pattern"
import { Alert, AlertTitle } from "@/components/ui/alert"
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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { gameOfLifeAtom } from "@/routes/tp/game-of-life/-atom"
import {
	getRandomStructure,
	mustSeeStructuresQueryAtom,
	pageAtom,
	type StructureType,
	searchAtom,
	structuresQueryAtom,
	structuresQueryEffect,
} from "@/routes/tp/game-of-life/-structures/-structures"

const openDialogAtom = atom(false)

export const StructuresDialog = (props: { children: ReactNode }) => {
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
			<DialogTrigger nativeButton={true}>{props.children}</DialogTrigger>
			<DialogContent className="h-[80dvh] w-[80vw] flex flex-col max-w-2xl!">
				<DialogHeader>
					<DialogTitle>Structure's catalog</DialogTitle>
					<DialogDescription>
						Discover and insert predefined structures into the grid. These
						structures are sourced from the{" "}
						<a
							href="https://github.com/thomasdunn/cellular-automata-patterns/"
							target="_blank"
							rel="noopener noreferrer"
							className="underline"
						>
							Cellular Automata Patterns repository
						</a>{" "}
						.
					</DialogDescription>
				</DialogHeader>
				<Tabs className="flex-1 flex flex-col overflow-hidden">
					<TabsList className="mx-auto">
						<TabsTrigger value="must-see">Must see</TabsTrigger>
						<TabsTrigger value="list">List</TabsTrigger>
					</TabsList>
					<StructureMustSeeTab />
					<StructureCatalogTab />
				</Tabs>
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

const StructureList = (props: {
	structureQueryAtom: AtomWithQueryResult<StructureType[], Error>
}) => {
	return (
		<ScrollArea className="flex-1 overflow-hidden">
			{match(props.structureQueryAtom)
				.with({ isLoading: true }, () => (
					<div className="h-full w-full flex justify-center items-center">
						<Spinner />
					</div>
				))
				.with({ isError: true }, () => (
					<div className="flex justify-center items-center w-full h-full">
						<Alert>
							<AlertCircleIcon />
							<AlertTitle>Error loading structures</AlertTitle>
						</Alert>
					</div>
				))
				.with({ data: P.nullish }, () => (
					<div className="flex justify-center items-center w-full h-full">
						<Alert>
							<AlertCircleIcon />
							<AlertTitle>Error loading structures</AlertTitle>
						</Alert>
					</div>
				))
				.with({ data: [] }, () => (
					<div className="flex justify-center items-center w-full h-full">
						<Alert>
							<AlertCircleIcon />
							<AlertTitle>No structures found</AlertTitle>
						</Alert>
					</div>
				))
				.otherwise(({ data }) => (
					<div className="p-2 flex flex-col gap-2">
						{data.map((structure) => (
							<StructureCard key={structure.name} structure={structure} />
						))}
					</div>
				))}
		</ScrollArea>
	)
}

const StructureCatalogTab = () => {
	const structuresQuery = useAtomValue(structuresQueryAtom)
	useAtom(structuresQueryEffect)
	const [search, setSearch] = useAtom(searchAtom)
	return (
		<TabsContent
			value="list"
			className="flex-1 flex flex-col gap-4 overflow-hidden"
		>
			<Input
				placeholder="Search for a structure"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			<StructureList structureQueryAtom={structuresQuery} />
			<StructurePagination />
		</TabsContent>
	)
}

const StructureMustSeeTab = () => {
	const mustSeeStructuresQuery = useAtomValue(mustSeeStructuresQueryAtom)
	return (
		<TabsContent
			value="must-see"
			className="flex-1 flex flex-col gap-4 overflow-hidden"
		>
			<StructureList structureQueryAtom={mustSeeStructuresQuery} />
		</TabsContent>
	)
}
