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
import { Loader2, Check, Lock, Globe, Sparkles, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { boardService, Board, BoardCategory } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";
import { IconPicker, IconDisplay } from "@/components/ui/icon-picker";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useOrganization } from "@/context/OrganizationContext";
import { useJobRoles } from "@/hooks/useJobRoles";

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


export function CreateBoardDialog({
  open,
  onOpenChange,
  onBoardCreated,
}: CreateBoardDialogProps) {
  const { toast } = useToast();
  const { organization } = useOrganization();
  const { roles: jobRoles, loading: rolesLoading } = useJobRoles(organization?.id);
  const [creating, setCreating] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false); // Icon picker state
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false); // Upgrade dialog state

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_private: false,
    color: "#6366f1",
    icon: "Lightbulb", // Default to Lucide icon name
    visible_to_roles: [] as string[], // ✅ ADD JOB ROLES FILTER
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



  // Handle role selection
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

    try {
      setCreating(true);
      const response = await boardService.createBoard(formData);

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
        color: "#6366f1",
        icon: "💡",
        visible_to_roles: [],
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Board creation error:', error);
      
      // Check if it's a board limit error
      const errorData = error.response?.data;
      if (errorData?.error === 'BOARD_LIMIT_REACHED' || errorData?.upgrade_required) {
        // Close the create dialog and show upgrade dialog
        onOpenChange(false);
        setShowUpgradeDialog(true);
        return;
      }
      
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create board",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-background dark:border-border">
        <form onSubmit={handleSubmit} className="p-2 space-y-5">
          <DialogHeader className="sr-only">
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>Create a feedback board</DialogDescription>
          </DialogHeader>

          {/* Board Name */}
          <Input
            id="name"
            placeholder="Board name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={creating}
            autoFocus
            className="h-11 text-base rounded-xl bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-400"
            maxLength={100}
            required
          />

          {/* URL slug feedback */}
          {slug && (
            <div className="flex items-center gap-2 text-xs text-gray-400 -mt-2 px-1">
              <span>/board/{slug}</span>
              {checkingSlug && <Loader2 className="h-3 w-3 animate-spin" />}
              {!checkingSlug && slugAvailable === true && <Check className="h-3 w-3 text-green-500" />}
              {!checkingSlug && slugAvailable === false && <span className="text-red-400">Already taken</span>}
            </div>
          )}

          {/* Privacy */}
          <RadioGroup
            value={formData.is_private ? "private" : "public"}
            onValueChange={(value) => setFormData({ ...formData, is_private: value === "private" })}
            disabled={creating}
            className="flex gap-5"
          >
            <label htmlFor="d-public" className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              <RadioGroupItem value="public" id="d-public" />
              public
            </label>
            <label htmlFor="d-private" className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
              <RadioGroupItem value="private" id="d-private" />
              private
            </label>
          </RadioGroup>

          {/* Job Role Chips */}
          <div className="flex flex-wrap gap-2">
            {rolesLoading ? (
              <span className="text-xs text-gray-400">Loading roles...</span>
            ) : (
              jobRoles.map((role) => {
                const selected = formData.visible_to_roles.includes(role.key);
                return (
                  <button
                    key={role.key}
                    type="button"
                    disabled={creating}
                    onClick={() => handleRoleToggle(role.key)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                      selected
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
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
              disabled={creating}
              className="flex-shrink-0 w-16 h-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-1 hover:border-blue-400 transition-colors"
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: formData.color + "20" }}
              >
                <IconDisplay iconName={formData.icon} className="h-5 w-5" style={{ color: formData.color }} />
              </div>
              <span className="text-[10px] text-gray-400">icon</span>
            </button>

            {/* Board preview */}
            <div
              className="flex-1 rounded-xl border bg-gray-50 dark:bg-gray-800/60 p-3 flex items-center justify-center min-h-[64px]"
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
                    <p className="text-sm font-semibold leading-tight flex items-center gap-1 text-gray-900 dark:text-white">
                      {formData.name}
                      {formData.is_private && <Lock className="h-3 w-3 text-gray-400" />}
                    </p>
                    {formData.description && (
                      <p className="text-xs text-gray-400 line-clamp-1">{formData.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center">how the board look like<br />with icon should be here</p>
              )}
            </div>
          </div>

          {/* Create Board button — right-aligned */}
          <div className="flex justify-end pt-1 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
              className="rounded-full px-6 h-10 text-sm font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.name.trim() || slugAvailable === false}
              className="rounded-full px-6 h-10 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium shadow-md"
            >
              {creating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
              ) : (
                "Create Board"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

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
    </Dialog>
  );
}
