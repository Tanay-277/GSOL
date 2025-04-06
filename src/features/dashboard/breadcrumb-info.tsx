"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FolderTwo } from "@mynaui/icons-react";
import { usePathname } from "next/navigation";

const BreadcrumbInfo = () => {
  const pathname = usePathname();

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList className=" ">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <BreadcrumbPage className="flex items-center gap-2">
                <FolderTwo size={16} className="h-5 w-5 font-bold md:flex" strokeWidth={2} />
                {pathname.startsWith("/projects") && (
                  <span className="hidden md:flex">Dashboard</span>
                )}
              </BreadcrumbPage>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2">User</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
};

export default BreadcrumbInfo;
