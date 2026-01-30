import jwtDecode from "jwt-decode";

export function getAdmin() {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("admin_token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);

    if (decoded.role !== "admin") return null;

    return decoded;
  } catch (err) {
    return null;
  }
}

export function isAdminLoggedIn() {
  return !!getAdmin();
}

export function adminLogout(router) {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin");
  router.push("/admin/login");
}
