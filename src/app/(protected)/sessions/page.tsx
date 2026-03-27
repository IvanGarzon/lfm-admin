import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { SessionsList } from '@/features/sessions/components/sessions-list';

export const metadata = constructMetadata({
  title: 'Sessions – lfm dashboard',
  description: 'Manage your active sessions and security.',
});

export default function SessionsPage() {
  return (
    <Shell className="gap-2">
      <SessionsList />
    </Shell>
  );
}
