import { useSetAtom } from "jotai"
import { Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"

export const LoadFileButton = () => {
	const setFileData = useSetAtom(gpuAtoms.fileDataAtom)
	return (
		<Button
			onClick={() => {
				setFileData(undefined)
			}}
		>
			<Box />
			Load file
		</Button>
	)
}
