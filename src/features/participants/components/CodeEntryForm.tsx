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
  codeEntrySchema,
  type CodeEntryFormData,
} from '../types/participant.schemas'

interface CodeEntryFormProps {
  onSubmit: (data: CodeEntryFormData) => Promise<void>
  isLoading?: boolean
}

/**
 * Code entry form with contest code and participant code fields.
 * Uses React Hook Form + Zod for validation.
 * Auto-uppercases input values.
 */
export function CodeEntryForm({
  onSubmit,
  isLoading = false,
}: CodeEntryFormProps) {
  const form = useForm<CodeEntryFormData>({
    resolver: zodResolver(codeEntrySchema),
    mode: 'onBlur',
    defaultValues: {
      contestCode: '',
      participantCode: '',
    },
  })

  const handleSubmit = async (data: CodeEntryFormData) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contestCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contest Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="6 characters"
                  maxLength={6}
                  autoComplete="off"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="participantCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Participant Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="8 characters"
                  maxLength={8}
                  autoComplete="off"
                  disabled={isLoading}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enter Contest
        </Button>
      </form>
    </Form>
  )
}
