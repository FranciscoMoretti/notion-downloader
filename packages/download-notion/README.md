# Notion Downloader

A powerful tool to download and convert your Notion pages to Markdown.

## Features

- Backup your Notion pages and databases
- Cache your downloads
- Convert Notion content to Markdown
- Flexible naming and layout strategies
- Image handling
- Continuous pulling with revalidation

## Installation

```bash
npm install notion-downloader
```

## Usage

1. Create a configuration file named `downloader.config.cjs` in your project root:

```typescript
import { NotionPullOptions, notionPull } from "notion-downloader"

const options: NotionPullOptions = {
  rootId: "your-root-page-id",
  conversion: {
    outputPaths: {
      markdown: "./docs",
      images: "./docs/assets",
    },
  },
}
```

2. Run the downloader:

```bash
npx notion-downloader-cli pull --notion-token "your-notion-token"
```
