# Content synchronization baseline

## ZBoard documentation migration — 2026-09-10

ZBoard documentation is now authored in `docs/projects/zboard/`. Product introductions, installation, basic management, and plugin usage lead the navigation; contracts, design notes and historical acceptance records are separate reference sections. `zboard-document-migration.json` records each source, destination and source digest.

This migration uses ZBoard develop `37d1716c466ce16a1198399ac91c9de3e2c0c4f8` plus local documentation revisions. It is not a claim that every feature is in the published v0.0.1 artifact. Plugin runtime and marketplace documentation explicitly identifies the post-v0.0.1 development scope; shared-pool RAW editor additions are marked pending publication. Payments and other business extensions belong to plugins; the current payment extension interface is not implemented. Core and client evidence remains on the earlier baseline below.

Public ZBoard documentation must be changed here, not copied back into the ignored product `docs/` directory. Product release packaging keeps its own release-note artifact under `.github/release-notes/`.

Verification: source and production-output checks passed for 97 Markdown pages, including every sidebar entry, internal link and anchor, JSON examples and rendered HTML. The migration also removes the product release workflow dependency on its local docs directory.

## Previous main audit — 2026-09-09

Public guides were checked on 2026-09-09 against freshly fetched GitHub `main` revisions. None of the three product repositories has a `master` branch. Source was read from immutable Git archives, excluding develop, feature branches and uncommitted changes. In particular, the client checkout contains ongoing uncommitted work and the panel checkout is on a feature branch; neither is the documentation baseline.

| Repository | Main revision |
| --- | --- |
| core | `503229562ef5854e3be6be3a9c8e7cbc5efffc61` |
| znet-sink | `6d822fb96140be87cdccdd0bea472ba0b089cf04` |
| zboard | `e1b7246cc4ef805bf39b22d634ba209114eb3b14` |
| docs develop before this update | `8e00ddfeec94707c1c2dd2d587f68ed23386c3ef` |

GitHub release API responses confirmed public, non-draft, non-prerelease `v0.0.1` releases for all three products. This verifies publication, not installed behavior or every main change in a downloaded artifact. The public [implementation progress page](docs/progress.md) links the pinned evidence and release records.

## Evidence and changes

- Core: inspected `crates/config/src/model/route.rs`, route compilation/validation, `crates/engine/src/runtime/route.rs`, `crates/proxy/src/adapters/direct/{inbound,udp}.rs`, and management, validation-isolation and URLTest implementation notes/test references. Added `route.bypass` precedence, management-only startup, Direct UDP capability and bind semantics, validation isolation, and the distinction between policy probes and read-only diagnostics. Corrected the old Direct UDP matrix entry and develop-only version notices.
- Client: inspected `src-tauri/src/services/bypass.rs`, `services/bypass/rules.rs`, `services/kernel_settings.rs`, `models/app_config.rs`, Network/TUN settings components, kernel integration and v0.0.1 qualification records. Updated the shared bypass editor, TUN exclusions, portable settings v2, lifecycle semantics and the shared 0.0.1 installation/recovery baseline. The four-platform installed-E2E waiver remains an outstanding acceptance boundary.
- Panel: inspected `backend/internal/handler/{admin_order_assignment,node_publish_worker,node_delete_cascade,dns_deletion,certificate_deletion,network_entry_delivery,network_entry_capabilities,managed_rule_client_compatibility,kernel_automation}.go`, related tests and implementation notes. Updated fronting and explicit landing authorization, shared proxy pools, durable publication, administrator order confirmation, client-specific rules, the shared 0.0.1 capability baseline, and database-only deletion versus independent remote cleanup. The compiler still injects a bootstrap listener even though Core now supports management-only operation.
- Release and scope records distinguish existing main implementation from plans, including panel online payment/plugin runtime and product installed/long-running acceptance. No product code, live network settings or remote node state was changed.

## Version terminology

All three product versions are 0.0.1. Public guides no longer use pre-reset release matrices, minimum-version thresholds, package names or User-Agent examples. Git tags, download URLs and image tags retain the actual `v0.0.1` spelling. API V1, client settings v2 and ZRS 0.1 remain independent protocol/data-format versions. The public compatibility page describes the current 0.0.1 contract rather than reconstructing historical release claims.

## Verification

- `pnpm check:build` passed for 69 Markdown pages: links, anchors, JSON examples, project boundaries, navigation, reachability and production output. Local tools were Node 24.19.0 and pnpm 11.19.0; repository CI independently uses Node 22 and pnpm 11.9.0.
- `git diff --check` passed. The progress page and three project entry pages contain 23 pinned source references, checked against the archived trees.
- The final `/progress` development route returned HTTP 200. No browser visual acceptance was performed.
- Existing dependencies were reused; the package manifest, lockfile and hosting/workflow configuration remain unchanged; the discussion question template now uses the 0.0.1 example.

This task did not run Rust/Go product suites, installed clients, live TUN changes, payment/email delivery or node cleanup.

## Delivery

The target is docs `develop` through a `codex/*` pull request. Current GitHub branch rules require a pull request and the `validate` status check. GitHub Pages listens to develop pushes; this documentation PR does not itself deploy a product or publish the separate Sites preview.
