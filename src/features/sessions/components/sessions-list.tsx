'use client';

import { useMemo, useCallback, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

import { deleteSession, deleteOtherSessions } from '@/actions/sessions';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { useDeleteSession, useDeleteOtherSessions, useDeleteSessions } from '@/features/sessions/hooks/use-sessions';
import { DeleteSessionDialog } from '@/features/sessions/components/delete-session-dialog';
import { DeleteOtherSessionsDialog } from '@/features/sessions/components/delete-other-sessions-dialog';
import { SessionCard } from '@/features/sessions/components/session-card';
import type { SessionWithUser } from '@/features/sessions/types';
import { getSessionLimit } from '@/config/session';

export function SessionsList({ initialData = [] }: { initialData?: SessionWithUser[] }) {
  const { data: currentSession } = useSession();
  const deleteMutation = useDeleteSession();
  const deleteOthersMutation = useDeleteOtherSessions();
  const deleteSessionsMutation = useDeleteSessions();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOthersDialogOpen, setDeleteOthersDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithUser | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Use prefetched data directly
  const sessions = initialData;

  const sessionLimit = useMemo(() => {
    return getSessionLimit(currentSession?.user?.role);
  }, [currentSession?.user?.role]);

  const totalSessionsCount = useMemo(() => {
    if (!Array.isArray(sessions)) return 0;
    return sessions.length;
  }, [sessions]);

  const handleOpenDeleteDialog = useCallback((session: SessionWithUser) => {
    setSelectedSession(session);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (selectedSession) {
      const isCurrentSession = (selectedSession as any).isCurrent || false;

      if (isCurrentSession) {
        setDeleteDialogOpen(false);
        setSelectedSession(null);
        try {
          await deleteSession({ sessionId: selectedSession.id });
        } catch (error) {}
        signOut({ callbackUrl: '/signin' });
      } else {
        deleteMutation.mutate(selectedSession.id, {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setSelectedSession(null);
          },
        });
      }
    }
  }, [selectedSession, deleteMutation]);

  const handleDeleteOthers = useCallback(async () => {
    const currentSessionId = sessions?.find((s) => s.isCurrent)?.id;
    if (currentSessionId) {
      setDeleteOthersDialogOpen(false);
      try {
        await deleteOtherSessions({ currentSessionId });
      } catch (error) {}
      signOut({ callbackUrl: '/signin' });
    }
  }, [sessions]);

  const toggleSelection = useCallback((sessionId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(sessionId);
      } else {
        next.delete(sessionId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!sessions) return;
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  }, [sessions, selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // Check if current session is selected
    const currentSessionId = sessions?.find((s) => s.isCurrent)?.id;
    const isCurrentSelected = currentSessionId && ids.includes(currentSessionId);

    deleteSessionsMutation.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        if (isCurrentSelected) {
          signOut({ callbackUrl: '/signin' });
        }
      },
    });
  }, [selectedIds, sessions, deleteSessionsMutation]);

  const sessionList = useMemo(() => {
    if (!Array.isArray(sessions)) return null;
    if (sessions.length === 0) return <p>No active sessions found.</p>;

    return sessions.map((session) => (
      <SessionCard
        key={session.id}
        session={session}
        onDelete={handleOpenDeleteDialog}
        selectable={isSelectionMode}
        selected={selectedIds.has(session.id)}
        onSelect={toggleSelection}
      />
    ));
  }, [sessions, handleOpenDeleteDialog, isSelectionMode, selectedIds, toggleSelection]);

  return (
    <>
      <Box className="space-y-4 min-w-0 w-full">
        <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Box className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground text-sm">Manage and track all your sessions</p>
          </Box>
        </Box>

        <Box className="py-4 rounded-lg">
          <Box className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <Box className="flex items-center gap-2">
              {isSelectionMode ? (
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={sessions.length > 0 && selectedIds.size === sessions.length}
                  onChange={toggleSelectAll}
                />
              ): null}
              <h2 className="text-xl font-bold">Your Active Sessions</h2>
              <span className="text-sm font-normal text-muted-foreground bg-white px-2 py-0.5 rounded border">
                {totalSessionsCount} / {sessionLimit}
              </span>
            </Box>
            
            <Box className="flex items-center gap-2">
              {isSelectionMode ? (
                <>
                  <Button
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    disabled={selectedIds.size === 0 || deleteSessionsMutation.isPending}
                    variant="destructive"
                    size="sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out Selected ({selectedIds.size})
                  </Button>
                </>
              ) : (
                <>
                  {totalSessionsCount > 1 && (
                    <Button
                      onClick={() => setIsSelectionMode(true)}
                      variant="outline"
                      size="sm"
                    >
                      Select Multiple
                    </Button>
                  )}
                  {totalSessionsCount > 1 && (
                    <Button
                      onClick={() => setDeleteOthersDialogOpen(true)}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                      size="sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out All
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">{sessionList}</Box>
        </Box>
      </Box>

      <DeleteSessionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        deviceName={selectedSession?.deviceName}
        isCurrentSession={(selectedSession as any)?.isCurrent || false}
        isPending={deleteMutation.isPending}
      />

      <DeleteOtherSessionsDialog
        open={deleteOthersDialogOpen}
        onOpenChange={setDeleteOthersDialogOpen}
        onConfirm={handleDeleteOthers}
        sessionCount={totalSessionsCount}
        isPending={deleteOthersMutation.isPending}
      />
      </>
  );
}