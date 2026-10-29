import {
  BedDouble,
  Gift,
  Layers,
  LayoutGrid,
  Percent,
  ShoppingBag,
  Sofa,
  Store,
  Tag,
  Ticket,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

type IkonProps = { className?: string; strokeWidth?: number };

export function IkonKategori({ nama, ...p }: { nama: string } & IkonProps) {
  const n = nama.toLowerCase();
  if (n.includes("diskon")) return <Percent {...p} />;
  if (n.includes("beli banyak")) return <ShoppingBag {...p} />;
  if (n.includes("termurah")) return <Tag {...p} />;
  if (n.includes("buy one") || n.includes("b1g1")) return <Layers {...p} />;
  if (n.includes("hadiah")) return <Gift {...p} />;
  if (n.includes("payday")) return <Wallet {...p} />;
  return <Ticket {...p} />;
}

// Ikon sesuai nama zona
export function IkonZona({ nama, ...p }: { nama: string } & IkonProps) {
  const n = nama.toLowerCase();
  if (n.includes("living")) return <Sofa {...p} />;
  if (n.includes("dining")) return <UtensilsCrossed {...p} />;
  if (n.includes("sleeping")) return <BedDouble {...p} />;
  if (n.includes("commercial") || n.includes("business")) return <Store {...p} />;
  return <LayoutGrid {...p} />;
}