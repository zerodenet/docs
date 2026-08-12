# ZeroDeNet Documentation

Official documentation repository for ZeroDeNet projects, covering user guides, deployment instructions, configuration references, interface contracts, and contribution documentation.

[简体中文](./README.zh-CN.md)

## Documentation Sites

- Production: https://docs.zerodenet.org
- Development preview: https://zerodenet.github.io/docs/

The production site is published from `main`, while the development preview is published from `develop`.

## Projects

| Project | Description | Repository |
| --- | --- | --- |
| Zero Core | Documentation for the ZeroDeNet network runtime, protocols, control interfaces, and deployment. | [zerodenet/core](https://github.com/zerodenet/core) |
| ZNet Sink | Usage, configuration, and platform compatibility documentation for the ZeroDeNet desktop proxy client. | [zerodenet/znet-sink](https://github.com/zerodenet/znet-sink) |
| Zboard | Deployment, initialization, node management, and usage documentation for the service operations platform. | [zerodenet/zboard](https://github.com/zerodenet/zboard) |

Each project has its own navigation, page hierarchy, and documentation boundaries so that versions, configuration semantics, and usage guidance remain project-specific.

## Documentation Scope

This repository primarily contains public documentation for users, operators, and integration developers, including:

- project introductions and capability overviews;
- installation, deployment, and initialization guides;
- configuration options and environment variables;
- node, protocol, and feature usage guides;
- public API, Webhook, gRPC, and related interface contracts;
- troubleshooting and common problems;
- compatibility, upgrade, and migration guidance;
- public contribution and collaboration guidance.

Internal design notes, temporary investigations, development plans, test records, and unstable implementation proposals should remain in the relevant project repositories.

## Repository Structure

Each project's documentation lives in its own directory:

```text
docs/
└── projects/
    ├── core/
    ├── znet-sink/
    └── zboard/
```

Project registration metadata is maintained in:

```text
docs/.vitepress/projects.json
```

Navigation and sidebar configuration are maintained in:

```text
docs/.vitepress/navigation.ts
```

When adding a page, make sure that:

- the page is placed under the correct project directory;
- the page title and navigation label are clear;
- local links resolve correctly;
- the page is not inserted into another project's reading sequence;
- version and compatibility notes belong to the relevant project;
- code-related problems are routed to the corresponding code repository.

## Reporting Documentation Problems

For incorrect or missing documentation, broken links, or unclear wording, open an Issue in this repository.

For application behavior, runtime errors, feature requests, or security issues, use the corresponding project repository:

- [Zero Core Issues](https://github.com/zerodenet/core/issues)
- [ZNet Sink Issues](https://github.com/zerodenet/znet-sink/issues)
- [Zboard Issues](https://github.com/zerodenet/zboard/issues)

## Branches and Publishing

This repository uses the following publishing flow:

```text
feature branch
    ↓
develop
    ↓
GitHub Pages development preview
    ↓
main
    ↓
production documentation site
```

- `develop`: receives documentation changes and publishes the development preview;
- `main`: contains reviewed documentation ready for production;
- feature branches: contain changes for a specific project, topic, or documentation batch.

Documentation changes should normally merge into `develop` first. After reviewing the preview, they can be promoted to `main`.

## Local Development

Requirements:

- Node.js 22 or later;
- pnpm;
- Corepack.

Enable Corepack and install dependencies:

```bash
corepack enable
pnpm install
```

Start the local development server:

```bash
pnpm dev
```

Default address:

```text
http://localhost:5173
```

## Quality Checks

Run the basic documentation checks:

```bash
pnpm check
```

Run the complete build validation:

```bash
pnpm check:build
```

The checks cover:

- project registration metadata;
- project landing pages;
- Markdown headings;
- UTF-8 encoding;
- local links;
- project navigation and sidebars;
- cross-project link boundaries;
- the VitePress production build;
- generated build artifacts.

Before submitting changes, run at least:

```bash
pnpm check:build
```

## Adding a Project

Use the project scaffold to create the initial registration metadata and landing page:

```bash
pnpm create:project -- \
  --id example \
  --name "Example" \
  --description "Project description" \
  --repository "https://github.com/zerodenet/example"
```

After running the scaffold:

1. Add the project introduction and usage documentation.
2. Add navigation and sidebar entries in `docs/.vitepress/navigation.ts`.
3. Review the reading order between project pages.
4. Run `pnpm check:build`.
5. Commit the changes to a feature branch and merge them into `develop` for preview.

## License

Documentation in this repository is published under the license declared by this repository. Source code licenses are defined by the corresponding project repositories.
