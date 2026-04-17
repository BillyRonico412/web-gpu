import { useAtom } from "jotai"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { gpuAtoms } from "@/routes/tp/viewer/-gpu/-gpu-atoms"

export const BackgroundSection = () => {
	const [backgroundHex, setBackgroundHex] = useAtom(gpuAtoms.backgroundHexAtom)
	return (
		<div>
			<Field orientation="horizontal">
				<FieldLabel>Color</FieldLabel>
				<Input
					type="color"
					value={backgroundHex}
					onChange={(e) => {
						setBackgroundHex(e.target.value)
					}}
					className="size-8 p-0 border-0"
				/>
			</Field>
		</div>
	)
}
