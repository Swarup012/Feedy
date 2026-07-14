import type { Metadata } from "next";
import CannyAlternativeClient from "./CannyAlternativeClient";

export const metadata: Metadata = {
  title: "Best Canny Alternative for Startups — Faddy",
  description:
    "Looking for a Canny alternative? Faddy gives you feedback boards, feature voting, roadmap and changelog — at flat pricing. Free plan available.",
  alternates: {
    canonical: "https://www.usefaddy.com/canny-alternative",
  },
};

export default function CannyAlternativePage() {
  return <CannyAlternativeClient />;
}
