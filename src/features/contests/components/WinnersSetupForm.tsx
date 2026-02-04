// Story 6-5: Winners page setup form

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Eye, RefreshCw, ShieldOff, ShieldCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from '@/components/ui';
import {
  useGenerateWinnersPage,
  useUpdateWinnersPassword,
  useRevokeWinnersPage,
  useReactivateWinnersPage,
} from '@/features/contests';
import type { Contest } from '@/features/contests';

const winnersPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type WinnersPasswordForm = z.infer<typeof winnersPasswordSchema>;

function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 6) return 'weak';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (password.length >= 10 && variety >= 3) return 'strong';
  if (password.length >= 6 && variety >= 2) return 'medium';
  return 'weak';
}

const strengthConfig = {
  weak: { label: 'Weak', className: 'bg-red-500', width: 'w-1/3' },
  medium: { label: 'Medium', className: 'bg-yellow-500', width: 'w-2/3' },
  strong: { label: 'Strong', className: 'bg-green-500', width: 'w-full' },
};

interface WinnersSetupFormProps {
  contest: Contest;
  allCategoriesApproved: boolean;
  approvedCount: number;
  totalCount: number;
  onPreview: () => void;
}

export function WinnersSetupForm({ contest, allCategoriesApproved, approvedCount, totalCount, onPreview }: WinnersSetupFormProps) {
  const isGenerated = contest.status === 'finished';
  const generateMutation = useGenerateWinnersPage();
  const updatePasswordMutation = useUpdateWinnersPassword();
  const revokeMutation = useRevokeWinnersPage();
  const reactivateMutation = useReactivateWinnersPage();

  const [showChangePassword, setShowChangePassword] = useState(false);

  const form = useForm<WinnersPasswordForm>({
    resolver: zodResolver(winnersPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = form.watch('password');
  const strength = passwordValue ? getPasswordStrength(passwordValue) : null;

  const getWinnersUrl = () => `${window.location.origin}/winners/${contest.contestCode}`;
  const winnersUrl = isGenerated ? getWinnersUrl() : '';

  const handleGenerate = (data: WinnersPasswordForm) => {
    generateMutation.mutate(
      { contestId: contest.id, password: data.password },
      {
        onSuccess: () => {
          toast.success('Winners page generated successfully');
          form.reset();
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleUpdatePassword = (data: WinnersPasswordForm) => {
    updatePasswordMutation.mutate(
      { contestId: contest.id, password: data.password },
      {
        onSuccess: () => {
          toast.success('Password updated successfully');
          form.reset();
          setShowChangePassword(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(winnersUrl);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleRevoke = () => {
    revokeMutation.mutate(contest.id, {
      onSuccess: () => toast.success('Winners page revoked'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleReactivate = () => {
    reactivateMutation.mutate(contest.id, {
      onSuccess: () => toast.success('Winners page reactivated'),
      onError: (err) => toast.error(err.message),
    });
  };

  // Generated state — show management controls
  if (isGenerated) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Winners Page</CardTitle>
            <Badge className={contest.winnersPageEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {contest.winnersPageEnabled ? 'Active' : 'Revoked'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL section */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Winners Page URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm break-all">
                {winnersUrl}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {contest.winnersPageGeneratedAt && (
              <p className="text-xs text-muted-foreground">
                Generated: {new Date(contest.winnersPageGeneratedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Preview button */}
          <Button variant="outline" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Winners Page
          </Button>

          {/* Change password */}
          {!showChangePassword ? (
            <Button variant="outline" onClick={() => setShowChangePassword(true)}>
              Change Password
            </Button>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdatePassword)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {strength && (
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded bg-muted">
                      <div className={`h-full rounded ${strengthConfig[strength].className} ${strengthConfig[strength].width} transition-all`} />
                    </div>
                    <p className="text-xs text-muted-foreground">Strength: {strengthConfig[strength].label}</p>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Repeat password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={updatePasswordMutation.isPending}>
                    Update Password
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowChangePassword(false); form.reset(); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Revoke / Reactivate */}
          <div className="border-t pt-4">
            {contest.winnersPageEnabled ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={revokeMutation.isPending}
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Revoke Winners Page
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke winners page?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will disable public access to the winners page. You can reactivate it later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRevoke}
                      disabled={revokeMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                onClick={handleReactivate}
                disabled={reactivateMutation.isPending}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Reactivate Winners Page
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not yet generated — show setup form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generate Winners Page</CardTitle>
      </CardHeader>
      <CardContent>
        {!allCategoriesApproved && (
          <p className="mb-4 text-sm text-muted-foreground">
            Approve all categories before publishing ({approvedCount} of {totalCount} approved).
          </p>
        )}

        <div className="mb-4">
          <Button variant="outline" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min 6 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {strength && (
              <div className="space-y-1">
                <div className="h-2 w-full rounded bg-muted">
                  <div className={`h-full rounded ${strengthConfig[strength].className} ${strengthConfig[strength].width} transition-all`} />
                </div>
                <p className="text-xs text-muted-foreground">Strength: {strengthConfig[strength].label}</p>
              </div>
            )}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Repeat password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={!allCategoriesApproved || generateMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Winners Page
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
