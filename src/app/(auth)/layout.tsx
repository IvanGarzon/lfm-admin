interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  return <main className="flex justify-center items-center h-full">{children}</main>;
}
