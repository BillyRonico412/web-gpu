export const asyncReadTextFile = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = (e) => {
			if (!e.target) {
				reject(new Error("Failed to read file"))
				return
			}
			resolve(e.target.result as string)
		}
		reader.onerror = (e) => {
			console.error(e)
			reject(new Error("Failed to read file"))
		}
		reader.readAsText(file)
	})
}

export const asyncReadArrayBuffer = (file: File): Promise<ArrayBuffer> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = (e) => {
			if (!e.target) {
				reject(new Error("Failed to read file"))
				return
			}
			resolve(e.target.result as ArrayBuffer)
		}
		reader.onerror = (e) => {
			console.error(e)
			reject(new Error("Failed to read file"))
		}
		reader.readAsArrayBuffer(file)
	})
}
