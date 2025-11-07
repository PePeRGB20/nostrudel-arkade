# Pull Request Submission Guide

This guide will help you submit PRs for Arkade Zaps support to both Nostrudel and the NIPs repository.

## Prerequisites

1. GitHub account
2. Git installed and configured
3. Fork access to repositories

---

## Part 1: Nostrudel PR

### Step 1: Create GitHub Fork

```bash
# Go to https://github.com/hzrd149/nostrudel
# Click "Fork" button (top right)
# This creates your own copy at: https://github.com/YOUR-USERNAME/nostrudel
```

### Step 2: Add Your Fork as Remote

```bash
cd C:\Users\peper\Documents\dev\nostrarkadezap\VersionNIPWallet\nostrudel

# Add your fork as a remote
git remote add myfork https://github.com/YOUR-USERNAME/nostrudel.git

# Verify remotes
git remote -v
```

### Step 3: Create Feature Branch

```bash
# Create and switch to new branch
git checkout -b feature/arkade-zaps-support

# Verify you're on the new branch
git branch
```

### Step 4: Commit Your Changes

```bash
# Stage all modified files
git add src/helpers/nostr/profile.ts
git add src/helpers/nostr/zaps.ts
git add src/views/settings/profile/components/profile-edit-form.tsx
git add src/views/settings/profile/index.tsx
git add src/components/event-zap-modal/index.tsx
git add src/components/event-zap-modal/input-step.tsx
git add src/components/event-zap-modal/pay-step.tsx
git add src/components/zap/event-zap-button.tsx
git add src/components/zap/event-zap-icon-button.tsx
git add src/views/user/components/user-zap-button.tsx
git add src/components/embed-event/card/embedded-zap-receipt.tsx
git add ARKADE_ZAPS_IMPLEMENTATION.md

# Create commit
git commit -m "feat: Add Arkade Zaps support

- Add arkade field to user profile metadata
- Implement Arkade zap request and payment flow
- Add payment type selector (Lightning/Arkade)
- Support Arkade zap receipt parsing
- Enable zap buttons for Arkade addresses
- Full backwards compatibility with Lightning zaps

Tested successfully with Arkadeos wallet via NWC."
```

### Step 5: Push to Your Fork

```bash
# Push branch to your fork
git push myfork feature/arkade-zaps-support
```

### Step 6: Create Pull Request on GitHub

1. Go to: `https://github.com/YOUR-USERNAME/nostrudel`
2. You'll see a banner: "Compare & pull request" - Click it
3. **Title**: `feat: Add Arkade Zaps support`
4. **Description**: Copy content from `PULL_REQUEST_TEMPLATE.md`
5. Make sure base repository is: `hzrd149/nostrudel` and base branch is: `main`
6. Click **"Create pull request"**

### Step 7: Respond to Feedback

The maintainer (hzrd149) will review your PR. Be prepared to:
- Answer questions about implementation
- Make requested changes
- Provide additional testing evidence

---

## Part 2: NIPs Repository PR

### Step 1: Fork NIPs Repository

```bash
# Go to https://github.com/nostr-protocol/nips
# Click "Fork" button
```

### Step 2: Clone Your Fork

```bash
cd C:\Users\peper\Documents\dev\nostrarkadezap\VersionNIPWallet

# Clone your fork
git clone https://github.com/YOUR-USERNAME/nips.git
cd nips
```

### Step 3: Create Feature Branch

```bash
# Create branch
git checkout -b arkade-nip47-extension
```

### Step 4: Edit NIP-47

```bash
# Open 47.md in your editor
# Navigate to: nips/47.md
```

Add this section after the "Methods" section:

```markdown
## Extended Parameters for Non-BOLT11 Addresses

For payment addresses that don't encode amounts (such as Arkade addresses starting with `ark1`),
the `amount` parameter MUST be included with `pay_invoice`.

### pay_invoice with amount parameter

Request:
```json
{
  "method": "pay_invoice",
  "params": {
    "invoice": "ark1qq4hfssprtcg...",
    "amount": 50000  // millisatoshis, REQUIRED for non-BOLT11
  }
}
```

Response unchanged. For Arkade, wallets MAY return `txid` instead of `preimage`:
```json
{
  "result_type": "pay_invoice",
  "result": {
    "txid": "9934a446314e..."  // VTXO transaction ID
  }
}
```

### Address Type Detection

| Prefix | Type | Amount Parameter |
|--------|------|------------------|
| `lnbc`, `lntb`, `lnbcrt` | BOLT11 | Optional (ignored) |
| `ark1` | Arkade | Required |

Wallets MUST return error code `AMOUNT_REQUIRED` if amount is missing for non-BOLT11 addresses.

## Arkade Zap Receipts

For Arkade zaps, the kind 9735 event SHOULD include these tags:

- `["arkade", "<vtxo-txid>"]` - Payment proof (VTXO transaction ID)
- `["amount", "<millisats>"]` - Payment amount
- `["description", "<json>"]` - kind 9734 zap request

Example:
```json
{
  "kind": 9735,
  "tags": [
    ["p", "recipient-pubkey"],
    ["arkade", "9934a446314e..."],
    ["amount", "50000"],
    ["description", "{...}"]
  ]
}
```
```

