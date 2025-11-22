import { Shell } from '@/components/shared/shell';
import { SessionsList } from '@/components/sessions/SessionsList';

export default function SessionsPage() {
  return (
    <Shell className="gap-2">
      <SessionsList></SessionsList>
    </Shell>
  );
}
