# Notion Downloader

A powerful tool to download and convert all your notion content.

## Features

- Backup your Notion pages and databases
- Cache your downloads
- Convert Notion content to Markdown
- Flexible naming and layout strategies
- Download assets
  - Images
  - Files
  - Videos
  - Audio
  - PDFs
- Continuous pulling with revalidation

## Installation

```bash
npm install notion-downloader
```

## Usage

1. Create a configuration file named `downloader.config.cjs` in your project root:

```typescript
import { Config } from "notion-downloader"

const config: Config = {
  conversion: {
    outputPaths: {
      markdown: "./content/",
      assets: "./public/assets/",
    },
    markdownPrefixes: {
      all: "",
      image: "/assets/",
    },
    statusPropertyName: "Status",
    statusPropertyValue: "Publish",
    pageLinkHasExtension: false,
    slugProperty: "slug",
  },
  rootDbAsFolder: true,
  rootObjectType: "database",
  rootId: "c974ccd9c70c4abd8a5bd4f5a294e5dd",
  cache: {
    cleanCache: false,
    cacheStrategy: "cache",
  },
  logLevel: "debug",
  revalidatePeriod: -1,
}

export default config
```

2. Run the downloader:

```bash
npx notion-downloader pull --notion-token "your-notion-token"
```

## Configuration Options

The `NotionPullOptions` object supports the following options:

- `notionToken`: Your Notion API token (required)
- `rootId`: The ID of the root page or database to start downloading from (required)
- `rootObjectType`: The type of the root object ("page", "database", or "auto")
- `rootDbAsFolder`: Treat the root database as a folder (default: false)
- `cache`: Caching options
- `revalidatePeriod`: Period for revalidating content (in milliseconds)
- `logLevel`: Logging level (default: "info")
- `conversion`: Conversion options

### Conversion Options

The `conversion` object allows you to customize how Notion content is converted:

- `skip`: Skip conversion (default: false)
- `overwrite`: Overwrite existing files (default: false)
- `slugProperty`: Custom property to use as slug
- `statusPropertyName`: Property name for filtering (default: "Status")
- `statusPropertyValue`: Property value for filtering (default: "Done")
- `pageLinkHasExtension`: Include file extension in page links (default: true)
- `outputPaths`: Output paths for different file types
- `markdownPrefixes`: Prefixes for markdown files
- `layoutStrategy`: File layout strategy
- `namingStrategy`: File naming strategy

## Advanced Configuration

For more advanced configuration options, refer to the `schema.ts` file:

This file defines the schema for all configuration options, including enums for asset types, layout strategies, and naming strategies.

## Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
