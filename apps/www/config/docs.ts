import { MainNavItem, SidebarNavItem } from "types/nav"

export interface DocsConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const docsConfig: DocsConfig = {
  mainNav: [
    {
      title: "Documentation",
      href: "/docs",
    },
  ],
  sidebarNav: [
    {
      title: "Getting Started",
      items: [
        {
          title: "Introduction",
          href: "/docs",
          items: [],
        },
        {
          title: "Installation",
          href: "/docs/installation",
          items: [],
        },
        {
          title: "Configuration",
          href: "/docs/config",
          items: [],
        },
        {
          title: "CLI",
          href: "/docs/cli",
          label: "Updated",
          items: [],
        },
      ],
    },
    {
      title: "Guides",
      items: [
        {
          title: "Notion Token",
          href: "/docs/guide/notion-token",
          items: [],
        },
        {
          title: "Docusaurus",
          href: "/docs/guide/docusaurus",
          items: [],
        },
        {
          title: "Obsidian",
          href: "/docs/guide/obsidian",
          items: [],
        },
        {
          title: "GitHub",
          href: "/docs/guide/github",
          items: [],
        },
        {
          title: "Manual Installation",
          href: "/docs/guide/manual-installation",
          items: [],
        },
      ],
    },
    {
      title: "Packages",
      items: [
        {
          title: "Notion Tree",
          href: "/docs/packages/notion-tree",
          items: [],
        },
        {
          title: "Notion Downloader",
          href: "/docs/packages/notion-downloader",
          items: [],
        },
        {
          title: "Notion Cache Client",
          href: "/docs/packages/notion-cache-client",
          items: [],
        },
      ],
    },
  ],
}
