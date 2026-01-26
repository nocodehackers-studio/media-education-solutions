import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { resetPasswordSchema, type ResetPasswordFormData, authApi } from '@/features/auth'
import { supabase } from '@/lib/supabase'

/**
 * Set password page for new judges.
 * Handles the invite callback from Supabase to allow new users to set their password.
 *
 * AC1: Redirect to Set Password Page - judges click invite link and land here
 * AC2: Set Password Successfully - form submission sets password and redirects to judge dashboard
 * AC3: Password Mismatch Error - handled by resetPasswordSchema validation
 * AC4: Password Too Short Error - handled by resetPasswordSchema validation (min 8 chars)
 * AC5: Already Has Password Redirect - redirects logged-in users not from invite flow
 */
export function SetPasswordPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Check for valid invite/recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      // Check URL hash for Supabase callback type
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const type = hashParams.get('type')

      // Valid for: invite (new user setup), recovery (password reset), or magiclink (flexibility)
      const validTypes = ['invite', 'recovery', 'magiclink']
      const isSetupFlow = !!data.session && validTypes.includes(type || '')

      // AC5: If user has a session but not from setup flow, redirect
      // (They may have navigated here directly while logged in)
      if (data.session && !isSetupFlow) {
        // Check if user is a judge and redirect appropriately
        const profile = await authApi.fetchProfile(data.session.user.id)
        if (profile?.role === 'judge') {
          navigate('/judge/dashboard', { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
        return
      }

      setIsValidSession(isSetupFlow)
    }
    checkSession()
  }, [navigate])

  const handleSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      // Set the password
      await authApi.updatePassword(data.password)
      toast.success('Password set successfully!')

      // AC2: Redirect to judge dashboard (already logged in via invite link)
      navigate('/judge/dashboard', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set password')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verifying...</div>
      </div>
    )
  }

  // Invalid session - show error with option to go to login
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold text-destructive">
              Invalid or Expired Link
            </CardTitle>
            <CardDescription>
              This invitation link is no longer valid. Please contact the contest
              administrator for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate('/login', { replace: true })}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid session - show password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            Set Your Password
          </CardTitle>
          <CardDescription>
            Welcome! Please set a password to complete your account setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
