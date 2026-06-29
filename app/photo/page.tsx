import { redirect } from "next/navigation";
import { getRegionFromCookies } from "@/lib/auth";
import { Suspense } from "react";
import PhotoContent from "./PhotoContent";

export default async function PhotoPage() {
  const region = await getRegionFromCookies();
  if (!region) redirect("/login");
  return (
    <Suspense fallback={<div className="min-h-screen bg-tint-50" />}>
      <PhotoContent region={region} />
    </Suspense>
  );
}
