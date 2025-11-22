'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleAlert } from 'lucide-react';

export default function AreaStatsError({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <CircleAlert className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Failed to load area statistics: {error.message}</AlertDescription>
    </Alert>
  );
}
