import Link from "next/link";
import { BookOpen, Grid2X2, LogOut, Sparkles, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Уроки", icon: Grid2X2 },
  { href: "/teachers", label: "Преподаватели", icon: Users },
  { href: "/courses", label: "Методичка", icon: BookOpen },
  { href: "/profile", label: "Профиль", icon: User }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f8ff]">
      <header className="sticky top-0 z-40 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-3 text-2xl font-black tracking-tight text-[#111426]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#675cff] text-white shadow-[0_10px_24px_rgba(103,92,255,0.24)]">
              <Sparkles className="h-5 w-5" />
            </span>
            LearnSpace
          </Link>
          <nav className="hidden items-center gap-9 lg:flex">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-base font-semibold transition-colors ${
                  index === 0 ? "text-[#161829]" : "text-slate-600 hover:text-[#161829]"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            <Button asChild variant="ghost" size="icon" aria-label="Выйти" className="text-[#161829]">
              <Link href="/login">
                <LogOut className="h-5 w-5" />
              </Link>
            </Button>
          </nav>
          <div className="flex items-center gap-2 lg:hidden">
            {navItems.slice(0, 1).map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
