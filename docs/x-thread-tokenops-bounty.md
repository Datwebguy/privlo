# Privlo — X thread (TokenOps Special Bounty)

**Bounty:** Zama Developer Program Mainnet Season 3 — Special Bounty Track × TokenOps  
**Project name:** Privlo (do not include "Zama" in the project name)  
**Format:** 6 tweets — post as a thread, attach screenshots/GIFs where noted

---

## Tweet 1/6 — Hook

Public blockchains made payroll, investor distributions, and airdrops composable.

They also made every allocation amount public.

Salaries leak. Treasury strategy leaks. Investor positions leak.

Teams shouldn't have to choose between onchain finance and financial privacy.

We built **Privlo** to fix that. 🧵

---

## Tweet 2/6 — What Privlo is

**Privlo** is a confidential distribution layer for onchain teams.

Built with the **TokenOps SDK** + **ERC-7984** confidential tokens on **Sepolia**.

Creators run **Disperse** (instant private transfers) or **Airdrop** (recipient-bound claims).

Every amount stays encrypted from campaign creation through recipient claim.

🔗 Live: https://privlo.vercel.app  
📂 Open source: https://github.com/Datwebguy/privlo

**[Attach: landing page screenshot]**

---

## Tweet 3/6 — Creator flow

Creating a confidential campaign on Privlo:

1. Connect wallet → switch to Sepolia  
2. Choose **Disperse** or **Airdrop**  
3. Add recipients manually or upload CSV (`address,amount`)  
4. Amounts encrypt client-side before submission  
5. TokenOps preflight + ERC-7984 operator approval  
6. Execute on TokenOps' pre-deployed Sepolia contracts  

No plaintext amounts in calldata. No public allocation sizes onchain.

**[Attach: Create campaign → Review step screenshot]**

---

## Tweet 4/6 — Recipient flow

Recipients open **My private claims**, connect their wallet, and see only their authorizations.

They tap **Decrypt amount** — EIP-712 scoped permit, visible only to them.

Then **Claim** onchain using the original issuer-signed encrypted payload.

Reveal is recipient-controlled. Privlo never regenerates the signed input.

Bonus: encrypted claim inbox API for cross-device delivery.

**[Attach: My claims → decrypt UI screenshot]**

---

## Tweet 5/6 — Stack + what we shipped

**TokenOps** = audited confidential Disperse + Airdrop primitives.

**Privlo** = the product layer teams actually need:

→ Wallet-native UX (real wallet/RPC data only — no fake dashboards)  
→ CSV import, validation, privacy checklist on review  
→ Confidential balance panels for creators & claimers  
→ CTTT test-token faucet for end-to-end Sepolia testing  
→ Claim inbox API (Supabase) for production-style delivery  

Stack: React 18 · TypeScript · wagmi/viem · `@tokenops/sdk` · `@zama-fhe/react-sdk` 3.0

Contracts: TokenOps pre-deployed Disperse singleton + Airdrop factory on Sepolia.

---

## Tweet 6/6 — CTA + submission

If you're running payroll, investor unlocks, or community rewards onchain — amounts shouldn't be public by default.

**Privlo: Private Financial Flows.**

Try it → https://privlo.vercel.app/app/campaigns/new  
Docs → https://github.com/Datwebguy/privlo#how-to-use-privlo  

Built for @zama_fhe Developer Program — TokenOps Special Bounty Track.

Demo video in our submission. Feedback welcome. 🙏

---

## Posting tips

- Post tweet 1, then reply with 2→6 (true thread).
- Pin tweet 1 after publishing.
- Add 2–4 screenshots: landing, create/review, claims decrypt, claim confirmed.
- Optional hashtags (1–2 max): `#FHE` `#Web3` `#DeFi` — don't over-tag.
- Link your demo video in tweet 6 once uploaded (YouTube, Loom, or X video).