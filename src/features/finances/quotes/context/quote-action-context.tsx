'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  useDeleteQuote,
  useMarkQuoteAsRejected,
  useMarkQuoteAsOnHold,
  useMarkQuoteAsCancelled,
  useConvertQuoteToInvoice,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { DeleteQuoteDialog } from '@/features/finances/quotes/components/delete-quote-dialog';
import { RejectQuoteDialog } from '@/features/finances/quotes/components/reject-quote-dialog';
import { OnHoldDialog } from '@/features/finances/quotes/components/on-hold-dialog';
import { CancelQuoteDialog } from '@/features/finances/quotes/components/cancel-quote-dialog';
import { ConvertToInvoiceDialog } from '@/features/finances/quotes/components/convert-to-invoice-dialog';

type ModalType = 'DELETE' | 'REJECT' | 'ON_HOLD' | 'CANCEL' | 'CONVERT';

interface ModalState {
  type: ModalType;
  id: string;
  quoteNumber?: string;
  gst?: number;
  discount?: number;
  onSuccess?: () => void;
}

interface QuoteActionContextType {
  openDelete: (id: string, quoteNumber?: string, onSuccess?: () => void) => void;
  openReject: (id: string, quoteNumber: string, onSuccess?: () => void) => void;
  openOnHold: (id: string, quoteNumber: string, onSuccess?: () => void) => void;
  openCancel: (id: string, quoteNumber: string, onSuccess?: () => void) => void;
  openConvert: (id: string, quoteNumber: string, gst: number, discount: number, onSuccess?: () => void) => void;
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

  const openDelete = useCallback((id: string, quoteNumber?: string, onSuccess?: () => void) => {
    setState({ type: 'DELETE', id, quoteNumber, onSuccess });
  }, []);

  const openReject = useCallback((id: string, quoteNumber: string, onSuccess?: () => void) => {
    setState({ type: 'REJECT', id, quoteNumber, onSuccess });
  }, []);

  const openOnHold = useCallback((id: string, quoteNumber: string, onSuccess?: () => void) => {
    setState({ type: 'ON_HOLD', id, quoteNumber, onSuccess });
  }, []);

  const openCancel = useCallback((id: string, quoteNumber: string, onSuccess?: () => void) => {
    setState({ type: 'CANCEL', id, quoteNumber, onSuccess });
  }, []);

  const openConvert = useCallback((id: string, quoteNumber: string, gst: number, discount: number, onSuccess?: () => void) => {
    setState({ type: 'CONVERT', id, quoteNumber, gst, discount, onSuccess });
  }, []);

  const close = useCallback(() => {
    setState(null);
  }, []);

  const handleConfirmDelete = useCallback((quoteId: string) => {
    deleteQuote.mutate(quoteId, {
      onSuccess: () => {
        close();
        state?.onSuccess?.();
      },
    });
  }, [state, deleteQuote, close]);

  const handleConfirmReject = useCallback((data: { id: string; rejectReason: string }) => {
    markAsRejected.mutate(data, {
      onSuccess: () => {
        close();
        state?.onSuccess?.();
      },
    });
  }, [markAsRejected, state, close]);

  const handleConfirmOnHold = useCallback((data: { id: string; reason?: string }) => {
    markAsOnHold.mutate(data, {
      onSuccess: () => {
        close();
        state?.onSuccess?.();
      },
    });
  }, [markAsOnHold, state, close]);

  const handleConfirmCancel = useCallback((data: { id: string; reason?: string }) => {
    markAsCancelled.mutate(data, {
      onSuccess: () => {
        close();
        state?.onSuccess?.();
      },
    });
  }, [markAsCancelled, state, close]);

  const handleConfirmConvert = useCallback((data: { id: string; dueDate: Date; gst: number; discount: number }) => {
    convertToInvoice.mutate(data, {
      onSuccess: () => {
        close();
        state?.onSuccess?.();
      },
    });
  }, [convertToInvoice, state, close]);

  const value = useMemo(() => ({
    openDelete,
    openReject,
    openOnHold,
    openCancel,
    openConvert,
    close,
  }), [openDelete, openReject, openOnHold, openCancel, openConvert, close]);

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
