# Content synchronization baseline

## User-first, released-capability reconstruction — 2026-09-30

The public site now starts with choosing a project, a first working setup, daily tasks and troubleshooting. ZBoard is presented as a minimal panel for personal use and sharing, with optional plugins. Contributor sections stay short; detailed configuration and public interface contracts remain available as lookup references rather than prerequisite reading. Existing routes and heading anchors are retained.

### Published evidence

| Project / channel | Published tag | Source commit |
| --- | --- | --- |
| Core RC (general tutorials and API reference) | `v0.0.2-rc.202609290540` | `2d7526596e91ea1259c3692501a02672ca826cfd` |
| Core dev (explicitly experimental WireGuard section only) | `v0.0.3-dev.202609281319` | `e0c078f3786e2ed60ace43613c47d3b98ae3f5c8` |
| ZNet Sink RC | `v0.0.2-rc.202609291414` | `3aa5c7fe36b3cc0966e417482fa13813119b31f9` |
| ZBoard RC | `v0.0.2-rc.202609291405` | `cf6f2cf0838880615063e94d7f5af3113ea03d9f` |

GitHub release metadata was checked on 2026-09-30. All three latest non-prerelease releases remain `v0.0.1`; the tags above are prereleases. The automatic client download chooser still reads the non-prerelease channel, and the download page now explicitly links the audited RC. Matching product numbers are not a compatibility contract.

Core `main` matches the RC commit above. Unreleased develop `4ad1b09ab5a59b5b673d1c28b05faf9a7a9735e4` was compared but is not the tutorial baseline: its URLTest and strict-route recovery fixes must not be attributed to earlier artifacts. The RC has no WireGuard feature. Sink's audited develop `080a635df3549449694038e7ce6e531ce376fb15` has exactly the RC tree `7b16a6a2d83c1e20b00aecae3ab952f5fb57821c`; public source links use the released commit. ZBoard `main`, `develop` and the RC tag all resolve to the listed commit.

### Material corrections

- Core: download-first installation, runnable local Mixed-proxy example, explicit TUN permission and recovery limits, accurate published VLESS/VMess capabilities, RC URLTest isolation semantics, and experimental dev-only WireGuard. HTTP/IPC/event contracts were cross-checked against the RC implementation, not just copied from an earlier source document.
- Sink: a concrete first connection using professional mode and system proxy; Lite's power button actually requests both system proxy and TUN. Current RC settings use per-configuration local changes; portable export is v3 and does not back up configuration-bound overrides or subscriptions. Linux system proxy targets GNOME. Plugin installation, permission approval, updates and destructive uninstall effects are explained as user tasks.
- ZBoard: installation is pinned to the released RC; first delivery includes a user, protocol, access group, product/specification, zero-amount assignment, explicit confirmation and client verification. Forwarding-only authorization now issues the parent credential with only the authorized entry address. External forwarding, proxy pools, released plugin business interfaces and migration/rollback constraints replace stale claims.
- Navigation: guides lead, advanced references are collapsed, contribution guidance is separated. The shared project chooser may link into each project's start page; its old false classification as a project named `index.md` is fixed in the documentation checker. The checker now rejects missing navigation targets and anchors; a pre-existing community sidebar anchor mismatch is repaired without removing the old anchor.

### Relationship to existing work

This change starts from docs `develop` / `main` commit `dcae2357323c1352aa6554fd0e5162921aef9bce`. Existing PR #36 remains separate and unmodified. Its module-ownership proposal overlaps navigation and ZBoard reference entry points; the user-facing subscription/forwarding explanations here follow the now-published RC rather than the proposal's earlier “unreleased” wording. Review that overlap before integrating both PRs.

### Verification scope

- `pnpm check:build` passes all 86 Markdown pages and production output (Node 24.19.0, pnpm 11.19.0; CI uses Node 22 and pnpm 11.9.0).
- A separate rendered-output check resolves 5,662 local links/assets across 87 HTML files. All 568 previous anchors in changed pages are retained; all 36 new pinned product-source targets resolve.
- The navigation checker rejects injected missing-page and missing-anchor cases, then passes with the real navigation restored. `git diff --check` passes.
- Thirty complete/assembled Core configuration examples pass `zero validate` with the existing audit binary reporting `c71a7c22`, not the exact RC binary. Two Python examples parse, two JavaScript examples pass syntax checks, and 23 ZBoard shell examples pass syntax checks.

Product code and release artifacts were inspected; this work does not deploy ZBoard, modify system proxy/TUN/firewall settings, send payments or operate live nodes. Local browser preview is unavailable in this environment (`ERR_BLOCKED_BY_CLIENT` for localhost), so no visual or installed-platform acceptance is claimed. Earlier audits are historical records, not the current public feature baseline.

## Historical provenance

The [September 9–10 audit and ZBoard migration record](https://github.com/zerodenet/docs/blob/dcae2357323c1352aa6554fd0e5162921aef9bce/CONTENT_SYNC.md) remains available in Git history. `zboard-document-migration.json` records the original migration sources and digests; it is provenance, not a claim that today's guide still matches those old files verbatim.

Public ZBoard documentation is maintained here. Do not copy these guides back into the product's ignored local documentation directory; its release packaging keeps its own release-note artifact under `.github/release-notes/`.
