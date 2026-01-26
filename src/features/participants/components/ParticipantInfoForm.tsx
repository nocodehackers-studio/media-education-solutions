import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui'
import {
  participantInfoSchema,
  type ParticipantInfoFormData,
} from '../types/participant.schemas'

interface ParticipantInfoFormProps {
  defaultValues?: Partial<ParticipantInfoFormData>
  onSubmit: (data: ParticipantInfoFormData) => Promise<void>
  isLoading?: boolean
}

/**
 * Participant info form with name, organization, and teacher/leader/coach fields.
 * Uses React Hook Form + Zod for validation.
 * Validates email on blur per AC5.
 */
export function ParticipantInfoForm({
  defaultValues,
  onSubmit,
  isLoading = false,
}: ParticipantInfoFormProps) {
  const form = useForm<ParticipantInfoFormData>({
    resolver: zodResolver(participantInfoSchema),
    mode: 'onBlur', // Validate on blur for AC5
    defaultValues: {
      name: defaultValues?.name ?? '',
      organizationName: defaultValues?.organizationName ?? '',
      tlcName: defaultValues?.tlcName ?? '',
      tlcEmail: defaultValues?.tlcEmail ?? '',
    },
  })

  const handleSubmit = async (data: ParticipantInfoFormData) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={isLoading}
                  aria-invalid={!!fieldState.error}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organizationName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>School/Organization</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your school or organization"
                  autoComplete="organization"
                  disabled={isLoading}
                  aria-invalid={!!fieldState.error}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tlcName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Teacher/Leader/Coach Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your teacher, leader, or coach's name"
                  autoComplete="off"
                  disabled={isLoading}
                  aria-invalid={!!fieldState.error}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tlcEmail"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Teacher/Leader/Coach Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="teacher@school.edu"
                  autoComplete="email"
                  disabled={isLoading}
                  aria-invalid={!!fieldState.error}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </form>
    </Form>
  )
}
