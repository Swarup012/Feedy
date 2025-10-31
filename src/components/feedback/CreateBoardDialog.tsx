"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, Lock, Globe, Sparkles } from "lucide-react";
import { boardService, Board, BoardCategory } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoardCreated: (board: Board) => void;
}

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

// Predefined emojis
const BOARD_ICONS = [
  "💡",
  "🚀",
  "🐛",
  "💬",
  "📝",
  "🎯",
  "⭐",
  "🔥",
  "💼",
  "🎨",
  "🔔",
  "📊",
  "🏆",
  "💰",
  "🎁",
  "🔧",
  "📱",
  "💻",
];

export function CreateBoardDialog({
  open,
  onOpenChange,
  onBoardCreated,
}: CreateBoardDialogProps) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<BoardCategory[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_private: false,
    category: "", // ✅ ADD CATEGORY
    color: "#6366f1",
    icon: "💡",
  });

  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // ✅ Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await boardService.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Use default categories if API fails
      setCategories([
        {
          id: "1",
          name: "Feature Requests",
          slug: "feature-requests",
          icon: "💡",
          color: "#6366f1",
          description: "",
        },
        {
          id: "2",
          name: "Bug Reports",
          slug: "bug-reports",
          icon: "🐛",
          color: "#ef4444",
          description: "",
        },
        {
          id: "3",
          name: "General Feedback",
          slug: "general-feedback",
          icon: "💬",
          color: "#10b981",
          description: "",
        },
        {
          id: "4",
          name: "Questions",
          slug: "questions",
          icon: "❓",
          color: "#f59e0b",
          description: "",
        },
        {
          id: "5",
          name: "Ideas",
          slug: "ideas",
          icon: "💭",
          color: "#ec4899",
          description: "",
        },
        {
          id: "6",
          name: "Support",
          slug: "support",
          icon: "🆘",
          color: "#14b8a6",
          description: "",
        },
      ]);
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
      setFormData({ ...formData, category: value });

      // Auto-set icon and color based on category
      const selectedCategory = categories.find((c) => c.name === value);
      if (selectedCategory) {
        setFormData((prev) => ({
          ...prev,
          category: value,
          icon: selectedCategory.icon,
          color: selectedCategory.color,
        }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Board name is required",
        variant: "destructive",
      });
      return;
    }

    if (slugAvailable === false) {
      toast({
        title: "Error",
        description:
          "This URL is already taken. Please choose a different name.",
        variant: "destructive",
      });
      return;
    }

    // Use custom category if provided
    const finalCategory =
      showCustomCategory && customCategory.trim()
        ? customCategory.trim()
        : formData.category || "General";

    try {
      setCreating(true);
      const response = await boardService.createBoard({
        ...formData,
        category: finalCategory, // ✅ SEND CATEGORY
      });

      toast({
        title: "Success!",
        description: `Board "${formData.name}" created successfully`,
      });

      onBoardCreated(response.data.board);

      // Reset form
      setFormData({
        name: "",
        description: "",
        is_private: false,
        category: "",
        color: "#6366f1",
        icon: "💡",
      });
      setCustomCategory("");
      setShowCustomCategory(false);

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create board",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Create a feedback board to organize posts by category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Board Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Board Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Feature Requests"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                maxLength={100}
                required
              />

              {/* URL Preview */}
              {slug && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">URL:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">
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
            </div>

            {/* ✅ CATEGORY SELECTION */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category{" "}
                <span className="text-gray-500 text-sm font-normal">
                  (optional)
                </span>
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
                  >
                    <SelectTrigger>
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

                  {/* Custom Category Input */}
                  {showCustomCategory && (
                    <Input
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      maxLength={100}
                    />
                  )}
                </>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this board for?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Privacy Setting */}
            <div className="space-y-3">
              <Label>Privacy</Label>
              <RadioGroup
                value={formData.is_private ? "private" : "public"}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_private: value === "private" })
                }
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="public" id="public" />
                  <div className="flex-1">
                    <label
                      htmlFor="public"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Globe className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">Public</p>
                        <p className="text-sm text-gray-500">
                          Anyone can view and post feedback
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="private" id="private" />
                  <div className="flex-1">
                    <label
                      htmlFor="private"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium">Private</p>
                        <p className="text-sm text-gray-500">
                          Only invited members can access
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Board Color */}
            <div className="space-y-2">
              <Label>Board Color</Label>
              <div className="grid grid-cols-5 gap-2">
                {BOARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, color: color.value })
                    }
                    className={`h-10 rounded-lg border-2 transition-all ${
                      formData.color === color.value
                        ? "border-gray-900 scale-110"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Board Icon */}
            <div className="space-y-2">
              <Label>Board Icon</Label>
              <div className="grid grid-cols-9 gap-2">
                {BOARD_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`h-10 w-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                      formData.icon === icon
                        ? "border-gray-900 bg-gray-100 scale-110"
                        : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="border rounded-lg p-4 flex items-center gap-3"
                style={{ borderColor: formData.color }}
              >
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: formData.color + "20" }}
                >
                  {formData.icon}
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
                      Category:{" "}
                      {showCustomCategory ? customCategory : formData.category}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    {formData.description || "Board description"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || slugAvailable === false}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Board"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
