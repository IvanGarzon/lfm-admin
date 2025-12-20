import { memo } from 'react';
import { CheckCircle2, Loader2, AlertTriangle, Clock } from 'lucide-react';
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
import { useExtendSession } from '@/features/sessions/hooks/use-sessions';

// Helper function to format last active time
function formatLastActive(lastActiveAt: Date | string | null | undefined, isCurrent: boolean): string {
  if (!lastActiveAt) return 'Never active';

  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

  // If active within the last minute and it's the current session, show "Active now"
  if (diffInMinutes < 1 && isCurrent) {
    return 'Active now';
  }

  // Otherwise show relative time
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
  
  // Calculate expiration status
  const expiresAt = new Date(session.expires);
  const now = new Date();
  const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const isExpiringSoon = daysUntilExpiry < 3; // Warning if expires in less than 3 days

  // Get dynamic icons and display info
  const DeviceIcon = getDeviceIcon(session.deviceType);
  const deviceTypeDisplay = getDeviceTypeDisplay(session.deviceType);
  const osDisplay = getOSDisplay(session.osName);
  const browserDisplay = getBrowserDisplay(session.browserName);

  const handleExtend = () => {
    extendSession(session.id);
  };

  return (
    <Box
      className={`flex flex-col border rounded p-4 transition-all ${
        selected
          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
          : isCurrent
          ? 'bg-primary/5 border-primary/30 ring-2 ring-primary/20'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Card Header - Session Name and Badge/Action */}
      <Box className="flex items-center justify-between gap-2 mb-4 pb-3 border-b">
        <Box className="flex items-center gap-3 flex-1 min-w-0">
          {selectable && onSelect && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(session.id, checked as boolean)}
              className="shrink-0"
            />
          )}
          <h6 className="text-sm font-semibold text-gray-800 truncate">
            {session.deviceName || session.deviceModel || deviceTypeDisplay.label}
          </h6>
        </Box>
        
        <Box className="flex items-center gap-2">
          {isCurrent ? (
            <Badge variant="default" className="shrink-0 bg-primary text-white text-xs whitespace-nowrap">
              Current Session
            </Badge>
          ) : (
            <Button
              onClick={() => onDelete(session)}
              variant="ghost"
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Sign Out
            </Button>
          )}
        </Box>
      </Box>

      {/* Card Body - Session Details */}
      <Box className="flex items-start gap-4">
        {/* Device Icon */}
        <Box className="shrink-0">
          {isCurrent ? (
            <Box className="relative">
              <Box className={`p-2 rounded-lg ${deviceTypeDisplay.bgColor}`}>
                <DeviceIcon className={`w-6 h-6 ${deviceTypeDisplay.color}`} />
              </Box>
              <CheckCircle2 className="w-4 h-4 text-primary absolute -top-1 -right-1 bg-white rounded-full border border-white" />
            </Box>
          ) : (
            <Box className={`p-2 rounded-lg ${deviceTypeDisplay.bgColor}`}>
              <DeviceIcon className={`w-6 h-6 ${deviceTypeDisplay.color}`} />
            </Box>
          )}
        </Box>

        <Box className="flex-1 min-w-0 space-y-3">
          {/* OS and Browser Badges */}
          <Box className="flex items-center gap-2">
            <Badge variant="outline" className={`shrink-0 flex items-center gap-1 ${osDisplay.bgColor} border-0`}>
              <osDisplay.Icon className={`w-3 h-3 ${osDisplay.color}`} />
              <span className={`text-xs ${osDisplay.color}`}>{osDisplay.label}</span>
            </Badge>
            <Badge variant="outline" className={`shrink-0 flex items-center gap-1 ${browserDisplay.bgColor} border-0`}>
              <browserDisplay.Icon className={`w-3 h-3 ${browserDisplay.color}`} />
              <span className={`text-xs ${browserDisplay.color}`}>{browserDisplay.label}</span>
            </Badge>
          </Box>

          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {/* Session Details */}
            <p className="text-xs text-gray-500 truncate font-medium" suppressHydrationWarning>
              {formatLastActive(session.lastActiveAt, isCurrent)}
            </p>
            
            <p className="text-xs text-gray-500 truncate" title="Location">
              {[session.city, session.region, session.country].filter(Boolean).join(', ') || 'Location unknown'}
            </p>
            
            <p className="text-xs text-gray-400 truncate" suppressHydrationWarning>
              Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
            </p>
            
            <Box className="flex gap-2 text-xs text-gray-400 truncate">
              {session.ipAddress ? (
                <span>IP: {session.ipAddress}</span>
              ): null}
              {session.timezone ? (
                <span>• {session.timezone}</span>
              ): null}
            </Box>
          </Box>
          
          {/* Expiration & Extension */}
          <Box className="flex items-center justify-between pt-2 border-t border-dashed">
            <Box className="flex items-center gap-1.5">
              {isExpiringSoon ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className={`text-xs ${isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-500'}`} suppressHydrationWarning>
                Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}
              </span>
            </Box>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExtend}
              disabled={isExtending}
              className="h-6 px-2 text-xs hover:bg-primary/5 text-primary"
            >
              {isExtending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              Extend Session
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const MemoizedSessionCard = memo(SessionCard, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.session.id === nextProps.session.id &&
    prevProps.session.lastActiveAt === nextProps.session.lastActiveAt &&
    prevProps.session.expires === nextProps.session.expires &&
    prevProps.session.deviceName === nextProps.session.deviceName &&
    prevProps.selectable === nextProps.selectable &&
    prevProps.selected === nextProps.selected
  );
});