import {
  Send,
  Pause,
  Check,
  X,
  Ban,
  FileCheck,
  Copy,
  Files,
  Download,
  Mail,
  Trash,
  MoreHorizontalIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getQuotePermissions } from '@/features/finances/quotes/utils/quote-helpers';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';

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

interface QuoteDrawerActionsMenuProps {
  quote: QuoteWithDetails;
  handlers: QuoteDrawerActionsMenuHandlers;
  showFollowUp: boolean;
  isDisabled?: boolean;
}

export function QuoteDrawerActionsMenu({
  quote,
  handlers,
  showFollowUp,
  isDisabled = false,
}: QuoteDrawerActionsMenuProps) {
  const {
    canAccept,
    canReject,
    canSend,
    canSendQuote,
    canPutOnHold,
    canCancel,
    canConvert,
    canDelete,
    canCreateVersion,
  } = getQuotePermissions(quote.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="More Options"
          disabled={isDisabled}
          className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10 cursor-pointer"
        >
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">More options</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {canSend ? (
          <DropdownMenuItem onClick={handlers.onSend}>
            <Send className="h-4 w-4" />
            Send quote
          </DropdownMenuItem>
        ) : null}

        {canPutOnHold ? (
          <DropdownMenuItem onClick={handlers.onOnHold}>
            <Pause className="h-4 w-4" />
            Put on hold
          </DropdownMenuItem>
        ) : null}

        {canAccept ? (
          <DropdownMenuItem onClick={handlers.onAccept}>
            <Check className="h-4 w-4" />
            Accept quote
          </DropdownMenuItem>
        ) : null}

        {canReject ? (
          <DropdownMenuItem onClick={handlers.onReject}>
            <X className="h-4 w-4" />
            Reject quote
          </DropdownMenuItem>
        ) : null}

        {canCancel ? (
          <DropdownMenuItem onClick={handlers.onCancel}>
            <Ban className="h-4 w-4" />
            Cancel quote
          </DropdownMenuItem>
        ) : null}

        {canConvert ? (
          <DropdownMenuItem onClick={handlers.onConvert}>
            <FileCheck className="h-4 w-4" />
            Convert to invoice
          </DropdownMenuItem>
        ) : null}

        {canCreateVersion ? (
          <DropdownMenuItem onClick={handlers.onCreateVersion}>
            <Copy className="h-4 w-4" />
            Create new version
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem onClick={handlers.onDuplicate}>
          <Files className="h-4 w-4" />
          Duplicate quote
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handlers.onDownloadPdf}>
          <Download className="h-4 w-4" />
          Download quote
        </DropdownMenuItem>

        {canSendQuote ? (
          <DropdownMenuItem onClick={handlers.onSendEmail}>
            <Mail className="h-4 w-4" />
            Resend quote
          </DropdownMenuItem>
        ) : null}

        {showFollowUp ? (
          <DropdownMenuItem onClick={handlers.onSendFollowUp}>
            <Send className="h-4 w-4" />
            Send follow-up
          </DropdownMenuItem>
        ) : null}

        {canDelete ? (
          <DropdownMenuItem
            onClick={handlers.onDelete}
            className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
          >
            <Trash className="h-4 w-4" />
            Delete quote
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
