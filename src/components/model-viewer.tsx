import { Box, BoxProps } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import "@google/model-viewer";

// Extend the JSX IntrinsicElements to include model-viewer
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerJSX &
        React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface ModelViewerJSX {
  src?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "auto-rotate-delay"?: number;
  "rotation-per-second"?: string;
  loading?: "auto" | "lazy" | "eager";
  "reveal"?: "auto" | "manual";
  "shadow-intensity"?: number;
  "shadow-softness"?: number;
  environment?: string;
  "skybox-image"?: string;
  poster?: string;
  style?: React.CSSProperties;
  class?: string;
}

export default function ModelViewer({
  url,
  poster,
  ...props
}: Omit<BoxProps, "children"> & { url: string; poster?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force a re-render when the model-viewer is added to the DOM
    // This helps with initial rendering
    if (containerRef.current) {
      const modelViewer = containerRef.current.querySelector("model-viewer");
      if (modelViewer) {
        // Trigger any necessary initialization
        (modelViewer as any).updateComplete?.then(() => {
          console.log("Model viewer loaded:", url);
        });
      }
    }
  }, [url]);

  return (
    <Box ref={containerRef} {...props}>
      <model-viewer
        src={url}
        alt="3D Model"
        camera-controls
        auto-rotate
        auto-rotate-delay={1000}
        rotation-per-second="30deg"
        shadow-intensity={1}
        shadow-softness={0.5}
        ar
        ar-modes="webxr scene-viewer quick-look"
        loading="eager"
        reveal="auto"
        poster={poster}
        style={{
          width: "100%",
          height: "500px",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
        }}
      >
        <div slot="progress-bar" style={{ display: "none" }} />
      </model-viewer>
    </Box>
  );
}
