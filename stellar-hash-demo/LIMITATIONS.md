# Technical Limitations of the Demonstration

## Current State (MVP for Demo)

The system uses in-memory storage (JavaScript Map) for:
- User sessions (`activeSessions`)
- Mapping document hash → Stellar transaction (`global.hashToTxMap`)

## Implications

- **Server restart:** All data in memory is lost.

- **Horizontal scaling:** It is not possible to run multiple server instances sharing the same state.

## Production Solution

| Current component | Production solution |

|------------------|---------------------|

| `activeSessions` (Map) | Redis with TTL (automatic expiration) |

| `hashToTxMap` (Map) | PostgreSQL (persistence) |

| Rate limit in memory | Redis (distributed counter) |

## Why this approach for the demo? The focus of this demonstration is to validate:

1. Integration with the Stellar Testnet
2. Full hash logging via `Memo.hash`
3. Correct processing of binary files (PDF, DOC, TXT)
4. Verification flow querying the blockchain

Memory storage is sufficient for a continuous demonstration, where the server is not restarted during the presentation.

## Implemented Security Notes

- Rate limiting: 10 requests per minute on the `/sign-contract` route
- Upload limit: 5MB per file
- Sensitive variables in `.env` (not versioned)
- Hash calculated on original bytes (without UTF-8 conversion)

```
