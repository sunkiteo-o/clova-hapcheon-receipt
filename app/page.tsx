import { redirect } from "next/navigation";
import { getRegionFromCookies } from "@/lib/auth";
import HomeClient from "./HomeClient";

export default async function Page() {
  const region = await getRegionFromCookies();
  if (!region) redirect("/login");
  return <HomeClient region={region} />;
}
