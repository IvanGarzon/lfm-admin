import { AcceptInviteForm } from '@/features/admin/invitations/components/accept-invite-form';
import { getInvitationByToken } from '@/actions/invitations/queries';
import { Box } from '@/components/ui/box';

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Box className="flex min-h-dvh items-center justify-center p-4">
        <Box className="max-w-md w-full text-center space-y-2">
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-muted-foreground">This invitation link is missing a token.</p>
        </Box>
      </Box>
    );
  }

  const result = await getInvitationByToken(token);

  if (!result.success) {
    return (
      <Box className="flex min-h-dvh items-center justify-center p-4">
        <Box className="max-w-md w-full text-center space-y-2">
          <h1 className="text-2xl font-bold">Invitation Unavailable</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="flex min-h-dvh items-center justify-center p-4">
      <AcceptInviteForm invitation={result.data} token={token} />
    </Box>
  );
}
