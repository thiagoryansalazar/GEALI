# ALI - Contract Registration

This demo simulates the registration of a signed contract, ensuring that the document is not altered after confirmation.

ALI does not create or store the contract. It registers a reference to the document at the time of signing, allowing you to verify later if there have been any changes.

## How contract registration works

The function of registering contracts with a hash has three main actions.

### 1. Register signed contract

Uses the route: `POST /sign-contract`

This action should be used when the entrepreneur has already signed the contract and wants to register it in ALI.

What happens:

- The system receives the contract content (file or text)
- Generates a SHA256 hash (digital fingerprint of the document)
- Registers the complete hash (32 bytes) on the Stellar Testnet using `Memo.hash`
- Returns a receipt with the transaction ID and a link for verification

---

### 2. Verify contract

Uses the route: `POST /verify-contract`

This action allows you to verify if the current contract remains the same as the one that was registered.

What happens:

- The system receives the current contract
- Generates a new hash
- Queries the Stellar blockchain to retrieve the original registered hash
- Compares the hashes
- Informs whether the document has been altered or not

---

### 3. Compare two documents (local)

Uses the route: `POST /compare` (executed on the frontend)

This action allows you to compare two documents directly, without needing to register them on the blockchain.

What happens:

- The system receives two documents
- Calculates the hash of both (via Web Crypto API)
- Compares the hashes locally
- Reports whether the documents are identical or different

**Useful for:** Verifying if a contract received from the consultant is the same as the one registered, without consuming server resources.

## Signature Flow

Signed contract

│

▼ SHA256 (full hash - 64 characters / 32 bytes)

│

▼ Memo.hash (full record in Stellar)

│

▼ Stellar Testnet

│

▼ Transaction confirmed + tx_hash + public link

│

▼ Proof available for future verification

## Technical Differentiators

| Feature | Implementation |

|----------------|---------------|

| Full hash | SHA256 (64 hex characters / 32 bytes) |

| Registration | Memo.hash (untruncated) |

| Binary files | Read as buffer (pure bytes, no UTF-8 conversion) |

| Verification | Direct query to the blockchain (does not trust the client) |

| Local comparison | Web Crypto API (no file sent to the server) |

| Security | Rate limiting (10 requests/minute) on the registration route |

## Benefits for the entrepreneur

1. Proof of existence:** The document existed on that date and time
2. Change detection:** Any modification to the document is detected
3. Independent verification:** Anyone can verify the hash on the blockchain
4. Low cost:** Transactions on the Stellar Testnet (and future Mainnet) have a cost close to zero