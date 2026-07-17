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
    return `| [**${item.title}**](https://github.com/${item.package})${owner} | ![Version](https://img.shields.io/packagist/v/${item.package}.svg?style=flat-square) | ![Downloads](https://img.shields.io/packagist/dt/${item.package}.svg?style=flat-square) | ![Stars](https://img.shields.io/github/stars/${item.package}?style=flat-square) |\n`;
}

function generateCakephpRow(item) {
    const gh = item.repo || item.package;
    const owner = isOwned(item.package) ? '' : ' Contribution';
    return `| [**${item.title}**](https://github.com/${gh})${owner} | ![Version](https://img.shields.io/packagist/v/${item.package}.svg?style=flat-square) | ![Downloads](https://img.shields.io/packagist/dt/${item.package}.svg?style=flat-square) | ![Stars](https://img.shields.io/github/stars/${gh}?style=flat-square) |\n`;
}

function generateJetbrainsRow(item) {
    const owner = isOwned(item.package) ? '' : ' Contribution';
    const marketplace = item.jetbrainsId
        ? `[![Marketplace](https://img.shields.io/badge/JetBrains-Marketplace-FE2857?style=flat-square&logo=jetbrains&logoColor=white)](https://plugins.jetbrains.com/plugin/${item.jetbrainsId})`
        : '';
    const downloads = item.jetbrainsId
        ? `[![Downloads](https://img.shields.io/jetbrains/plugin/d/${item.jetbrainsId}.svg?style=flat-square)](https://plugins.jetbrains.com/plugin/${item.jetbrainsId})`
        : '';
    return `| [**${item.title}**](https://github.com/${item.package})${owner} | ![Release](https://img.shields.io/github/v/release/${item.package}?style=flat-square) | ${marketplace} | ${downloads} | ![Stars](https://img.shields.io/github/stars/${item.package}?style=flat-square) |\n`;
}

function generateVscodeRow(item) {
    const owner = isOwned(item.package) ? '' : ' Contribution';
    const marketplace = item.vscodeId
        ? `[![Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=${item.vscodeId})`
        : '';
    const installs = item.vscodeId
        ? `![Installs](https://img.shields.io/visual-studio-marketplace/i/${item.vscodeId}.svg?style=flat-square)`
        : '';
    return `| [**${item.title}**](https://github.com/${item.package})${owner} | ![Release](https://img.shields.io/github/v/release/${item.package}?style=flat-square) | ${marketplace} | ${installs} | ![Stars](https://img.shields.io/github/stars/${item.package}?style=flat-square) |\n`;
}

function generateBrowserExtensionRow(item) {
    const owner = isOwned(item.package) ? '' : ' Contribution';
    const chromeStore = item.chromeStoreId
        ? `[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/${item.chromeStoreId})`
        : '';
    return `| [**${item.title}**](https://github.com/${item.package})${owner} | ![Release](https://img.shields.io/github/v/release/${item.package}?style=flat-square) | ${chromeStore} | ![Stars](https://img.shields.io/github/stars/${item.package}?style=flat-square) |\n`;
}

const byPackage = (a, b) => a.package.localeCompare(b.package);
const sorted = (arr) => arr.slice().sort(byPackage);

const startkitFeatured = sorted(plugins.startkit.featured).map(generateStartkitRow).join('');
const startkitLegacy = sorted(plugins.startkit.legacy).map(generateStartkitRow).join('');
const filamentPlugins = sorted(plugins.filament.plugins).map(generateFilamentRow).join('');
const filamentCollaborator = sorted(plugins.filament.collaborator).map(generateFilamentRow).join('');
const laravelList = sorted(plugins.laravel).map(generateLaravelRow).join('');
const laravelZeroList = sorted(plugins.laravelZero).map(generateStartkitRow).join('');
const cliList = sorted(plugins.cli).map(generateStartkitRow).join('');
const cakephpList = sorted(plugins.cakephp).map(generateCakephpRow).join('');
const jetbrainsList = sorted(plugins.jetbrains).map(generateJetbrainsRow).join('');
const vscodeList = sorted(plugins.vscode).map(generateVscodeRow).join('');
const browserExtensionsList = sorted(plugins.browserExtensions).map(generateBrowserExtensionRow).join('');

readme = readme.replace(/\[STARTKIT_FEATURED\]/g, startkitFeatured.trim());
readme = readme.replace(/\[STARTKIT_LEGACY\]/g, startkitLegacy.trim());
readme = readme.replace(/\[FILAMENT_PLUGINS\]/g, filamentPlugins.trim());
readme = readme.replace(/\[FILAMENT_COLLABORATOR\]/g, filamentCollaborator.trim());
readme = readme.replace(/\[LARAVEL\]/g, laravelList.trim());
readme = readme.replace(/\[LARAVEL_ZERO\]/g, laravelZeroList.trim());
readme = readme.replace(/\[CLI\]/g, cliList.trim());
readme = readme.replace(/\[CAKEPHP\]/g, cakephpList.trim());
readme = readme.replace(/\[JETBRAINS\]/g, jetbrainsList.trim());
readme = readme.replace(/\[VSCODE\]/g, vscodeList.trim());
readme = readme.replace(/\[BROWSER_EXTENSIONS\]/g, browserExtensionsList.trim());
readme = readme.replace(/\[YEARS\]/g, yearExperience);

fs.writeFileSync('README.md', readme);
console.log('README.md has been updated successfully');
