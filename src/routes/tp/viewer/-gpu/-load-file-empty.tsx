import { useAtomValue, useSetAtom } from "jotai"
import { Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { chooseFileDialogOpenAtom } from "@/routes/tp/viewer/-gpu/-choose-file-dialog"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"

export const LoadFileEmpty = () => {
	const objects3D = useAtomValue(gpuAtoms.objects3DAtom)
	const setChooseFileDialogOpen = useSetAtom(chooseFileDialogOpenAtom)
	if (objects3D) {
		return null
	}
	return (
		<div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
			<div className="flex flex-col items-center">
				<h2 className="text-2xl font-bold">Welcome to the WebGPU Viewer!</h2>
				<p className="text-muted-foreground mt-2">
					Please load a .obj or .glb file to view it.
				</p>
				<Button
					size="lg"
					className="mt-4"
					onClick={() => setChooseFileDialogOpen(true)}
				>
					<Flame />
					Get Started
				</Button>
			</div>
		</div>
	)
}
