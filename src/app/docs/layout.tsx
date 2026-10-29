import type { Metadata } from "next";
import { DOCS_SITE_URL } from "./docs-nav";
import { DocsShell } from "./components/docs-shell";

export const metadata: Metadata = {
  metadataBase: new URL(DOCS_SITE_URL),
  title: {
    default: "Faddy Docs",
    template: "%s | Faddy Docs",
  },
  description:
    "Guides for setting up feedback boards, roadmaps, changelogs, integrations, and AI automation in Faddy.",
  openGraph: {
    siteName: "Faddy Docs",
    type: "website",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsShell>{children}</DocsShell>;
}
