import { Box, Button, Flex, Input, Radio, RadioGroup, Stack, Text } from "@chakra-ui/react";
import { getZapSplits } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { humanReadableSats } from "../../helpers/lightning";
import { getArkadeAddressFromProfile, getLightningAddressFromProfile } from "../../helpers/nostr/profile";
import useAppSettings from "../../hooks/use-user-app-settings";
import useUserLNURLMetadata from "../../hooks/use-user-lnurl-metadata";
import useUserProfile from "../../hooks/use-user-profile";
import { EmbedEventCard } from "../embed-event/card";
import { LightningIcon } from "../icons";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";
import CustomZapAmountOptions from "./zap-options";

function UserCard({ pubkey, percent }: { pubkey: string; percent?: number }) {
  const { address } = useUserLNURLMetadata(pubkey);

  return (
    <Flex gap="2" alignItems="center" overflow="hidden">
      <UserAvatar pubkey={pubkey} size="md" />
      <Box overflow="hidden">
        <UserLink pubkey={pubkey} fontWeight="bold" />
        <Text isTruncated>{address}</Text>
      </Box>
      {percent && (
        <Text fontWeight="bold" fontSize="lg" ml="auto">
          {Math.round(percent * 10000) / 100}%
        </Text>
      )}
    </Flex>
  );
}

export type InputStepProps = {
  pubkey: string;
  event?: NostrEvent;
  initialComment?: string;
  initialAmount?: number;
  allowComment?: boolean;
  showEmbed?: boolean;
  onSubmit: (values: { amount: number; comment: string; paymentType: "lightning" | "arkade" }) => void;
};

export default function InputStep({
  event,
  pubkey,
  initialComment,
  initialAmount,
  allowComment = true,
  showEmbed = true,
  onSubmit,
}: InputStepProps) {
  const { customZapAmounts } = useAppSettings();
  const userProfile = useUserProfile(pubkey);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<{
    amount: number;
    comment: string;
  }>({
    mode: "onBlur",
    defaultValues: {
      amount: initialAmount ?? (parseInt(customZapAmounts.split(",")[0]) || 100),
      comment: initialComment ?? "",
    },
  });

  // Check available payment methods
  const lightningAddress = getLightningAddressFromProfile(userProfile);
  const arkadeAddress = getArkadeAddressFromProfile(userProfile);
  const hasLightning = !!lightningAddress;
  const hasArkade = !!arkadeAddress;
  const hasBoth = hasLightning && hasArkade;

  // Default to Lightning if available, otherwise Arkade
  const [paymentType, setPaymentType] = useState<"lightning" | "arkade">(hasLightning ? "lightning" : "arkade");

  const splits = event ? (getZapSplits(event) ?? []) : [];

  const { metadata: lnurlMetadata } = useUserLNURLMetadata(pubkey);
  const canZapLightning = lnurlMetadata?.allowsNostr && lnurlMetadata?.nostrPubkey;
  const canZapArkade = hasArkade;

  // User can zap if they have the selected payment method
  const canZap = paymentType === "arkade" ? canZapArkade : canZapLightning;

  const showComment = allowComment && (splits.length > 0 || canZapLightning || canZapArkade || lnurlMetadata?.commentAllowed);
  const actionName = paymentType === "arkade" ? "Arkade Zap" : canZapLightning ? "Zap" : "Tip";

  const onSubmitZap = handleSubmit((values) => onSubmit({ ...values, paymentType }));

  return (
    <form onSubmit={onSubmitZap}>
      <Flex gap="4" direction="column">
        {splits.map((p) => (
          <UserCard key={p.pubkey} pubkey={p.pubkey} percent={p.percent} />
        ))}

        {showEmbed && event && <EmbedEventCard event={event} />}

        {hasBoth && (
          <RadioGroup value={paymentType} onChange={(value) => setPaymentType(value as "lightning" | "arkade")}>
            <Stack direction="row" gap="4">
              <Radio value="lightning">Lightning</Radio>
              <Radio value="arkade">Arkade</Radio>
            </Stack>
          </RadioGroup>
        )}

        {showComment && (
          <Input
            placeholder="Comment"
            {...register("comment", { maxLength: lnurlMetadata?.commentAllowed ?? 150 })}
            autoComplete="off"
          />
        )}

        <CustomZapAmountOptions onSelect={(amount) => setValue("amount", amount, { shouldDirty: true })} />

        <Flex gap="2">
          <Input
            type="number"
            placeholder="Custom amount"
            isInvalid={!!errors.amount}
            step={1}
            flex={1}
            {...register("amount", { valueAsNumber: true, min: 1 })}
          />
          <Button
            leftIcon={<LightningIcon />}
            type="submit"
            isLoading={isSubmitting}
            variant="solid"
            size="md"
            autoFocus
          >
            {actionName} {humanReadableSats(watch("amount"))} sats
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
