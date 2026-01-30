"use client";

import Link from "next/link";
import { X, ChevronRight, LogOut } from "lucide-react";

type UserType = {
  id: number;
  name: string;
  email: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  user: UserType | null;
  onLogout: () => void;
};

const AccountSlider = ({ open, onClose, user, onLogout }: Props) => {
  return (
    <>
      {/* BACKDROP */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/20 z-40"
        />
      )}

      {/* SLIDER */}
      <div
        className={`fixed top-0 right-0 h-full w-105 bg-white z-50 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="px-5 py-20 pb-10 flex items-center justify-between">
          {user ? (
            <h2 className="text-3xl font-medium">
              Hello {user.name.split(" ")[0]}
            </h2>
          ) : (
            <h2 className="text-3xl font-medium">Welcome</h2>
          )}

          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* NOT LOGGED IN */}
        {!user && (
          <div className="px-6 py-6 space-y-4">
            <Link
              href="/login"
              onClick={onClose}
              className="block w-full text-center bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              onClick={onClose}
              className="block w-full text-center border-2 border-black py-3 rounded-md font-medium hover:bg-gray-50 transition"
            >
              Create Account
            </Link>

            <div className="divide-y divide-gray-100 pt-6 text-sm">
              <MenuItem label="Order status" href="/orders" />
              <MenuItem label="Wish List" href="/wishlist" />
              <MenuItem label="Gift Card Balance" href="/gift-cards" />
            </div>
          </div>
        )}

        {/* LOGGED IN MENU */}
        {user && (
          <div className="px-6 py-4 text-sm">

            <div className="divide-y divide-gray-100 ">
              <MenuItem label="My Account" href="/account" />
              <MenuItem label="Wish List" href="/wishlist" />
              <MenuItem label="My Rewards" href="/rewards" />
              <MenuItem label="Gift Card Balance" href="/gift-cards" />
              <MenuItem label="Order History" href="/orders" />
            </div>

            {/* SIGN OUT */}
            <div className="pt-10">
              <button
                onClick={onLogout}
                className="w-full border-2 border-black py-3 rounded-md font-medium hover:bg-gray-50 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AccountSlider;

/* ================= MENU ROW ================= */

const MenuItem = ({
  label,
  href,
}: {
  label: string;
  href: string;
}) => {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-4 hover:text-black transition"
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
};
