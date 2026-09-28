"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { ReactNode } from "react";

type ProjectLayoutProps = {
  children: ReactNode;
};

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const projectId = params.id;
  const tabs = [
    { label: "Files", href: `/projects/${projectId}` },
    { label: "Review", href: `/projects/${projectId}/review` },
    { label: "Chat", href: `/projects/${projectId}/chat` },
    { label: "History", href: `/projects/${projectId}/reviews` },
  ];

  return (
    <div className="project-route-layout">
      <nav className="project-route-tabs" aria-label="Project navigation">
        <div>{tabs.map((tab) => <Link className={pathname === tab.href || (tab.label !== "Files" && pathname.startsWith(`${tab.href}/`)) ? "active" : ""} href={tab.href} key={tab.href}>{tab.label}</Link>)}</div>
      </nav>
      {children}
    </div>
  );
}
