"use client";

import React, { Suspense, useState } from "react";
import {
  BarChart3,
  MessageSquare,
  Briefcase,
  TrendingUp,
  Settings,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSearchParams, useRouter } from "next/navigation";

type TabKey = "home" | "chat" | "portfolio" | "backtest" | "settings";

interface NavItem {
  label: string;
  icon: React.ElementType;
  tab: TabKey;
  searchParam?: string;
}

const navItems: NavItem[] = [
  { label: "首页", icon: BarChart3, tab: "home" },
  { label: "问股", icon: MessageSquare, tab: "chat", searchParam: "chat" },
  { label: "持仓", icon: Briefcase, tab: "portfolio", searchParam: "portfolio" },
  { label: "回测", icon: TrendingUp, tab: "backtest", searchParam: "backtest" },
  { label: "设置", icon: Settings, tab: "settings", searchParam: "settings" },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab") || "home";

  const handleNavClick = (item: NavItem) => {
    if (item.tab === "home") {
      router.push("/");
    } else {
      router.push(`/?tab=${item.searchParam || item.tab}`);
    }
    onNavigate?.();
  };

  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map((item) => {
        const isActive = currentTab === item.tab;
        const Icon = item.icon;

        return (
          <Button
            key={item.tab}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "justify-start gap-3 h-10 px-3 w-full text-sm font-normal",
              isActive && "bg-accent text-accent-foreground font-medium"
            )}
            onClick={() => handleNavClick(item)}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Button>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / App Title */}
      <div className="px-4 py-5 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        <h1 className="text-lg font-bold tracking-tight">DSA</h1>
      </div>

      <Separator />

      {/* Navigation Links */}
      <div className="flex-1 py-3">
        <SidebarNav onNavigate={onNavigate} />
      </div>

      <Separator />

      {/* Footer */}
      <div className="p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          股票智能分析系统
        </span>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9">
              <Menu className="size-5" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>导航菜单</SheetTitle>
            </SheetHeader>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h1 className="font-bold tracking-tight">DSA</h1>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r bg-sidebar/50 shrink-0 sticky top-0 h-screen">
          <Suspense fallback={null}>
            <SidebarContent />
          </Suspense>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
