# Contributing

Thanks for your interest in contributing to downloader.franciscomoretti.com. We're happy to have you here.

Please take a moment to review this document before submitting your first pull request. We also strongly recommend that you check for open issues and pull requests to see if someone else is working on something similar.

If you need any help, feel free to reach out to [@franciscomoretti](https://twitter.com/franciscomoretti).

## About this repository

This repository is a monorepo.

- We use [pnpm](https://pnpm.io) and [`workspaces`](https://pnpm.io/workspaces) for development.
- We use [Turborepo](https://turbo.build/repo) as our build system.
- We use [changesets](https://github.com/changesets/changesets) for managing releases.

## Structure

This repository is structured as follows:

```
apps
└── www
    ├── app
    ├── components
    └── content
packages
├── notion-cache-client
├── notion-downloader
└── notion-tree

```

| Path                           | Description                              |
| ------------------------------ | ---------------------------------------- |
| `apps/www`                     | The Next.js application for the website. |
| `apps/www/content`             | The content for the website.             |
| `packages/notion-downloader`   | The Notion Downloader package.           |
| `packages/notion-tree`         | The Notion Tree package.                 |
| `packages/notion-cache-client` | The Notion Cache Client package.         |

## Development

### Fork this repo

You can fork this repo by clicking the fork button in the top right corner of this page.

### Clone on your local machine

```bash
git clone https://github.com/your-username/notion-downloader.git
```

### Navigate to project directory

```bash
cd notion-downloader
```

### Create a new Branch

```bash
git checkout -b my-new-branch
```

### Install dependencies

```bash
pnpm install
```

### Run a workspace

You can use the `pnpm --filter=[WORKSPACE]` command to start the development process for a workspace.

#### Examples

1. To run the website:

```bash
pnpm --filter=www dev
```

2. To run the `notion-downloader` package:

```bash
pnpm --filter=notion-downloader dev
```

## Documentation

The documentation for this project is located in the `www` workspace. You can run the documentation locally by running the following command:

```bash
pnpm --filter=www dev
```

Documentation is written using [MDX](https://mdxjs.com). You can find the documentation files in the `apps/www/content/docs` directory.

## Testing

Tests are written using [Vitest](https://vitest.dev). You can run all the tests from the root of the repository.

```bash
pnpm test
```

Please ensure that the tests are passing when submitting a pull request. If you're adding new features, please include tests.
