import { useAtom } from "jotai"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { renderingAtoms } from "@/routes/tp/viewer/-rendering/-rendering-atoms"

export const RenderingSection = () => {
	const [msaa, setMsaa] = useAtom(renderingAtoms.msaaAtom)
	return (
		<FieldGroup>
			<Field orientation="horizontal">
				<FieldLabel>MSAA</FieldLabel>
				<Switch
					checked={msaa}
					onCheckedChange={(checked) => setMsaa(checked)}
				/>
			</Field>
		</FieldGroup>
	)
}
