import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
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
import { loginSchema, type LoginFormData } from '@/features/auth'
import { useAuth } from '@/contexts'

interface LoginFormProps {
  onSubmit: (data: LoginFormData, turnstileToken: string) => Promise<void>
}

/**
 * Login form with email and password fields + Turnstile bot protection.
 * Uses React Hook Form + Zod for validation.
 * Uses AuthContext isLoading for submission state.
 */
export function LoginForm({ onSubmit }: LoginFormProps) {
  const { isLoading } = useAuth()
  const turnstileTokenRef = useRef<string>('')
  const turnstileRef = useRef<TurnstileRef>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleTurnstileVerify = useCallback((token: string) => {
    turnstileTokenRef.current = token
    form.clearErrors('root')
  }, [form])

  const handleTurnstileExpire = useCallback(() => {
    turnstileTokenRef.current = ''
  }, [])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
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
            throw error // Re-throw so LoginPage handles the error display
          }
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </FormItem>
          )}
        />

        <Turnstile ref={turnstileRef} onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} />
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </Form>
  )
}
