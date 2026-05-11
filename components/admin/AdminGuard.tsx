"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

type PageKey =
  | "products" | "orders"   | "category" | "subject"
  | "author"   | "users"    | "reviews"  | "shipping"
  | "subscriptions" | "payment" | "coupons" | "ads"
  | "settings" ;

interface AdminGuardProps {
  pageKey: PageKey;
  children: React.ReactNode;
}

export default function AdminGuard({ pageKey, children }: AdminGuardProps) {
  const { can, loading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !can(pageKey)) {
      router.replace("/admin/unauthorized");
    }
  }, [loading, pageKey]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!can(pageKey)) return null;

  return <>{children}</>;
}