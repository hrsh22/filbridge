# Wallet Connect Setup Guide

## Overview
The frontend now uses Web3Modal (@web3modal/wagmi) to provide a multi-provider wallet connection interface.

## Required Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Backend Filecoin address for storage operations  
NEXT_PUBLIC_BACKEND_FILECOIN_ADDRESS=0x...

# Reown (WalletConnect) Project ID for Web3Modal
# REQUIRED for the wallet connect modal to work
# Get one at: https://cloud.reown.com/
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
```

## How to Get a Reown Project ID

1. Visit https://cloud.reown.com/
2. Sign up or log in
3. Create a new project
4. Copy the Project ID
5. Add it to your `.env.local` file

## Architecture

### Initialization Flow

1. **lib/web3modal.ts** - Initializes Web3Modal synchronously at module load time (client-side only)
2. **app/providers.tsx** - Imports web3modal module to ensure initialization happens early
3. **Components** - Import web3modal module before using `useWeb3Modal` hook

### Key Files Modified

- `lib/web3modal.ts` - Web3Modal initialization logic
- `lib/wagmi.ts` - Wagmi config with injected + walletConnect connectors
- `app/providers.tsx` - Root provider setup
- `components/WalletButton.tsx` - Unified connect button (modal or fallback)
- `components/FilesTable.tsx` - Gated by `isConnected` with inline Connect button
- `components/CreditsPanel.tsx` - Gated by `isConnected` with inline Connect button
- `components/UploadPanel.tsx` - Gated by `isConnected` with inline Connect button

### Connection Gating

All components now use `isConnected` from `useAccount()` instead of checking `walletClient` to avoid false "Connect your wallet" messages when the wallet is already connected.

When not connected, components show:
- An inline message explaining what's needed
- A "Connect Wallet" button that opens the Web3Modal

### Fallback Behavior

If `NEXT_PUBLIC_REOWN_PROJECT_ID` is not set:
- `WalletButton` falls back to per-connector buttons (injected only)
- Gated components show the message without the Connect button

## Testing

1. Set the environment variable
2. Run `npm run dev`
3. Test the following scenarios:

**Not Connected:**
- Files, Credits, and Upload panels should show "Connect your wallet" with a button
- Clicking the button should open the Web3Modal with provider options
- Header should show "Connect Wallet" button

**Connected:**
- No false "Connect your wallet" messages should appear
- Files, Credits, and Upload panels should be functional
- Header should show truncated address and Disconnect button

## Troubleshooting

### "Please call createWeb3Modal before using useWeb3Modal"

This means the modal hasn't been initialized yet. Ensure:
1. `NEXT_PUBLIC_REOWN_PROJECT_ID` is set in `.env.local`
2. The server was restarted after adding the env variable
3. All components that use `useWeb3Modal` import `../lib/web3modal` first

### "WalletConnect Core is already initialized"

This warning indicates multiple initializations. The current code guards against this with a try-catch, but if it persists:
1. Clear `.next` directory: `rm -rf .next`
2. Restart dev server

### Modal doesn't open

Check browser console for errors. Ensure:
1. Project ID is valid
2. No network issues blocking WalletConnect CDN
3. Browser allows third-party scripts

