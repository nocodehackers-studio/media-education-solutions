import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@/components/ui';
import { useUpdateParticipantCode } from '../hooks/useUpdateParticipantCode';
import { useDeleteParticipantCode } from '../hooks/useDeleteParticipantCode';
import type { Participant } from '../types/contest.types';

interface CodeListTableProps {
  codes: Participant[];
  contestId: string;
}

/**
 * Table displaying participant codes with organization, status, created date, and actions.
 * Codes represent institutions, not individuals.
 */
export function CodeListTable({ codes, contestId }: CodeListTableProps) {
  const [editingCode, setEditingCode] = useState<Participant | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingCode, setDeletingCode] = useState<Participant | null>(null);

  const updateCode = useUpdateParticipantCode(contestId);
  const deleteCode = useDeleteParticipantCode(contestId);

  const handleEditOpen = (code: Participant) => {
    setEditName(code.organizationName || '');
    setEditingCode(code);
  };

  const handleEditSave = async () => {
    if (!editingCode) return;
    try {
      await updateCode.mutateAsync({
        participantId: editingCode.id,
        organizationName: editName.trim(),
      });
      toast.success('Organization name updated');
      setEditingCode(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deletingCode) return;
    try {
      await deleteCode.mutateAsync(deletingCode.id);
      toast.success(`Code ${deletingCode.code} revoked`);
      setDeletingCode(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map((code) => (
            <TableRow key={code.id}>
              <TableCell className="font-mono">{code.code}</TableCell>
              <TableCell>{code.organizationName || '-'}</TableCell>
              <TableCell>
                <Badge variant={code.status === 'used' ? 'default' : 'outline'}>
                  {code.status === 'used' ? 'Used' : 'Unused'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(code.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleEditOpen(code); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeletingCode(code); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit organization name sheet */}
      <Sheet open={!!editingCode} onOpenChange={(open) => { if (!open) setEditingCode(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Code</SheetTitle>
            <SheetDescription>
              Update the organization name for code{' '}
              <span className="font-mono font-semibold">{editingCode?.code}</span>
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Springfield Elementary"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingCode(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={updateCode.isPending}
              >
                {updateCode.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingCode} onOpenChange={(open) => { if (!open) setDeletingCode(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke participant code?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete code{' '}
              <span className="font-mono font-semibold">{deletingCode?.code}</span>
              {deletingCode?.organizationName && (
                <> for <span className="font-semibold">{deletingCode.organizationName}</span></>
              )}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCode.isPending ? 'Deleting...' : 'Revoke & Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
