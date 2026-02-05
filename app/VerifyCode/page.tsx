"use client";

import { Suspense } from "react";
import Verify from "./Verify";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <Verify />
    </Suspense>
  );
}
