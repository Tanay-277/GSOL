"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "@/features/dashboard/nav-main";
import { NavUser } from "@/features/dashboard/nav-user";
import { Frame, Terminal } from "@mynaui/icons-react";
import * as React from "react";
import Logo from "../global/logo";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: (
          <Terminal size={16} className="font-semibold" strokeWidth={1.08} />
        ),
        isActive: true,
        items: [
          {
            title: "Analytics",
            url: "/dashboard/analytics",
          },
        ],
      },
      {
        title: "Courses",
        url: "#",
        icon: <Frame size={16} className="font-semibold" strokeWidth={1.08} />,
        isActive: true,
        items: [
          {
            title: "All Courses",
            url: "/course",
          },
          {
            title: "Create",
            url: "/create",
          },
        ],
      },
    ],
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="rounded-xl bg-background"
            >
              <Logo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="z-10">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
