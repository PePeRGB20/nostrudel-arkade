# Add Arkade Zaps Support

## Summary

This PR adds support for **Arkade Zaps** alongside existing Lightning Zaps, enabling users to send and receive zaps using the Arkade protocol (ark addresses).

## Motivation

The Arkade protocol provides an alternative payment layer for Bitcoin that doesn't encode amounts in addresses (unlike BOLT11 invoices). This implementation allows Nostr users to:

- Send zaps via Arkade addresses (ark1...)
- Receive zaps on Arkade addresses
- Choose between Lightning and Arkade when both are available
- View and parse both Lightning and Arkade zap receipts

## Changes

### Profile Support
- Added `arkade` field to user profile metadata
- Profile editor now includes Arkade Address input field with validation
- Helper functions to extract Arkade addresses from profiles

### Zap Modal Enhancements
- Added payment type selector (Lightning/Arkade) when both are available
- New `getArkadePayRequestForPubkey()` function for creating Arkade zap requests
- Dynamic validation based on selected payment type

### Payment Processing
- New `ArkadePayRequestCard` component for Arkade payment UI
- WebLN/NWC integration with proper amount parameter handling
- Fallback methods for different WebLN implementations

### Zap Receipt Parsing
- `isArkadeZap()` - Detects Arkade zaps via "arkade" tag
- `getArkadeZapPayment()` - Extracts VTXO txid and amount
- `getUnifiedZapPayment()` - Unified interface for both Lightning and Arkade
- `totalZaps()` - Updated to support both types

### UI Updates
- Zap buttons now activate if user has Lightning OR Arkade address
- Zap receipts display correctly for both types
- Purple "Pay Arkade" button to distinguish from Lightning

## Technical Details

### Arkade vs Lightning Differences

| Aspect | Lightning | Arkade |
|--------|-----------|--------|
| Address format | `user@domain.com` or LNURL | `ark1q...` |
| Amount encoding | In BOLT11 invoice | Passed separately |
| Payment proof | Preimage | VTXO txid |
| Zap receipt tags | `["bolt11", "lnbc..."]`<br>`["preimage", "..."]` | `["arkade", "vtxo-txid"]`<br>`["amount", "210000"]` |

### NIP-47 Integration

For Arkade payments via NWC, the `amount` parameter MUST be passed explicitly:

```json
{
  "method": "pay_invoice",
  "params": {
    "invoice": "ark1qq4hfssprtcg...",
    "amount": 50000
  }
}
```

### Zap Receipt Format (kind 9735)

```json
{
  "kind": 9735,
  "tags": [
    ["p", "recipient-pubkey"],
    ["arkade", "vtxo-txid"],
    ["amount", "50000"],
    ["description", "{zap request json}"]
  ],
  "content": ""
}
```

## Testing

- ✅ Profile configuration with Arkade address
- ✅ Sending Arkade zaps via WebLN/NWC
- ✅ Receiving Arkade zaps in compatible wallet
- ✅ Payment type selection when both Lightning and Arkade available
- ✅ Parsing Arkade zap receipts
- ✅ Total zaps calculation includes both types

## Backwards Compatibility

✅ **100% backwards compatible** with existing Lightning zaps:
- Users without Arkade addresses continue using Lightning
- Existing Lightning zaps remain unchanged
- No breaking changes to any existing functionality
- Graceful degradation if Arkade not available

## Files Modified

```
src/helpers/nostr/profile.ts                                    [Types + helpers]
src/helpers/nostr/zaps.ts                                       [Zap parsing]
src/views/settings/profile/components/profile-edit-form.tsx    [Profile editor UI]
src/views/settings/profile/index.tsx                            [Profile saving]
src/components/event-zap-modal/index.tsx                        [Arkade request]
src/components/event-zap-modal/input-step.tsx                   [Payment selector]
src/components/event-zap-modal/pay-step.tsx                     [Arkade payment]
src/components/zap/event-zap-button.tsx                         [Note zap button]
src/components/zap/event-zap-icon-button.tsx                    [Icon button]
src/views/user/components/user-zap-button.tsx                   [Profile button]
src/components/embed-event/card/embedded-zap-receipt.tsx        [Display]
```

## Documentation

Full implementation documentation available in `ARKADE_ZAPS_IMPLEMENTATION.md`

## Requirements

- Compatible NWC wallet that supports Arkade (e.g., Arkadeos)
- WebLN provider with NWC client access
- Relay that accepts zap receipts with custom tags

## Future Enhancements

- [ ] Arkade zap splits (multiple recipients)
- [ ] Arkade-specific statistics and filtering
- [ ] Auto-detection of Arkade-compatible wallets
- [ ] Unit tests for Arkade functions

## Related Work

This implementation is based on successful testing with:
- Arkadeos wallet (PWA) with NWC support
- Bitcoin Connect for WebLN integration
- Standard Nostr relays for event distribution

---

**Implementation verified**: Successfully sent and received 50 sats via Arkade zap on 2025-11-06.
