# NIP-47 Extension: Support for Non-BOLT11 Payment Addresses

## Abstract

This extension to NIP-47 (Nostr Wallet Connect) adds support for payment protocols that use addresses which don't encode amounts, such as Arkade addresses. The `amount` parameter becomes mandatory when paying such addresses.

## Motivation

NIP-47 currently assumes all payment requests use BOLT11 invoices, which encode the payment amount. However, alternative payment protocols like Arkade use static addresses (similar to Lightning addresses) where the amount must be specified separately.

This creates interoperability issues when:
- Users want to send zaps via Arkade
- Wallets need to process payments to non-BOLT11 addresses
- Clients expect unified payment interfaces

## Specification

### Current NIP-47 Behavior

```json
{
  "method": "pay_invoice",
  "params": {
    "invoice": "lnbc..."
  }
}
```

The amount is extracted from the BOLT11 invoice.

### Extended Behavior for Arkade

For payment addresses that don't encode amounts (identified by the `ark1` prefix for Arkade):

```json
{
  "method": "pay_invoice",
  "params": {
    "invoice": "ark1qq4hfssprtcg...",
    "amount": 50000
  }
}
```

The `amount` field:
- **Type**: Integer
- **Unit**: Millisatoshis
- **Required**: When `invoice` doesn't start with `ln` or contain encoded amount
- **Optional**: For standard BOLT11 invoices (backwards compatible)

### Wallet Behavior

Wallets implementing this extension MUST:

1. Check if the `invoice` parameter contains an encoded amount (BOLT11)
2. If no encoded amount is found, the `amount` parameter MUST be present
3. Reject requests with `error: "AMOUNT_REQUIRED"` if amount is missing
4. Process the payment using the provided amount

### Response Format

Success response (unchanged):
```json
{
  "result_type": "pay_invoice",
  "result": {
    "preimage": "..." // For Lightning
    // OR
    "txid": "..."     // For Arkade VTXO
  }
}
```

Error response (new):
```json
{
  "result_type": "pay_invoice",
  "error": {
    "code": "AMOUNT_REQUIRED",
    "message": "Amount parameter is required for this payment address"
  }
}
```

## Arkade Zap Receipts (kind 9735)

When a wallet successfully processes an Arkade zap via NIP-47, it SHOULD publish a zap receipt with these tags:

```json
{
  "kind": 9735,
  "tags": [
    ["p", "recipient-pubkey"],
    ["arkade", "vtxo-txid"],
    ["amount", "50000"],
    ["description", "{zap request JSON}"]
  ],
  "content": ""
}
```

### Tag Specifications

- `["arkade", "<vtxo-txid>"]` - The VTXO transaction ID (payment proof)
- `["amount", "<millisats>"]` - The payment amount in millisatoshis
- `["description", "<json>"]` - The kind 9734 zap request (same as Lightning)

## Address Format Detection

Clients and wallets SHOULD detect address types:

| Prefix | Type | Amount Encoding |
|--------|------|-----------------|
| `lnbc`, `lntb`, `lnbcrt` | Lightning BOLT11 | Yes |
| `lnurl` | Lightning URL | Via callback |
| `ark1` | Arkade | No (separate param) |
| `user@domain` | Lightning Address | Via LNURL |

## Implementation Examples

### Client-side (sending zap)

```javascript
async function sendArkadeZap(arkadeAddress, amountMsats, zapRequest) {
  // Call NWC with amount parameter
  const response = await nwcClient.payInvoice({
    invoice: arkadeAddress,
    amount: amountMsats
  });

  return response.txid; // VTXO transaction ID
}
```

### Wallet-side (processing payment)

```javascript
async function payInvoice(params) {
  const { invoice, amount } = params;

  // Detect address type
  if (invoice.startsWith('ark1')) {
    if (!amount) {
      throw new Error('AMOUNT_REQUIRED',
        'Amount parameter is required for Arkade addresses');
    }

    // Process Arkade payment
    const vtxoTxid = await arkade.send(invoice, amount);
    return { txid: vtxoTxid };
  }

  // Standard BOLT11 processing
  if (invoice.startsWith('ln')) {
    // Amount is encoded in invoice
    const preimage = await lightning.payInvoice(invoice);
    return { preimage };
  }
}
```

## Profile Metadata Extension

Users wanting to receive Arkade zaps SHOULD add their Arkade address to their kind 0 metadata:

```json
{
  "name": "alice",
  "lud16": "alice@getalby.com",
  "arkade": "ark1qq4hfssprtcgzr8h..."
}
```

Clients SHOULD:
- Display both Lightning and Arkade options when both are available
- Allow users to choose their preferred payment method
- Fall back gracefully if one method is unavailable

## Backwards Compatibility

This extension is **fully backwards compatible**:

✅ Existing wallets ignore the `amount` parameter for BOLT11 invoices
✅ Existing clients continue using Lightning without changes
✅ New clients detect Arkade addresses and add `amount` parameter
✅ Wallets can progressively adopt Arkade support

## Security Considerations

1. **Amount Verification**: Wallets MUST validate that the `amount` parameter matches the user's intent before processing
2. **Address Validation**: Wallets SHOULD validate Arkade address format (bech32 with `ark1` prefix)
3. **User Confirmation**: Wallets MAY require explicit user confirmation for non-Lightning payments
4. **Rate Limiting**: Wallets SHOULD enforce rate limits on `pay_invoice` calls

## Reference Implementation

- **Client**: Nostrudel (pull request pending)
- **Wallet**: Arkadeos PWA with NWC support
- **Testing**: Successfully transmitted 50 sats via Arkade zap on 2025-11-06

## Related NIPs

- [NIP-47](https://github.com/nostr-protocol/nips/blob/master/47.md) - Nostr Wallet Connect
- [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md) - Lightning Zaps

## Authors

- PPRGB (implementation and testing)
- Claude (documentation assistance)

## Changelog

- 2025-11-06: Initial draft
- Successfully tested with Arkadeos wallet
- Verified zap receipt parsing in Nostrudel client
