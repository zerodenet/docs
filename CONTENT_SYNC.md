# Content synchronization baseline

Public guides were checked against these fetched `origin/develop` revisions on 2026-09-03. Each local product checkout matched the fetched revision and was clean; product code was read only.

| Repository | Revision |
| --- | --- |
| core | `6d0553d743ecd074379126e574d9263157486f7a` |
| znet-sink | `dff6b732415a860e3807cb22ccbdb016c230eccc` |
| zboard | `8d37762bdaca6f4befaf15343960d396417983da` |
| docs before this update | `ee10f810c382d04ec324cfefc3607c935375b1a6` |

## Evidence used

- Core: `crates/config/src/model/{mod,dns,tun,route,inbound,outbound,log,api}.rs`, DNS/API validation, `src/cli.rs`, `crates/api/src/{command,query,capabilities,error,sink}.rs`, Fake-IP state path and pool implementation, `docs/project/stable-contract-v1.md`, and the develop commit history. Repository `docs/control-plane/` contains historical designs, not the current public contract.
- Client: actual DNS/TUN settings components, DNS recommendations and capability checks, portable settings model and import transaction, release-check policy, diagnostics components, and TUN apply/recovery notes. Running imports restart the managed core; online TUN parameter application recreates TUN.
- Platform: actual admin navigation/router, maintenance/migration handler and form, announcements form, registration settings, purchase UI, Fair Use page, backend configuration and release/SQLite Compose files. Deployment documentation in the source repository contains older database assumptions, so current code and Compose definitions take precedence.

## Editorial scope

- Client and operator pages describe tasks, UI entry points, expected outcomes and failure recovery.
- Core pages retain runnable starts and add parameter types, defaults, limits, examples and capability boundaries.
- Source revision notices distinguish develop behavior from stable availability.
- No production configuration, database, network routes, runtime binary or product code is changed by this documentation task.

## Verification

- `pnpm install --frozen-lockfile` completed without changing the lockfile.
- `pnpm check:build` passed for all 67 Markdown pages, including links, anchors, JSON syntax, navigation, reachability and production output.
- `git diff --check` passed.
- Browser review of the built DNS parameter, operator navigation and client TUN pages passed at the default 1280px viewport: tables and sidebars rendered, no horizontal document overflow, no captured warnings/errors. The final DNS page was reloaded with a fresh URL to avoid the previous build's browser cache.
- Product checkouts were clean at the revisions listed above when the source audit completed. This update changes documentation only; it does not release or deploy any product.

These checks do not execute Rust configuration validation or establish TUN, payment, email or database migration runtime acceptance.
