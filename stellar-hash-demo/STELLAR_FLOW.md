# STELLAR TESTNET HASH FLOW

## Context

This is a test to validate how a record storage feature could be applied for food micro-entrepreneurs.

---

## Problema

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

## Why use a blockchain layer?

The blockchain layer adds a secure external record of when a document was registered, ensuring that this information cannot be modified later.

This reduces uncertainty, increases trust in the information, and gives the entrepreneur more security when presenting documents to clients, partners, or during inspections.

---

## Future Implementation

- Escrow using Soroban smart contracts
- Certificate verification endpoint
- Public validation interface
