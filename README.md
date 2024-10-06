# Notion Download MD

A powerful suite of tools for downloading, caching, and converting Notion content to Markdown.

## Packages

This repository contains the following packages:

1. [notion-downloader](#notion-downloader)
2. [notion-downloader](#notion-downloader)
3. [notion-cache-client](#notion-cache-client)

## Features

- Download and backup Notion pages and databases
- Convert Notion content to Markdown
- Cache Notion queries for improved performance
- Download assets (images, files, videos, audio, PDFs)
- Flexible naming and layout strategies
- Continuous pulling with revalidation

## Installation

```bash
npm install notion-downloader
```

## Usage

For detailed usage instructions, please refer to the individual package READMEs.

### notion-downloader

Create a configuration file named `downloader.config.cjs` in your project root:

Then, run the downloader:

```bash
npx notion-downloader pull --notion-token "your-notion-token"
```

### notion-tree

```typescript
import { downloadNotionObjectTree } from "notion-downloader"

const objectTree = await downloadNotionObjectTree(
  cachedNotionClient,
  startingNode,
  cachingOptions
)
```

### notion-cache-client

```typescript
import { NotionCacheClient } from "notion-cache-client"

const client = new NotionCacheClient({
  auth: "your-notion-api-key",
  cacheOptions: {
    cacheDirectory: "./.cache",
  },
})
```

## Configuration

Each package has its own configuration options. Please refer to the individual package READMEs for detailed configuration information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Roadmap

- [ ] Compatibility with all properties (e.g. people, etc)
