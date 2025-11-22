'use client';

import { SessionWithRelations } from '@/zod/modelSchema/SessionSchema';
import { useQuery } from '@tanstack/react-query';
import { getSessions } from '@/actions/sessions';
import { useSession } from 'next-auth/react';
import { useMemo, useCallback } from 'react';
import { Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { useSessions } from '@/hooks/use-sessions';
import { motion } from 'framer-motion';

function SessionCard({
  session,
  currentSessionId,
}: {
  session: SessionWithRelations;
  currentSessionId?: string;
}) {
  const isCurrent = session.id === currentSessionId;

  const handleRenameSessionName = useCallback(() => {
    const newName = prompt('Enter new device name:', session.deviceName || undefined);
    if (newName) {
      // TODO: implement renameSession(session.id, newName);
    }
  }, [session.deviceName]);

  return (
    <Box className="flex items-center justify-between bg-white border rounded p-4">
      <Box className="flex items-center space-x-4 overflow-hidden">
        <Box className="shrink-0">
          <Laptop className="w-8 h-8" />
        </Box>

        <Box className="overflow-hidden">
          <h6 className="text-sm text-gray-400 truncate">
            <span className="font-semibold text-gray-800 truncate">
              {session.user.firstName} {session.user.lastName}{' '}
            </span>
            <span className="">was logged in on {session.deviceModel || 'Unknown Device'} </span>
            {isCurrent && <span className="text-primary">- This Device</span>}
          </h6>
          <p className="text-xs text-gray-400 truncate">
            Created: {new Date(session.createdAt).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 truncate">
            Near {session.city}, {session.region}, {session.country} - {session.browserName}{' '}
          </p>
          {session.ipAddress && (
            <p className="text-xs text-gray-400 truncate">IP: {session.ipAddress}</p>
          )}
        </Box>
      </Box>

      <Box className="shrink-0 space-x-2">
        <Button onClick={handleRenameSessionName} className="px-2 py-1 text-sm bg-gray-100 rounded">
          Rename
        </Button>
        <Button
          // onClick={() => {
          //   TODO: implement signOutSession(session.id);
          // }}
          className="px-2 py-1 text-sm bg-red-100 text-red-800 rounded"
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
}

export function SessionsList() {
  const { data: currentSession, status } = useSession();

  const {
    data: sessions,
    isFetching,
    error,
  } = useQuery({
    ...useSessions({}),
    enabled: status === 'authenticated',
  });

  const sessionList = useMemo(() => {
    if (!Array.isArray(sessions)) {
      return null;
    }

    if (sessions.length === 0) {
      return <p>No active sessions found.</p>;
    }

    if (!currentSession) {
      return <p className="text-gray-500">Loading current session...</p>;
    }

    return sessions.map((session) => (
      <SessionCard key={session.id} session={session} currentSessionId={currentSession.id} />
    ));
  }, [sessions, currentSession]);

  if (error) {
    return <Box className="p-4 bg-red-100 text-red-700 rounded">Error fetching sessions</Box>;
  }

  return (
    <>
      {isFetching && (
        <Box className="flex items-center justify-center p-4 bg-white dark:bg-black">
          <span className="animate-spin w-8 h-8 border-4 border-t-transparent border-solid border-primary rounded-full" />
        </Box>
      )}

      {sessions && (
        <motion.div
          key={'employee-table'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Box className="p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Your Active Sessions</h2>
            <Box className="space-y-2">{sessionList}</Box>
          </Box>
        </motion.div>
      )}
    </>
  );
}
