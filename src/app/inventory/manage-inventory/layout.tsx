import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Manage Inventory - INVEXIS",
  description: "Manage your inventory items",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
};

export default function ManageInventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}