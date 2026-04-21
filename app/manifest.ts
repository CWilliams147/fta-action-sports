import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Find the Adventure",
    short_name: "FTA",
    description: "Find the Adventure. Raw action sports.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F4F4",
    theme_color: "#FF5F1F",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
