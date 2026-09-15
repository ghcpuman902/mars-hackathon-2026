import type { Metadata } from "next"

import { LandingPicker } from "@/components/landing-picker"

export const metadata: Metadata = {
  title: "NASA landing areas — Mars City",
  description: "Select a NASA-recommended Mars landing area, then inspect terrain and cave pits.",
}

export default function Page() {
  return <LandingPicker />
}
