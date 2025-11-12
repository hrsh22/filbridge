# Frontend Demo: Synapse SDK (Testnet)

Classic demo UI that showcases using our SDK from a user's wallet on testnet:
- Connect wallet with Reown AppKit (Base Sepolia)
- Fund credits (simulated bridge via SDK)
- Upload a file with duration and cost estimate (Synapse formula)
- List and download files stored on Filecoin Calibration

## Prerequisites
- Backend running locally: `http://localhost:3001`
- SDK built at `../sdk/dist`
- Testnet:
  - Source: Base Sepolia (84532) with RUSD
  - Destination: Filecoin Calibration (314159)

## Setup

```bash
# from repo root (ensure SDK is built)
cd sdk && npm run build

# then in frontend
cd ../frontend
npm install
cp .env.local.example .env.local # then edit values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Env Vars
Create `frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_FILECOIN_ADDRESS=0xYourBackendFilecoinTestnetAddress
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
```

## What’s Included
- `Reown AppKit` + `wagmi` providers (`app/providers.tsx`)
- SDK client hook that wires OnlySwaps router for testnet (`lib/sdkClient.ts`)
- Panels for status, credits, upload, and files list in `components/`

## Notes
- Bridging is simulated by the SDK for demo speed; no SDK or backend changes needed.
- Ensure backend uses Filecoin Calibration RPC (WebSocket) and is healthy.

## Troubleshooting
- Ensure `NEXT_PUBLIC_REOWN_PROJECT_ID` is valid and AppKit is initialized.
- Check backend status at `/api/status`.
- If uploads fail with 402, fund credits first.

## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Reown AppKit (WalletKit)](https://docs.reown.com/)
