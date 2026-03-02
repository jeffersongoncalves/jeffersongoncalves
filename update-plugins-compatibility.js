/**
 * Script para verificar compatibilidade dos plugins Filament no Packagist
 *
 * Consulta a API do Packagist para cada plugin e verifica se existe
 * alguma versão que depende de filament/* ^3.x, ^4.x ou ^5.x
 *
 * Uso: node update-plugins-compatibility.js
 */

const fs = require('fs');
const https = require('https');

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'update-plugins-compatibility/1.0' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`JSON parse error for ${url}: ${e.message}`));
                }
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkFilamentCompatibility(requireSection) {
    if (!requireSection) return { v3: false, v4: false, v5: false };

    // Buscar qualquer dependência filament/* (filament/filament, filament/support, filament/actions, filament/forms, etc.)
    const filamentDeps = Object.entries(requireSection)
        .filter(([key]) => key.startsWith('filament/'))
        .map(([, value]) => value);

    if (filamentDeps.length === 0) return { v3: false, v4: false, v5: false };

    const result = { v3: false, v4: false, v5: false };

    for (const dep of filamentDeps) {
        // Match any constraint referencing major version N of filament
        // Handles: ^N.x, ~N.x, >=N.x, >N.x, N.*, and || OR constraints
        if (/(?:\^|~|>=?)3\.\d|3\.\*/.test(dep)) result.v3 = true;
        if (/(?:\^|~|>=?)4\.\d|4\.\*/.test(dep)) result.v4 = true;
        if (/(?:\^|~|>=?)5\.\d|5\.\*/.test(dep)) result.v5 = true;
    }

    return result;
}

async function getPackageCompatibility(packageName) {
    const url = `https://repo.packagist.org/p2/${packageName}.json`;

    try {
        const data = await fetch(url);
        const versions = data.packages?.[packageName] || [];

        const compat = { v3: false, v4: false, v5: false };

        for (const version of versions) {
            const result = checkFilamentCompatibility(version.require);
            if (result.v3) compat.v3 = true;
            if (result.v4) compat.v4 = true;
            if (result.v5) compat.v5 = true;
        }

        return compat;
    } catch (error) {
        console.error(`  [ERRO] ${packageName}: ${error.message}`);
        return null; // Signal error - preserve existing data
    }
}

async function main() {
    const pluginsPath = 'plugins.json';
    const plugins = JSON.parse(fs.readFileSync(pluginsPath, 'utf8'));

    console.log('Verificando compatibilidade dos plugins Filament no Packagist...\n');

    const allFilament = [...plugins.filament.featured, ...plugins.filament.more, ...plugins.filament.collaborator];

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const changes = [];

    for (let i = 0; i < allFilament.length; i++) {
        const plugin = allFilament[i];
        console.log(`Verificando: ${plugin.package}`);
        const compat = await getPackageCompatibility(plugin.package);

        if (compat === null) {
            errors++;
            console.log(`  [SKIP] Mantendo dados existentes para ${plugin.package}\n`);
        } else {
            const changed = plugin.v3 !== compat.v3 || plugin.v4 !== compat.v4 || plugin.v5 !== compat.v5;
            if (changed) {
                changes.push({
                    package: plugin.package,
                    before: { v3: plugin.v3, v4: plugin.v4, v5: plugin.v5 },
                    after: { v3: compat.v3, v4: compat.v4, v5: compat.v5 }
                });
                updated++;
            } else {
                skipped++;
            }

            plugin.v3 = compat.v3;
            plugin.v4 = compat.v4;
            plugin.v5 = compat.v5;

            const icon = (v) => v ? '✅' : '❌';
            console.log(`  V3: ${icon(compat.v3)}  V4: ${icon(compat.v4)}  V5: ${icon(compat.v5)}\n`);
        }

        // Rate limiting: 200ms delay between requests
        if (i < allFilament.length - 1) {
            await sleep(200);
        }
    }

    // Summary
    console.log('='.repeat(60));
    console.log('RESUMO:');
    console.log(`  Total: ${allFilament.length} plugins`);
    console.log(`  Atualizados: ${updated}`);
    console.log(`  Sem alteração: ${skipped}`);
    console.log(`  Erros (dados preservados): ${errors}`);

    if (changes.length > 0) {
        console.log('\nAlterações:');
        for (const c of changes) {
            const fmt = (o) => `v3:${o.v3 ? '✅' : '❌'} v4:${o.v4 ? '✅' : '❌'} v5:${o.v5 ? '✅' : '❌'}`;
            console.log(`  ${c.package}`);
            console.log(`    Antes:  ${fmt(c.before)}`);
            console.log(`    Depois: ${fmt(c.after)}`);
        }
    }
    console.log('');

    fs.writeFileSync(pluginsPath, JSON.stringify(plugins, null, 2) + '\n');
    console.log('plugins.json atualizado com sucesso!');
}

main().catch((err) => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
