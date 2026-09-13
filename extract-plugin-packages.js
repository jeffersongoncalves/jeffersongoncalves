/**
 * Gera plugins-packages-owner.json e plugins-packages-collaborator.json:
 * listas achatadas de "owner/repo" extraídas do plugins.json, para o site
 * (jeffersongoncalves.dev.br) comparar com a última sincronização e importar
 * só o que é novo, em vez de reprocessar tudo a cada push.
 *
 * Mesma lógica de achatamento usada pelo SyncPluginsJsonJob do site: "repo"
 * sobrescreve "package" quando o vendor Composer difere do owner GitHub
 * (ex: pacotes CakePHP), e tudo sob uma chave "collaborator" vai pro arquivo
 * de colaborador.
 *
 * Uso: node extract-plugin-packages.js
 */

const fs = require('fs');

function collectEntries(node, isCollaborator, owner, collaborator) {
    if (!node || typeof node !== 'object') return;

    if (typeof node.package === 'string') {
        const slug = typeof node.repo === 'string' ? node.repo : node.package;
        (isCollaborator ? collaborator : owner).push(slug);
        return;
    }

    for (const [key, child] of Object.entries(node)) {
        collectEntries(child, key === 'collaborator' ? true : isCollaborator, owner, collaborator);
    }
}

function main() {
    const plugins = JSON.parse(fs.readFileSync('plugins.json', 'utf8'));

    const owner = [];
    const collaborator = [];

    for (const value of Object.values(plugins)) {
        collectEntries(value, false, owner, collaborator);
    }

    owner.sort();
    collaborator.sort();

    fs.writeFileSync('plugins-packages-owner.json', JSON.stringify(owner, null, 2) + '\n');
    fs.writeFileSync('plugins-packages-collaborator.json', JSON.stringify(collaborator, null, 2) + '\n');

    console.log(`plugins-packages-owner.json: ${owner.length} pacotes`);
    console.log(`plugins-packages-collaborator.json: ${collaborator.length} pacotes`);
}

main();
