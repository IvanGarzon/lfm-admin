'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useDeleteInvoice, useRecordPayment, useCancelInvoice, useDownloadReceiptPdf, useInvoice } from '@/features/finances/invoices/hooks/use-invoice-queries';
import { DeleteInvoiceDialog } from '@/features/finances/invoices/components/delete-invoice-dialog';
import { RecordPaymentDialog } from '@/features/finances/invoices/components/record-payment-dialog';
import { CancelInvoiceDialog } from '@/features/finances/invoices/components/cancel-invoice-dialog';
import { SendReceiptDialog } from '@/features/finances/invoices/components/send-receipt-dialog';
import type { InvoiceWithDetails, CancelInvoiceData } from '@/features/finances/invoices/types';
import type { RecordPaymentInput } from '@/schemas/invoices';

type ModalType = 'DELETE' | 'RECORD_PAYMENT' | 'CANCEL' | 'SEND_RECEIPT';

interface ModalState {
  type: ModalType;
  id: string;
  invoiceNumber?: string;
  invoice?: InvoiceWithDetails;
  onSuccess?: () => void;
}

interface InvoiceActionContextType {
  openDelete: (id: string, invoiceNumber?: string, onSuccess?: () => void) => void;
  openRecordPayment: (id: string, invoiceNumber: string, invoice?: InvoiceWithDetails, onSuccess?: () => void) => void;
  openCancel: (id: string, invoiceNumber: string, onSuccess?: () => void) => void;
  openSendReceipt: (id: string, invoice?: InvoiceWithDetails, onSuccess?: () => void) => void;
  close: () => void;
}

const InvoiceActionContext = createContext<InvoiceActionContextType | undefined>(undefined);

export function InvoiceActionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const deleteInvoice = useDeleteInvoice();
  const recordPayment = useRecordPayment();
  const cancelInvoice = useCancelInvoice();
  const downloadReceiptPdf = useDownloadReceiptPdf();

  // Fetch full invoice details if needed (e.g. for Send Receipt dialog if opened from list)
  const shouldFetchInvoice = (state?.type === 'SEND_RECEIPT' || state?.type === 'RECORD_PAYMENT') && !state.invoice;
  const { data: fetchedInvoice } = useInvoice(shouldFetchInvoice ? state?.id : undefined);

  const activeInvoice = state?.invoice || fetchedInvoice;

  const openDelete = useCallback((id: string, invoiceNumber?: string, onSuccess?: () => void) => {
    setState({ type: 'DELETE', id, invoiceNumber, onSuccess });
  }, []);

  const openRecordPayment = useCallback((id: string, invoiceNumber: string, invoice?: InvoiceWithDetails, onSuccess?: () => void) => {
    setState({ type: 'RECORD_PAYMENT', id, invoiceNumber, invoice, onSuccess });
  }, []);

  const openCancel = useCallback((id: string, invoiceNumber: string, onSuccess?: () => void) => {
    setState({ type: 'CANCEL', id, invoiceNumber, onSuccess });
  }, []);

  const openSendReceipt = useCallback((id: string, invoice?: InvoiceWithDetails, onSuccess?: () => void) => {
    setState({ type: 'SEND_RECEIPT', id, invoice, onSuccess });
  }, []);

  const close = useCallback(() => {
    setState(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (state?.type === 'DELETE' && state.id) {
      deleteInvoice.mutate(state.id, {
        onSuccess: () => {
          close();
          state.onSuccess?.();
        },
      });
    }
  }, [state, deleteInvoice, close]);

  const handleConfirmRecordPayment = useCallback(async (data: RecordPaymentInput) => {
    const result = await recordPayment.mutateAsync(data);

    // If the payment resulted in a fully paid invoice with a receipt number, open the receipt dialog
    if (result.status === 'PAID' && result.receiptNumber) {
      close();
      // Open the send receipt dialog
      openSendReceipt(data.id, undefined, state?.onSuccess);
    } else {
      // For partial payments or other cases, just close
      close();
      state?.onSuccess?.();
    }
  }, [recordPayment, state, close, openSendReceipt]);

  const handleConfirmCancel = useCallback((data: CancelInvoiceData) => {
    cancelInvoice.mutate(data, {
      onSuccess: () => {
        close();
        state?.onSuccess?.();
      },
    });
  }, [cancelInvoice, state, close]);

  const handleDownloadReceipt = useCallback(async () => {
    if (state?.id) {
      await downloadReceiptPdf.mutateAsync(state.id);
    }
  }, [state, downloadReceiptPdf]);

  const handleSendEmailReceipt = useCallback(async () => {
    if (!state?.id) {
      throw new Error('No invoice ID available');
    }

    // Import the server action dynamically to avoid bundling issues
    const { sendInvoiceReceipt } = await import('@/actions/invoices');

    // Send the receipt email with PDF attachment
    const result = await sendInvoiceReceipt(state.id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to send receipt');
    }

    close();
    state.onSuccess?.();
  }, [state, close]);

  const value = useMemo(() => ({
    openDelete,
    openRecordPayment,
    openCancel,
    openSendReceipt,
    close,
  }), [openDelete, openRecordPayment, openCancel, openSendReceipt, close]);

  return (
    <InvoiceActionContext.Provider value={value}>
      {children}

      <DeleteInvoiceDialog
        open={state?.type === 'DELETE'}
        onOpenChange={(open) => !open && close()}
        onConfirm={handleConfirmDelete}
        invoiceNumber={state?.invoiceNumber}
        isPending={deleteInvoice.isPending}
      />

      {state?.type === 'RECORD_PAYMENT' && state.id && state.invoiceNumber && (
        <RecordPaymentDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          onConfirm={handleConfirmRecordPayment}
          invoiceId={state.id}
          invoiceNumber={state.invoiceNumber}
          amountDue={activeInvoice?.amountDue ?? 0}
          invoiceTotal={Number(activeInvoice?.amount ?? 0)}
          isPending={recordPayment.isPending}
        />
      )}

      {state?.type === 'CANCEL' && state.id && state.invoiceNumber && (
        <CancelInvoiceDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          onConfirm={handleConfirmCancel}
          invoiceId={state.id}
          invoiceNumber={state.invoiceNumber}
          isPending={cancelInvoice.isPending}
        />
      )}

      {state?.type === 'SEND_RECEIPT' && activeInvoice && (
        <SendReceiptDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          invoice={activeInvoice}
          onDownload={handleDownloadReceipt}
          onSendEmail={handleSendEmailReceipt}
        />
      )}
    </InvoiceActionContext.Provider>
  );
}

export function useInvoiceActions() {
  const context = useContext(InvoiceActionContext);
  if (context === undefined) {
    throw new Error('useInvoiceActions must be used within an InvoiceActionProvider');
  }
  return context;
}
