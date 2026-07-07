# Privlo — 3-minute video script (TokenOps Special Bounty)

**Bounty:** Zama Developer Program Mainnet Season 3 — Special Bounty Track × TokenOps  
**Length:** 3:00 max  
**Rules:** Real person on camera (start + end). Your voice only — no AI-generated video or voice.  
**Network:** Sepolia testnet  
**Live app:** https://privlo.vercel.app

---

## Before you record

### Accounts & wallets
- **Creator wallet** — Sepolia ETH + CTTT (mint via faucet in create flow)
- **Recipient wallet** — Sepolia ETH (different address from creator)
- Two browsers or one normal + one incognito works well

### Pre-stage (do this 10 min before)
1. Creator: open `/app/campaigns/new`, mint CTTT if balance is low
2. Create a small **Airdrop** with recipient wallet address (e.g. 500 CTTT)
3. Complete execution so claim appears in recipient inbox
4. Recipient: open `/app/claims` — confirm claim card is visible (same browser localStorage, or API if configured)

### Screen recording
- 1920×1080, hide bookmarks bar, close unrelated tabs
- Zoom browser to 100–110% so UI text is readable
- Have Sepolia Etherscan ready for tx link at the end

### Camera
- Face visible at **0:00–0:20** (intro) and **2:45–3:00** (close)
- Good lighting, quiet room, mic close to mouth

---

## Script

### 0:00–0:20 — ON CAMERA — Problem + intro

> "Hi, I'm **[YOUR NAME]**. Public blockchains are great for verifiable payments — but terrible for private ones.
>
> Payroll exposes salaries. Airdrops expose allocation sizes. Investor distributions expose cap table strategy.
>
> I built **Privlo** — a confidential distribution app on Sepolia using the **TokenOps SDK** and **ERC-7984** tokens. Let me show you the full flow."

**[Cut to screen share]**

---

### 0:20–0:40 — SCREEN — Landing + product overview

**Show:** https://privlo.vercel.app (landing page)

**Say:**

> "Privlo is the private distribution layer for onchain organizations. Creators configure confidential campaigns. Recipients decrypt only what belongs to them, then claim onchain.
>
> Every individual amount stays encrypted — from campaign creation through recipient claim."

**Do:** Scroll briefly past hero. Click **Create distribution** or nav to **Campaigns**.

---

### 0:40–1:35 — SCREEN — Creator demo (Airdrop) ⭐ Main judging moment

**Show:** `/app/campaigns/new`

**Say while clicking:**

> "I'll create a confidential airdrop — like a private team payout."

| Step | Action | Say (short) |
|------|--------|-------------|
| 1 | Connect creator wallet, confirm Sepolia | "Creator connects on Sepolia." |
| 2 | Select **Airdrop** | "Airdrop lets recipients claim on their schedule." |
| 3 | Campaign name, e.g. "Q2 contributor rewards" | "Name the campaign." |
| 4 | Token: CTTT — mint from faucet if needed | "We use TokenOps' confidential test token, CTTT." |
| 5 | Add recipient address + amount (or CSV) | "Recipients manually or via CSV — address and amount columns." |
| 6 | Next → **Review** step | "Review shows recipients, totals, and a privacy checklist." |
| 7 | Approve ERC-7984 operator if prompted | "TokenOps needs scoped operator approval on the confidential token." |
| 8 | Confirm execution, wallet signature | "Amounts encrypt in the browser before they hit the chain." |
| 9 | Success screen + tx hash | "TokenOps' pre-deployed Airdrop factory on Sepolia handles the contract side." |

**Say (wrap-up this section):**

> "Privlo adds the workflow teams need — validation, CSV import, review, wallet UX. TokenOps provides the audited confidential distribution contracts. No plaintext amounts in calldata."

---

### 1:35–2:25 — SCREEN — Recipient demo ⭐ Second judging moment

**Switch** to recipient wallet / browser.

**Show:** `/app/claims` → **My private claims**

**Say:**

> "Now the recipient. This is where privacy actually matters."

