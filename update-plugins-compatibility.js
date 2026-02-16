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

    const filamentDep = requireSection['filament/filament']
        || requireSection['filament/support']
        || '';

    return {
        v3: /\^3\.0|~3\.|>=3\./.test(filamentDep),
        v4: /\^4\.0|~4\.|>=4\.|4\.0\.0/.test(filamentDep),
        v5: /\^5\.0|~5\.|>=5\./.test(filamentDep),
    };
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
