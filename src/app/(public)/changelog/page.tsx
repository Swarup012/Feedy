"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Wrench, Bug } from "lucide-react";
import { changelogService, Changelog } from "@/services/changelogService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

// Type icons mapping
const getTypeIcon = (type: string) => {
  switch (type) {
    case "new":
      return <Sparkles className="h-5 w-5 text-blue-500" />;
    case "improved":
      return <Wrench className="h-5 w-5 text-orange-500" />;
    case "fixed":
      return <Bug className="h-5 w-5 text-green-500" />;
    default:
      return <Sparkles className="h-5 w-5" />;
  }
};

// Type badge variant
const getTypeBadge = (type: string) => {
  switch (type) {
    case "new":
      return { label: "New Feature", variant: "default" as const };
    case "improved":
      return { label: "Improvement", variant: "secondary" as const };
    case "fixed":
      return { label: "Bug Fix", variant: "outline" as const };
    default:
      return { label: type, variant: "default" as const };
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
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-switzer font-medium tracking-tight">Changelog</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Discover the latest features, improvements, and bug fixes.
        </p>
      </div>

      {changelogs.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No changelogs published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {changelogs.map((changelog) => {
            const typeBadge = getTypeBadge(changelog.type);
            
            return (
              <article key={changelog.id} className="space-y-4">
                {/* Type Icon & Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                    {getTypeIcon(changelog.type)}
                  </div>
                  <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                </div>

                {/* Title & Date */}
                <div>
                  <h2 className="text-xl font-switzer font-medium mb-2">{changelog.title}</h2>
                  <time className="text-sm text-muted-foreground">
                    {changelog.published_at
                      ? format(new Date(changelog.published_at), "MMMM d, yyyy")
                      : format(new Date(changelog.created_at), "MMMM d, yyyy")}
                  </time>
                </div>

                {/* Description */}
                {changelog.description && (
                  <p className="text-base text-muted-foreground">{changelog.description}</p>
                )}

                {/* Featured Image */}
                {changelog.featured_image && (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <img
                      src={changelog.featured_image}
                      alt={changelog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-slate dark:prose-invert max-w-none">
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
                      <Badge key={idx} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Author */}
                {changelog.author && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {changelog.author.avatar_url ? (
                        <img
                          src={changelog.author.avatar_url}
                          alt={changelog.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {changelog.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{changelog.author.name}</p>
                        <p className="text-xs text-muted-foreground">Author</p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator className="mt-8" />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
