# Limitações Técnicas da Demonstração

## Estado Atual (MVP para Demo)

O sistema utiliza armazenamento em memória (JavaScript Map) para:
- Sessões de usuários (`activeSessions`)
- Mapeamento hash do documento → transação Stellar (`global.hashToTxMap`)

## Implicações

- **Reinicialização do servidor:** Todos os dados em memória são perdidos.
- **Escala horizontal:** Não é possível rodar múltiplas instâncias.

## Solução em Produção

| Componente atual | Solução de produção |
|------------------|---------------------|
| `activeSessions` (Map) | Redis com TTL |
| `hashToTxMap` (Map) | PostgreSQL |
| Rate limit em memória | Redis |

## Por que esta abordagem?

Foco da demo: validar integração com Stellar, hash completo, arquivos binários e verificação na blockchain.
