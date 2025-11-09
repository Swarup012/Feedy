"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Briefcase,
  Users,
  Code,
  Palette,
  Headphones,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";

export type Role =
  | "product_manager"
  | "founder"
  | "engineering"
  | "designer"
  | "support"
  | "marketing"
  | "other";

interface RoleOption {
  value: Role;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const roleOptions: RoleOption[] = [
  {
    value: "product_manager",
    label: "Product Manager",
    icon: Briefcase,
  },
  {
    value: "founder",
    label: "Founder/CEO",
    icon: TrendingUp,
  },
  {
    value: "engineering",
    label: "Engineering Lead",
    icon: Code,
  },
  {
    value: "designer",
    label: "Designer",
    icon: Palette,
  },
  {
    value: "support",
    label: "Customer Success/Support",
    icon: Headphones,
  },
  {
    value: "marketing",
    label: "Marketing",
    icon: TrendingUp,
  },
  {
    value: "other",
    label: "Other",
    icon: MoreHorizontal,
  },
];

interface RoleSelectorProps {
  value?: Role;
  onChange: (role: Role) => void;
  label?: string;
  description?: string;
  required?: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  label = "What's your role?",
  description,
  required = false,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as Role)}
        className="space-y-3"
      >
        {roleOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.value}
              className={`
                flex items-center space-x-3 border rounded-lg p-4 
                hover:bg-accent cursor-pointer transition-colors
                ${
                  value === option.value
                    ? "border-primary bg-accent ring-2 ring-primary ring-offset-1"
                    : "border-border"
                }
              `}
            >
              <RadioGroupItem value={option.value} id={option.value} />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <Label
                  htmlFor={option.value}
                  className="text-base font-medium cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

// Utility function to get role label
export const getRoleLabel = (role: Role): string => {
  const option = roleOptions.find((opt) => opt.value === role);
  return option?.label || role;
};

// Utility function to get all roles
export const getAllRoles = (): Role[] => {
  return roleOptions.map((opt) => opt.value);
};
