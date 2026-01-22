import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from '@/components/ui';
import { useGenerateSingleCode } from '../hooks/useGenerateSingleCode';

const addCodeSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, 'Organization name is required')
    .max(200, 'Organization name must be 200 characters or less'),
});

type AddCodeInput = z.infer<typeof addCodeSchema>;

interface AddCodeDialogProps {
  contestId: string;
  variant?: 'default' | 'outline';
}

/**
 * Dialog to add a single participant code with organization name
 * AC4 (Updated): Instead of batch generation, admin enters organization name to generate single code
 */
export function AddCodeDialog({ contestId, variant = 'outline' }: AddCodeDialogProps) {
  const [open, setOpen] = useState(false);
  const generateCode = useGenerateSingleCode(contestId);

  const form = useForm<AddCodeInput>({
    resolver: zodResolver(addCodeSchema),
    mode: 'onBlur',
    defaultValues: {
      organizationName: '',
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Reset form when dialog closes (via X button, overlay click, or cancel)
    if (!isOpen) {
      form.reset();
    }
  };

  const onSubmit = async (data: AddCodeInput) => {
    try {
      const participant = await generateCode.mutateAsync(data.organizationName);
      toast.success(`Code ${participant.code} generated for ${data.organizationName}`);
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate code');
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant={variant}>Add Code</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Participant Code</SheetTitle>
          <SheetDescription>
            Enter the organization name to generate a unique 8-digit participant code.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Springfield Elementary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || generateCode.isPending}
              >
                {form.formState.isSubmitting || generateCode.isPending
                  ? 'Generating...'
                  : 'Generate Code'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
