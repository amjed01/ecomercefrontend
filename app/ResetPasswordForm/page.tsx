"use client";

import { Suspense } from "react";
import Password from "./Pssword";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <Password />
    </Suspense>
  );
}
