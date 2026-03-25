import { Shell } from '@/components/shared/shell';
import { FilesList } from '@/features/files/components/files-list';

export default function FilesPage() {
  return (
    <Shell>
      <FilesList />
    </Shell>
  );
}
