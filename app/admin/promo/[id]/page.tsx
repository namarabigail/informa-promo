"use client";

import { useParams } from "next/navigation";
import PromoForm from "@/components/PromoForm";

export default function EditPromoPage() {
  const params = useParams<{ id: string }>();
  return <PromoForm promoId={params.id} />;
}