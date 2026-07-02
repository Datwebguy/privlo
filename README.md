# Privlo

**Private Financial Flows**

Confidential payroll, investor distributions, airdrops, and vesting onchain,
powered by Zama Protocol and the TokenOps SDK.

## What is implemented

- Premium responsive landing page with privacy-first product messaging
- Injected wallet connection with Sepolia switching and error handling
- Live creator dashboard backed by Sepolia RPC and confirmed transaction records
- Functional CSV/manual campaign wizard for confidential Disperse and Airdrop
- TokenOps preflight, scoped ERC-7984 operator approval, encryption, and execution
- Airdrop funding plus per-recipient encryption and EIP-712 claim authorization
- Recipient claim inbox with real ACL grant, Zama decryption, and TokenOps claim
- Integrated Sepolia CTTT faucet for end-to-end testnet testing
- TokenOps-compatible Zama 3.0 React provider configured for Sepolia and viem
- Typed TokenOps 1.1 integration using its published FHE subpaths

There are no demo campaigns, amounts, dates, or claims. Simple Vesting is
visibly disabled until its execution flow is completed; it is never presented
as a working write path.

## Stack

- React 18, TypeScript, Vite, Tailwind CSS
- wagmi, viem, TanStack Query
- `@zama-fhe/sdk` and `@zama-fhe/react-sdk`
- `@tokenops/sdk/fhe-disperse`
- `@tokenops/sdk/fhe-airdrop`
- `@tokenops/sdk/fhe-vesting`

Node.js 22 or newer is required by the current Zama and TokenOps SDKs.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:5173`.

Environment variables:

```dotenv
VITE_SEPOLIA_RPC_URL=https://your-sepolia-rpc.example
VITE_ZAMA_RELAYER_URL=
VITE_PRIVLO_API_URL=
```

Omit `VITE_ZAMA_RELAYER_URL` to use the public Sepolia relayer from Zama's
chain preset. Set `VITE_PRIVLO_API_URL` to enable cross-device recipient claim
delivery. Without it, encrypted authorizations are stored locally for
same-browser testing only.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing page |
| `/app` | Creator dashboard |
| `/app/campaigns/new` | Campaign wizard |
| `/app/claims` | Recipient claim portal |

## Zama integration

[`src/providers/web3-provider.tsx`](src/providers/web3-provider.tsx) composes
wagmi, TanStack Query, and Zama's `ZamaProvider`. It rebuilds the Zama config
when the active wallet changes so permits cannot accidentally remain bound to
a previous signer. The configured FHE chain is Sepolia (`11155111`).

The correct recipient reveal sequence is demonstrated in
[`src/hooks/use-private-claim.ts`](src/hooks/use-private-claim.ts):

1. TokenOps `getClaimAmount` submits a transaction that grants the recipient
   ACL access and returns the receipt-derived encrypted handle.
2. Zama `useUserDecrypt` creates/reuses recipient credentials and requests a
   scoped decryption signature when required.
3. The authorized handle is decrypted by the Zama relayer for that recipient.
4. TokenOps `claim` submits the original issuer-signed encrypted input. It must
   not be re-encrypted client-side because the EIP-712 signature commits to the
   original handle.

## TokenOps integration

Privlo uses TokenOps SDK `1.1.x`, which calls pre-deployed contracts. No factory
deployment is needed.

Current SDK registry addresses on Sepolia:

| Product | Address |
| --- | --- |
| Confidential Disperse singleton | `0x710dD9885Cc9986EfD234E7719483147a6d8DBb4` |
| Confidential Airdrop factory | `0xbE6A3B78B36684fFee48De77d47Bc3393F5Acd4c` |
| Confidential Vesting factory | `0xA87701CE9A52D43681600583a99c85b50DbE3150` |
| Confidential test token (CTTT) | `0x258F9D60dc023870e4E3109c894D834D5377361a` |

[`src/lib/tokenops.ts`](src/lib/tokenops.ts) contains the framework-free clients.
For React, import the SDK hooks from their tree-shakeable subpaths:

```tsx
import { useDisperse } from "@tokenops/sdk/fhe-disperse/react";
import { useTokenOpsEncryptor } from "./hooks/use-tokenops-encryptor";

