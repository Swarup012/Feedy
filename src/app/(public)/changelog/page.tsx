"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Wrench, Bug, Inbox } from "lucide-react";
import { changelogService, Changelog } from "@/services/changelogService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

// Type icon — sits in a bg-secondary medallion; the glyph carries the type hue.
const getTypeIcon = (type: string) => {
  switch (type) {
    case "new":
      return <Sparkles className="h-5 w-5 text-primary" />;
    case "improved":
      return <Wrench className="h-5 w-5 text-warning" />;
    case "fixed":
      return <Bug className="h-5 w-5 text-success" />;
    default:
      return <Sparkles className="h-5 w-5 text-muted-foreground" />;
  }
};

// Type label — one quiet pill style; the words carry the meaning.
const getTypeBadge = (type: string) => {
  switch (type) {
    case "new":
      return { label: "New Feature" };
    case "improved":
      return { label: "Improvement" };
    case "fixed":
      return { label: "Bug Fix" };
    default:
      return { label: type };
  }
};

export default function ChangelogPage() {
  const { toast } = useToast();
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChangelogs();
  }, []);

  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      const response = await changelogService.getPublicChangelogs({
        limit: 50,
      });

      if (response.success) {
        setChangelogs(response.data.changelogs);
      }
    } catch (error: any) {
      console.error("Error fetching changelogs:", error);
      toast({
        title: "Error",
        description: "Failed to load changelogs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] max-w-3xl items-center justify-center py-10">
        <Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" />
        <span className="sr-only">Loading changelog</span>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl px-4 py-10 md:py-14">
      {/* Masthead — left aligned, weight-led */}
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
          Changelog
        </h1>
        <p className="mt-3 text-base text-foreground">
          Discover the latest features, improvements, and bug fixes.
        </p>
        <p className="mt-2 text-sm tabular-nums text-muted-foreground">
          {changelogs.length} {changelogs.length === 1 ? "release" : "releases"}{" "}
          published
        </p>
      </header>

      {changelogs.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-foreground">
            No changelogs published yet.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {changelogs.map((changelog) => {
            const typeBadge = getTypeBadge(changelog.type);

            return (
              <article
                key={changelog.id}
                className="space-y-4 border-b border-border pb-10 last:border-0 last:pb-0"
              >
                {/* Type medallion, label, date */}
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {getTypeIcon(changelog.type)}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-border font-medium text-foreground"
                  >
                    {typeBadge.label}
                  </Badge>
                  <time
                    className="ml-auto text-sm tabular-nums text-muted-foreground"
                    dateTime={
                      changelog.published_at || changelog.created_at
                    }
                  >
                    {changelog.published_at
                      ? format(new Date(changelog.published_at), "MMMM d, yyyy")
                      : format(new Date(changelog.created_at), "MMMM d, yyyy")}
                  </time>
                </div>

                {/* Title */}
                <h2 className="font-headline text-xl font-semibold tracking-tight text-foreground break-words">
                  {changelog.title}
                </h2>

                {/* Description */}
                {changelog.description && (
                  <p className="max-w-[70ch] text-base text-foreground">
                    {changelog.description}
                  </p>
                )}

                {/* Featured Image */}
                {changelog.featured_image && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <img
                      src={changelog.featured_image}
                      alt={changelog.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="prose-blog">
                  <ReactMarkdown
                    components={{
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="rounded-lg max-w-full h-auto"
                          style={{ maxWidth: "100%" }}
                        />
                      ),
                    }}
                  >
                    {changelog.content}
                  </ReactMarkdown>
                </div>

                {/* Labels */}
                {changelog.labels && changelog.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {changelog.labels.map((label, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Author */}
                {changelog.author && (
                  <div className="flex items-center gap-3 border-t border-border pt-4">
                    {changelog.author.avatar_url ? (
                      <img
                        src={changelog.author.avatar_url}
                        alt={changelog.author.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                        {changelog.author.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {changelog.author.name}
                      </p>
                      <p className="text-xs text-muted-foreground">Author</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
