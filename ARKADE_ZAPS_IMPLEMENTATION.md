# Implémentation des Arkade Zaps

## Vue d'ensemble

Cette implémentation ajoute le support complet des **Arkade Zaps** au client Nostr, en parallèle des Lightning Zaps existants. Les utilisateurs peuvent maintenant :

- Configurer une adresse Arkade dans leur profil
- Recevoir des zaps via Arkade ou Lightning
- Envoyer des zaps en choisissant entre Lightning et Arkade
- Voir tous les types de zaps (Lightning et Arkade) dans l'interface

## Différences clés : Lightning vs Arkade

| Aspect | Lightning | Arkade |
|--------|-----------|--------|
| **Format d'adresse** | `user@domain.com` ou LNURL | `ark1q...` |
| **Montant dans l'invoice** | ✅ Oui (BOLT11) | ❌ Non (passé séparément) |
| **Payment proof** | Preimage | VTXO txid |
| **Tags dans zap receipt** | `["bolt11", "lnbc..."]`<br>`["preimage", "..."]` | `["arkade", "vtxo-txid"]`<br>`["amount", "210000"]` |
| **NWC pay_invoice** | `pay_invoice(bolt11)` | `pay_invoice(arkade_addr, amount)` |

## Modifications effectuées

### 1. Types et helpers de profil

**Fichier:** `src/helpers/nostr/profile.ts`

```typescript
// Type étendu avec support Arkade
export type ExtendedProfileContent = ProfileContent & {
  arkade?: string;
};

// Extrait l'adresse Lightning (lud16 ou lud06)
export function getLightningAddressFromProfile(profile: ProfileContent | undefined): string | undefined {
  return profile?.lud16 || profile?.lud06;
}

// Extrait l'adresse Arkade (doit commencer par ark1)
export function getArkadeAddressFromProfile(profile: ProfileContent | undefined): string | undefined {
  const arkade = (profile as ExtendedProfileContent)?.arkade;
  if (arkade && typeof arkade === "string" && arkade.startsWith("ark1")) {
    return arkade;
  }
  return undefined;
}
```

### 2. Parsing des zap receipts

**Fichier:** `src/helpers/nostr/zaps.ts`

Nouvelles fonctions :

- `isArkadeZap(event)` - Détecte les zaps Arkade via le tag "arkade"
- `getArkadeZapPayment(event)` - Extrait le vtxo txid, montant et adresse
- `getUnifiedZapPayment(event)` - Obtient le paiement (Lightning ou Arkade)
- `totalZaps(zaps)` - Mis à jour pour supporter les deux types

```typescript
export interface ArkadeZapPayment {
  vtxoTxid: string;
  amount: number;
  arkadeAddress?: string;
}

// Détection des zaps Arkade
export function isArkadeZap(event: NostrEvent): boolean {
  return event.kind === 9735 && event.tags.some((tag) => tag[0] === "arkade");
}

// Extraction du paiement unifié (Lightning ou Arkade)
export function getUnifiedZapPayment(event: NostrEvent): { amount: number; identifier: string } | null {
  // Essaie Arkade d'abord
  const arkadePayment = getArkadeZapPayment(event);
  if (arkadePayment) {
    return {
      amount: arkadePayment.amount,
      identifier: arkadePayment.vtxoTxid,
    };
  }

  // Repli sur Lightning
  const lightningPayment = getZapPayment(event);
  if (lightningPayment) {
    return {
      amount: lightningPayment.amount,
      identifier: lightningPayment.bolt11,
    };
  }

  return null;
}
```

### 3. Éditeur de profil

**Fichiers:**
- `src/views/settings/profile/components/profile-edit-form.tsx`
- `src/views/settings/profile/index.tsx`

Ajout d'un champ "Arkade Address" dans le formulaire :

```tsx
<FormControl isInvalid={!!errors.arkade}>
  <FormLabel>Arkade Address</FormLabel>
  <Input
    placeholder="ark1q..."
    {...register("arkade", {
      validate: validateArkadeAddress,
    })}
  />
  <FormHelperText>Your Arkade address for receiving Arkade zaps.</FormHelperText>
  <FormErrorMessage>{errors.arkade?.message}</FormErrorMessage>
</FormControl>
```

