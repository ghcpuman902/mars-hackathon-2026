import type { Metadata } from "next"

import { LandingPicker } from "@/components/landing-picker"

export const metadata: Metadata = {
  title: "Pick a landing site — Mars City",
  description: "Select a Martian landing site for a buried first habitat.",
}

export default function Page() {
  return <LandingPicker />
}
