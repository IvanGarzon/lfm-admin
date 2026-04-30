import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';

interface QuoteVersion {
  id: string;
}

interface QuoteVersionNavigationProps {
  versions: QuoteVersion[];
  currentVersionIndex: number;
  hasUnsavedChanges: boolean;
  onNavigateToVersion: (versionId: string) => void;
}

export function QuoteVersionNavigation({
  versions,
  currentVersionIndex,
  hasUnsavedChanges,
  onNavigateToVersion,
}: QuoteVersionNavigationProps) {
  const hasPreviousVersion = currentVersionIndex > 0;
  const hasNextVersion = currentVersionIndex >= 0 && currentVersionIndex < versions.length - 1;
  const previousVersionId = hasPreviousVersion ? versions[currentVersionIndex - 1]?.id : null;
  const nextVersionId = hasNextVersion ? versions[currentVersionIndex + 1]?.id : null;

  if (versions.length <= 1) {
    return null;
  }

  return (
    <Box className="flex items-center gap-1 ml-2">
      <Button
        variant="outline"
        size="icon"
        className="h-6 w-6"
        onClick={() => previousVersionId && onNavigateToVersion(previousVersionId)}
        disabled={!hasPreviousVersion || hasUnsavedChanges}
        aria-label="Previous version"
      >
        <ChevronLeft className="h-3 w-3" aria-hidden="true" />
      </Button>
      <span className="text-xs text-muted-foreground px-1">
        {currentVersionIndex + 1} / {versions.length}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-6 w-6"
        onClick={() => nextVersionId && onNavigateToVersion(nextVersionId)}
        disabled={!hasNextVersion || hasUnsavedChanges}
        aria-label="Next version"
      >
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
      </Button>
    </Box>
  );
}
