"use client";

import { useState } from "react";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  // General & Common
  Lightbulb,
  Target,
  Rocket,
  Zap,
  Star,
  Heart,
  Flag,
  Award,
  TrendingUp,
  Activity,
  MessageSquare,
  // Features & Product
  Box,
  Layers,
  Grid,
  Settings,
  Smartphone,
  Monitor,
  Code,
  Layout,
  Tablet,
  // Issues & Bugs
  Bug,
  AlertCircle,
  XCircle,
  Shield,
  Lock,
  Eye,
  EyeOff,
  // Announcements
  Bell,
  Megaphone,
  Newspaper,
  BookOpen,
  FileText,
  Mail,
  MessageCircle,
  CheckCircle,
  // Support & Help
  HelpCircle,
  Phone,
  Headphones,
  LifeBuoy,
  Users,
  User,
  // Development
  GitBranch,
  Terminal,
  Database,
  Cloud,
  Server,
  Cpu,
  Wifi,
  // Business
  Briefcase,
  Building,
  BarChart,
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  TrendingDown,
  // Content
  Image,
  Video,
  Music,
  File,
  Folder,
  // Actions
  Plus,
  Minus,
  Edit,
  Trash,
  Download,
  Upload,
  Share,
  Copy,
  Search,
  Filter,
  // Navigation
  Home,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Menu,
  X,
  Maximize,
  Minimize,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IconOption {
  name: string;
  icon: LucideIcon;
  category: string;
}

const iconOptions: IconOption[] = [
  // General - Common Board Types
  { name: "Lightbulb", icon: Lightbulb, category: "general" },
  { name: "MessageSquare", icon: MessageSquare, category: "general" },
  { name: "Target", icon: Target, category: "general" },
  { name: "Rocket", icon: Rocket, category: "general" },
  { name: "Star", icon: Star, category: "general" },
  { name: "TrendingUp", icon: TrendingUp, category: "general" },
  { name: "Zap", icon: Zap, category: "general" },
  { name: "Award", icon: Award, category: "general" },
  { name: "Heart", icon: Heart, category: "general" },
  { name: "Flag", icon: Flag, category: "general" },
  
  // Features & Requests
  { name: "Box", icon: Box, category: "features" },
  { name: "Layers", icon: Layers, category: "features" },
  { name: "Grid", icon: Grid, category: "features" },
  { name: "Settings", icon: Settings, category: "features" },
  { name: "Smartphone", icon: Smartphone, category: "features" },
  { name: "Monitor", icon: Monitor, category: "features" },
  { name: "Code", icon: Code, category: "features" },
  { name: "Layout", icon: Layout, category: "features" },
  
  // Issues & Bugs
  { name: "Bug", icon: Bug, category: "issues" },
  { name: "AlertCircle", icon: AlertCircle, category: "issues" },
  { name: "XCircle", icon: XCircle, category: "issues" },
  { name: "Shield", icon: Shield, category: "issues" },
  { name: "Lock", icon: Lock, category: "issues" },
  { name: "Eye", icon: Eye, category: "issues" },
  { name: "EyeOff", icon: EyeOff, category: "issues" },
  { name: "Activity", icon: Activity, category: "issues" },
  
  // Announcements & Updates
  { name: "Bell", icon: Bell, category: "announcements" },
  { name: "Megaphone", icon: Megaphone, category: "announcements" },
  { name: "Newspaper", icon: Newspaper, category: "announcements" },
  { name: "BookOpen", icon: BookOpen, category: "announcements" },
  { name: "FileText", icon: FileText, category: "announcements" },
  { name: "Mail", icon: Mail, category: "announcements" },
  { name: "MessageCircle", icon: MessageCircle, category: "announcements" },
  { name: "CheckCircle", icon: CheckCircle, category: "announcements" },
  
  // Support & Help
  { name: "HelpCircle", icon: HelpCircle, category: "support" },
  { name: "LifeBuoy", icon: LifeBuoy, category: "support" },
  { name: "Headphones", icon: Headphones, category: "support" },
  { name: "Phone", icon: Phone, category: "support" },
  { name: "Users", icon: Users, category: "support" },
  { name: "User", icon: User, category: "support" },
  { name: "MessageSquare", icon: MessageSquare, category: "support" },
  { name: "Heart", icon: Heart, category: "support" },
  
  // Development & Tech
  { name: "GitBranch", icon: GitBranch, category: "development" },
  { name: "Terminal", icon: Terminal, category: "development" },
  { name: "Database", icon: Database, category: "development" },
  { name: "Cloud", icon: Cloud, category: "development" },
  { name: "Server", icon: Server, category: "development" },
  { name: "Cpu", icon: Cpu, category: "development" },
  { name: "Wifi", icon: Wifi, category: "development" },
  { name: "Code", icon: Code, category: "development" },
  
  // Business & Analytics
  { name: "BarChart", icon: BarChart, category: "business" },
  { name: "TrendingUp", icon: TrendingUp, category: "business" },
  { name: "TrendingDown", icon: TrendingDown, category: "business" },
  { name: "DollarSign", icon: DollarSign, category: "business" },
  { name: "Briefcase", icon: Briefcase, category: "business" },
  { name: "Building", icon: Building, category: "business" },
  { name: "Package", icon: Package, category: "business" },
  { name: "ShoppingCart", icon: ShoppingCart, category: "business" },
];

interface IconPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIcon: (iconName: string) => void;
  currentIcon?: string;
}

export function IconPicker({ open, onOpenChange, onSelectIcon, currentIcon }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");

  const filteredIcons = iconOptions.filter((option) => {
    const matchesSearch = option.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || option.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectIcon = (iconName: string) => {
    onSelectIcon(iconName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose an Icon</DialogTitle>
          <DialogDescription>
            Select a professional icon for your board
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {/* Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
              <TabsTrigger value="general" className="text-xs">Popular</TabsTrigger>
              <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
              <TabsTrigger value="issues" className="text-xs">Issues</TabsTrigger>
              <TabsTrigger value="announcements" className="text-xs">News</TabsTrigger>
              <TabsTrigger value="support" className="text-xs">Support</TabsTrigger>
              <TabsTrigger value="development" className="text-xs">Tech</TabsTrigger>
              <TabsTrigger value="business" className="text-xs">Business</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-6 gap-2">
                  {filteredIcons.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.name}
                        variant="outline"
                        className={cn(
                          "h-16 w-full flex flex-col items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-300",
                          currentIcon === option.name && "bg-blue-50 border-blue-500 border-2"
                        )}
                        onClick={() => handleSelectIcon(option.name)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px] text-gray-600 truncate w-full text-center">
                          {option.name}
                        </span>
                      </Button>
                    );
                  })}
                </div>
                {filteredIcons.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No icons found. Try a different search term.
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get icon component by name
export function getIconComponent(iconName: string): LucideIcon | null {
  const option = iconOptions.find((opt) => opt.name === iconName);
  return option ? option.icon : null;
}

// Helper component to render icon by name
interface IconDisplayProps {
  iconName: string;
  className?: string;
  style?: React.CSSProperties;
}

export function IconDisplay({ iconName, className, style }: IconDisplayProps) {
  const IconComponent = getIconComponent(iconName);
  
  if (!IconComponent) {
    // Fallback to a default icon if not found
    return <Box className={className} style={style} />;
  }
  
  return <IconComponent className={className} style={style} />;
}
