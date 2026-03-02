import { Suspense } from "react";
import OrderConfirmedPage from "@/components/order-confirmed/OrderConfirmed";
export default function OrderConfiremdParentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <OrderConfirmedPage />
      
    </Suspense>
  );
}