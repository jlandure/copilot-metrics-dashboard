# Éléments intégrés à GitHub Copilot

Sources consultées le 19 novembre 2026. Le catalogue du tableau de bord se trouve dans [`src/constants/copilotDefaults.ts`](src/constants/copilotDefaults.ts).

Dans **Skills & MCP**, les éléments intégrés reconnus sont masqués à l'ouverture. **Show Copilot defaults** les réaffiche dans les onglets et les classements, avec le badge **By default**. Ce badge signifie « fourni par Copilot sur au moins un client pris en compte », pas « actif pour tous les utilisateurs ». Le filtre change l'affichage, pas les données importées ni les totaux de l'export.

## Agents

La [référence officielle de Copilot CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#built-in-agents) liste ces sept sous-agents intégrés :

| Identifiant | Rôle |
| --- | --- |
| `code-review` | Revue de code en lecture seule. |
| `explore` | Exploration rapide du code. |
| `general-purpose` | Tâches complexes ou à plusieurs étapes. |
| `research` | Recherche et vérification de sources. |
| `rubber-duck` | Second avis sur une proposition, un changement ou des tests. |
| `security-review` | Revue de sécurité en lecture seule. |
| `task` | Exécution de commandes : builds, tests, lints. |

`search-subagent` n'est pas dans la liste CLI. Le [code officiel de VS Code](https://github.com/microsoft/vscode/blob/99669d956e3619df57c7950f7eaef827accbab68/extensions/copilot/src/extension/tools/common/toolNames.ts) identifie le sous-agent de recherche intégré sous le nom d'outil `search_subagent`. Le dashboard reconnaît la graphie `search-subagent` observée dans l'export ; cette correspondance n'est pas un contrat de télémétrie documenté.

Voir aussi [les sous-agents de VS Code](https://code.visualstudio.com/docs/agents/run/subagents) et [les agents personnalisés de GitHub Copilot](https://docs.github.com/en/copilot/concepts/customizations/custom-agents). Un nom absent de cette liste ne prouve pas qu'un agent vient d'un projet.

## Serveurs MCP

- **`github-mcp-server`** : [configuré automatiquement par Copilot CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#built-in-mcp-servers) lorsque l'authentification est disponible, sauf désactivation ou configuration de remplacement. L'identifiant `io.github.github/github-mcp-server` n'est pas assimilé à cette entrée automatique.
- **`ide`** : le [code officiel de l'extension GitHub Copilot Chat pour VS Code](https://github.com/microsoft/vscode-copilot-chat/blob/5863f5a7088958050792b5dccbe8b46c6e13eccc/src/extension/chatSessions/claude/common/mcpServers/ideMcpServer.ts) confirme cet identifiant pour le pont IDE de ses sessions Claude. Il n'est pas présenté comme un serveur présent dans tous les clients.
- **Non masqués** : `WorkIQ`, `browser-use` (ancien nom `github-copilot-browser`) et `computer-use` sont documentés dans la référence CLI, mais désactivés par défaut. Playwright est donné en [exemple de configuration](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers), pas comme serveur activé d'office.

## Skills

La [référence des skills intégrés à l'app GitHub Copilot](https://docs.github.com/en/copilot/reference/github-copilot-app-reference/built-in-skills) liste `af`, `agent-merge`, `create-canvas`, `orchestrate`, `pr-stack` et `customize-cloud-agent`. VS Code documente aussi [`automate` comme skill intégré à sa fenêtre Agents](https://code.visualstudio.com/docs/agent-customization/agent-skills#_discover-and-install-skills).

La [référence des skills de Copilot CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#skills-reference) décrit leur chargement et leur configuration. Elle ne justifie pas de considérer un skill `code-review` comme intégré parce que l'agent `code-review` l'est. Les skills de projet, personnels ou installés via un plugin restent visibles, sauf homonyme exact d'un nom intégré connu.

## Commandes slash et plugins

Le catalogue des commandes prend l'union des commandes et alias documentés dans les références [CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference#slash-commands-in-the-interactive-interface) et [app](https://docs.github.com/en/copilot/reference/github-copilot-app-reference/slash-commands). Il inclut aussi `/automate` dans [VS Code](https://code.visualstudio.com/docs/agents/reference/ai-features-cheat-sheet#_slash-commands), ainsi que `/computer` et `/pr-stack` documentés dans les guides du [CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/computer-use) et de [l'app](https://docs.github.com/en/copilot/reference/github-copilot-app-reference/built-in-skills). Une commande intégrée peut dépendre de la version, du contexte ou d'une fonctionnalité activée. Une commande comme `/devflow:fix` reste visible.

Les **plugins** ne sont pas filtrés : un [marketplace fourni par défaut](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference#managing-marketplaces) ne rend pas ses plugins intégrés ou préinstallés.

## Limites et maintenance

Les dimensions `totals_by_skill`, `totals_by_mcp`, `totals_by_custom_agent`, `totals_by_plugin` et `totals_by_slash_cmd` exploitées par le tableau de bord fournissent des noms et des compteurs, pas une provenance par ligne. La reconnaissance se fait donc par nom exact **dans sa catégorie**, sans distinction de casse ; seul le `/` initial est facultatif pour une commande. Un homonyme personnalisé peut être marqué, et un nom intégré inconnu reste visible. Aucun préfixe ni volume d'usage ne sert à déduire la provenance. Les lignes agrégées `other` et `custom` restent toujours visibles lorsque le filtre de nom le permet.

Pour mettre à jour le catalogue, vérifier les références ci-dessus, puis modifier `src/constants/copilotDefaults.ts`. Dans un client installé, le menu `/` de l'app, `/help` et `/mcp list` dans le CLI montrent les commandes ou serveurs disponibles dans le contexte courant.
