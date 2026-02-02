// Story 7-5: Notification logs table with type filter, retry, and CSV export
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Download, ArrowUpDown } from 'lucide-react';
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
} from '@/components/ui';
import { useNotificationLogs } from '../hooks/useNotificationLogs';
import { useRetryNotification } from '../hooks/useRetryNotification';
import type {
  NotificationLog,
  NotificationType,
} from '../types/notification.types';

interface NotificationLogsTableProps {
  contestId: string;
}

const TYPE_LABELS: Record<NotificationType, string> = {
  judge_invitation: 'Judge Invitation',
  judge_complete: 'Judging Complete',
  tlc_results: 'T/L/C Results',
  contest_status: 'Contest Status',
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  sent: { label: 'Sent', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
  permanently_failed: { label: 'Permanently Failed', variant: 'outline' },
};

type SortField = 'createdAt' | 'type' | 'status';
type SortDir = 'asc' | 'desc';

export function NotificationLogsTable({
  contestId,
}: NotificationLogsTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filterType =
    typeFilter === 'all' ? undefined : (typeFilter as NotificationType);
  const { data: logs, isLoading } = useNotificationLogs(
    contestId,
    filterType
  );
  const retryMutation = useRetryNotification();

  const sortedLogs = useMemo(() => {
    if (!logs) return [];
    return [...logs].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [logs, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      const result = await retryMutation.mutateAsync(logId);
      // F3: Surface error/success feedback to admin
      if (result.success) {
        toast.success('Notification resent successfully');
      } else {
        toast.error(result.error || 'Retry failed');
      }
    } catch {
      toast.error('Failed to retry notification');
    } finally {
      setRetryingId(null);
    }
  };

  const handleExportCsv = () => {
    if (!logs || logs.length === 0) return;
    exportToCsv(logs);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="judge_invitation">
              Judge Invitation
            </SelectItem>
            <SelectItem value="judge_complete">Judging Complete</SelectItem>
            <SelectItem value="tlc_results">T/L/C Results</SelectItem>
            <SelectItem value="contest_status">Contest Status</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={!logs || logs.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      {sortedLogs.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No notification logs found.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1"
                    onClick={() => handleSort('type')}
                  >
                    Type
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => handleSort('createdAt')}
                  >
                    Sent At
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Error</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.map((log) => {
                const statusConf =
                  STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                const canRetry =
                  log.status === 'failed' && (log.retryCount || 0) < 3;

                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {log.recipientEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TYPE_LABELS[log.type] || log.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConf.variant}>
                        {statusConf.label}
                      </Badge>
                      {log.retryCount > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({log.retryCount} {log.retryCount === 1 ? 'retry' : 'retries'})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.errorMessage || '-'}
                    </TableCell>
                    <TableCell>
                      {canRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(log.id)}
                          disabled={retryingId === log.id}
                        >
                          <RefreshCw
                            className={`h-3 w-3 mr-1 ${
                              retryingId === log.id ? 'animate-spin' : ''
                            }`}
                          />
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function exportToCsv(logs: NotificationLog[]) {
  const headers = [
    'Recipient',
    'Type',
    'Status',
    'Error',
    'Sent At',
    'Retry Count',
  ];
  const rows = logs.map((l) => [
    l.recipientEmail,
    l.type,
    l.status,
    l.errorMessage || '',
    l.createdAt,
    String(l.retryCount),
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
