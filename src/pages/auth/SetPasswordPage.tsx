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
import {
  resetPasswordSchema,
  judgeOnboardingSchema,
  type ResetPasswordFormData,
  type JudgeOnboardingFormData,
  authApi,
} from '@/features/auth'
import { useAuth } from '@/contexts'
import { supabase } from '@/lib/supabase'

type FlowType = 'invite' | 'recovery' | 'magiclink' | null

/**
 * Dual-mode page for judge onboarding and password recovery.
 *
 * Onboarding mode (invite/magiclink): Collects first name, last name, password, confirm password.
 * Recovery mode: Collects password and confirm password only.
 */
export function SetPasswordPage() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [flowType, setFlowType] = useState<FlowType>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const isOnboarding = flowType === 'invite' || flowType === 'magiclink'

  const onboardingForm = useForm<JudgeOnboardingFormData>({
    resolver: zodResolver(judgeOnboardingSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  })

  const recoveryForm = useForm<ResetPasswordFormData>({
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
      const type = hashParams.get('type') as FlowType

      // Valid for: invite (new user setup), recovery (password reset), or magiclink (flexibility)
      const validTypes = ['invite', 'recovery', 'magiclink']
      const isSetupFlow = !!data.session && validTypes.includes(type || '')

      // AC5: If user has a session but not from setup flow, redirect
      if (data.session && !isSetupFlow) {
        try {
          const profile = await authApi.fetchProfile(data.session.user.id)
          if (profile?.role === 'judge') {
            navigate('/judge/dashboard', { replace: true })
          } else {
            navigate('/login', { replace: true })
          }
        } catch {
          navigate('/login', { replace: true })
        }
        return
      }

      if (isSetupFlow && data.session) {
        setFlowType(type)
        setUserId(data.session.user.id)
      }
      setIsValidSession(isSetupFlow)
    }
    checkSession()
  }, [navigate])

  const handleOnboardingSubmit = async (data: JudgeOnboardingFormData) => {
    setIsLoading(true)
    try {
      // FIRST: Set password — critical op, magic link is single-use
      await authApi.updatePassword(data.password)

      // THEN: Update profile with name
      try {
        await authApi.updateProfile(userId!, { firstName: data.firstName, lastName: data.lastName })
        await refreshProfile()
        toast.success('Account setup complete!')
      } catch {
        toast.warning('Password set, but name update failed. You can update your name later.')
      }

      navigate('/judge/dashboard', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecoverySubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      await authApi.updatePassword(data.password)
      toast.success('Password set successfully!')
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

  // Valid session - show form based on flow type
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            {isOnboarding ? 'Complete Your Account' : 'Reset Your Password'}
          </CardTitle>
          <CardDescription>
            {isOnboarding
              ? 'Welcome! Please complete your account setup to start judging.'
              : 'Enter your new password below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOnboarding ? (
            <Form {...onboardingForm}>
              <form onSubmit={onboardingForm.handleSubmit(handleOnboardingSubmit)} className="space-y-4">
                <FormField
                  control={onboardingForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your first name"
                          autoComplete="given-name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={onboardingForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your last name"
                          autoComplete="family-name"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={onboardingForm.control}
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
                  control={onboardingForm.control}
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
                  Complete Setup
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...recoveryForm}>
              <form onSubmit={recoveryForm.handleSubmit(handleRecoverySubmit)} className="space-y-4">
                <FormField
                  control={recoveryForm.control}
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
                  control={recoveryForm.control}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