| Step | Action | Say (short) |
|------|--------|-------------|
| 1 | Connect recipient wallet | "Recipient connects the wallet that was allocated." |
| 2 | Show claim card — amount shows `••••••` | "The amount is concealed — encrypted onchain." |
| 3 | Point to **Visible only to you** badge | "Only this wallet can authorize a reveal." |
| 4 | Click **Decrypt amount**, approve wallet prompts | "TokenOps grants ACL access. Then EIP-712 user decryption runs." |
| 5 | Amount reveals (e.g. 500 CTTT) | "Now only the recipient sees their number." |
| 6 | Click **Claim [amount]**, confirm tx | "Claim submits the original issuer-signed encrypted payload." |
| 7 | **Claim confirmed** + Etherscan link | "Confidential tokens settle on Sepolia." |

**Say (wrap-up):**

> "Reveal and claim are separate, explicit steps. We never regenerate the signed encrypted input client-side. Plaintext never appears in transaction data."

---

### 2:25–2:42 — SCREEN — Disperse mention + dashboard (quick)

**Option A:** Brief flash of `/app/campaigns` dashboard  
**Option B:** In create flow, point at **Disperse** card without re-executing

**Say:**

> "For instant payroll, **Disperse** sends confidential transfers in one shot — same encryption, same TokenOps singleton on Sepolia.
>
> The dashboard is wallet-scoped: no fabricated volume or fake campaigns. Everything comes from your connected wallet and onchain state.
>
> We also ship an encrypted claim inbox API so authorizations can reach recipients across devices — production-style delivery, not just localStorage."

---

### 2:42–2:55 — SCREEN — Tech one-liner

**Show:** GitHub README or quick scroll of create + claims UI

**Say:**

> "Open source on GitHub. Built with React, TypeScript, wagmi, the TokenOps npm SDK, and ERC-7984 confidential tokens. This is confidential finance that feels like a real product — not a cryptography demo."

---

### 2:55–3:00 — ON CAMERA — Close

> "**Privlo** — private financial flows on public rails.
>
> Live at **privlo.vercel.app**. Code on GitHub. Thanks for watching."

**[End card — hold 3 seconds:]**

```
Privlo — Private Financial Flows
https://privlo.vercel.app
https://github.com/Datwebguy/privlo
```

---

## Judging criteria — what this script hits

| Criterion | How the video demonstrates it |
|-----------|-------------------------------|
| **UX / Frontend quality** | Polished landing, step wizard, privacy badges, concealed amounts, clear CTAs |
| **Functionality** | Full sender configure → execute → recipient decrypt → claim on Sepolia |
| **Demo quality** | Clear problem → solution → live flows → close in 3 minutes |
| **Real-world viability** | Payroll / airdrop / investor distribution framing; CSV; claim inbox mention |
| **Code quality** | Point to open-source repo; TokenOps pre-deployed contracts |

---

## Timing cheat sheet

| Segment | Duration |
|---------|----------|
| On-camera intro | 0:20 |
| Landing overview | 0:20 |
| Creator Airdrop demo | 0:55 |
| Recipient decrypt + claim | 0:50 |
| Disperse + dashboard + tech | 0:17 |
| On-camera close | 0:05 |
| **Total** | **~3:00** |

---

## If something breaks during recording

- **Faucet fails:** Pre-mint CTTT before recording
- **Claim not visible:** Use same-browser localStorage test, or pre-publish via API
- **Decrypt slow:** Say "Zama relayer authorization" while waiting — cut dead air in edit
- **Wrong network:** Switch to Sepolia on camera — shows real UX, not a failure

---

## Upload checklist

- [ ] Video ≤ 3 minutes
- [ ] Your face visible at start and end
- [ ] Your real voice (no AI)
- [ ] Shows TokenOps Disperse or Airdrop end-to-end
- [ ] Shows recipient decrypt + claim
- [ ] Mentions Sepolia + ERC-7984
- [ ] Upload to YouTube (unlisted) or Loom
- [ ] Paste video URL in bounty submission form