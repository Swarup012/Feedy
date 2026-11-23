import type { LucideIcon, LucideProps } from "lucide-react";

type ShellIconProps = Omit<LucideProps, "size" | "strokeWidth"> & {
  icon: LucideIcon;
};

/**
 * One size and stroke for every icon in the admin shell.
 * Colour stays currentColor so the parent's nav state controls it.
 */
export function ShellIcon({ icon: Icon, ...props }: ShellIconProps) {
  return (
    <Icon
      size={16}
      strokeWidth={1.5}
      color="currentColor"
      aria-hidden="true"
      {...props}
    />
  );
}
