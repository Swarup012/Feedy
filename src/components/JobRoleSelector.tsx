"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Briefcase,
  Palette,
  Code,
  TrendingUp,
  Headphones,
  DollarSign,
  User,
  HelpCircle,
} from "lucide-react";

export type JobRole =
  | "product-manager"
  | "designer"
  | "developer"
  | "marketing"
  | "customer-success"
  | "sales"
  | "customer"
  | "other";

interface JobRoleOption {
  value: JobRole;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const jobRoleOptions: JobRoleOption[] = [
  {
    value: "product-manager",
    label: "Product Manager",
    description: "I manage product strategy and roadmap",
    icon: Briefcase,
  },
  {
    value: "designer",
    label: "Designer",
    description: "I create user experiences and interfaces",
    icon: Palette,
  },
  {
    value: "developer",
    label: "Developer",
    description: "I build and maintain the product",
    icon: Code,
  },
  {
    value: "marketing",
    label: "Marketing",
    description: "I promote and market the product",
    icon: TrendingUp,
  },
  {
    value: "customer-success",
    label: "Customer Success",
    description: "I help customers achieve their goals",
    icon: Headphones,
  },
  {
    value: "sales",
    label: "Sales",
    description: "I sell and demonstrate the product",
    icon: DollarSign,
  },
  {
    value: "customer",
    label: "Customer",
    description: "I use the product and provide feedback",
    icon: User,
  },
  {
    value: "other",
    label: "Other",
    description: "My role doesn't fit the categories above",
    icon: HelpCircle,
  },
];

interface JobRoleSelectorProps {
  value?: JobRole;
  onChange: (role: JobRole) => void;
  label?: string;
  description?: string;
  required?: boolean;
}

export const JobRoleSelector: React.FC<JobRoleSelectorProps> = ({
  value,
  onChange,
  label = "What's your role?",
  description = "This helps us show you the most relevant content",
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
        onValueChange={(val) => onChange(val as JobRole)}
        className="grid gap-3"
      >
        {jobRoleOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Label
              key={option.value}
              htmlFor={option.value}
              className={`
                flex items-start gap-3 p-4 border rounded-lg cursor-pointer
                transition-all hover:bg-accent
                ${
                  value === option.value
                    ? "border-primary bg-accent ring-2 ring-primary ring-offset-2"
                    : "border-border"
                }
              `}
            >
              <RadioGroupItem
                id={option.value}
                value={option.value}
                className="mt-1"
              />
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
};

// Utility function to get job role label
export const getJobRoleLabel = (role: JobRole): string => {
  const option = jobRoleOptions.find((opt) => opt.value === role);
  return option?.label || role;
};

// Utility function to get all job roles
export const getAllJobRoles = (): JobRole[] => {
  return jobRoleOptions.map((opt) => opt.value);
};
