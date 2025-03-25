"use client";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/dashboard/app-sidebar";
import BreadcrumbInfo from "@/features/dashboard/breadcrumb-info";
import { QueryProvider } from "@/providers/query-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex h-screen flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 bg-background pr-4">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="md:mr-2 md:h-4" />
              <BreadcrumbInfo />
            </div>
          </header>
          <div
            className="flex flex-1 flex-col gap-4 overflow-y-auto border-t border-zinc-200 p-4"
            style={{
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
            }}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
