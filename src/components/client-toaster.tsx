"use client"

import dynamic from "next/dynamic"

const Toaster = dynamic(
  () => import("@/components/ui/toaster").then((mod) => mod.Toaster),
  { ssr: false }
)

export function ClientToaster() {
  return <Toaster />
}
