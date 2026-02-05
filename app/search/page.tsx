"use client";

import { Suspense } from "react";
import Searchproduct from "./Searchproduct";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <Searchproduct />
    </Suspense>
  );
}
