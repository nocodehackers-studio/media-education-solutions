// Story 7-5: Notification summary stats for contest dashboard
import { useMemo } from 'react';
import { Mail, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, Skeleton } from '@/components/ui';
import { useNotificationLogs } from '../hooks/useNotificationLogs';

interface NotificationSummaryProps {
  contestId: string;
}

export function NotificationSummary({ contestId }: NotificationSummaryProps) {
  const { data: logs, isLoading } = useNotificationLogs(contestId);

  const summary = useMemo(() => {
    if (!logs) return { total: 0, sent: 0, failed: 0, pending: 0 };
    return {
      total: logs.length,
      sent: logs.filter((l) => l.status === 'sent').length,
      failed: logs.filter((l) =>
        ['failed', 'permanently_failed'].includes(l.status)
      ).length,
      pending: logs.filter((l) => l.status === 'pending').length,
    };
  }, [logs]);

  if (isLoading) {
    return (
      // F8: Responsive grid
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Emails',
      value: summary.total,
      icon: Mail,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Delivered',
      value: summary.sent,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Failed',
      value: summary.failed,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Pending',
      value: summary.pending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    // F8: Responsive grid
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg p-2 ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
