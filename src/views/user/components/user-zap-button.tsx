import { IconButton, IconButtonProps, useDisclosure } from "@chakra-ui/react";
import useUserProfile from "../../../hooks/use-user-profile";
import { LightningIcon } from "../../../components/icons";
import ZapModal from "../../../components/event-zap-modal";
import { getArkadeAddressFromProfile, getLightningAddressFromProfile } from "../../../helpers/nostr/profile";

export default function UserZapButton({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "aria-label">) {
  const metadata = useUserProfile(pubkey);
  const { isOpen, onOpen, onClose } = useDisclosure();
  if (!metadata) return null;

  // Check if user has Lightning or Arkade address
  const lightningAddress = getLightningAddressFromProfile(metadata);
  const arkadeAddress = getArkadeAddressFromProfile(metadata);

  if (!lightningAddress && !arkadeAddress) return null;

  return (
    <>
      <IconButton
        onClick={onOpen}
        aria-label="Send Tip"
        title="Send Tip"
        icon={<LightningIcon />}
        color="yellow.400"
        {...props}
      />
      {isOpen && (
        <ZapModal
          isOpen={isOpen}
          onClose={onClose}
          pubkey={pubkey}
          onZapped={async () => {
            onClose();
          }}
        />
      )}
    </>
  );
}
