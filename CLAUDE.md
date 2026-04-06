# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

GitHub profile repository (`jeffersongoncalves/jeffersongoncalves`). It auto-generates the profile README from a template (`README_plugin.md`) and a data file (`plugins.json`). There is no application code — just data, templates, and automation.

## Architecture

- **`plugins.json`** — Single source of truth for all packages: starter kits, Filament plugins (with v3/v4/v5 compatibility flags), Laravel packages, and CLI tools. Organized into sections: `startkit` (featured/legacy), `filament` (featured/more/collaborator), `laravel`, `cli`.
- **`README_plugin.md`** — Template with placeholders (`[STARTKIT_FEATURED]`, `[FILAMENT_FEATURED]`, `[LARAVEL]`, `[CLI]`, `[YEARS]`, etc.) that get replaced to produce `README.md`.
- **`update-plugins-compatibility.js`** — Queries Packagist API to auto-detect Filament version compatibility (v3/v4/v5) for each plugin by inspecting `require` constraints. Updates `plugins.json` in-place.
- **`README.md`** — Generated output. Never edit directly; it gets overwritten by CI.

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

# Install dependencies
pnpm install
```

## Editing Guide

- To add/remove a package: edit `plugins.json`. Filament plugins need `v3`/`v4`/`v5` boolean fields.
- To change README layout/text: edit `README_plugin.md`, not `README.md`.
- `plugins.json` must pass validation: top-level keys `startkit`, `filament`, `laravel`, `cli`; every entry needs `title` and `package`.

## Branch

- Default branch: `master`
