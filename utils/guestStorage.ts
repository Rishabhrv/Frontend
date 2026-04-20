// ─────────────────────────────────────────────────────────────────────────────
//  guestStorage.ts
//  Manages guest cart & wishlist in localStorage.
//  Call mergeGuestDataOnLogin() right after a successful login/Google-auth.
// ─────────────────────────────────────────────────────────────────────────────

const GUEST_CART_KEY     = "guest_cart";
const GUEST_WISHLIST_KEY = "guest_wishlist";
const API_URL            = process.env.NEXT_PUBLIC_API_URL!;

// ── Types ────────────────────────────────────────────────────────────────────

export type GuestCartItem = {
  product_id:         number;
  format:             "ebook" | "paperback";
  quantity:           number;
  title:              string;
  slug:               string;
  image:              string;   // full URL as-received from BookCard
  price:              number;
  stock:              number;
  category_imprints?: string;
};

export type GuestWishlistItem = {
  id:           number;          // = product_id
  title:        string;
  slug:         string;
  sell_price:   number;
  image:        string;          // full URL
  author?:      string;
  product_type: "ebook" | "physical" | "both";
  stock:        number;
};

// ── Cart helpers ─────────────────────────────────────────────────────────────

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]"); }
  catch { return []; }
}

export function saveGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("guest-cart-change"));
  window.dispatchEvent(new Event("cart-change"));
}

export function addToGuestCart(item: Omit<GuestCartItem, "quantity"> & { quantity?: number }) {
  const cart = getGuestCart();
  const idx  = cart.findIndex(
    (i) => i.product_id === item.product_id && i.format === item.format
  );
  if (idx > -1) {
    cart[idx].quantity = Math.min(cart[idx].quantity + (item.quantity ?? 1), item.stock || 99);
  } else {
    cart.push({ ...item, quantity: item.quantity ?? 1 });
  }
  saveGuestCart(cart);
}

export function updateGuestCartQty(product_id: number, format: string, qty: number) {
  const cart = getGuestCart().map((i) =>
    i.product_id === product_id && i.format === format ? { ...i, quantity: qty } : i
  );
  saveGuestCart(cart);
}

export function removeFromGuestCart(product_id: number, format: string) {
  saveGuestCart(getGuestCart().filter(
    (i) => !(i.product_id === product_id && i.format === format)
  ));
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
  window.dispatchEvent(new Event("cart-change"));
}

// ── Wishlist helpers ──────────────────────────────────────────────────────────

export function getGuestWishlist(): GuestWishlistItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY) || "[]"); }
  catch { return []; }
}

export function saveGuestWishlist(items: GuestWishlistItem[]) {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("guest-wishlist-change"));
  window.dispatchEvent(new Event("wishlist-change"));
}

export function isInGuestWishlist(product_id: number): boolean {
  return getGuestWishlist().some((i) => i.id === product_id);
}

export function toggleGuestWishlist(item: GuestWishlistItem): boolean {
  const list = getGuestWishlist();
  const idx  = list.findIndex((i) => i.id === item.id);
  if (idx > -1) { list.splice(idx, 1); saveGuestWishlist(list); return false; }
  list.push(item);  saveGuestWishlist(list); return true;
}

export function removeFromGuestWishlist(product_id: number) {
  saveGuestWishlist(getGuestWishlist().filter((i) => i.id !== product_id));
}

export function clearGuestWishlist() {
  localStorage.removeItem(GUEST_WISHLIST_KEY);
  window.dispatchEvent(new Event("wishlist-change"));
}

// ── Merge on login ────────────────────────────────────────────────────────────
// Call this immediately after a successful login, passing the JWT token.

export async function mergeGuestDataOnLogin(token: string) {
  const guestCart     = getGuestCart();
  const guestWishlist = getGuestWishlist();

  // Merge cart items in parallel
  await Promise.allSettled(
    guestCart.map((item) =>
      fetch(`${API_URL}/api/cart/add`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          product_id: item.product_id,
          format:     item.format,
          quantity:   item.quantity,
        }),
      })
    )
  );

  // Merge wishlist items in parallel
  await Promise.allSettled(
    guestWishlist.map((item) =>
      fetch(`${API_URL}/api/wishlist/${item.id}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    )
  );

  clearGuestCart();
  clearGuestWishlist();
}