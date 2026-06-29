import { redirect } from "next/navigation";
import { getRegionFromCookies } from "@/lib/auth";
import { Suspense } from "react";
import FormContent from "./FormContent";

export default async function FormPage() {
  const region = await getRegionFromCookies();
  if (!region) redirect("/login");
  return (
    <Suspense fallback={<div className="min-h-screen bg-tint-50" />}>
      <FormContent region={region} />
    </Suspense>
  );
}
