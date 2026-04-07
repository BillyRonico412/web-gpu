import { keepPreviousData } from "@tanstack/query-core"
import { atom } from "jotai"
import { atomWithQuery } from "jotai-tanstack-query"
import structurePath from "@/routes/tp/game-of-life/-structures/-structures.json"

export type StructureType = {
	name: string
	author: string
	description: string
	x: number
	y: number
	rule: string
	patterns: number[][]
}

export const parseRLE = (rle: string): StructureType | undefined => {
	const lines = rle.split("\n").filter((line) => !line.startsWith("#"))
	let x = 0
	let y = 0
	let rule = ""
	const headers = lines[0].replaceAll(" ", "").trim()
	for (const header of headers.split(",")) {
		const [key, value] = header.split("=")
		if (key === "x") {
			x = Number.parseInt(value, 10)
		} else if (key === "y") {
			y = Number.parseInt(value, 10)
		} else if (key === "rule") {
			rule = value
		} else {
			console.error("Unknown key")
			return
		}
	}
	if (rule.toUpperCase() !== "B3/S23") {
		console.error("No classic game of life")
		return
	}
	const body = lines
		.slice(1)
		.map((it) => it.trim())
		.join("")
	const patterns: number[][] = []
	let currentPattern: number[] = []
	let count = ""
	for (const char of body.split("")) {
		if (char === "b" || char === "o") {
			const cellValue = char === "b" ? 0 : 1
			if (count === "") {
				currentPattern.push(cellValue)
				continue
			}
			for (let i = 0; i < Number(count); i++) {
				currentPattern.push(cellValue)
			}
			count = ""
		} else if (char === "$") {
			patterns.push(currentPattern)
			currentPattern = []
			count = ""
		} else if (char === "!") {
			if (currentPattern.length > 0) {
				patterns.push(currentPattern)
			}
			break
		} else if (char >= "0" && char <= "9") {
			count += char
		} else {
			console.error("Unknown character in body")
			return
		}
	}

	const comments = rle.split("\n").filter((line) => line.startsWith("#"))
	const nameComment = comments.find((comment) => comment.startsWith("#N"))
	let name = "Unknown"
	if (nameComment) {
		name = nameComment.replace("#N ", "")
	}
	const authorComment = comments.find((comment) => comment.startsWith("#O"))
	let author = "Unknown"
	if (authorComment) {
		author = authorComment.replace("#O ", "")
	}
	const descriptionComment = comments.filter((comment) =>
		comment.startsWith("#C"),
	)
	let description = "No description"
	if (descriptionComment.length > 0) {
		description = descriptionComment
			.map((comment) => comment.replace("#C ", ""))
			.join(" ")
	}

	return {
		x,
		y,
		rule,
		patterns,
		name,
		author,
		description,
	}
}

export const insertStructureToGrid = (
	structure: StructureType,
	grid: Uint32Array,
	gridWidth: number,
	gridHeight: number,
) => {
	if (gridWidth * gridHeight !== grid.length) {
		throw new Error("Grid size does not match the provided width and height")
	}
	if (structure.x > gridWidth || structure.y > gridHeight) {
		throw new Error("Structure is too large for the grid")
	}
	const offsetX = Math.floor((gridWidth - structure.x) / 2)
	const offsetY = Math.floor((gridHeight - structure.y) / 2)
	for (let y = 0; y < structure.patterns.length; y++) {
		const patternRow = structure.patterns[y]
		for (let x = 0; x < patternRow.length; x++) {
			const cellValue = patternRow[x]
			const gridX = offsetX + x
			const gridY = offsetY + y
			grid[gridY * gridWidth + gridX] = cellValue
		}
	}
}

export const pageAtom = atom(1)
const NB_STRUCTURES_PER_PAGE = 50
export const structuresQueryAtom = atomWithQuery((get) => {
	const page = get(pageAtom)
	return {
		queryKey: ["game-of-life-structures", page],
		queryFn: async () => {
			const structuresPath = structurePath[0].conwaylife.slice(
				(page - 1) * NB_STRUCTURES_PER_PAGE,
				page * NB_STRUCTURES_PER_PAGE,
			)
			const sturcturesLinks = structuresPath.map(
				(path) =>
					`https://raw.githubusercontent.com/thomasdunn/cellular-automata-patterns/refs/heads/master/patterns/conwaylife/${path}`,
			)
			const responses = await Promise.all(
				sturcturesLinks.map((link) => fetch(link)),
			)
			const rles = await Promise.all(
				responses.map((response) => response.text()),
			)
			const structures: StructureType[] = []
			for (const rle of rles) {
				const structure = parseRLE(rle)
				if (structure) {
					structures.push(structure)
				}
			}
			return structures
		},
		placeholderData: keepPreviousData,
	}
})

export const getRandomStructure = async () => {
	const randomIndex = Math.floor(
		Math.random() * structurePath[0].conwaylife.length,
	)
	const randomStructurePath = structurePath[0].conwaylife[randomIndex]
	const randomStructureLink = `https://raw.githubusercontent.com/thomasdunn/cellular-automata-patterns/refs/heads/master/patterns/conwaylife/${randomStructurePath}`
	const response = await fetch(randomStructureLink)
	const rle = await response.text()
	const structure = parseRLE(rle)
	if (!structure) {
		throw new Error("Failed to parse structure")
	}
	return structure
}
