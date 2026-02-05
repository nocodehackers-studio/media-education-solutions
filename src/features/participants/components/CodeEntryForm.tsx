import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRef, useCallback } from 'react'
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
import { Turnstile, type TurnstileRef } from '@/components'
import {
  codeEntrySchema,
  type CodeEntryFormData,
} from '../types/participant.schemas'

interface CodeEntryFormProps {
  onSubmit: (data: CodeEntryFormData, turnstileToken: string) => Promise<void>
  isLoading?: boolean
}

/**
 * Code entry form with contest code and participant code fields + Turnstile bot protection.
 * Uses React Hook Form + Zod for validation.
 * Auto-uppercases input values.
 */
export function CodeEntryForm({
  onSubmit,
  isLoading = false,
}: CodeEntryFormProps) {
  const turnstileTokenRef = useRef<string>('')
  const turnstileRef = useRef<TurnstileRef>(null)

  const form = useForm<CodeEntryFormData>({
    resolver: zodResolver(codeEntrySchema),
    mode: 'onBlur',
    defaultValues: {
      contestCode: '',
      participantCode: '',
    },
  })

  const handleTurnstileVerify = useCallback((token: string) => {
    turnstileTokenRef.current = token
    form.clearErrors('root')
  }, [form])

  const handleTurnstileExpire = useCallback(() => {
    turnstileTokenRef.current = ''
  }, [])

  const handleFormSubmit = useCallback(
    async (data: CodeEntryFormData) => {
      if (!turnstileTokenRef.current) {
        form.setError('root', { message: 'Please complete the verification' })
        return
      }
      try {
        await onSubmit(data, turnstileTokenRef.current)
      } catch (error) {
        // Token consumed on submission - reset widget for retry
        turnstileRef.current?.reset()
        turnstileTokenRef.current = ''
        throw error // Re-throw so CodeEntryPage handles the error display
      }
    },
    [form, onSubmit]
  )

  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line react-hooks/refs -- ref is accessed at submit time, not render time
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="contestCode"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Contest Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="6 characters"
                  maxLength={6}
                  autoComplete="off"
                  disabled={isLoading}
                  aria-invalid={!!fieldState.error}
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
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Participant Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="8 characters"
                  maxLength={8}
                  autoComplete="off"
                  disabled={isLoading}
                  aria-invalid={!!fieldState.error}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Turnstile ref={turnstileRef} onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} />
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enter Contest
        </Button>
      </form>
    </Form>
  )
}
