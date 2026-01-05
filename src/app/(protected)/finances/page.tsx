import { Shell } from '@/components/shared/shell';
import { FinancesOverview } from '@/features/finances/shared/components/finances-overview';

export const metadata = {
  title: 'Finances | Overview',
  description: 'Monitor invoices, quotes, and transactions across all financial modules',
};

export default function FinancesPage() {
  return (
    <Shell>
      <FinancesOverview />
    </Shell>
  );
}
