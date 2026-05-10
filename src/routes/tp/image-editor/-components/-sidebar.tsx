import { useAtom } from "jotai"
import { ImageIcon } from "lucide-react"
import { Field, FieldLabel } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar"
import { atoms } from "@/routes/tp/image-editor/-atom"
import { LoadImageButton } from "@/routes/tp/image-editor/-components/-load-image-button"
import { AppliedFilter } from "@/routes/tp/image-editor/-types"

export const ImageEditorSidebar = () => {
	const [appliedFilter, setAppliedFilter] = useAtom(atoms.appliedFilterAtom)
	return (
		<Sidebar>
			<SidebarHeader>
				<h2 className="text-lg font-semibold flex justify-center items-center gap-2">
					<ImageIcon />
					Image editor
				</h2>
			</SidebarHeader>
			<SidebarContent className="px-4 py-2">
				<Field orientation="horizontal">
					<FieldLabel>Filter</FieldLabel>
					<NativeSelect
						value={appliedFilter}
						onChange={(e) => {
							setAppliedFilter(Number(e.target.value) as AppliedFilter)
						}}
					>
						<NativeSelectOption value={AppliedFilter.None}>
							None
						</NativeSelectOption>
						<NativeSelectOption value={AppliedFilter.Grayscale}>
							Grayscale
						</NativeSelectOption>
						<NativeSelectOption value={AppliedFilter.Sepia}>
							Sepia
						</NativeSelectOption>
						<NativeSelectOption value={AppliedFilter.Invert}>
							Invert
						</NativeSelectOption>
					</NativeSelect>
				</Field>
			</SidebarContent>
			<SidebarFooter className="px-4 py-4 flex flex-row items-center justify-center">
				<LoadImageButton />
			</SidebarFooter>
		</Sidebar>
	)
}
