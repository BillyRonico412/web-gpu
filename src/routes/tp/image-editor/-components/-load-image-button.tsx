import { useSetAtom } from "jotai"
import { ImageDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { atoms } from "@/routes/tp/image-editor/-atom"

export const LoadImageButton = () => {
	const setImageUrl = useSetAtom(atoms.imageUrlAtom)
	const handleClick = () => {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = "image/*"
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0]
			if (!file) {
				return
			}
			const url = URL.createObjectURL(file)
			setImageUrl(url)
		}
		input.click()
	}
	return (
		<Button onClick={handleClick}>
			<ImageDown />
			Load image
		</Button>
	)
}
