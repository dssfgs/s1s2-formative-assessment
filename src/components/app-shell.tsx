import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Calculator,
  CalendarDays,
  Layers,
  LayoutGrid,
  Menu,
  Settings2,
  Table2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { S1_CLASSES, S2_CLASSES, ALL_CLASSES } from "@/lib/classes";
import { SCHOOL_NAME, SCHOOL_YEAR } from "@/lib/calendar";
import { useAppStore } from "@/lib/store";
import { PwaProvider } from "@/lib/pwa";
import { cn } from "@/lib/utils";
import { InstallHeaderButton, InstallPrompt, InstallSpacer } from "@/components/install-prompt";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  title?: string;
};

const NAV_INPUT: NavItem[] = [
  { to: "/", label: "總覽", icon: LayoutGrid },
  { to: "/groups", label: "輸入中英", icon: Layers, title: "中文、英文按上課分組輸入" },
];

const NAV_MORE: NavItem[] = [
  { to: "/all", label: "全校總表", icon: Users },
  { to: "/awards", label: "進步頒獎", icon: Award },
  { to: "/subjects", label: "各科進程", icon: Table2 },
  { to: "/calendar", label: "評估日程", icon: CalendarDays },
  { to: "/import", label: "匯入匯出", icon: Upload },
  { to: "/rules", label: "計分規則", icon: BookOpen },
  { to: "/settings", label: "設定", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <PwaProvider>
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        跳至內容
      </a>
      <InstallPrompt />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur print:hidden">
        <div className="mx-auto flex min-h-14 max-w-[1600px] items-center gap-3 px-4 py-2">
          <button
            className="inline-flex size-10 items-center justify-center rounded-md hover:bg-muted lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "關閉選單" : "開啟選單"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <Calculator className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-base font-medium leading-tight tracking-tight">
                課後進展性評估
              </span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                {SCHOOL_YEAR} · {SCHOOL_NAME}
              </span>
            </span>
          </Link>
          <InstallHeaderButton />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "print:hidden z-30 border-r border-border bg-background lg:static lg:block lg:w-56 lg:shrink-0",
            open ? "fixed inset-x-0 top-14 bottom-0 overflow-y-auto" : "hidden lg:block",
          )}
        >
          <nav className="flex flex-col gap-6 p-4">
            <div className="flex flex-col gap-1">
              {NAV_INPUT.map((item) => (
                <NavLink
                  key={item.to}
                  item={item}
                  pathname={pathname}
                  onClick={() => setOpen(false)}
                />
              ))}
            </div>
            <div>
              <p className="mb-2 px-3 text-[11px] font-medium tracking-wider text-muted-foreground">
                輸入非核心 · 中一
              </p>
              <div className="grid grid-cols-4 gap-1">
                {S1_CLASSES.map((c) => (
                  <ClassChip
                    key={c}
                    code={c}
                    active={pathname === `/class/${c}`}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 px-3 text-[11px] font-medium tracking-wider text-muted-foreground">
                輸入非核心 · 中二
              </p>
              <div className="grid grid-cols-4 gap-1">
                {S2_CLASSES.map((c) => (
                  <ClassChip
                    key={c}
                    code={c}
                    active={pathname === `/class/${c}`}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {NAV_MORE.map((item) => (
                <NavLink
                  key={item.to}
                  item={item}
                  pathname={pathname}
                  onClick={() => setOpen(false)}
                />
              ))}
            </div>
          </nav>
        </aside>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 lg:px-8">
          <ClientGate>{children}</ClientGate>
        </main>
      </div>
      <InstallSpacer />
    </div>
    </PwaProvider>
  );
}

function fillIfEmpty() {
  const roster = useAppStore.getState().roster;
  const named = ALL_CLASSES.some((c) => (roster[c] ?? []).some((s) => s.chname.trim()));
  if (!named) useAppStore.getState().loadOfficialRoster();
}

function ClientGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => {
      useAppStore.setState({ hydrated: true });
      fillIfEmpty();
      setReady(true);
    });
    useAppStore.persist.rehydrate();
    if (useAppStore.persist.hasHydrated()) {
      useAppStore.setState({ hydrated: true });
      fillIfEmpty();
      setReady(true);
    }
    const t = window.setTimeout(() => {
      useAppStore.setState({ hydrated: true });
      setReady(true);
    }, 400);
    return () => {
      unsub();
      window.clearTimeout(t);
    };
  }, []);
  if (!ready) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">載入本機成績…</p>
    );
  }
  return children;
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick: () => void;
}) {
  const active =
    item.to === "/"
      ? pathname === "/"
      : item.to === "/groups"
        ? pathname.startsWith("/groups") || pathname.startsWith("/group/")
        : pathname.startsWith(item.to);
  return (
    <Link
      to={item.to}
      title={item.title}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-4" />
      {item.label}
    </Link>
  );
}

function ClassChip({
  code,
  active,
  onClick,
}: {
  code: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      to="/class/$code"
      params={{ code }}
      title="輸入地理、公經社、中史、歷史、佛化教育、科學"
      onClick={onClick}
      className={cn(
        "grid h-9 place-items-center rounded-md text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {code}
    </Link>
  );
}
