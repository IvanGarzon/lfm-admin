'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  useDeleteQuote,
  useMarkQuoteAsRejected,
  useMarkQuoteAsOnHold,
  useMarkQuoteAsCancelled,
  useConvertQuoteToInvoice,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { DeleteQuoteDialog } from '@/features/finances/quotes/components/dialogs/delete-quote-dialog';
import { RejectQuoteDialog } from '@/features/finances/quotes/components/dialogs/reject-quote-dialog';
import { OnHoldDialog } from '@/features/finances/quotes/components/dialogs/on-hold-dialog';
import { CancelQuoteDialog } from '@/features/finances/quotes/components/dialogs/cancel-quote-dialog';
import { ConvertToInvoiceDialog } from '@/features/finances/quotes/components/dialogs/convert-to-invoice-dialog';

type ModalType = 'DELETE' | 'REJECT' | 'ON_HOLD' | 'CANCEL' | 'CONVERT';

interface ModalState {
  type: ModalType;
  id: string;
  quoteNumber?: string;
  gst?: number;
  discount?: number;
}

interface QuoteActionContextType {
  openDelete: (id: string, quoteNumber?: string) => void;
  openReject: (id: string, quoteNumber: string) => void;
  openOnHold: (id: string, quoteNumber: string) => void;
  openCancel: (id: string, quoteNumber: string) => void;
  openConvert: (id: string, quoteNumber: string, gst: number, discount: number) => void;
  close: () => void;
}

const QuoteActionContext = createContext<QuoteActionContextType | undefined>(undefined);

export function QuoteActionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const deleteQuote = useDeleteQuote();
  const markAsRejected = useMarkQuoteAsRejected();
  const markAsOnHold = useMarkQuoteAsOnHold();
  const markAsCancelled = useMarkQuoteAsCancelled();
  const convertToInvoice = useConvertQuoteToInvoice();

  const openDelete = useCallback((id: string, quoteNumber?: string) => {
    setState({ type: 'DELETE', id, quoteNumber });
  }, []);

  const openReject = useCallback((id: string, quoteNumber: string) => {
    setState({ type: 'REJECT', id, quoteNumber });
  }, []);

  const openOnHold = useCallback((id: string, quoteNumber: string) => {
    setState({ type: 'ON_HOLD', id, quoteNumber });
  }, []);

  const openCancel = useCallback((id: string, quoteNumber: string) => {
    setState({ type: 'CANCEL', id, quoteNumber });
  }, []);

  const openConvert = useCallback(
    (id: string, quoteNumber: string, gst: number, discount: number) => {
      setState({ type: 'CONVERT', id, quoteNumber, gst, discount });
    },
    [],
  );

  const close = useCallback(() => {
    setState(null);
  }, []);

  const handleConfirmDelete = useCallback(
    (quoteId: string) => {
      deleteQuote.mutate(quoteId, {
        onSuccess: close,
      });
    },
    [deleteQuote, close],
  );

  const handleConfirmReject = useCallback(
    (data: { id: string; rejectReason: string }) => {
      markAsRejected.mutate(data, {
        onSuccess: close,
      });
    },
    [markAsRejected, close],
  );

  const handleConfirmOnHold = useCallback(
    (data: { id: string; reason?: string }) => {
      markAsOnHold.mutate(data, {
        onSuccess: close,
      });
    },
    [markAsOnHold, close],
  );

  const handleConfirmCancel = useCallback(
    (data: { id: string; reason?: string }) => {
      markAsCancelled.mutate(data, {
        onSuccess: close,
      });
    },
    [markAsCancelled, close],
  );

  const handleConfirmConvert = useCallback(
    (data: { id: string; dueDate: Date; gst: number; discount: number }) => {
      convertToInvoice.mutate(data, {
        onSuccess: close,
      });
    },
    [convertToInvoice, close],
  );

  const value = useMemo(
    () => ({
      openDelete,
      openReject,
      openOnHold,
      openCancel,
      openConvert,
      close,
    }),
    [openDelete, openReject, openOnHold, openCancel, openConvert, close],
  );

  return (
    <QuoteActionContext.Provider value={value}>
      {children}

      {state?.type === 'DELETE' && state.id && state.quoteNumber && (
        <DeleteQuoteDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          onConfirm={handleConfirmDelete}
          quoteId={state.id}
          quoteNumber={state.quoteNumber}
          isPending={deleteQuote.isPending}
        />
      )}

      {state?.type === 'REJECT' && state.id && state.quoteNumber && (
        <RejectQuoteDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          onConfirm={handleConfirmReject}
          quoteId={state.id}
          quoteNumber={state.quoteNumber}
          isPending={markAsRejected.isPending}
        />
      )}

      {state?.type === 'ON_HOLD' && state.id && state.quoteNumber && (
        <OnHoldDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          onConfirm={handleConfirmOnHold}
          quoteId={state.id}
          quoteNumber={state.quoteNumber}
          isPending={markAsOnHold.isPending}
        />
      )}

      {state?.type === 'CANCEL' && state.id && state.quoteNumber && (
        <CancelQuoteDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          onConfirm={handleConfirmCancel}
          quoteId={state.id}
          quoteNumber={state.quoteNumber}
          isPending={markAsCancelled.isPending}
        />
      )}

      {state?.type === 'CONVERT' && state.id && state.quoteNumber && (
        <ConvertToInvoiceDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          onConfirm={handleConfirmConvert}
          quoteId={state.id}
          quoteNumber={state.quoteNumber}
          quoteGst={state.gst ?? 0}
          quoteDiscount={state.discount ?? 0}
          isPending={convertToInvoice.isPending}
        />
      )}
    </QuoteActionContext.Provider>
  );
}

export function useQuoteActions() {
  const context = useContext(QuoteActionContext);
  if (context === undefined) {
    throw new Error('useQuoteActions must be used within a QuoteActionProvider');
  }
  return context;
}
