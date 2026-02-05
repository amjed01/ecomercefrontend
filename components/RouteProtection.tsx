// components/RouteProtection.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const RouteProtection = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const token = localStorage.getItem("authToken");
      const userRole = localStorage.getItem("userRole");
      
      if (token) {
        // If user is logged in and on home page, redirect based on role
        if (pathname === "/") {
          if (userRole === "seller") {
            router.push("/seller/dashboard");
          }
          // If user is client, stay on home page
        }
        
        // If seller tries to access user routes, redirect to seller dashboard
        if (userRole === "seller" && !pathname.startsWith("/seller")) {
          router.push("/seller/dashboard");
        }
      } else {
        // If no token and trying to access protected routes, redirect to login
        if (pathname.startsWith("/seller")) {
          router.push("/login");
        }
      }
    };

    checkAuthAndRedirect();
  }, [pathname, router]);

  return null;
};

export default RouteProtection;