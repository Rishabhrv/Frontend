import { Suspense } from "react";
import PaymentClient from "./PaymentClient";

export default function SubscriptionPaymentPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading payment...</div>}>
      <PaymentClient />
    </Suspense>
  );
}
