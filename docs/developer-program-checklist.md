# Zama Developer Program checklist

Source: https://www.zama.org/developer-hub#developer-program

## Target tracks

- [x] Special Bounty: TokenOps SDK
- [x] Builder Track
- [ ] Bounty Track — not the primary submission category
- [ ] Startup Track — consider after the MVP

## Special Bounty evidence

- [x] Uses the published `@tokenops/sdk` package
- [x] Uses TokenOps' deployed Sepolia Disperse singleton
- [x] Uses TokenOps' deployed Sepolia Airdrop factory
- [x] Uses ERC-7984 confidential tokens
- [x] Encrypts recipient amounts before transaction submission
- [x] Provides CSV and manual recipient entry
- [x] Runs TokenOps preflight checks
- [x] Uses time-scoped operator permissions
- [x] Provides recipient-controlled reveal and claim UX
- [x] Links successful transactions to Sepolia Etherscan
- [x] Documents the TokenOps integration and deployed addresses

## Builder Track evidence

- [x] Real-world payroll and token distribution use case
- [x] End-to-end encrypted financial amounts
- [x] Composable public-chain execution
- [x] Explicit decryption access controlled by the recipient wallet
- [x] Responsive end-user interface
- [x] Wallet/network error handling
- [x] No sample campaigns or fabricated dashboard metrics
- [x] Production build, lint, typecheck, and dependency audit

## Before submission

- [x] Deploy the frontend to a public HTTPS URL — https://privlo.vercel.app
- [x] Publish the source repository — https://github.com/Datwebguy/privlo
- [x] Add screenshots and architecture diagram — `docs/assets/`
- [ ] Deploy an authenticated cross-device claim inbox (optional; localStorage works for demo)
- [ ] Record one real Disperse transaction on Sepolia
- [ ] Record one complete Airdrop create → decrypt → claim loop on Sepolia
- [ ] Put the real transaction links in the README (after recording)
- [ ] Record the three-minute demo — script: `docs/video-pitch-tokenops-bounty.md`
- [ ] Post X thread — script: `docs/x-thread-tokenops-bounty.md`
- [ ] Submit through the Zama Developer Program form (deadline: Jul 7, 2026 23:59 AOE)

## Demo narrative

1. Public blockchains expose compensation, investor allocations, and unlocks.
2. A creator imports recipients and executes an encrypted TokenOps campaign.
3. The transaction is verifiable on Sepolia while individual amounts remain
   confidential.
4. A recipient connects, authorizes decryption, privately reveals their amount,
   and claims.
5. Privlo turns Zama's FHE and TokenOps primitives into an approachable
   financial workflow.