### Step 5: Commit and Push

```bash
# Stage changes
git add 47.md

# Commit
git commit -m "Add Arkade support to NIP-47

Extend pay_invoice method to support non-BOLT11 addresses
like Arkade that require explicit amount parameter.

- Add amount parameter specification
- Define Arkade zap receipt format
- Address type detection table
- Error handling for missing amounts

Backwards compatible with existing BOLT11 implementations."

# Push to your fork
git push origin arkade-nip47-extension
```

### Step 6: Create Pull Request

1. Go to: `https://github.com/YOUR-USERNAME/nips`
2. Click "Compare & pull request"
3. **Title**: `NIP-47: Add support for Arkade and non-BOLT11 addresses`
4. **Description**:

```markdown
This PR extends NIP-47 to support payment protocols that use addresses
which don't encode amounts (like Arkade).

## Changes
- Add optional `amount` parameter to `pay_invoice` method
- Required for non-BOLT11 addresses (Arkade: `ark1...`)
- Define Arkade zap receipt format (kind 9735)
- Address type detection guidelines

## Motivation
Arkade is a Bitcoin payment protocol using static addresses (similar
to Lightning addresses) where the amount must be specified separately.

## Backwards Compatibility
✅ Fully compatible - existing wallets ignore `amount` for BOLT11

## Testing
Successfully tested with:
- Arkadeos wallet (NWC-enabled)
- Nostrudel client
- 50 sats transferred via Arkade zap

## Reference Implementation
- Client: Nostrudel (PR pending)
- Wallet: Arkadeos PWA

Related discussion: [link to Arkade protocol docs if available]
```

5. Click **"Create pull request"**

---

## Part 3: Arkadeos Wallet Repository

### Option A: New Public Repository

```bash
cd C:\Users\peper\Documents\dev\nostrarkadezap

# Initialize git if not already done
git init

# Create repository on GitHub
# Go to https://github.com/new
# Name: "arkadeos-wallet" or similar

# Add remote
git remote add origin https://github.com/YOUR-USERNAME/arkadeos-wallet.git

# Create README
echo "# Arkadeos Wallet - NWC Enabled" > README.md
echo "Bitcoin Arkade wallet with Nostr Wallet Connect (NIP-47) support" >> README.md

# Add, commit, push
git add .
git commit -m "Initial commit: Arkadeos wallet with NWC support"
git push -u origin main
```

### Option B: Contribute to Existing Arkade Repo

If Arkadeos is already open-source:
1. Fork the repository
2. Create branch with your NWC implementation
3. Submit PR to original repository

---

## Timeline & Expectations

### Nostrudel PR
- **Review time**: 1-7 days
- **Likely questions**: Testing, edge cases, WebLN compatibility
- **Acceptance**: High (clean implementation, backwards compatible)

### NIPs PR
- **Review time**: 1-4 weeks (NIPs have slower review cycles)
- **Discussion**: Expect community feedback on standardization
- **Consensus**: May require adjustments based on community input

### Tips for Success

1. **Be Responsive**: Answer questions within 24-48 hours
2. **Be Patient**: NIPs take time due to community consensus
3. **Be Flexible**: Be willing to adjust implementation
4. **Provide Evidence**: Link to working demo or video if possible
5. **Stay Professional**: Technical, concise communication

---

## After PRs Are Merged

1. **Deploy Nostrudel**: You can deploy your fork to Vercel/Netlify
2. **Promote**: Share on Nostr, Twitter, etc.
3. **Support**: Help others implement Arkade zaps
4. **Iterate**: Gather feedback and propose improvements

---

## Need Help?

- Nostrudel issues: https://github.com/hzrd149/nostrudel/issues
- NIPs discussion: https://github.com/nostr-protocol/nips/discussions
- Nostr dev chat: Check popular Nostr relays for dev channels

Good luck! 🚀
