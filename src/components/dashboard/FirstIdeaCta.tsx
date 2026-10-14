import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Plus } from "lucide-react";

/**
 * Empty state for brand-new members: replaces the stat zeros with a
 * single clear CTA.
 */
export function FirstIdeaCta({ onPostIdea }: { onPostIdea: () => void }) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="py-12 flex flex-col items-center text-center gap-3">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Lightbulb className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Post your first idea</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Share feedback with the team — your suggestions, their status, and every update will show up here.
        </p>
        <Button onClick={onPostIdea} className="mt-2 gap-2">
          <Plus className="h-4 w-4" /> New feedback
        </Button>
      </CardContent>
    </Card>
  );
}
