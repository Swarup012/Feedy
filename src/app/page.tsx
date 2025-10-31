import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  MessageSquare,
  Lightbulb,
  Zap,
  CheckCircle,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const heroImage = PlaceHolderImages.find((p) => p.id === "landing-hero-1");

const features = [
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: "Capture Feedback",
    description:
      "Easily collect and organize feature requests, bug reports, and ideas from your users.",
    image: PlaceHolderImages.find((p) => p.id === "feature-1"),
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Prioritize with AI",
    description:
      "Use AI to automatically categorize, analyze sentiment, and identify trending feedback.",
    image: PlaceHolderImages.find((p) => p.id === "feature-2"),
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: "Engage Your Community",
    description:
      "Keep users in the loop with public roadmaps and automated changelog updates.",
    image: PlaceHolderImages.find((p) => p.id === "feature-3"),
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold">Faddy</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/feedback"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Feedback
            </Link>
            <Link
              href="/roadmap"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Roadmap
            </Link>
            <Link
              href="/changelog"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Changelog
            </Link>
          </nav>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32">
          <div className="container text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
                Build Better Products with User Feedback
              </h1>
              <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                FeedbackFlow helps you collect, manage, and prioritize customer
                feedback to build products that people love.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/feedback">View Demo Board</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
                The All-in-One Feedback Platform
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg">
                From idea to launch, FeedbackFlow provides all the tools you
                need.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader className="items-center">
                    {feature.icon}
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-center">
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32">
          <div className="container grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
                Close the Loop with Your Users
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Keep your users engaged and informed throughout the entire
                product development lifecycle.
              </p>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>
                    Public roadmaps show what you're working on and what's next.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>
                    Changelogs celebrate new feature launches and product
                    updates.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>
                    Automatic notifications keep stakeholders informed of status
                    changes.
                  </span>
                </li>
              </ul>
            </div>
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                data-ai-hint={heroImage.imageHint}
                width={600}
                height={400}
                className="rounded-lg shadow-2xl"
              />
            )}
          </div>
        </section>
      </main>
      <footer className="bg-secondary border-t">
        <div className="container py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} FeedbackFlow. All rights
              reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
