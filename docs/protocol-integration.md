# Zama Protocol integration notes

Official source: https://docs.zama.org/protocol

## Network

Privlo targets Ethereum Sepolia:

- Host chain ID: `11155111`
- Gateway chain ID: `10901`
- Relayer: resolved from Zama's `SepoliaConfig`
- RPC: configured with `VITE_SEPOLIA_RPC_URL`

The application consumes Zama's chain preset instead of duplicating ACL, KMS,
input-verifier, and gateway verification addresses.

## Encrypted inputs

Zama encrypted inputs are bound to both a contract address and a user address.
TokenOps' browser encryptor returns the ciphertext handles and shared input
proof expected by `FHE.fromExternal`.

Privlo applies that rule in two places:

- Disperse amounts are encrypted by the TokenOps SDK for the deployed singleton.
- Each airdrop authorization is encrypted for the deployed airdrop clone and
  the specific recipient. Re-encrypting it later would invalidate the
  issuer's EIP-712 signature.

Amounts are parsed into raw token units and rejected unless they are positive
and fit in `uint64`, matching the ERC-7984/TokenOps `euint64` representation.

## Access control and decryption

User decryption requires persistent ACL access to the ciphertext handle.
Privlo does not attempt to decrypt the external airdrop input directly.

The recipient flow is:

1. Call TokenOps `getClaimAmount`.
2. Wait for the transaction receipt.
3. Use the ACL-granted handle extracted from that receipt.
4. Pass the handle and airdrop contract address to Zama `useUserDecrypt`.
5. Let the Zama SDK create or reuse scoped recipient credentials.
6. Render the plaintext only in recipient-local React state.
7. Submit the original signed encrypted payload through TokenOps `claim`.

Privlo decrypts one `euint64` per request, comfortably below the protocol's
documented 2048-bit aggregate user-decryption limit.

## ERC-7984 operators

TokenOps contracts need temporary operator access to pull confidential tokens.
Privlo:

- checks operator state before execution;
- asks for an explicit wallet transaction;
- scopes Disperse approval to one hour;
- scopes Airdrop factory approval to the claim window plus one hour;
- never silently grants the maximum `uint48` deadline.

## Relayer deployment

Sepolia uses Zama's public relayer preset. Mainnet is intentionally not enabled:
the official docs require a Zama API key for the mainnet relayer. A future
mainnet deployment must keep that key server-side and proxy authenticated
requests rather than embedding it in Vite environment variables.

## Source references

- Protocol overview: https://docs.zama.org/protocol
- Relayer initialization:
  https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization
- Encrypted inputs:
  https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/input
- User decryption:
  https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption
- Web applications:
  https://docs.zama.org/protocol/relayer-sdk-guides/development-guide/webapp
- ERC-7984:
  https://docs.zama.org/protocol/examples/openzeppelin-confidential-contracts/erc7984
