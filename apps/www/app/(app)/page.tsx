import Image from "next/image"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { Button } from "@/components/ui/button"
import { Announcement } from "@/components/announcement"
import { DownloadFlow } from "@/components/download-flow"
import {
  PageActions,
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"

export default function IndexPage() {
  return (
    <div className="relative container mx-auto">
      <PageHeader>
        <Announcement />
        <PageHeaderHeading>
          Download and sync your Notion content
        </PageHeaderHeading>
        <PageHeaderDescription>
          Easily download your Notion pages and databases to Markdown, images,
          and more. Keep your content in sync with automatic updates.
        </PageHeaderDescription>
        <PageActions>
          <Button asChild size="sm">
            <Link href="/docs">Get Started</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link
              target="_blank"
              rel="noreferrer"
              href={siteConfig.links.github}
            >
              GitHub
            </Link>
          </Button>
        </PageActions>
      </PageHeader>

      <section className="py-10 flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Download Notion pages and databases to Markdown files</li>
          <li>Download images, videos, pdfs, audio, and files</li>
          <li>Customize the output directory structure and file naming</li>
          <li>Automatically sync changes from Notion</li>
          <li>Flexible caching options to optimize performance</li>
        </ul>
      </section>

      <section className="py-10 flex flex-col gap-4">
        <h2 className="text-2xl font-bold">
          Download and convert all your Notion content
        </h2>
        <DownloadFlow />
      </section>
    </div>
  )
}
