export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout can be expanded to include admin-specific navigation or sidebars.
  return <>{children}</>;
}
