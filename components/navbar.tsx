"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bot, Layers, Sparkles, Terminal } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Technical Questions",
      href: "/interview-questions",
      icon: BookOpen,
      active: pathname === "/interview-questions",
    },
    {
      label: "Scenario Questions",
      href: "/scenario-questions",
      icon: Layers,
      active: pathname === "/scenario-questions",
    },
    {
      label: "AI Questions",
      href: "/ai-questions",
      icon: Sparkles,
      active: pathname === "/ai-questions",
    },
    {
      label: "AI Chat",
      href: "/ai-chat",
      icon: Bot,
      active: pathname === "/ai-chat",
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-85">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100">
            <Terminal className="h-4 w-4 text-zinc-100" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-zinc-100">PrepForge</span>
            <span className="text-[10px] text-zinc-400 font-mono -mt-0.5">interview mastery</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  item.active
                    ? "bg-zinc-800 text-zinc-50 shadow-inner"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <Icon className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${item.active ? "text-zinc-100" : "text-zinc-400"}`} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
