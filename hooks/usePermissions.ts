import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PageKey =
  | "products" | "orders"   | "category" | "subject"
  | "author"   | "users"    | "reviews"  | "shipping"
  | "subscriptions" | "payment" | "coupons" | "ads";

interface PermissionsResponse {
  pages: PageKey[];
  isSuperAdmin: boolean;
}

interface UsePermissionsReturn {
  permissions: PageKey[] | null;
  isSuperAdmin: boolean;
  can: (pageKey: PageKey) => boolean;
  loading: boolean;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<PageKey[] | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    fetch(`${API_URL}/api/admin/permissions/my-permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }
        const data: PermissionsResponse = await res.json();
        setPermissions(data.pages);
        setIsSuperAdmin(data.isSuperAdmin);
      })
      .catch(() => router.replace("/admin/login"));
  }, []);

  const can = (pageKey: PageKey): boolean => {
    if (isSuperAdmin) return true;
    return permissions?.includes(pageKey) ?? false;
  };

  return {
    permissions,
    isSuperAdmin,
    can,
    loading: permissions === null,
  };
}