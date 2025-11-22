import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from 'src/components/ui/card';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export function SignIn() {
  return (
    <div className="min-h-screen flex justify-center items-start md:items-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>This demo uses GitHub for authentication.</CardDescription>
        </CardHeader>
        <CardFooter>
          <GoogleSignInButton></GoogleSignInButton>
        </CardFooter>
      </Card>
    </div>
  );
}
