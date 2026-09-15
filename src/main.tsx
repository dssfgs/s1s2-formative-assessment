import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Home } from "@/routes/index";
import { AllPage } from "@/routes/all";
import { AwardsPage } from "@/routes/awards";
import { SubjectsPage } from "@/routes/subjects";
import { CalendarPage } from "@/routes/calendar";
import { ImportPage } from "@/routes/import";
import { RulesPage } from "@/routes/rules";
import { SettingsPage } from "@/routes/settings";
import { ClassPage } from "@/routes/class.$code";
import "./styles.css";

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home }),
  createRoute({ getParentRoute: () => rootRoute, path: "/all", component: AllPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/awards", component: AwardsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/subjects", component: SubjectsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/calendar", component: CalendarPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/import", component: ImportPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/rules", component: RulesPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/settings", component: SettingsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/class/$code", component: ClassPage }),
]);

const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
