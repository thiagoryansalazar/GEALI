# STELLAR TESTNET HASH FLOW

## Context

This demo represents the anchoring of service reports on Stellar Testnet.
The goal is to simulate how ALI Consultora can guarantee document integrity between entrepreneur and consultant.

---

## Problem Being Solved

Service reports and certificates can be altered after delivery.
There is no simple and low-cost way for microentrepreneurs to verify authenticity and timestamp.

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
