# Documentation maintenance

Keep public documentation centered on user tasks. A project should have one clear first-use tutorial with its prerequisites, actions, expected results and stopping/recovery steps together. Follow-up guides explain a specific task; reference pages answer a specific lookup. Do not repeat the same directory of links across the homepage, project overview and guide index.

## Verify facts without narrating the audit

- Check behavior against publicly released source and artifacts, including the actual UI labels, configuration schema and platform requirements.
- Record the checked releases, commits, evidence and validation limits in the pull request description. Audit dates, branch comparisons, implementation progress and commit baselines do not belong in ordinary user guides.
- Keep version details in migration, breaking-change and compatibility notes only when they change what the reader must do. Protocol identifiers and data-format versions remain part of their technical contracts.
- State real feature/build/platform requirements at the point of use. Removing a historical version label must not imply that every old package includes a feature.
- Release links should help the reader download or upgrade; source links should help a contributor inspect the relevant contract. Neither should substitute for the actual instructions.

## Maintain a coherent reading path

- Link the project chooser and overview directly to the complete first-use tutorial.
- Put task guides before reference and contribution material. Avoid making the reader visit several indexes before reaching an action.
- Keep essential setup and verification on the tutorial page. Link to detailed platform or configuration help only for optional cases.
- Preserve published routes and anchors when consolidating content, and make the destination of each old entry clear.
- Keep developer guidance focused on project conventions and contribution requirements; do not copy internal implementation records into public tutorials.

## Check changes

Run `pnpm check:build` and `git diff --check`. Review links and anchors in rendered output as well as source Markdown. Validate changed configuration and command examples when possible, and distinguish syntax checks from actual runtime or platform validation in the pull request.

ZBoard public guides live in this repository. Its product repository retains source contracts and release-packaging material. `zboard-document-migration.json` is historical migration provenance, not the current feature baseline.
