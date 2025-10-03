import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, ThumbsUp } from "lucide-react";
import Link from 'next/link';

const changelogEntries = [
  {
    version: 'v2.5.0',
    date: 'June 1, 2024',
    title: 'The Collaboration Update',
    summary: 'Introducing team mentions, internal notes, and a redesigned notification system to supercharge your team\'s workflow.',
    changes: {
      'New Features': ['Team mentions with @username', 'Internal notes on feedback (admin-only)'],
      'Improvements': ['Redesigned notification preferences', 'Improved search performance'],
      'Bug Fixes': ['Fixed an issue with image uploads on Safari'],
    },
    reactions: { celebrate: 12, thumbsup: 45, heart: 28 },
  },
  {
    version: 'v2.4.0',
    date: 'May 15, 2024',
    title: 'Roadmap and Changelog',
    summary: 'We are excited to launch public roadmaps and this very changelog! Now you can track our progress and stay up-to-date with new features.',
    changes: {
      'New Features': ['Public Roadmap page', 'Public Changelog page'],
    },
    reactions: { celebrate: 30, thumbsup: 60, heart: 40 },
  },
];

export default function ChangelogPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Changelog</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Discover the latest features, improvements, and bug fixes.
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto">
        <div className="absolute left-1/2 -translate-x-1/2 h-full w-0.5 bg-border" aria-hidden="true"></div>
        
        {changelogEntries.map((entry, index) => (
          <div key={index} className="relative mb-12">
            <div className="flex items-center mb-4">
              <div className="z-10 flex items-center justify-center w-8 h-8 bg-primary rounded-full ring-8 ring-background">
                <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              </div>
            </div>

            <Card className="ml-4 md:ml-12 shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <CardTitle className="text-2xl font-bold">{entry.title}</CardTitle>
                  <time className="text-sm text-muted-foreground font-medium">{entry.date}</time>
                </div>
                <p className="text-muted-foreground pt-1">{entry.summary}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(entry.changes).map(([category, items]) => (
                  <div key={category}>
                    <Badge variant="secondary" className="mb-2">{category}</Badge>
                    <ul className="list-disc list-inside space-y-1 text-foreground/80">
                      {items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
              <Separator className="my-4"/>
              <CardFooter className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                        <ThumbsUp className="h-4 w-4" /> {entry.reactions.thumbsup}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5">
                        <Heart className="h-4 w-4" /> {entry.reactions.heart}
                    </Button>
                 </div>
                 <Link href="#" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4"/>
                    <span>Comment</span>
                 </Link>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
