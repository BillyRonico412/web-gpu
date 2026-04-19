import { readFile } from "node:fs/promises"
import { expect, test } from "vitest"
import { parseGLBToJsonAndBin } from "@/routes/tp/viewer/-glb/-parser"

test("parseGLBToJsonAndBin should correctly parse a GLB file", async () => {
	const response = await readFile("public/glb/cube.glb")
	const { json, bin } = parseGLBToJsonAndBin(response)

	// Check that the JSON part is parsed correctly
	expect(json).toBeDefined()
	console.log(json)
	// Check that the binary part is parsed correctly
	expect(bin).toBeInstanceOf(Uint8Array)
	expect(bin.length).toBeGreaterThan(0)
})
