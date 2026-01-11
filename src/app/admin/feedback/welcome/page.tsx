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
import { boardService, BoardCategory } from "@/services/boardService";
import { IconPicker, IconDisplay } from "@/components/ui/icon-picker";
import { UpgradeDialog } from "@/components/UpgradeDialog";
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
  Briefcase,
  Palette,
  Code,
  User
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

// Job roles for targeting
const JOB_ROLES = [
  { value: "product_manager", label: "Product Manager", icon: "Briefcase" },
  { value: "founder", label: "Founder / CEO", icon: "Rocket" },
  { value: "designer", label: "Designer", icon: "Palette" },
  { value: "developer", label: "Developer", icon: "Code" },
  { value: "marketer", label: "Marketer", icon: "TrendingUp" },
  { value: "other", label: "Other", icon: "User" },
];

export default function FirstBoardWelcomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"welcome" | "create">("welcome");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_private: false,
    category: "",
    color: "#6366f1",
    icon: "Lightbulb",
    visible_to_roles: [] as string[],
  });

  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Fetch categories when moving to create step
  useEffect(() => {
    if (step === "create") {
      fetchCategories();
    }
  }, [step]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await boardService.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

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

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      setShowCustomCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setShowCustomCategory(false);
      const selectedCategory = categories.find((c) => c.name === value);
      if (selectedCategory) {
        setFormData({
          ...formData,
          category: value,
          icon: selectedCategory.icon,
          color: selectedCategory.color,
        });
      } else {
        setFormData({ ...formData, category: value });
      }
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

    // Use custom category if provided
    const finalCategory =
      showCustomCategory && customCategory.trim()
        ? customCategory.trim()
        : formData.category || "General";

    setLoading(true);
    try {
      const response = await boardService.createBoard({
        ...formData,
        category: finalCategory,
      });

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
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
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

                {/* Category */}
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-base font-semibold">
                    Category <span className="text-gray-400">(optional)</span>
                  </Label>
                  {loadingCategories ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <>
                      <Select
                        value={showCustomCategory ? "custom" : formData.category}
                        onValueChange={handleCategoryChange}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">No Category</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              <div className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              <span>Custom Category</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {showCustomCategory && (
                        <Input
                          placeholder="Enter custom category"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          maxLength={100}
                          className="h-12"
                          disabled={loading}
                        />
                      )}
                    </>
                  )}
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
                    {JOB_ROLES.map((role) => (
                      <div
                        key={role.value}
                        className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Checkbox
                          id={role.value}
                          checked={formData.visible_to_roles.includes(role.value)}
                          onCheckedChange={() => handleRoleToggle(role.value)}
                          disabled={loading}
                        />
                        <label
                          htmlFor={role.value}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <IconDisplay iconName={role.icon} className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium">{role.label}</span>
                        </label>
                      </div>
                    ))}
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

                {/* Board Color */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Board Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {BOARD_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`h-12 rounded-lg border-2 transition-all ${
                          formData.color === color.value
                            ? "border-gray-900 scale-110"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        disabled={loading}
                      />
                    ))}
                  </div>
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
                      {(formData.category || customCategory) && (
                        <p className="text-xs text-gray-500">
                          Category: {showCustomCategory ? customCategory : formData.category}
                        </p>
                      )}
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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl animate-pulse">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to Your Feedback Hub! 🎉
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Let's create your first feedback board to start collecting valuable insights from your users.
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Collect Feedback
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Let users submit ideas, bugs, and feature requests easily
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Track Progress
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage status from planned to completed with ease
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Prioritize Ideas
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    See what your users want most with voting system
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Engage Users
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep your community updated and involved always
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <Lightbulb className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">
                    Why Use Feedback Boards?
                  </h3>
                  <ul className="space-y-3 text-blue-50">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span>Understand what your customers really want</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span>Build features that matter most to your users</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span>Create a transparent product roadmap</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      <span>Reduce support tickets with better communication</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pro Tip */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-3 text-gray-600 dark:text-gray-400" />
              <p className="text-gray-700 dark:text-gray-300">
                <strong>💡 Pro tip:</strong> You can create multiple boards for different products, features, or teams! Start with one and add more as you grow.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            onClick={handleNext}
            size="lg"
            className="h-16 px-12 text-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all duration-300"
          >
            Create Your First Board
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Takes less than 30 seconds to set up
          </p>
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
