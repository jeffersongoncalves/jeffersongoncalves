/**
 * Renders README.md from README_plugin.md + plugins.json.
 *
 * Used by .github/workflows/update-readme.yml on push to master, and
 * available locally via `pnpm run build:readme`.
 */

const fs = require('fs');

const plugins = JSON.parse(fs.readFileSync('plugins.json', 'utf8'));
const year = new Date().getFullYear();
const yearExperience = year - 2008;

if (!fs.existsSync('README_plugin.md')) {
    console.error('ERROR: README_plugin.md does not exist');
    process.exit(1);
}

let readme = fs.readFileSync('README_plugin.md', 'utf8');

if (!readme || readme.trim() === '') {
    console.error('ERROR: README_plugin.md is empty or could not be read');
    process.exit(1);
}

function isOwned(pkg) {
    return pkg.startsWith('jeffersongoncalves') || pkg.startsWith('jeffersonsimaogoncalves');
}

function generateStartkitRow(item) {
    const owner = isOwned(item.package) ? '' : ' Contribution';
    return `| [**${item.title}**](https://github.com/${item.package})${owner} | ![Version](https://img.shields.io/packagist/v/${item.package}.svg?style=flat-square) | ![Downloads](https://img.shields.io/packagist/dt/${item.package}.svg?style=flat-square) | ![Stars](https://img.shields.io/github/stars/${item.package}?style=flat-square) |\n`;
}

function generateFilamentRow(item) {
    const owner = isOwned(item.package) ? '' : ' Contribution';
    const versions = [];
    if (item.v3) versions.push('v3');
    if (item.v4) versions.push('v4');
    if (item.v5) versions.push('v5');
    const compatibility = versions.join(' · ');
    return `| [**${item.title}**](https://github.com/${item.package})${owner} | ![Downloads](https://img.shields.io/packagist/dt/${item.package}.svg?style=flat-square) | ![Stars](https://img.shields.io/github/stars/${item.package}?style=flat-square) | ${compatibility} |\n`;
}

function generateLaravelRow(item) {
    const owner = isOwned(item.package) ? '' : ' Contribution';
    return `| [**${item.title}**](https://github.com/${item.package})${owner} | ![Downloads](https://img.shields.io/packagist/dt/${item.package}.svg?style=flat-square) | ![Stars](https://img.shields.io/github/stars/${item.package}?style=flat-square) |\n`;
}

function generateJetbrainsRow(item) {
    const owner = isOwned(item.package) ? '' : ' Contribution';
    const downloads = item.jetbrainsId
        ? `[![Downloads](https://img.shields.io/jetbrains/plugin/d/${item.jetbrainsId}.svg?style=flat-square)](https://plugins.jetbrains.com/plugin/${item.jetbrainsId})`
        : '';
    return `| [**${item.title}**](https://github.com/${item.package})${owner} | ![Release](https://img.shields.io/github/v/release/${item.package}?style=flat-square) | ${downloads} | ![Stars](https://img.shields.io/github/stars/${item.package}?style=flat-square) |\n`;
}

const byPackage = (a, b) => a.package.localeCompare(b.package);
const sorted = (arr) => arr.slice().sort(byPackage);

const startkitFeatured = sorted(plugins.startkit.featured).map(generateStartkitRow).join('');
const startkitLegacy = sorted(plugins.startkit.legacy).map(generateStartkitRow).join('');
const filamentPlugins = sorted(plugins.filament.plugins).map(generateFilamentRow).join('');
const filamentCollaborator = sorted(plugins.filament.collaborator).map(generateFilamentRow).join('');
const laravelList = sorted(plugins.laravel).map(generateLaravelRow).join('');
const cliList = sorted(plugins.cli).map(generateStartkitRow).join('');
const jetbrainsList = sorted(plugins.jetbrains).map(generateJetbrainsRow).join('');

readme = readme.replace(/\[STARTKIT_FEATURED\]/g, startkitFeatured.trim());
readme = readme.replace(/\[STARTKIT_LEGACY\]/g, startkitLegacy.trim());
readme = readme.replace(/\[FILAMENT_PLUGINS\]/g, filamentPlugins.trim());
readme = readme.replace(/\[FILAMENT_COLLABORATOR\]/g, filamentCollaborator.trim());
readme = readme.replace(/\[LARAVEL\]/g, laravelList.trim());
readme = readme.replace(/\[CLI\]/g, cliList.trim());
readme = readme.replace(/\[JETBRAINS\]/g, jetbrainsList.trim());
readme = readme.replace(/\[YEARS\]/g, yearExperience);

fs.writeFileSync('README.md', readme);
console.log('README.md has been updated successfully');
