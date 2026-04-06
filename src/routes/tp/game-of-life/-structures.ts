export type StructureType = {
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
	const headers = lines[0].replaceAll(" ", "")
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
	if (rule !== "B3/S23") {
		console.error("No classic game of life")
		return
	}
	const body = lines.slice(1).join("")
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
	return {
		x,
		y,
		rule,
		patterns,
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
