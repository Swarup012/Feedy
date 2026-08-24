"use client";
import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Logo } from "@/components/logo";


interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
    dropdown?: {
      section: string;
      items: {
        name: string;
        link: string;
        description?: string;
        icon?: React.ReactNode;
      }[];
    }[];
    featured?: {
      title: string;
      description: string;
      link: string;
      image?: string;
    };
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  id?: string;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn("sticky inset-x-0 top-0 z-40 w-full", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(12px)" : "none",
        boxShadow: visible ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        width: visible ? "70%" : "100%",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-full flex-row items-center justify-between self-start rounded-full px-8 py-3 lg:flex bg-card dark:bg-background",
        visible && "bg-card/80 dark:bg-background/80",
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | HTMLAnchorElement)[]>([]);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const calculateDropdownPosition = useCallback((triggerIdx: number) => {
    const trigger = triggerRefs.current[triggerIdx];
    const dropdown = dropdownRefs.current[triggerIdx];
    if (!trigger || !dropdown) return;

    const triggerRect = trigger.getBoundingClientRect();
    const dropdownWidth = dropdown.offsetWidth;
    const viewportWidth = window.innerWidth;
    const padding = 16;

    let left = triggerRect.left + triggerRect.width / 2 - dropdownWidth / 2;
    let transformX = '0';

    if (left + dropdownWidth > viewportWidth - padding) {
      left = viewportWidth - padding - dropdownWidth;
    }
    if (left < padding) {
      left = padding;
    }

    const adjustedOffset = triggerRect.left + triggerRect.width / 2 - left;
    transformX = `translateX(calc(-50% + ${adjustedOffset - triggerRect.width / 2}px))`;

    setDropdownStyle({
      left: 0,
      transform: transformX,
    });
  }, []);

  const openDropdown = useCallback((idx: number) => {
    setHovered(idx);
    setFocusedIdx(idx);
    setTimeout(() => calculateDropdownPosition(idx), 0);
  }, [calculateDropdownPosition]);

  const closeDropdown = useCallback(() => {
    setHovered(null);
    setFocusedIdx(null);
  }, []);

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number, hasDropdown: boolean) => {
      if (!hasDropdown) return;

      switch (e.key) {
        case "ArrowDown":
        case "Enter":
        case " ":
          e.preventDefault();
          openDropdown(idx);
          // Focus first link in dropdown after render
          setTimeout(() => {
            const dropdown = triggerRefs.current[idx]
              ?.closest("[data-nav-item]")
              ?.querySelectorAll("[data-dropdown-link]");
            (dropdown?.[0] as HTMLElement)?.focus();
          }, 50);
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          triggerRefs.current[idx]?.focus();
          break;
      }
    },
    [openDropdown, closeDropdown],
  );

  const handleDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number, _sectionCount: number, _itemCount: number) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closeDropdown();
          triggerRefs.current[idx]?.focus();
          break;
        case "ArrowDown": {
          e.preventDefault();
          const target = e.currentTarget as HTMLElement;
          const next = target.nextElementSibling as HTMLElement | null;
          if (next) {
            next.focus();
          } else {
            // Wrap to first item in next section or first item overall
            const container = target.closest("[data-dropdown-container]");
            const firstLink = container?.querySelector("[data-dropdown-link]") as HTMLElement;
            firstLink?.focus();
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const target = e.currentTarget as HTMLElement;
          const prev = target.previousElementSibling as HTMLElement | null;
          if (prev && prev.hasAttribute("data-dropdown-link")) {
            prev.focus();
          } else {
            // Move focus back to trigger
            closeDropdown();
            triggerRefs.current[idx]?.focus();
          }
          break;
        }
        case "Tab":
          // Allow natural tab but close dropdown when leaving
          if (e.shiftKey) {
            closeDropdown();
          }
          break;
      }
    },
    [closeDropdown],
  );

  return (
    <motion.div
      onMouseLeave={() => closeDropdown()}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-base font-medium transition duration-200 lg:flex lg:space-x-2",
        className,
      )}
    >
      {items.map((item, idx) => (
        <div
          key={`nav-item-${idx}`}
          data-nav-item
          className="relative"
          onMouseEnter={() => openDropdown(idx)}
        >
          {item.dropdown ? (
            <button
              ref={(el) => { triggerRefs.current[idx] = el as HTMLButtonElement; }}
              type="button"
              aria-haspopup="true"
              aria-expanded={hovered === idx}
              onFocus={() => openDropdown(idx)}
              onBlur={(e) => {
                // Only close if focus moves outside this nav item
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  closeDropdown();
                }
              }}
              onKeyDown={(e) => handleTriggerKeyDown(e, idx, true)}
              className={cn(
                "relative px-5 py-2 cursor-pointer inline-block rounded-full transition-colors",
                "text-foreground",
                "hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                hovered === idx && "text-primary",
              )}
            >
              <AnimatePresence>
                {hovered === idx && (
                  <motion.div
                    layoutId="hovered"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 h-full w-full rounded-full bg-accent"
                  />
                )}
              </AnimatePresence>
              <span className="relative z-20 flex items-center gap-1">
                {item.name}
                <svg
                  className={cn(
                    "relative z-20 h-3 w-3 transition-transform",
                    hovered === idx && "rotate-180",
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
          ) : (
            <a
              ref={(el) => { triggerRefs.current[idx] = el as HTMLAnchorElement; }}
              onClick={onItemClick}
              onFocus={() => setFocusedIdx(idx)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setFocusedIdx(null);
                }
              }}
              onKeyDown={(e) => handleTriggerKeyDown(e, idx, false)}
              className={cn(
                "relative px-5 py-2 cursor-pointer inline-block rounded-full transition-colors",
                "text-foreground",
                "hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              href={item.link}
            >
              <AnimatePresence>
                {(hovered === idx || focusedIdx === idx) && (
                  <motion.div
                    layoutId="hovered"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 h-full w-full rounded-full bg-accent"
                  />
                )}
              </AnimatePresence>
              <span className="relative z-20">{item.name}</span>
            </a>
          )}

          {/* Dropdown Menu */}
          <AnimatePresence>
            {item.dropdown && hovered === idx && (
              <motion.div
                key={`dropdown-${idx}`}
                ref={(el) => { dropdownRefs.current[idx] = el; }}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                role="menu"
                style={dropdownStyle}
                className="absolute top-full mt-2 w-max min-w-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
              >
                <div className="flex">
                  {/* Columns */}
                  <div className="flex">
                    {item.dropdown.map((section, sectionIdx) => (
                      <div
                        key={`section-${sectionIdx}`}
                        className={`p-6 ${sectionIdx > 0 ? "border-l border-slate-200 dark:border-slate-800" : ""}`}
                      >
                        <div
                          id={`nav-dropdown-section-${idx}-${sectionIdx}`}
                          className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4"
                        >
                          {section.section}
                        </div>
                        <div
                          data-dropdown-container
                          className="space-y-1"
                          role="group"
                          aria-labelledby={`nav-dropdown-section-${idx}-${sectionIdx}`}
                        >
                          {section.items.map((dropdownItem, itemIdx) => (
                            <a
                              key={`dropdown-item-${itemIdx}`}
                              data-dropdown-link
                              href={dropdownItem.link}
                              onClick={onItemClick}
                              onKeyDown={(e) =>
                                handleDropdownKeyDown(e, idx, section.items.length, itemIdx)
                              }
                              role="menuitem"
                              className="flex items-start gap-3 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset group"
                            >
                              {dropdownItem.icon && (
                                <span className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                  {dropdownItem.icon}
                                </span>
                              )}
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                                  {dropdownItem.name}
                                </div>
                                {dropdownItem.description && (
                                  <div className="text-xs text-slate-500 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 mt-0.5 leading-relaxed">
                                    {dropdownItem.description}
                                  </div>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Featured Card */}
                  {item.featured && (
                    <div className="p-6 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        {item.featured.title}
                      </div>
                      {item.featured.image && (
                        <div className="rounded-lg overflow-hidden mb-3 border border-slate-200 dark:border-slate-700">
                          <img
                            src={item.featured.image}
                            alt={item.featured.title}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.featured.description}
                      </p>
                      <a
                        href={item.featured.link}
                        onClick={onItemClick}
                        className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Learn more
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: "none",
        width: visible ? "90%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "4px" : "2rem",
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden",
        visible && "bg-card dark:bg-background",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
  id,
}: MobileNavMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the element that had focus before menu opened
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    const menu = menuRef.current;
    if (!menu) return;

    // Focus the first focusable element inside the menu
    const focusFirst = () => {
      const focusable = menu.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    };

    // Small delay to let animation start
    const timer = setTimeout(focusFirst, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = menu.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Return focus when menu closes
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="menu"
          aria-label="Mobile navigation"
          id={id}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-card px-4 py-8 shadow-lg dark:bg-background border border-border",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-nav-menu"
      className={cn(
        "inline-flex items-center justify-center",
        "h-11 w-11 rounded-md",
        "text-foreground",
        "hover:bg-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-colors",
      )}
    >
      {isOpen ? (
        <IconX className="h-5 w-5" aria-hidden="true" />
      ) : (
        <IconMenu2 className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
};

export const NavbarLogo = ({
  href = "/",
  children,
}: {
  href?: string;
  children?: React.ReactNode;
}) => {
  return (
    <a
      href={href}
      className={cn(
        "relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:rounded-md",
      )}
    >
      {children ?? <Logo width={32} height={32} className="text-primary" />}
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-md text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const variantStyles = {
    primary:
      "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-shadow",
    secondary: "bg-transparent shadow-none text-foreground",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
