# STELLAR TESTNET HASH FLOW

## Context

This is a test to validate how a record storage feature could be applied for food micro-entrepreneurs.

---

## Problem Being Solved

Micro-entrepreneurs receive service reports and certificates in simple files (PDF, Word, WhatsApp).

These documents can be edited, lost, or difficult to find when needed for inspection, proof of work, or to resolve a disagreement with a client.

Instead of relying on files saved in different locations and informal message exchanges, ALI stores and validates these documents in the same system used to manage services, ensuring organization and easy access.

---

## Flow Overview

1. Consultant generates a service report.
2. The system calculates a SHA256 hash of the document.
3. The hash is sent to Stellar Testnet.
4. The hash is stored in the transaction memo field.
5. The transaction hash becomes immutable proof of existence.

---

## Technical Execution

- Backend: Node.js
- Stellar SDK: @stellar/stellar-sdk
- Network: Stellar Testnet
- Horizon: https://horizon-testnet.stellar.org

---

## Endpoint

POST /register-hash

Request:
{
  "report": "Document content here"
}

Response:
{
  "documentHash": "...",
  "stellarTxHash": "..."
}

---

## Why Stellar?

- Low transaction cost
- Fast confirmation
- Built-in memo field for anchoring data
- Suitable for micropayments and escrow logic (future implementation)

---

## Future Implementation

- Escrow using Soroban smart contracts
- Certificate verification endpoint
- Public validation interface
