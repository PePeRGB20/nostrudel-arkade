import { useState } from "react";
import { Badge, ButtonGroup, Flex, FlexProps, IconButton, Text } from "@chakra-ui/react";

import { ChevronLeftIcon, ChevronRightIcon } from "../../icons";
import NavItems from "../components";
import useRootPadding from "../../../hooks/use-root-padding";
import AccountSwitcher from "../components/account-switcher";
import { CollapsedContext } from "../context";
import RelayConnectionButton from "../components/connections-button";
import PublishLogButton from "../components/publish-log-button";

export default function DesktopSideNav({ ...props }: Omit<FlexProps, "children">) {
  const [collapsed, setCollapsed] = useState(false);

  useRootPadding({ left: collapsed ? "var(--chakra-sizes-16)" : "var(--chakra-sizes-64)" });

  return (
    <CollapsedContext.Provider value={collapsed}>
      <Flex
        as="nav"
        aria-label="Main navigation"
        role="navigation"
        direction="column"
        gap="2"
        px="2"
        py="2"
        shrink={0}
        borderRightWidth={1}
        mt="var(--safe-top)"
        mb="var(--safe-bottom)"
        pt="var(--chakra-space-2)"
        pb="var(--chakra-space-2)"
        w={collapsed ? "16" : "64"}
        position="fixed"
        left="0"
        bottom="0"
        top="0"
        zIndex="modal"
        overflowY="auto"
        overflowX="hidden"
        overscroll="none"
        {...props}
      >
        <AccountSwitcher />
        {!collapsed && (
          <Flex direction="column" align="center" py="2" gap="1">
            <Text fontSize="sm" fontWeight="bold" color="purple.400">
              Arkade Edition
            </Text>
            <Badge colorScheme="purple" fontSize="xs">
              ⚡ Lightning & Arkade Zaps
            </Badge>
          </Flex>
        )}
        <NavItems />
        <ButtonGroup variant="ghost" role="group" aria-label="Navigation controls">
          <IconButton
            aria-label={collapsed ? "Expand navigation menu" : "Collapse navigation menu"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand" : "Collapse"}
            onClick={() => setCollapsed(!collapsed)}
            icon={collapsed ? <ChevronRightIcon boxSize={6} /> : <ChevronLeftIcon boxSize={6} />}
          />
          {!collapsed && (
            <>
              <RelayConnectionButton w="full" aria-label="Manage relay connections" />
              <PublishLogButton flexShrink={0} aria-label="Publish log" />
            </>
          )}
        </ButtonGroup>
      </Flex>
    </CollapsedContext.Provider>
  );
}
