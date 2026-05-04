# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

GitHub profile repository (`jeffersongoncalves/jeffersongoncalves`). It auto-generates the profile README from a template (`README_plugin.md`) and a data file (`plugins.json`). There is no application code — just data, templates, and automation.

## Architecture

- **`plugins.json`** — Single source of truth for all packages. Top-level keys: `startkit` (`featured`, `legacy`), `filament` (`plugins`, `collaborator`), `laravel`, `cli`, `jetbrains`. Filament entries also carry `v3`/`v4`/`v5` boolean compatibility flags; `jetbrains` entries may carry `jetbrainsId` for the marketplace badge.
- **`README_plugin.md`** — Template with placeholders replaced at build time: `[STARTKIT_FEATURED]`, `[STARTKIT_LEGACY]`, `[FILAMENT_PLUGINS]`, `[FILAMENT_COLLABORATOR]`, `[LARAVEL]`, `[CLI]`, `[JETBRAINS]`, `[YEARS]`. The `[YEARS]` placeholder resolves to `currentYear − 2008` (years of experience).
- **`update-plugins-compatibility.js`** — Queries Packagist API to auto-detect Filament version compatibility (v3/v4/v5) for each plugin by inspecting any `filament/*` constraint in `require`. Updates `plugins.json` in-place.
- **`update-readme.js`** — Renders `README.md` from `README_plugin.md` + `plugins.json`. Runs in CI via `.github/workflows/update-readme.yml` and locally via `pnpm run build:readme`. Each section is auto-sorted by `package` (`localeCompare`) before rendering, so the order of entries in `plugins.json` doesn't affect the output. To change row formatting, badges, or placeholders, edit this file.
- **`README.md`** — Generated output. Never edit directly; it gets overwritten by CI.
- **Ownership badge convention.** The generator appends " Contribution" after the title link for any package whose name does *not* start with `jeffersongoncalves` or `jeffersonsimaogoncalves` — keep this in mind when adding entries.

## Key Workflows

### Local: Pre-commit hook (Husky + lint-staged)
When `plugins.json` is staged, the pre-commit hook runs `update-plugins-compatibility.js` and re-stages the file. This ensures compatibility flags are always current.

### CI: README generation (`.github/workflows/update-readme.yml`)
On push to `master` when `plugins.json` or `README_plugin.md` changes, a GitHub Action regenerates `README.md` from the template and commits it.

### CI: JSON validation (`.github/workflows/validate-templates.yml`)
On PRs touching `plugins.json`, validates JSON syntax and required structure (all sections present, all entries have `title` and `package`).

### CI: Filakit CLI notification (`.github/workflows/notify-filakit-cli.yml`)
On push to `master` when `plugins.json` changes, dispatches a `repository_dispatch` event to `jeffersongoncalves/filakit-cli`.

## Commands

```bash
# Update Filament plugin compatibility flags from Packagist
pnpm run update:plugins

# Render README.md locally from README_plugin.md + plugins.json
pnpm run build:readme

# Install dependencies
pnpm install
```

## Editing Guide

- To add/remove a package: edit `plugins.json`. Filament entries should include `v3`/`v4`/`v5` flags (the pre-commit hook will refresh them from Packagist; if you bypass hooks, run `pnpm run update:plugins` manually).
- To change README layout/text: edit `README_plugin.md`, not `README.md`.
- To change how rows are rendered (badges, columns, ownership marker): edit `update-readme.js`. Test locally with `pnpm run build:readme` — output goes to `README.md`.
- `plugins.json` must pass validation (`.github/workflows/validate-templates.yml`): top-level keys `startkit`, `filament`, `laravel`, `cli`, `jetbrains`; `startkit` must have `featured`+`legacy`; `filament` must have `plugins`+`collaborator`; every entry needs `title` and `package`.

## Branch

- Default branch: `master`
