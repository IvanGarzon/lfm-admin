import { memo } from 'react';
import { Loader2, AlertTriangle, Clock, CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SessionWithUser } from '@/features/sessions/types';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getDeviceIcon,
  getOSDisplay,
  getBrowserDisplay,
  getDeviceTypeDisplay,
} from '@/features/sessions/utils/session-icons';
import { useExtendSession } from '@/features/users/hooks/use-sessions';

function formatLastActive(
  lastActiveAt: Date | string | null | undefined,
  isCurrent: boolean,
): string {
  if (!lastActiveAt) return 'Never active';
  const lastActive = new Date(lastActiveAt);
  const diffInMinutes = (Date.now() - lastActive.getTime()) / (1000 * 60);
  if (diffInMinutes < 1 && isCurrent) return 'Active now';
  return `Last active ${formatDistanceToNow(lastActive, { addSuffix: true })}`;
}

export function SessionCard({
  session,
  onDelete,
  selectable = false,
  selected = false,
  onSelect,
}: {
  session: SessionWithUser;
  onDelete: (session: SessionWithUser) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (sessionId: string, checked: boolean) => void;
}) {
  const isCurrent = session.isCurrent || false;
  const { mutate: extendSession, isPending: isExtending } = useExtendSession();

  const expiresAt = new Date(session.expires);
  const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const isExpiringSoon = daysUntilExpiry < 3;

  const DeviceIcon = getDeviceIcon(session.deviceType);
  const deviceTypeDisplay = getDeviceTypeDisplay(session.deviceType);
  const osDisplay = getOSDisplay(session.osName);
  const browserDisplay = getBrowserDisplay(session.browserName);

  const location =
    [session.city, session.region, session.country].filter(Boolean).join(', ') ||
    'Location unknown';

  return (
    <Box
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
        selected
          ? 'border-blue-200 bg-blue-50 ring-1 ring-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:ring-blue-900'
          : isCurrent
            ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
            : 'border-border bg-card hover:border-border/70'
      }`}
    >
      {/* Checkbox */}
      {selectable && onSelect ? (
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(session.id, checked as boolean)}
          className="shrink-0"
        />
      ) : null}

      {/* Device icon */}
      <Box className="relative shrink-0">
        <Box className={`rounded-lg p-2 ${deviceTypeDisplay.bgColor}`}>
          <DeviceIcon className={`h-5 w-5 ${deviceTypeDisplay.color}`} />
        </Box>
        {isCurrent ? (
          <CheckCircle2 className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border border-card bg-card text-primary" />
        ) : null}
      </Box>

      {/* Line 1: device name + badges / Line 2: meta */}
      <Box className="min-w-0 flex-1">
        {/* Row 1 */}
        <Box className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">
            {session.deviceName || session.deviceModel || deviceTypeDisplay.label}
          </span>
          <Badge
            variant="outline"
            className={`flex items-center gap-1 border-0 ${osDisplay.bgColor}`}
          >
            <osDisplay.Icon className={`h-3 w-3 ${osDisplay.color}`} />
            <span className={`text-xs ${osDisplay.color}`}>{osDisplay.label}</span>
          </Badge>
          <Badge
            variant="outline"
            className={`flex items-center gap-1 border-0 ${browserDisplay.bgColor}`}
          >
            <browserDisplay.Icon className={`h-3 w-3 ${browserDisplay.color}`} />
            <span className={`text-xs ${browserDisplay.color}`}>{browserDisplay.label}</span>
          </Badge>
          {isCurrent ? (
            <Badge className="bg-primary text-white text-xs">Current Session</Badge>
          ) : null}
        </Box>

        {/* Row 2 */}
        <Box className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span
            className="flex items-center gap-1 text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            <Calendar className="h-3 w-3" />
            {formatLastActive(session.lastActiveAt, isCurrent)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {location}
          </span>
          <span
            className={`flex items-center gap-1 text-xs ${
              isExpiringSoon
                ? 'font-medium text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
            }`}
            suppressHydrationWarning
          >
            {isExpiringSoon ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}
          </span>
        </Box>
      </Box>

      {/* Actions */}
      <Box className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => extendSession(session.id)}
          disabled={isExtending}
          className="h-7 px-2 text-xs text-primary hover:bg-primary/5"
        >
          {isExtending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
          Extend
        </Button>
        {!isCurrent ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(session)}
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Revoke
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

export const MemoizedSessionCard = memo(SessionCard, (prev, next) => {
  return (
    prev.session.id === next.session.id &&
    prev.session.lastActiveAt === next.session.lastActiveAt &&
    prev.session.expires === next.session.expires &&
    prev.session.deviceName === next.session.deviceName &&
    prev.selectable === next.selectable &&
    prev.selected === next.selected
  );
});
