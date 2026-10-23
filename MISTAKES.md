# MISTAKES.md — Erros e aprendizados

Registro dos erros cometidos ou encontrados durante o desenvolvimento do app, e do que
aprendemos com eles. Objetivo: não repetir o mesmo erro duas vezes.

## Como registrar
- Adicione entradas novas **no topo** da seção "Registro" (mais recente primeiro).
- Seja curto e concreto: o que aconteceu, por quê e o que fazer daqui pra frente.
- Se um aprendizado virar regra permanente, leve-o também para o [AGENTS.md](AGENTS.md).

Modelo:

```
### AAAA-MM-DD — Título curto
- **Contexto:** onde/quando aconteceu (arquivo, tela, comando)
- **Erro:** o que deu errado (sintoma, mensagem de erro)
- **Causa:** por que aconteceu
- **Correção:** o que foi feito para resolver
- **Aprendizado:** regra prática para evitar no futuro
```

## Registro

### 2026-10-23 — README.md com linhas em UTF-16 no final
- **Contexto:** `README.md`, após o primeiro commit.
- **Erro:** as duas últimas linhas (`# repertorio-app`) foram gravadas em UTF-16 (bytes nulos
  entre os caracteres) num arquivo UTF-8, aparecendo como `#   r e p e r t o r i o - a p p`.
- **Causa:** provavelmente `echo "# repertorio-app" >> README.md` no Windows PowerShell 5.1,
  cujo redirecionamento `>>` grava em UTF-16 LE por padrão.
- **Correção:** pendente — remover as linhas corrompidas do final do README.
- **Aprendizado:** no Windows PowerShell 5.1, não usar `>`/`>>` para arquivos de texto do
  projeto; usar `Add-Content -Encoding utf8` / `Out-File -Encoding utf8` ou editar no VS Code.
