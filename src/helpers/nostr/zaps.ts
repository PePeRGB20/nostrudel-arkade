import { bech32 } from "@scure/base";
import { NostrEvent, utils } from "nostr-tools";
import { getZapPayment, isETag, isPTag, ProfileContent } from "applesauce-core/helpers";

// based on https://github.com/nbd-wtf/nostr-tools/blob/master/nip57.ts
export async function getZapEndpoint(metadata: ProfileContent): Promise<null | string> {
  try {
    let lnurl: string = "";
    const { lud06, lud16 } = metadata;
    if (lud06) {
      const { words } = bech32.decode(lud06 as `${string}1${string}`, 1000);
      const data = bech32.fromWords(words);
      lnurl = utils.utf8Decoder.decode(data);
    } else if (lud16) {
      const [name, domain] = lud16.split("@");
      lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
    } else {
      return null;
    }

    const res = await fetch(lnurl);
    const body = await res.json();

    if (body.allowsNostr && body.nostrPubkey) {
      return body.callback;
    }
  } catch (err) {
    /*-*/
  }

  return null;
}

export function isNoteZap(event: NostrEvent) {
  return event.tags.some(isETag);
}
export function isProfileZap(event: NostrEvent) {
  return !isNoteZap(event) && event.tags.some(isPTag);
}

export function totalZaps(zaps: NostrEvent[]) {
  return zaps
    .map((zap) => {
      // Try to get unified payment (supports both Lightning and Arkade)
      const unified = getUnifiedZapPayment(zap);
      if (unified) return unified.amount;

      // Fallback to legacy Lightning-only method
      const payment = getZapPayment(zap);
      return payment?.amount ?? 0;
    })
    .reduce((t, amount) => t + amount, 0);
}

// Arkade Zaps support
export interface ArkadeZapPayment {
  vtxoTxid: string;
  amount: number;
  arkadeAddress?: string;
}

/**
 * Check if a zap receipt is an Arkade zap
 * Arkade zaps have an "arkade" tag containing the vtxo txid
 */
export function isArkadeZap(event: NostrEvent): boolean {
  return event.kind === 9735 && event.tags.some((tag) => tag[0] === "arkade");
}

/**
 * Extract Arkade payment info from zap receipt
 * Returns vtxo txid and amount from tags
 */
export function getArkadeZapPayment(event: NostrEvent): ArkadeZapPayment | null {
  if (!isArkadeZap(event)) return null;

  let vtxoTxid = "";
  let amount = 0;
  let arkadeAddress: string | undefined;

  for (const tag of event.tags) {
    if (tag[0] === "arkade" && tag[1]) {
      vtxoTxid = tag[1];
    } else if (tag[0] === "amount" && tag[1]) {
      amount = parseInt(tag[1], 10);
    } else if (tag[0] === "bolt11" && tag[1] && tag[1].startsWith("ark1")) {
      // Some implementations might store arkade address in bolt11 tag
      arkadeAddress = tag[1];
    }
  }

  if (!vtxoTxid || !amount) return null;

  return {
    vtxoTxid,
    amount,
    arkadeAddress,
  };
}

/**
 * Get payment info from either Lightning or Arkade zap
 */
export function getUnifiedZapPayment(event: NostrEvent): { amount: number; identifier: string } | null {
  // Try Arkade first
  const arkadePayment = getArkadeZapPayment(event);
  if (arkadePayment) {
    return {
      amount: arkadePayment.amount,
      identifier: arkadePayment.vtxoTxid,
    };
  }

  // Fall back to Lightning
  const lightningPayment = getZapPayment(event);
  if (lightningPayment && lightningPayment.amount) {
    return {
      amount: lightningPayment.amount,
      identifier: lightningPayment.paymentRequest,
    };
  }

  return null;
}
