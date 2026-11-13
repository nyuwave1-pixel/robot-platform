import { notFound } from "next/navigation";
import DevHarness from "@/components/DevHarness";

/** 개발·E2E 검증 전용. 프로덕션에서는 ENABLE_DEV_HARNESS=1 일 때만 열린다. */
export const dynamic = "force-dynamic";
export default function Page() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_HARNESS !== "1") notFound();
  return <DevHarness />;
}
