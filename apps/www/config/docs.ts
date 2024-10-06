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
          title: "Config",
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
          title: "Manual",
          href: "/docs/guide/manual",
          items: [],
        },
      ],
    },
    {
      title: "Packages",
      items: [
        {
          title: "Tree",
          href: "/docs/packages/notion-tree",
          items: [],
        },
        {
          title: "Downloader",
          href: "/docs/packages/notion-downloader",
          items: [],
        },
        {
          title: "Cache Client",
          href: "/docs/packages/notion-cache-client",
          items: [],
        },
      ],
    },
  ],
}
