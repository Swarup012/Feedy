"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { boardService } from "@/services/boardService";
import { IconPicker, IconDisplay } from "@/components/ui/icon-picker";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useOrganization } from "@/context/OrganizationContext";
import { useJobRoles } from "@/hooks/useJobRoles";
import { 
  Sparkles, 
  MessageSquare, 
  Target, 
  Lightbulb,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Users,
  BarChart3,
  Rocket,
  ArrowRight,
  ChevronRight,
  Globe,
  Lock,
  Check,
} from "lucide-react";

// Predefined board colors
const BOARD_COLORS = [
  { name: "Blue", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Gray", value: "#6b7280" },
];


export default function FirstBoardWelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { organization } = useOrganization();
  const { roles: jobRoles, loading: rolesLoading } = useJobRoles(organization?.id);
  const [step, setStep] = useState<"welcome" | "create">("welcome");
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_private: false,
    color: "#6366f1",
    icon: "Lightbulb",
    visible_to_roles: [] as string[],
  });

  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);



  // Generate slug from name
  useEffect(() => {
    if (formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);

      setSlug(generatedSlug);

      const timer = setTimeout(() => {
        checkSlugAvailability(generatedSlug);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setSlug("");
      setSlugAvailable(null);
    }
  }, [formData.name]);

  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck) return;

    try {
      setCheckingSlug(true);
      const response = await boardService.checkSlug(slugToCheck);
      setSlugAvailable(response.data.available);
    } catch (error) {
      console.error("Error checking slug:", error);
    } finally {
      setCheckingSlug(false);
    }
  };



  // Handle role toggle
  const handleRoleToggle = (roleValue: string) => {
    setFormData((prev) => {
      const currentRoles = prev.visible_to_roles;
      if (currentRoles.includes(roleValue)) {
        return {
          ...prev,
          visible_to_roles: currentRoles.filter((r) => r !== roleValue),
        };
      } else {
        return {
          ...prev,
          visible_to_roles: [...currentRoles, roleValue],
        };
      }
    });
  };

  const handleCreateBoard = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Board name required",
        description: "Please enter a name for your board",
        variant: "destructive",
      });
      return;
    }

    if (slugAvailable === false) {
      toast({
        title: "Error",
        description: "This URL is already taken. Please choose a different name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await boardService.createBoard(formData);

      const newBoard = response.data.board;

      toast({
        title: "Success!",
        description: `Board "${newBoard.name}" created successfully`,
      });

      // Save to localStorage and redirect
      localStorage.setItem("lastVisitedBoard", newBoard.slug);
      router.push(`/admin/feedback/boards/${newBoard.slug}`);
    } catch (error: any) {
      console.error('Board creation error:', error);
      
      // Check if it's a board limit error
      const errorData = error.response?.data;
      if (errorData?.error === 'BOARD_LIMIT_REACHED' || errorData?.upgrade_required) {
        // Show upgrade dialog
        setShowUpgradeDialog(true);
        return;
      }
      
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create board",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setStep("create");
  };

  const handleBack = () => {
    setStep("welcome");
  };

  if (step === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-background dark:to-background">
        <div className="container mx-auto px-4 py-10">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-5 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back
          </button>

          {/* Create Form */}
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Rocket className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">
                Create Your First Board
              </h1>
              <p className="text-lg text-muted-foreground">
                Give your board a name and description. You can always change these later.
              </p>
            </div>

            <Card className="shadow-xl border border-border rounded-2xl">
              <CardContent className="p-6 space-y-5">

                {/* Board Name */}
                <Input
                  id="board-name-create"
                  placeholder="Board name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                  autoFocus
                  className="h-11 text-base rounded-xl bg-muted border-border focus:ring-2 focus:ring-ring"
                  maxLength={100}
                />

                {/* URL slug feedback */}
                {slug && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70 -mt-2 px-1">
                    <span>/board/{slug}</span>
                    {checkingSlug && <Loader2 className="h-3 w-3 animate-spin" />}
                    {!checkingSlug && slugAvailable === true && <Check className="h-3 w-3 text-green-500" />}
                    {!checkingSlug && slugAvailable === false && <span className="text-destructive">Already taken</span>}
                  </div>
                )}

                {/* Privacy */}
                <RadioGroup
                  value={formData.is_private ? "private" : "public"}
                  onValueChange={(value) => setFormData({ ...formData, is_private: value === "private" })}
                  disabled={loading}
                  className="flex gap-5"
                >
                  <label htmlFor="c-public" className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <RadioGroupItem value="public" id="c-public" />
                    public
                  </label>
                  <label htmlFor="c-private" className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <RadioGroupItem value="private" id="c-private" />
                    private
                  </label>
                </RadioGroup>

                {/* Job Role Chips */}
                <div className="flex flex-wrap gap-2">
                  {rolesLoading ? (
                    <span className="text-xs text-muted-foreground/70">Loading roles...</span>
                  ) : (
                    jobRoles.map((role) => {
                      const selected = formData.visible_to_roles.includes(role.key);
                      return (
                        <button
                          key={role.key}
                          type="button"
                          disabled={loading}
                          onClick={() => handleRoleToggle(role.key)}
                          className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:border-primary"
                          }`}
                        >
                          {role.name}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Icon + Preview side by side */}
                <div className="flex gap-3 items-stretch">
                  {/* Icon picker button */}
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    disabled={loading}
                    className="flex-shrink-0 w-16 h-16 rounded-xl border border-border bg-muted flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: formData.color + "20" }}
                    >
                      <IconDisplay iconName={formData.icon} className="h-5 w-5" style={{ color: formData.color }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground/70">icon</span>
                  </button>

                  {/* Board preview */}
                  <div
                    className="flex-1 rounded-xl border bg-muted p-3 flex items-center justify-center min-h-[64px]"
                    style={{ borderColor: formData.name ? formData.color : undefined }}
                  >
                    {formData.name ? (
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: formData.color + "20" }}
                        >
                          <IconDisplay iconName={formData.icon} className="h-4 w-4" style={{ color: formData.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight flex items-center gap-1">
                            {formData.name}
                            {formData.is_private && <Lock className="h-3 w-3 text-muted-foreground/70" />}
                          </p>
                          {formData.description && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-1">{formData.description}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/70 text-center">how the board look like<br />with icon should be here</p>
                    )}
                  </div>
                </div>

                {/* Create Board button — right-aligned */}
                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleCreateBoard}
                    disabled={loading || !formData.name.trim() || slugAvailable === false}
                    className="rounded-full px-6 h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-md"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                    ) : (
                      "Create Board"
                    )}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Icon Picker Dialog */}
        <IconPicker
          open={showIconPicker}
          onOpenChange={setShowIconPicker}
          onSelectIcon={(iconName) => setFormData({ ...formData, icon: iconName })}
          currentIcon={formData.icon}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-background dark:to-background">
      <div className="container mx-auto px-4 py-10 flex justify-center">
        
        <div className="w-full max-w-md">
          <div className="mb-5 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Create Your First Board
            </h1>
            <p className="text-muted-foreground">
              Set up your first board to start collecting feedback.
            </p>
          </div>
          
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
            <Card className="shadow-xl border border-border rounded-2xl">
              <CardContent className="p-6 space-y-5">

                {/* Board Name */}
                <Input
                  id="board-name"
                  placeholder="Board name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                  autoFocus
                  className="h-11 text-base rounded-xl bg-muted border-border focus:ring-2 focus:ring-ring"
                  maxLength={100}
                />

                {/* URL slug feedback */}
                {slug && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70 -mt-2 px-1">
                    <span>/board/{slug}</span>
                    {checkingSlug && <Loader2 className="h-3 w-3 animate-spin" />}
                    {!checkingSlug && slugAvailable === true && <Check className="h-3 w-3 text-green-500" />}
                    {!checkingSlug && slugAvailable === false && <span className="text-destructive">Already taken</span>}
                  </div>
                )}

                {/* Privacy */}
                <RadioGroup
                  value={formData.is_private ? "private" : "public"}
                  onValueChange={(value) => setFormData({ ...formData, is_private: value === "private" })}
                  disabled={loading}
                  className="flex gap-5"
                >
                  <label htmlFor="w-public" className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <RadioGroupItem value="public" id="w-public" />
                    public
                  </label>
                  <label htmlFor="w-private" className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <RadioGroupItem value="private" id="w-private" />
                    private
                  </label>
                </RadioGroup>

                {/* Job Role Chips */}
                <div className="flex flex-wrap gap-2">
                  {rolesLoading ? (
                    <span className="text-xs text-muted-foreground/70">Loading roles...</span>
                  ) : (
                    jobRoles.map((role) => {
                      const selected = formData.visible_to_roles.includes(role.key);
                      return (
                        <button
                          key={role.key}
                          type="button"
                          disabled={loading}
                          onClick={() => handleRoleToggle(role.key)}
                          className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:border-primary"
                          }`}
                        >
                          {role.name}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Icon + Preview side by side */}
                <div className="flex gap-3 items-stretch">
                  {/* Icon picker button */}
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    disabled={loading}
                    className="flex-shrink-0 w-16 h-16 rounded-xl border border-border bg-muted flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: formData.color + "20" }}
                    >
                      <IconDisplay iconName={formData.icon} className="h-5 w-5" style={{ color: formData.color }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground/70">icon</span>
                  </button>

                  {/* Board preview */}
                  <div
                    className="flex-1 rounded-xl border bg-muted p-3 flex items-center justify-center min-h-[64px]"
                    style={{ borderColor: formData.name ? formData.color : undefined }}
                  >
                    {formData.name ? (
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: formData.color + "20" }}
                        >
                          <IconDisplay iconName={formData.icon} className="h-4 w-4" style={{ color: formData.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight flex items-center gap-1">
                            {formData.name}
                            {formData.is_private && <Lock className="h-3 w-3 text-muted-foreground/70" />}
                          </p>
                          {formData.description && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-1">{formData.description}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/70 text-center">how the board look like<br />with icon should be here</p>
                    )}
                  </div>
                </div>

                {/* Create Board button — right-aligned */}
                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleCreateBoard}
                    disabled={loading || !formData.name.trim() || slugAvailable === false}
                    className="rounded-full px-6 h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-md"
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                    ) : (
                      "Create Board"
                    )}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Icon Picker Dialog */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        onSelectIcon={(iconName) => setFormData({ ...formData, icon: iconName })}
        currentIcon={formData.icon}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature="boards"
        title="Upgrade to Starter for Unlimited Boards"
        description="You've reached the 3 board limit on the Free plan. Upgrade to Starter for unlimited boards and more features."
      />
    </div>
  );
}
