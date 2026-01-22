import { Button } from '@/components/ui';
import { toast } from '@/components/ui';
import { useGenerateCodes } from '../hooks/useGenerateCodes';

interface GenerateCodesButtonProps {
  contestId: string;
  variant?: 'default' | 'outline';
}

/**
 * Button to generate 50 new participant codes (batch generation)
 * @deprecated Use AddCodeDialog instead per Change Proposal 2026-01-21
 * Original AC4 (superseded): Generates 50 codes, shows success toast, updates list
 * New AC4: Single code generation with organization name via AddCodeDialog
 */
export function GenerateCodesButton({
  contestId,
  variant = 'outline',
}: GenerateCodesButtonProps) {
  const generateCodes = useGenerateCodes(contestId);

  const handleGenerate = async () => {
    try {
      await generateCodes.mutateAsync(50);
      toast.success('50 codes generated');
    } catch {
      toast.error('Failed to generate codes');
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleGenerate}
      disabled={generateCodes.isPending}
    >
      {generateCodes.isPending ? 'Generating...' : 'Generate 50 More'}
    </Button>
  );
}
