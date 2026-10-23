# CLAUDE.md

As regras do projeto ficam em AGENTS.md (compartilhadas com outros agentes):

@AGENTS.md

## Específico do Claude Code
- No início de cada tarefa, leia [MISTAKES.md](MISTAKES.md) para não repetir erros já registrados.
- Ao final de uma tarefa em que algo deu errado (bug introduzido, comando que falhou,
  suposição incorreta, retrabalho), adicione uma entrada em MISTAKES.md antes de encerrar.
- Ambiente do desenvolvedor: Windows. Ao usar PowerShell para escrever arquivos, force
  UTF-8 (`-Encoding utf8`) — ou use as ferramentas de edição de arquivo em vez do shell.
- Responda ao usuário em português.