Validation :
```typescript
const validateArkadeAddress = (value?: string) => {
  if (!value) return true;
  if (!value.startsWith("ark1")) {
    return "Arkade address must start with 'ark1'";
  }
  if (value.length < 20) {
    return "Arkade address appears too short";
  }
  return true;
};
```

### 4. Modal de Zap

#### 4.1 Fonction de requête Arkade

**Fichier:** `src/components/event-zap-modal/index.tsx`

```typescript
export async function getArkadePayRequestForPubkey(
  pubkey: string,
  event: NostrEvent | undefined,
  amount: number,
  comment?: string,
  additionalRelays?: Iterable<string>,
): Promise<PayRequest> {
  // 1. Récupère le profil et vérifie l'adresse Arkade
  const metadata = await firstValueFrom(eventStore.profile(pubkey));
  const arkadeAddress = getArkadeAddressFromProfile(metadata);
  if (!arkadeAddress) throw new Error("User missing Arkade address");

  // 2. Crée le zap request (même format que Lightning)
  const zapRequest: EventTemplate = {
    kind: kinds.ZapRequest,
    created_at: dayjs().unix(),
    content: comment ?? "",
    tags: [
      ["p", pubkey],
      ["relays", ...relays],
      ["amount", String(amount)],
    ],
  };

  // 3. Signe le zap request
  const signed = await account.signEvent(zapRequest);

  // 4. Retourne l'adresse et le montant séparément
  return {
    pubkey,
    isArkade: true,
    arkadeAddress,
    amount,
    invoice: JSON.stringify(signed),
  };
}
```

#### 4.2 Sélecteur de type de paiement

**Fichier:** `src/components/event-zap-modal/input-step.tsx`

```tsx
const [paymentType, setPaymentType] = useState<"lightning" | "arkade">(
  hasLightning ? "lightning" : "arkade"
);

// Affiche le sélecteur uniquement si les deux sont disponibles
{hasBoth && (
  <RadioGroup value={paymentType} onChange={setPaymentType}>
    <Stack direction="row" gap="4">
      <Radio value="lightning">Lightning</Radio>
      <Radio value="arkade">Arkade</Radio>
    </Stack>
  </RadioGroup>
)}
```

#### 4.3 Composant de paiement Arkade

**Fichier:** `src/components/event-zap-modal/pay-step.tsx`

```tsx
function ArkadePayRequestCard({
  pubkey,
  arkadeAddress,
  amount,
  onPaid,
}: {
  pubkey: string;
  arkadeAddress: string;
  amount: number;
  onPaid: () => void;
}) {
  const payWithWebLn = async () => {
    if (window.webln && arkadeAddress) {
      if (!window.webln.enabled) await window.webln.enable();

      // Pour Arkade, passer le montant séparément
      const weblnExtended = window.webln as any;
      if (weblnExtended.sendPayment.length > 1) {
        await weblnExtended.sendPayment(arkadeAddress, { amount });
      } else {
        await window.webln.sendPayment(arkadeAddress);
      }

      onPaid();
    }
  };

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        <Button
          variant="outline"
          colorScheme="purple"
          size="sm"
          leftIcon={<LightningIcon />}
          onClick={payWithWebLn}
        >
          Pay Arkade
        </Button>
      </UserCard>
    </Flex>
  );
}
```

### 5. Boutons Zap

Tous les boutons de zap ont été mis à jour pour s'activer si l'utilisateur a une adresse Lightning **OU** Arkade :

**Fichiers modifiés :**
- `src/components/zap/event-zap-button.tsx`
- `src/components/zap/event-zap-icon-button.tsx`
- `src/views/user/components/user-zap-button.tsx`

```typescript
const arkadeAddress = getArkadeAddressFromProfile(userProfile);
const canZap = !!metadata?.allowsNostr || !!arkadeAddress || event.tags.some((t) => t[0] === "zap");
```

### 6. Affichage des zaps

**Fichier:** `src/components/embed-event/card/embedded-zap-receipt.tsx`

```typescript
// Support Lightning et Arkade
const payment = getZapPayment(zap) || getUnifiedZapPayment(zap);
```

## Format du zap receipt Arkade (kind 9735)

