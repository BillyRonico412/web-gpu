import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ToggleGroup } from '@/components/ui/toggle-group'

export const LightSection = () => {
	return <FieldGroup>
    <Field>
      <FieldLabel>
        Mode
      </FieldLabel>
      <ToggleGroup
      multiple={false}  
    >
        <Toggle
      </ToggleGroup>
    </Field>
  </FieldGroup>
}
