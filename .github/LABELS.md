# Repository Labels

Labels in this repository describe work owned by `zerodenet/docs`. Product bugs and implementation requests belong in the corresponding project repository rather than being classified here.

The **Description** column is the exact English text recommended for the GitHub label UI.

| Label | Color | Description |
| --- | --- | --- |
| `content` | `0075CA` | Documentation content changes, corrections, or additions. |
| `site` | `1D76DB` | Documentation site, navigation, rendering, or search work. |
| `maintenance` | `6E7781` | Repository automation, CI, templates, or maintenance work. |
| `needs-triage` | `FBCA04` | Needs initial review and classification by a maintainer. |
| `needs-info` | `D4C5F9` | More information is required before work can continue. |
| `blocked` | `B60205` | Blocked by another change, decision, or dependency. |
| `good first issue` | `7057FF` | Well-scoped work suitable for a first contribution. |
| `help wanted` | `008672` | Community contributions are welcome. |
| `release:promote` | `1F883D` | Promote the reviewed develop snapshot to main. |

Use at most one of `content`, `site`, or `maintenance` to describe the work type. Status and contribution labels may be added when useful.

`release:promote` is a release trigger, not authorization. The promotion workflow separately requires the label sender to have the repository role `maintain` or `admin`.

GitHub issue state reasons should be used for duplicate or not-planned closures instead of permanent `duplicate`, `invalid`, or `wontfix` labels. General questions and product ideas belong in GitHub Discussions.
