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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2 transition-colors"
            disabled={loading}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back
          </button>

          {/* Create Form */}
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Create Your First Board
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Give your board a name and description. You can always change these later.
              </p>
            </div>

            <Card className="shadow-2xl border-0">
              <CardContent className="p-8 space-y-6">
                {/* Board Name */}
                <div className="space-y-3">
                  <Label htmlFor="board-name" className="text-base font-semibold">
                    Board Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="board-name"
                    placeholder="e.g., Feature Requests, Bug Reports, Product Ideas"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={loading}
                    autoFocus
                    className="h-12 text-base"
                    maxLength={100}
                  />
                  
                  {/* URL Preview */}
                  {slug && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">URL:</span>
                      <code className="bg-gray-100 dark:bg-card px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                        /board/{slug}
                      </code>
                      {checkingSlug && (
                        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                      )}
                      {!checkingSlug && slugAvailable === true && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {!checkingSlug && slugAvailable === false && (
                        <span className="text-red-500 text-xs">Already taken</span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a clear name that describes what feedback you'll collect
                  </p>
                </div>



                {/* Description */}
                <div className="space-y-3">
                  <Label htmlFor="board-description" className="text-base font-semibold">
                    Description <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Textarea
                    id="board-description"
                    placeholder="Help users understand what kind of feedback to submit..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={loading}
                    rows={4}
                    className="text-base"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Privacy */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Privacy</Label>
                  <RadioGroup
                    value={formData.is_private ? "private" : "public"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, is_private: value === "private" })
                    }
                    disabled={loading}
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <RadioGroupItem value="public" id="public" />
                      <div className="flex-1">
                        <label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                          <Globe className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">Public</p>
                            <p className="text-sm text-gray-500">Anyone can view and post feedback</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <RadioGroupItem value="private" id="private" />
                      <div className="flex-1">
                        <label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                          <Lock className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="font-medium">Private</p>
                            <p className="text-sm text-gray-500">Only invited members can access</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Target Team */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <Label className="text-base font-semibold">Target Team (Optional)</Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Select which job roles can see this board. Leave empty for all team members.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {rolesLoading ? (
                      <p className="text-sm text-gray-500 col-span-2">Loading roles...</p>
                    ) : (
                      jobRoles.map((role) => (
                        <div
                          key={role.key}
                          className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Checkbox
                            id={`step1-${role.key}`}
                            checked={formData.visible_to_roles.includes(role.key)}
                            onCheckedChange={() => handleRoleToggle(role.key)}
                            disabled={loading}
                          />
                          <label
                            htmlFor={`step1-${role.key}`}
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <IconDisplay iconName={role.icon} className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">{role.name}</span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.visible_to_roles.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        Visible to {formData.visible_to_roles.length} role{formData.visible_to_roles.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Board Icon */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Board Icon</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowIconPicker(true)}
                    className="w-full justify-start h-12"
                    disabled={loading}
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center mr-3"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      <IconDisplay iconName={formData.icon} className="h-5 w-5" style={{ color: formData.color }} />
                    </div>
                    <span>{formData.icon || "Choose Icon"}</span>
                  </Button>
                </div>

                {/* Preview */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Preview</Label>
                  <div
                    className="border rounded-lg p-4 flex items-center gap-3"
                    style={{ borderColor: formData.color }}
                  >
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: formData.color + "20" }}
                    >
                      <IconDisplay iconName={formData.icon} className="h-6 w-6" style={{ color: formData.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        {formData.name || "Board Name"}
                        {formData.is_private && (
                          <Lock className="h-3 w-3 text-gray-400" />
                        )}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {formData.description || "Board description"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateBoard}
                  disabled={loading || !formData.name.trim() || slugAvailable === false}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Your Board...
                    </>
                  ) : (
                    <>
                      Create Board & Get Started
                      <CheckCircle2 className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Image (Sticky) */}
          <div className="flex justify-center lg:sticky lg:top-24">
            <img
              src="/images/boards.png"
              alt="Boards"
              className="w-full max-w-lg h-auto rounded-2xl"
            />
          </div>

          {/* Right Side - Board Creation Form (Scrollable) */}
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <Card className="shadow-2xl border-0">
              <CardContent className="p-8 space-y-6">
                {/* Board Name */}
                <div className="space-y-3">
                  <Label htmlFor="board-name" className="text-base font-semibold">
                    Board Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="board-name"
                    placeholder="e.g., Feature Requests, Bug Reports, Product Ideas"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={loading}
                    autoFocus
                    className="h-12 text-base"
                    maxLength={100}
                  />

                  {/* URL Preview */}
                  {slug && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">URL:</span>
                      <code className="bg-gray-100 dark:bg-card px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                        /board/{slug}
                      </code>
                      {checkingSlug && (
                        <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                      )}
                      {!checkingSlug && slugAvailable === true && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {!checkingSlug && slugAvailable === false && (
                        <span className="text-red-500 text-xs">Already taken</span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a clear name that describes what feedback you'll collect
                  </p>
                </div>



                {/* Description */}
                <div className="space-y-3">
                  <Label htmlFor="board-description" className="text-base font-semibold">
                    Description <span className="text-gray-400">(optional)</span>
                  </Label>
                  <Textarea
                    id="board-description"
                    placeholder="Help users understand what kind of feedback to submit..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    disabled={loading}
                    rows={4}
                    className="text-base"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Privacy */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Privacy</Label>
                  <RadioGroup
                    value={formData.is_private ? "private" : "public"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, is_private: value === "private" })
                    }
                    disabled={loading}
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <RadioGroupItem value="public" id="public" />
                      <div className="flex-1">
                        <label htmlFor="public" className="flex items-center gap-2 cursor-pointer">
                          <Globe className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">Public</p>
                            <p className="text-sm text-gray-500">Anyone can view and post feedback</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <RadioGroupItem value="private" id="private" />
                      <div className="flex-1">
                        <label htmlFor="private" className="flex items-center gap-2 cursor-pointer">
                          <Lock className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="font-medium">Private</p>
                            <p className="text-sm text-gray-500">Only invited members can access</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Target Team */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <Label className="text-base font-semibold">Target Team (Optional)</Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Select which job roles can see this board. Leave empty for all team members.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {rolesLoading ? (
                      <p className="text-sm text-gray-500 col-span-2">Loading roles...</p>
                    ) : (
                      jobRoles.map((role) => (
                        <div
                          key={role.key}
                          className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Checkbox
                            id={`step2-${role.key}`}
                            checked={formData.visible_to_roles.includes(role.key)}
                            onCheckedChange={() => handleRoleToggle(role.key)}
                            disabled={loading}
                          />
                          <label
                            htmlFor={`step2-${role.key}`}
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            <IconDisplay iconName={role.icon} className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">{role.name}</span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.visible_to_roles.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Users className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        Visible to {formData.visible_to_roles.length} role{formData.visible_to_roles.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Board Icon */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Board Icon</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowIconPicker(true)}
                    className="w-full justify-start h-12"
                    disabled={loading}
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center mr-3"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      <IconDisplay iconName={formData.icon} className="h-5 w-5" style={{ color: formData.color }} />
                    </div>
                    <span>{formData.icon || "Choose Icon"}</span>
                  </Button>
                </div>

                {/* Preview */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Preview</Label>
                  <div
                    className="border rounded-lg p-4 flex items-center gap-3"
                    style={{ borderColor: formData.color }}
                  >
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: formData.color + "20" }}
                    >
                      <IconDisplay iconName={formData.icon} className="h-6 w-6" style={{ color: formData.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold flex items-center gap-2">
                        {formData.name || "Board Name"}
                        {formData.is_private && (
                          <Lock className="h-3 w-3 text-gray-400" />
                        )}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {formData.description || "Board description"}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateBoard}
                  disabled={loading || !formData.name.trim() || slugAvailable === false}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Your Board...
                    </>
                  ) : (
                    <>
                      Create Board & Get Started
                      <CheckCircle2 className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
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
