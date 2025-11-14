import {
  Alert,
  Button,
  ButtonGroup,
  Flex,
  FlexProps,
  IconButton,
  Spacer,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { PropsWithChildren, useEffect, useState } from "react";
import { useMount } from "react-use";

import { PayRequest } from ".";
import useAppSettings from "../../hooks/use-user-app-settings";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, ErrorIcon, LightningIcon } from "../icons";
import { InvoiceModalContent } from "../invoice-modal";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";

function UserCard({ children, pubkey }: PropsWithChildren & { pubkey: string }) {
  return (
    <Flex gap="2" alignItems="center" overflow="hidden">
      <UserAvatar pubkey={pubkey} size="md" />
      <UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
      <Spacer />
      {children}
    </Flex>
  );
}
function PayRequestCard({ pubkey, invoice, onPaid }: { pubkey: string; invoice: string; onPaid: () => void }) {
  const toast = useToast();
  const showMore = useDisclosure({ defaultIsOpen: !window.webln });

  const payWithWebLn = async () => {
    try {
      if (window.webln && invoice) {
        if (!window.webln.enabled) await window.webln.enable();
        await window.webln.sendPayment(invoice);
        onPaid();
      }
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        <ButtonGroup size="sm">
          {!!window.webln && (
            <Button
              variant="outline"
              colorScheme="yellow"
              size="sm"
              leftIcon={<LightningIcon />}
              isDisabled={!window.webln}
              onClick={payWithWebLn}
            >
              Pay
            </Button>
          )}
          <IconButton
            icon={showMore.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            aria-label="More Options"
            onClick={showMore.onToggle}
          />
        </ButtonGroup>
      </UserCard>
      {showMore.isOpen && <InvoiceModalContent invoice={invoice} onPaid={onPaid} />}
    </Flex>
  );
}

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
  const toast = useToast();
  const showMore = useDisclosure({ defaultIsOpen: !window.webln });

  const payWithWebLn = async () => {
    try {
      if (window.webln && arkadeAddress) {
        if (!window.webln.enabled) await window.webln.enable();

        // For Arkade, we need to pass the amount separately
        // The Arkade address doesn't encode the amount like BOLT11 does
        const weblnExtended = window.webln as any;

        // Try multiple methods to send Arkade payment with amount
        try {
          // Method 1: Try sendPayment with amount as second parameter
          const result = await weblnExtended.sendPayment(arkadeAddress, amount);
          toast({
            description: "Arkade zap sent successfully!",
            status: "success",
          });
          onPaid();
        } catch (error1: any) {
          try {
            // Method 2: Try sendPayment with options object
            const result2 = await weblnExtended.sendPayment(arkadeAddress, { amount: amount });
            toast({
              description: "Arkade zap sent successfully!",
              status: "success",
            });
            onPaid();
          } catch (error2: any) {
            // Method 3: Try to access NWC client directly
            if (weblnExtended.nwcClient || weblnExtended.client) {
              const nwcClient = weblnExtended.nwcClient || weblnExtended.client;
              const nwcResult = await nwcClient.payInvoice({
                invoice: arkadeAddress,
                amount: amount,
              });
              toast({
                description: "Arkade zap sent via NWC!",
                status: "success",
              });
              onPaid();
            } else {
              throw error2;
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        toast({
          description: `Payment failed: ${e.message}`,
          status: "error",
          duration: 5000,
        });
      }
    }
  };

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        <ButtonGroup size="sm">
          {!!window.webln && (
            <Button
              variant="outline"
              colorScheme="purple"
              size="sm"
              leftIcon={<LightningIcon />}
              isDisabled={!window.webln}
              onClick={payWithWebLn}
            >
              Pay Arkade
            </Button>
          )}
          <IconButton
            icon={showMore.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            aria-label="More Options"
            onClick={showMore.onToggle}
          />
        </ButtonGroup>
      </UserCard>
      {showMore.isOpen && (
        <Alert status="info">
          Arkade Address: {arkadeAddress.slice(0, 20)}...
          <br />
          Amount: {amount / 1000} sats
        </Alert>
      )}
    </Flex>
  );
}
function ErrorCard({ pubkey, error }: { pubkey: string; error: any }) {
  const showMore = useDisclosure();

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        <Button size="sm" variant="outline" colorScheme="red" leftIcon={<ErrorIcon />} onClick={showMore.onToggle}>
          Error
        </Button>
      </UserCard>
      {showMore.isOpen && <Alert status="error">{error.message}</Alert>}
    </Flex>
  );
}

export default function PayStep({
  callbacks,
  onComplete,
  ...props
}: Omit<FlexProps, "children"> & { callbacks: PayRequest[]; onComplete: () => void }) {
  const [paid, setPaid] = useState<string[]>([]);
  const { autoPayWithWebLN } = useAppSettings();

  const [payingAll, setPayingAll] = useState(false);
  const payAllWithWebLN = async () => {
    if (!window.webln) return;

    setPayingAll(true);
    if (!window.webln.enabled) await window.webln.enable();

    for (const callback of callbacks) {
      try {
        if (!paid.includes(callback.pubkey)) {
          if (callback.isArkade && callback.arkadeAddress && callback.amount) {
            // Pay Arkade with fallback methods
            const weblnExtended = window.webln as any;
            let success = false;

            try {
              // Method 1: Try sendPayment with amount as second parameter
              await weblnExtended.sendPayment(callback.arkadeAddress, callback.amount);
              success = true;
            } catch (error1: any) {
              try {
                // Method 2: Try sendPayment with options object
                await weblnExtended.sendPayment(callback.arkadeAddress, { amount: callback.amount });
                success = true;
              } catch (error2: any) {
                // Method 3: Try to access NWC client directly
                if (weblnExtended.nwcClient || weblnExtended.client) {
                  const nwcClient = weblnExtended.nwcClient || weblnExtended.client;
                  await nwcClient.payInvoice({
                    invoice: callback.arkadeAddress,
                    amount: callback.amount,
                  });
                  success = true;
                } else {
                  throw error2;
                }
              }
            }

            if (success) {
              setPaid((a) => a.concat(callback.pubkey));
            }
          } else if (callback.invoice) {
            // Pay Lightning
            await window.webln.sendPayment(callback.invoice);
            setPaid((a) => a.concat(callback.pubkey));
          }
        }
      } catch (e) {}
    }
    setPayingAll(false);
  };

  useEffect(() => {
    const withPayment = callbacks.filter((p) => !!p.invoice || (p.isArkade && !!p.arkadeAddress));
    const hasUnpaid = withPayment.some(({ pubkey }) => !paid.includes(pubkey));
    if (withPayment.length > 0 && !hasUnpaid) {
      onComplete();
    }
  }, [paid]);

  // if autoPayWithWebLN is enabled, try to pay all immediately
  useMount(() => {
    if (autoPayWithWebLN) {
      payAllWithWebLN();
    }
  });

  return (
    <Flex direction="column" gap="4" {...props}>
      {callbacks.map((callback) => {
        const { pubkey, invoice, error, isArkade, arkadeAddress, amount } = callback;

        if (paid.includes(pubkey))
          return (
            <UserCard key={pubkey} pubkey={pubkey}>
              <Button size="sm" variant="outline" colorScheme="green" leftIcon={<CheckIcon />}>
                Paid
              </Button>
            </UserCard>
          );
        if (error) return <ErrorCard key={pubkey} pubkey={pubkey} error={error} />;

        // Render Arkade payment card
        if (isArkade && arkadeAddress && amount) {
          return (
            <ArkadePayRequestCard
              key={pubkey}
              pubkey={pubkey}
              arkadeAddress={arkadeAddress}
              amount={amount}
              onPaid={() => setPaid((a) => a.concat(pubkey))}
            />
          );
        }

        // Render Lightning payment card
        if (invoice) {
          return (
            <PayRequestCard
              key={pubkey}
              pubkey={pubkey}
              invoice={invoice}
              onPaid={() => setPaid((a) => a.concat(pubkey))}
            />
          );
        }

        return null;
      })}
      {!!window.webln && (
        <Button
          variant="outline"
          size="md"
          leftIcon={<LightningIcon />}
          colorScheme="yellow"
          onClick={payAllWithWebLN}
          isLoading={payingAll}
        >
          Pay All
        </Button>
      )}
    </Flex>
  );
}
