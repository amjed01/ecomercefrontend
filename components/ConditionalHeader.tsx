// components/ConditionalHeader.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./home/Header";

const ConditionalHeader = () => {
  const pathname = usePathname();
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    // Hide header on seller routes
    if (pathname.startsWith("/seller")) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
  }, [pathname]);

  if (!showHeader) {
    return null;
  }

  return <Header />;
};

export default ConditionalHeader;