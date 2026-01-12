/**
 * Example Form Pattern (AC5)
 * Demonstrates React Hook Form + Zod with onBlur validation
 * and inline error display below fields.
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  toast,
} from '@/components/ui'

// 1. Define schema with Zod
const exampleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  contestCode: z.string().length(6, 'Contest code must be exactly 6 characters'),
})

type ExampleFormValues = z.infer<typeof exampleFormSchema>

interface ExampleFormProps {
  onSubmit?: (data: ExampleFormValues) => void
}

export function ExampleForm({ onSubmit }: ExampleFormProps) {
  // 2. Initialize form with zodResolver and onBlur validation mode
  const form = useForm<ExampleFormValues>({
    resolver: zodResolver(exampleFormSchema),
    mode: 'onBlur', // Validate on blur (AC5 requirement)
    defaultValues: {
      name: '',
      email: '',
      contestCode: '',
    },
  })

  // 3. Handle form submission
  const handleSubmit = (data: ExampleFormValues) => {
    if (onSubmit) {
      onSubmit(data)
    }
    toast.success('Form submitted successfully')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Name field with inline error */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage /> {/* Inline error displays here */}
            </FormItem>
          )}
        />

        {/* Email field with inline error */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contest code field with inline error */}
        <FormField
          control={form.control}
          name="contestCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contest Code *</FormLabel>
              <FormControl>
                <Input placeholder="ABC123" maxLength={6} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  )
}
