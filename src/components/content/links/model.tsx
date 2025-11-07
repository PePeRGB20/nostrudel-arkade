import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  IconButton,
  Link,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "../../error-boundary";
import { DownloadIcon, ThingsIcon } from "../../icons";
import ExpandableEmbed from "../components/content-embed";

const STLViewer = lazy(() => import("../../stl-viewer"));
const ModelViewer = lazy(() => import("../../model-viewer"));

function EmbeddedStlFile({ src }: { src: string }) {
  const preview = useDisclosure();

  return (
    <Card variant="outline">
      <CardHeader p="2" display="flex" alignItems="center" gap="2">
        <ThingsIcon boxSize={6} />
        <Heading size="sm">STL File</Heading>
        <ButtonGroup size="sm" ml="auto">
          <IconButton icon={<DownloadIcon />} aria-label="Download File" title="Download File" />
          {!preview.isOpen && (
            <Button colorScheme="primary" onClick={preview.onOpen}>
              Preview
            </Button>
          )}
        </ButtonGroup>
      </CardHeader>
      {preview.isOpen && (
        <CardBody px="2" pt="0" pb="2" overflow="hidden">
          <Suspense
            fallback={
              <Text>
                <Spinner /> Loading viewer...
              </Text>
            }
          >
            <ErrorBoundary>
              <STLViewer aspectRatio={16 / 10} width={1920} height={1080} w="full" h="auto" url={src} />
            </ErrorBoundary>
          </Suspense>
        </CardBody>
      )}
      <CardFooter p="2" pt="0" pb="2">
        <Link isExternal href={src} color="blue.500">
          {src}
        </Link>
      </CardFooter>
    </Card>
  );
}

function EmbeddedGlbGltfFile({ src, format }: { src: string; format: "glb" | "gltf" }) {
  const preview = useDisclosure({ defaultIsOpen: true });

  return (
    <Card variant="outline">
      <CardHeader p="2" display="flex" alignItems="center" gap="2">
        <ThingsIcon boxSize={6} />
        <Heading size="sm">{format.toUpperCase()} 3D Model</Heading>
        <ButtonGroup size="sm" ml="auto">
          <IconButton
            as={Link}
            href={src}
            isExternal
            icon={<DownloadIcon />}
            aria-label="Download File"
            title="Download File"
          />
          <Button colorScheme="primary" onClick={preview.onToggle}>
            {preview.isOpen ? "Hide" : "Show"}
          </Button>
        </ButtonGroup>
      </CardHeader>
      {preview.isOpen && (
        <CardBody px="2" pt="0" pb="2" overflow="hidden">
          <Suspense
            fallback={
              <Text>
                <Spinner /> Loading 3D viewer...
              </Text>
            }
          >
            <ErrorBoundary>
              <ModelViewer url={src} />
            </ErrorBoundary>
          </Suspense>
        </CardBody>
      )}
      <CardFooter p="2" pt="0" pb="2">
        <Link isExternal href={src} color="blue.500">
          {src}
        </Link>
      </CardFooter>
    </Card>
  );
}

export function renderModelUrl(match: URL) {
  const pathname = match.pathname.toLowerCase();

  // Handle STL files
  if (pathname.endsWith(".stl")) {
    return (
      <ExpandableEmbed label="STL Model" url={match} hideOnDefaultOpen>
        <EmbeddedStlFile src={match.toString()} />
      </ExpandableEmbed>
    );
  }

  // Handle GLB files
  if (pathname.endsWith(".glb")) {
    return (
      <ExpandableEmbed label="GLB 3D Model" url={match}>
        <EmbeddedGlbGltfFile src={match.toString()} format="glb" />
      </ExpandableEmbed>
    );
  }

  // Handle GLTF files
  if (pathname.endsWith(".gltf")) {
    return (
      <ExpandableEmbed label="GLTF 3D Model" url={match}>
        <EmbeddedGlbGltfFile src={match.toString()} format="gltf" />
      </ExpandableEmbed>
    );
  }

  return null;
}
