import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getSessions } from '@/actions/sessions';
import { SessionsList } from '@/features/sessions/components/sessions-list';

export const metadata = constructMetadata({
  title: 'Sessions – lfm dashboard',
  description: 'Manage your active sessions and security.',
});

export default async function SessionsPage() {
  const result = await getSessions();

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell className="gap-2">
      <SessionsList initialData={result.data} />
    </Shell>
  );
}