Le wallet NWC doit publier un événement kind 9735 avec ces tags :

```json
{
  "kind": 9735,
  "tags": [
    ["p", "recipient-pubkey"],
    ["arkade", "vtxo-txid-here"],
    ["amount", "210000"],
    ["description", "{kind 9734 zap request json}"]
  ],
  "content": ""
}
```

## NIP-47 pay_invoice pour Arkade

Pour payer un zap Arkade via NWC :

```json
{
  "method": "pay_invoice",
  "params": {
    "invoice": "ark1q...",
    "amount": 210000
  }
}
```

⚠️ **Important :** Le paramètre `amount` DOIT être passé, contrairement à Lightning où le montant est encodé dans le BOLT11.

## Comment tester

### 1. Configurer une adresse Arkade

1. Aller dans **Paramètres → Profil**
2. Remplir le champ "Arkade Address" avec une adresse commençant par `ark1`
3. Sauvegarder

### 2. Recevoir un zap Arkade

1. Un utilisateur visite votre profil
2. Clique sur le bouton de zap ⚡
3. Si vous avez Lightning ET Arkade, il voit le sélecteur
4. Il sélectionne "Arkade" et entre le montant
5. Le paiement se fait via WebLN avec NWC

### 3. Envoyer un zap Arkade

1. Visitez le profil d'un utilisateur avec une adresse Arkade
2. Cliquez sur le bouton zap
3. Sélectionnez "Arkade" si les deux options sont disponibles
4. Entrez le montant et le commentaire
5. Cliquez sur "Pay Arkade"

### 4. Voir les zaps

Les zaps Arkade s'affichent de la même manière que les Lightning zaps :
- Dans les timelines
- Sur les profils
- Dans les notifications
- Le montant total inclut Lightning + Arkade

## Configuration requise

### Wallet NWC compatible Arkade

Le wallet doit supporter :
- NIP-47 (Nostr Wallet Connect)
- Méthode `pay_invoice` avec paramètre `amount`
- Publication de zap receipts (kind 9735) avec tags Arkade

### WebLN

L'interface WebLN doit supporter le passage du montant :

```typescript
webln.sendPayment(arkadeAddress, { amount: millisats })
```

## Rétrocompatibilité

✅ **100% compatible** avec les implémentations existantes :
- Les utilisateurs sans Arkade peuvent toujours utiliser Lightning
- Les anciens zaps Lightning continuent de fonctionner
- Aucune modification des événements Nostr existants
- Dégradation gracieuse si Arkade n'est pas disponible

## Prochaines étapes possibles

1. **Zap splits Arkade** : Support des splits de zaps pour les événements avec tags zap
2. **Historique Arkade** : Filtrage et affichage séparé des zaps Arkade
3. **Stats Arkade** : Statistiques distinctes Lightning vs Arkade
4. **Auto-détection** : Détecter automatiquement les wallets Arkade compatibles
5. **Tests** : Ajouter des tests unitaires pour les fonctions Arkade

## Fichiers modifiés

```
src/helpers/nostr/profile.ts                                    [Type + helpers]
src/helpers/nostr/zaps.ts                                       [Parsing zaps]
src/views/settings/profile/components/profile-edit-form.tsx    [UI profil]
src/views/settings/profile/index.tsx                            [Sauvegarde]
src/components/event-zap-modal/index.tsx                        [Requête Arkade]
src/components/event-zap-modal/input-step.tsx                   [Sélecteur]
src/components/event-zap-modal/pay-step.tsx                     [Paiement]
src/components/zap/event-zap-button.tsx                         [Bouton note]
src/components/zap/event-zap-icon-button.tsx                    [Bouton icône]
src/views/user/components/user-zap-button.tsx                   [Bouton profil]
src/components/embed-event/card/embedded-zap-receipt.tsx        [Affichage]
```

## Support

Pour toute question ou problème :
1. Vérifier que le wallet NWC supporte Arkade
2. Vérifier le format de l'adresse Arkade (commence par `ark1`)
3. Consulter les logs du navigateur pour les erreurs WebLN
4. Vérifier les tags du zap receipt (kind 9735)

---

**Implémenté le :** 2025-11-06
**Version Nostrudel :** 0.46.1
