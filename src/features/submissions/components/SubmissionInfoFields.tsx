import type { Control } from 'react-hook-form'
import {
  Input,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui'
import type { SubmissionInfoFormData } from '../types/submissionInfo.schema'

interface SubmissionInfoFieldsProps {
  control: Control<SubmissionInfoFormData>
  disabled?: boolean
}

/**
 * Reusable form fields for submission info (student name, TLC, group members).
 * Intended to be embedded in upload forms wrapped with React Hook Form.
 */
export function SubmissionInfoFields({
  control,
  disabled = false,
}: SubmissionInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="studentName"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Your Name / Group Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your full name or group name"
                autoComplete="name"
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="tlcName"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Teacher/Leader/Coach Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter your teacher, leader, or coach's name"
                autoComplete="off"
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="tlcEmail"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Teacher/Leader/Coach Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="teacher@school.edu"
                autoComplete="email"
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="groupMemberNames"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              Group Member Names{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Jane Smith, John Doe"
                autoComplete="off"
                disabled={disabled}
                aria-invalid={!!fieldState.error}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
