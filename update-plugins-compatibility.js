/**
 * Script para verificar compatibilidade dos plugins Filament no Packagist
 *
 * Consulta a API do Packagist para cada plugin e verifica se existe
 * alguma versão que depende de filament/filament ^3.0, ^4.0 ou ^5.0
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

function checkFilamentCompatibility(requireSection) {
    if (!requireSection) return { v3: false, v4: false, v5: false };

    // Buscar qualquer dependência filament/* (filament/filament, filament/support, filament/actions, filament/forms, etc.)
    const filamentDeps = Object.entries(requireSection)
        .filter(([key]) => key.startsWith('filament/'))
        .map(([, value]) => value);

    if (filamentDeps.length === 0) return { v3: false, v4: false, v5: false };

    const result = { v3: false, v4: false, v5: false };

    for (const dep of filamentDeps) {
        if (/\^3\.0|~3\.|>=3\./.test(dep)) result.v3 = true;
        if (/\^4\.0|~4\.|>=4\.|4\.0\.0/.test(dep)) result.v4 = true;
        if (/\^5\.0|~5\.|>=5\./.test(dep)) result.v5 = true;
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
        return { v3: false, v4: false, v5: false };
    }
}

async function main() {
    const pluginsPath = 'plugins.json';
    const plugins = JSON.parse(fs.readFileSync(pluginsPath, 'utf8'));

    console.log('Verificando compatibilidade dos plugins Filament no Packagist...\n');

    for (const plugin of plugins.filament) {
        console.log(`Verificando: ${plugin.package}`);
        const compat = await getPackageCompatibility(plugin.package);

        plugin.v3 = compat.v3;
        plugin.v4 = compat.v4;
        plugin.v5 = compat.v5;

        const icon = (v) => v ? '✅' : '❌';
        console.log(`  V3: ${icon(compat.v3)}  V4: ${icon(compat.v4)}  V5: ${icon(compat.v5)}\n`);
    }

    fs.writeFileSync(pluginsPath, JSON.stringify(plugins, null, 2) + '\n');
    console.log('plugins.json atualizado com sucesso!');
}

main().catch((err) => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