function SubmitDistribution() {
  const { encryptor } = useTokenOpsEncryptor();
  const disperse = useDisperse({ encryptor: () => encryptor });

  return (
    <button
      onClick={() =>
        disperse.mutate({
          token: "0xConfidentialToken",
          mode: "direct",
          recipients: ["0xRecipient"],
          amounts: [1_000_000n],
        })
      }
    >
      Encrypt and disperse
    </button>
  );
}
```

TokenOps' FHE clients expect its raw proof-producing encryptor shape. Privlo
therefore uses the SDK's official `createSepoliaEncryptorWeb` bridge rather
than casting an incompatible high-level dispatcher.

The Zama packages are deliberately pinned to `3.0.0`. TokenOps SDK `1.1.1`
currently imports the Zama 3.0 root exports (`RelayerWeb`, `SepoliaConfig`,
and `MainnetConfig`) at runtime. Zama 3.2 removed those root exports, which
causes a production bundle failure even though TypeScript can resolve the
TokenOps declarations. Upgrade these packages together after TokenOps ships a
compatible release.

## Developer Program alignment

Privlo targets both relevant Zama Developer Program tracks:

- **Special Bounty: TokenOps SDK** — the primary demo is a polished
  confidential distribution experience using TokenOps' deployed Disperse and
  Airdrop contracts.
- **Builder Track** — Privlo applies ERC-7984 confidential tokens to payroll,
  investor payouts, and team distributions with explicit recipient-controlled
  decryption.

The project emphasizes the qualities described by the Zama Developer Hub:
end-to-end encryption, composability, programmable confidentiality, familiar
Solidity/EVM tooling, and a real-world confidential-finance use case.

The implementation's protocol invariants and official references are recorded
in [`docs/protocol-integration.md`](docs/protocol-integration.md). The
submission readiness list is in
[`docs/developer-program-checklist.md`](docs/developer-program-checklist.md).

## Claim inbox API

TokenOps airdrop authorizations are recipient-bound offchain payloads. They
cannot be discovered from RPC logs alone. For production, configure an
authenticated inbox service at `VITE_PRIVLO_API_URL`:

```text
POST /claims
Content-Type: application/json

{ "claims": [{ "recipient": "0x…", "claim": { … } }] }

GET /claims?recipient=0x…
→ ConfidentialClaim[]
```

The service must authenticate the creator before `POST`, authenticate wallet
ownership before `GET`, return only claims for that wallet, rate-limit both
routes, and mark consumed authorizations after observing the claim transaction.
Payloads contain encrypted inputs and signatures, never plaintext amounts.

## Production data model

Keep only public campaign metadata in an indexer or database: campaign name,
contract address, transaction hash, timestamps, and status. Store the
recipient's issuer-generated `{ encryptedInput, signature }` authorization
behind wallet-authenticated access. Never persist plaintext amounts in browser
storage, analytics events, logs, or URLs.

## Sepolia deployment

1. Deploy the static Vite output (`npm run build`) to Vercel, Netlify, or an
   equivalent host.
2. Configure SPA rewrites to serve `index.html` for application routes.
3. Add `VITE_SEPOLIA_RPC_URL` at build time.
4. Deploy the authenticated claim inbox API and set `VITE_PRIVLO_API_URL`.
5. Fund the creator and recipient wallets with Sepolia ETH.
6. Use Privlo's integrated TokenOps CTTT faucet or a supported ERC-7984
   confidential token.
7. Confirm chain ID `11155111` before enabling writes.

### Vercel

The repository includes [`vercel.json`](vercel.json) with the Vite build,
`dist` output, SPA rewrites for `/app/*`, immutable asset caching, and baseline
security headers.

1. Import the GitHub repository into Vercel.
2. Select the Vite framework preset.
3. Use Node.js 22.
4. Add `VITE_SEPOLIA_RPC_URL` in Project Settings → Environment Variables.
5. Add `VITE_PRIVLO_API_URL` after deploying the claim inbox service.
6. Leave `VITE_ZAMA_RELAYER_URL` empty for the public Sepolia preset.
7. Deploy and verify `/`, `/app`, `/app/campaigns/new`, and `/app/claims`.

## Verification

```bash
npm run typecheck
npm run build
```

## Security notes

- Never log plaintext allocations or decrypted balances.
- Validate CSV addresses, duplicate recipients, token decimals, batch limits,
  and totals before encryption.
- Use TokenOps preflight helpers before every write.
- Keep issuer signing keys in an HSM/KMS-backed server process.
- Do not regenerate a recipient's airdrop encrypted input after signing it.
- Clear cached Zama credentials on wallet disconnect for shared devices.

## Project structure

```text
src/
├── components/
│   ├── brand/             # Privlo identity
│   ├── campaign/          # Campaign UI
│   ├── layout/            # Product shell
│   ├── ui/                # Reusable primitives
│   └── wallet/            # wagmi connection UI
├── config/                # Chain and web3 configuration
├── hooks/                 # Zama + TokenOps orchestration
├── lib/                   # Headless SDK clients and utilities
├── pages/                 # Landing, dashboard, create, and claims
├── providers/             # wagmi, Query, and Zama providers
├── styles/                # Tailwind globals and motion
└── types/                 # Domain types
```

## License

MIT
