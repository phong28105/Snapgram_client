export default function MainLayout({
  children,
  login,
}: {
  children: React.ReactNode;
  login: React.ReactNode;
}) {
  return (
    <>
      {login}
      {children}
    </>
  );
}