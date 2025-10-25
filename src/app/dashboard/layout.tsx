export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout can be expanded to include dashboard-specific navigation or sidebars.
  return <>{children}</>;
}
