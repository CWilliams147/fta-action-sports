import dynamic from "next/dynamic";

const SpotMapClient = dynamic(() => import("./SpotMapClient"), { ssr: false });

export default function MapPage() {
  return <SpotMapClient />;
}
