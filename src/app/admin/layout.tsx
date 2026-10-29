import type { Metadata } from "next";
import "./admin.css";

// El panel no se indexa en buscadores
export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel IonBikeStore" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
