import { useSetAtom } from "jotai"
import { Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { chooseFileDialogOpenAtom } from "@/routes/tp/viewer/-gpu/-choose-file-dialog"

export const LoadFileButton = () => {
	const setChooseDialogFileOpen = useSetAtom(chooseFileDialogOpenAtom)
	return (
		<Button
			onClick={() => {
				setChooseDialogFileOpen(true)
			}}
		>
			<Box />
			Load file
		</Button>
	)
}
