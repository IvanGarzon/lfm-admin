import { QuoteStatusSchema, type QuoteStatus } from '@/zod/schemas/enums/QuoteStatus.schema';
import { X, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { QuoteStatusBadge } from '@/features/finances/quotes/components/quote-status-badge';
import { QuoteDrawerActionsMenu } from '@/features/finances/quotes/components/quote-drawer-actions-menu';
import { QuoteVersionNavigation } from '@/features/finances/quotes/components/quote-version-navigation';
import type { QuoteWithDetails, QuoteMetadata } from '@/features/finances/quotes/types';

interface QuoteVersion {
  id: string;
}

interface QuoteDrawerActionsMenuHandlers {
  onSend: () => void;
  onOnHold: () => void;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onConvert: () => void;
  onCreateVersion: () => void;
  onDuplicate: () => void;
  onDownloadPdf: () => void;
  onSendEmail: () => void;
  onSendFollowUp: () => void;
  onDelete: () => void;
}

interface QuoteDrawerHeaderProps {
  mode: 'create' | 'edit';
  title: string;
  status: QuoteStatus | null;
  hasUnsavedChanges: boolean;
  showPreview: boolean;
  onPreviewToggle: () => void;
  versions?: QuoteVersion[];
  currentVersionIndex: number;
  onNavigateToVersion: (versionId: string) => void;
  quote?: QuoteWithDetails | QuoteMetadata | null;
  isCreating: boolean;
  isUpdating: boolean;
  actionsMenuHandlers: QuoteDrawerActionsMenuHandlers;
  showFollowUp: boolean;
  onClose: () => void;
}

export function QuoteDrawerHeader({
  mode,
  title,
  status,
  hasUnsavedChanges,
  showPreview,
  onPreviewToggle,
  versions,
  currentVersionIndex,
  onNavigateToVersion,
  quote,
  isCreating,
  isUpdating,
  actionsMenuHandlers,
  showFollowUp,
  onClose,
}: QuoteDrawerHeaderProps) {
  return (
    <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
      <Box className="mt-1 flex flex-col flex-1">
        <Box className="flex items-center gap-2">
          <DrawerTitle>{title}</DrawerTitle>
          {mode === 'edit' && hasUnsavedChanges ? (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </span>
          ) : null}
        </Box>
        <Box className="flex items-center gap-2">
          {status ? (
            <DrawerDescription>
              <QuoteStatusBadge status={status} />
            </DrawerDescription>
          ) : null}

          {mode === 'edit' && versions && versions.length > 1 ? (
            <QuoteVersionNavigation
              versions={versions}
              currentVersionIndex={currentVersionIndex}
              hasUnsavedChanges={hasUnsavedChanges}
              onNavigateToVersion={onNavigateToVersion}
            />
          ) : null}
        </Box>
      </Box>

      <Box className="flex items-center gap-2">
        {mode === 'edit' ? (
          <Button type="button" variant="outline" size="sm" onClick={onPreviewToggle}>
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Preview
              </>
            )}
          </Button>
        ) : null}

        {mode === 'create' ? (
          <Button type="submit" form="form-rhf-quote" size="sm" disabled={isCreating}>
            <Save className="h-4 w-4 mr-1" />
            Save as Draft
          </Button>
        ) : null}

        {mode === 'edit' && quote ? (
          <>
            {quote.status !== QuoteStatusSchema.enum.ACCEPTED &&
            quote.status !== QuoteStatusSchema.enum.CONVERTED &&
            quote.status !== QuoteStatusSchema.enum.ON_HOLD ? (
              <Button
                type="submit"
                form="form-rhf-quote"
                size="sm"
                disabled={isUpdating || !hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-1" />
                {mode === 'edit' ? 'Update' : 'Save'}
              </Button>
            ) : null}

            <QuoteDrawerActionsMenu
              quote={quote}
              handlers={actionsMenuHandlers}
              showFollowUp={showFollowUp}
              isDisabled={isUpdating}
            />
          </>
        ) : null}

        <Button
          variant="ghost"
          className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </Button>
      </Box>
    </Box>
  );
}
