import { Box } from '@/components/ui/box';
import { ResetPasswordForm } from '@/features/users/components/reset-password-form';
import { getPasswordResetToken } from '@/actions/users/queries';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Box className="w-full min-h-screen flex justify-center items-start md:items-center p-8">
        <Box className="max-w-md w-full text-center space-y-2">
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-muted-foreground">This password reset link is missing a token.</p>
        </Box>
      </Box>
    );
  }

  const result = await getPasswordResetToken(token);

  if (!result.success || !result.data) {
    return (
      <Box className="w-full min-h-screen flex justify-center items-start md:items-center p-8">
        <Box className="max-w-md w-full text-center space-y-2">
          <h1 className="text-2xl font-bold">Link Unavailable</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="w-full min-h-screen flex justify-center items-start md:items-center p-8">
      <ResetPasswordForm token={token} email={result.data.email} />
    </Box>
  );
}
