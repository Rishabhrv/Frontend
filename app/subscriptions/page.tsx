"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";


export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Unlimited Reading. One Simple Plan.
        </h1>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Read unlimited eBooks anytime, anywhere. No limits. No ads. 
          Cancel anytime.
        </p>
      </section>

      {/* PLANS */}
      <section className="mx-auto max-w-6xl px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MONTHLY */}
        <PlanCard
          title="Monthly"
          price="₹149"
          period="/month"
          description="Perfect for casual readers"
          features={[
            "Unlimited eBook access",
            "Read on any device",
            "Cancel anytime",
          ]}
          button="Start Monthly"
          planType="monthly"
        />

        {/* 3 MONTHS */}
        <PlanCard
          title="3 Months"
          price="₹399"
          period="/3 months"
          highlight
          badge="Most Popular"
          description="Best balance of value & flexibility"
          features={[
            "Unlimited eBook access",
            "Save ₹48 vs monthly",
            "Priority support",
          ]}
          button="Start 3 Months"
          planType="quarterly"
        />

        {/* YEARLY */}
        <PlanCard
          title="Yearly"
          price="₹1499"
          period="/year"
          badge="Best Value"
          description="For serious readers"
          features={[
            "Unlimited eBook access",
            "Save ₹289 per year",
            "Early access to new releases",
          ]}
          button="Go Yearly"
          planType="yearly"
        />
      </section>

      {/* FEATURES */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <Feature
            title="Unlimited eBooks"
            text="Read as many eBooks as you want without limits."
          />
          <Feature
            title="Any Device"
            text="Read on mobile, tablet, or desktop anytime."
          />
          <Feature
            title="Cancel Anytime"
            text="No lock-in. Upgrade or cancel whenever you want."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <Faq
            q="Does this include paperback books?"
            a="No. Subscription is only for digital eBooks. Paperbacks are sold separately."
          />
          <Faq
            q="Can I cancel anytime?"
            a="Yes. You can cancel your subscription anytime from your account."
          />
          <Faq
            q="Can I download books?"
            a="Books can be read online in our reader. Downloads are not supported."
          />
        </div>
      </section>
    </div>
  );
}

/* =======================
   COMPONENTS
======================= */

function PlanCard({
  title,
  price,
  period,
  description,
  features,
  button,
  highlight,
  badge,
  planType,
}: any) {
  const router = useRouter();

  return (
    <div
      className={`rounded-2xl border bg-white p-6 flex flex-col ${
        highlight ? "border-blue-600 shadow-lg" : "border-gray-200"
      }`}
    >
      {badge && (
        <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {badge}
        </span>
      )}

      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-gray-600 text-sm">{description}</p>

      <div className="mt-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-500">{period}</span>
      </div>

      <ul className="my-6 space-y-2 text-sm">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-center gap-2">
            <Check className="text-green-600" size={16} />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() =>
          router.push(`/subscriptions/payment?plan=${planType}`)
        }
        className={`mt-auto rounded-lg py-3 text-sm font-semibold transition ${
          highlight
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-gray-300 hover:bg-gray-100"
        }`}
      >
        {button}
      </button>
    </div>
  );
}

function Feature({ title, text }: any) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-gray-600 text-sm">{text}</p>
    </div>
  );
}

function Faq({ q, a }: any) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="font-medium">{q}</p>
      <p className="mt-1 text-sm text-gray-600">{a}</p>
    </div>
  );
}
