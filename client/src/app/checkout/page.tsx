/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Check, CreditCard, Lock, Smartphone, Truck } from "lucide-react";
import { apiFetch, ApiError, errorMessage, money } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useProfile } from "@/lib/useProfile";
import {
  detectBrand, digitsOnly, formatCardNumber, formatExpiry, parseExpiry, validateCard, type CardErrors,
} from "@/lib/card";
import { btnGhost, btnPrimary, card, input, label } from "@/components/dashboard/ui";

type Quote = {
  shippable: boolean;
  codAllowed: boolean;
  methods: { key: string; label: string; eta: string; fee: number; free: boolean }[];
  pricing: {
    subtotal: number; shippingFee: number; tax: number; taxRate: number; total: number;
    method: { key: string; label: string; eta: string };
  };
  items: { name: string; slug: string; image?: string; price: number; quantity: number; color?: string; size?: string }[];
};

type Option = "card" | "bkash" | "nagad" | "cod";
type Step = "address" | "shipping" | "payment" | "review";

const STEP_LABEL: Record<Step, string> = {
  address: "Address", shipping: "Shipping", payment: "Payment", review: "Review",
};

const emptyAddr = { fullName: "", phone: "", line1: "", city: "", postalCode: "" };
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const wrap = "px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 pb-16";

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const TEST_CARDS = [
  { label: "Approved", number: "4242424242424242" },
  { label: "Declined", number: "4000000000000002" },
  { label: "No funds", number: "4000000000009995" },
];

const Stepper = ({ steps, current }: { steps: Step[]; current: number }) => (
  <ol className="flex items-center gap-2 mb-8 overflow-x-auto">
    {steps.map((s, i) => (
      <li key={s} className="flex items-center gap-2 whitespace-nowrap">
        <span
          className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-medium ${
            i < current ? "bg-green-500 text-white" : i === current ? "bg-lama text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          {i < current ? <Check size={14} /> : i + 1}
        </span>
        <span className={`text-sm ${i === current ? "font-medium" : "text-gray-500"}`}>{STEP_LABEL[s]}</span>
        {i < steps.length - 1 && <span className="w-8 h-px bg-gray-300 mx-1" />}
      </li>
    ))}
  </ol>
);

const Choice = ({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left w-full rounded-xl p-4 transition ring-1 ${
      selected ? "ring-2 ring-lama bg-pink-50/50" : "ring-gray-200 hover:ring-gray-400"
    }`}
  >
    {children}
  </button>
);

const Summary = ({ quote }: { quote: Quote }) => {
  const p = quote.pricing;
  return (
    <aside className={`${card} p-5 flex flex-col gap-4 lg:sticky lg:top-24 self-start`}>
      <h2 className="font-semibold">Order summary</h2>
      <ul className="flex flex-col gap-3 max-h-72 overflow-y-auto">
        {quote.items.map((i, idx) => (
          <li key={idx} className="flex gap-3 text-sm">
            <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
              {i.image && <img src={i.image} alt={i.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{i.name}</div>
              <div className="text-xs text-gray-500">
                Qty {i.quantity}
                {[i.color, i.size].filter(Boolean).length > 0 && ` · ${[i.color, i.size].filter(Boolean).join(" / ")}`}
              </div>
            </div>
            <div>{money(i.price * i.quantity)}</div>
          </li>
        ))}
      </ul>
      <div className="border-t pt-4 text-sm flex flex-col gap-2">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{money(p.subtotal)}</span></div>
        <div className="flex justify-between">
          <span className="text-gray-500">Shipping ({p.method.label})</span>
          <span>{p.shippingFee === 0 ? "Free" : money(p.shippingFee)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax ({Math.round(p.taxRate * 100)}%)</span><span>{money(p.tax)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base border-t pt-3 mt-1">
          <span>Total</span><span>{money(p.total)}</span>
        </div>
      </div>
    </aside>
  );
};

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <span className="text-red-600 font-normal">{msg}</span> : null;

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { reload: reloadCart } = useCart();
  const { profile } = useProfile();
  const router = useRouter();
  const idemKey = useRef(newKey());

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadError, setLoadError] = useState("");
  const [shippingKey, setShippingKey] = useState("standard");
  const [stepIdx, setStepIdx] = useState(0);

  // address
  const [addressId, setAddressId] = useState<string>("new");
  const [addr, setAddr] = useState(emptyAddr);
  const [saveAddress, setSaveAddress] = useState(true);
  const [addrError, setAddrError] = useState("");

  // payment
  const [option, setOption] = useState<Option>("card");
  const [cardForm, setCardForm] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [mobile, setMobile] = useState({ number: "", code: "" });
  const [mobileError, setMobileError] = useState("");

  // placing
  const [placing, setPlacing] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch<Quote>(`/checkout/quote?shipping=${shippingKey}`)
      .then((q) => {
        setQuote(q);
        setLoadError("");
        if (q.shippable && !q.methods.some((m) => m.key === shippingKey)) setShippingKey(q.methods[0].key);
      })
      .catch((e) => setLoadError(errorMessage(e)));
  }, [user, shippingKey]);

  // preselect the default saved address
  useEffect(() => {
    if (!profile) return;
    const def = profile.addresses.find((a) => a.isDefault) ?? profile.addresses[0];
    setAddressId(def ? def._id : "new");
  }, [profile]);

  if (loading) return <div className={`${wrap} py-20 text-gray-500`}>Loading...</div>;
  if (!user)
    return (
      <div className={`${wrap} py-20`}>
        Please <Link href="/login" className="underline">log in</Link> to check out.
      </div>
    );
  if (loadError)
    return (
      <div className={`${wrap} py-20 flex flex-col gap-4 items-start`}>
        <p className="text-gray-700">{loadError}</p>
        <Link href="/list" className={btnPrimary}>Continue shopping</Link>
      </div>
    );
  if (!quote) return <div className={`${wrap} py-20 text-gray-500`}>Preparing checkout...</div>;

  const steps: Step[] = quote.shippable ? ["address", "shipping", "payment", "review"] : ["payment", "review"];
  const step = steps[stepIdx];
  const saved = profile?.addresses ?? [];
  const method = option === "card" ? "card" : option === "cod" ? "cod" : "mobile";

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const back = () => {
    setPayError("");
    setStepIdx((i) => Math.max(i - 1, 0));
  };

  const continueAddress = () => {
    if (addressId === "new") {
      if (addr.fullName.trim().length < 2) return setAddrError("Full name is required");
      if (!PHONE_RE.test(addr.phone.trim())) return setAddrError("Enter a valid phone number");
      if (addr.line1.trim().length < 5) return setAddrError("Enter the street address");
      if (!addr.city.trim()) return setAddrError("City is required");
    }
    setAddrError("");
    next();
  };

  const continuePayment = () => {
    if (option === "card") {
      const errs = validateCard(cardForm);
      setCardErrors(errs);
      if (Object.keys(errs).length) return;
    } else if (option !== "cod") {
      if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(mobile.number.replace(/[\s-]/g, "")))
        return setMobileError("Enter a valid number, like 01XXXXXXXXX");
      if (!/^\d{6}$/.test(mobile.code)) return setMobileError("Enter the 6-digit code");
      setMobileError("");
    }
    next();
  };

  const placeOrder = async () => {
    setPlacing(true);
    setPayError("");
    const exp = parseExpiry(cardForm.expiry);
    const payment =
      option === "card"
        ? {
            method: "card",
            card: {
              name: cardForm.name,
              number: digitsOnly(cardForm.number),
              expMonth: exp?.month,
              expYear: exp?.year,
              cvc: cardForm.cvc,
            },
          }
        : option === "cod"
        ? { method: "cod" }
        : { method: "mobile", mobile: { provider: option, number: mobile.number, code: mobile.code } };

    try {
      const d = await apiFetch<{ order: { _id: string } }>("/checkout", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: idemKey.current,
          shippingMethod: shippingKey,
          ...(quote.shippable
            ? addressId === "new"
              ? { address: addr, saveAddress }
              : { addressId }
            : {}),
          payment,
        }),
      });
      await reloadCart();
      router.push(`/checkout/success/${d.order._id}`);
    } catch (e) {
      setPayError(errorMessage(e));
      if (e instanceof ApiError && e.status === 402) idemKey.current = newKey();
      setPlacing(false);
    }
  };

  const chosenAddress =
    addressId === "new" ? addr : saved.find((a) => a._id === addressId) ?? emptyAddr;

  const options: { key: Option; title: string; text: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { key: "card", title: "Credit / debit card", text: "Visa, Mastercard, Amex", icon: <CreditCard size={20} /> },
    { key: "bkash", title: "bKash", text: "Pay with your bKash account", icon: <Smartphone size={20} /> },
    { key: "nagad", title: "Nagad", text: "Pay with your Nagad account", icon: <Smartphone size={20} /> },
    { key: "cod", title: "Cash on delivery", text: "Pay when your order arrives", icon: <Banknote size={20} />, hidden: !quote.codAllowed },
  ];

  const payLabel =
    option === "card"
      ? `${detectBrand(cardForm.number) === "unknown" ? "Card" : detectBrand(cardForm.number)} ending ${digitsOnly(cardForm.number).slice(-4)}`
      : option === "cod"
      ? "Cash on delivery"
      : `${option === "nagad" ? "Nagad" : "bKash"} (${mobile.number})`;

  return (
    <div className={wrap}>
      <h1 className="text-2xl font-semibold mb-2">Checkout</h1>
      <Stepper steps={steps} current={stepIdx} />

      {!user.emailVerified && (
        <div className="bg-yellow-50 text-yellow-900 text-sm rounded-lg p-3 mb-6">
          Verify your email before placing an order.{" "}
          <Link href="/verify-email" className="underline">Enter code</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="fade-in" key={step}>
          {/* ADDRESS */}
          {step === "address" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Where should we deliver?</h2>
              {saved.map((a) => (
                <Choice key={a._id} selected={addressId === a._id} onClick={() => setAddressId(a._id)}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">{a.label} · {a.fullName}</span>
                    {a.isDefault && <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">Default</span>}
                  </div>
                  <div className="text-sm text-gray-500">{a.line1}, {a.city}{a.postalCode ? `, ${a.postalCode}` : ""}</div>
                  <div className="text-sm text-gray-500">{a.phone}</div>
                </Choice>
              ))}
              <Choice selected={addressId === "new"} onClick={() => setAddressId("new")}>
                <span className="text-sm font-medium">Use a new address</span>
              </Choice>

              {addressId === "new" && (
                <div className={`${card} p-5 grid sm:grid-cols-2 gap-4`}>
                  <label className={label}>Full name
                    <input className={input} value={addr.fullName} onChange={(e) => setAddr({ ...addr, fullName: e.target.value })} />
                  </label>
                  <label className={label}>Phone
                    <input className={input} value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} placeholder="+8801XXXXXXXXX" />
                  </label>
                  <label className={`${label} sm:col-span-2`}>Street address
                    <input className={input} value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
                  </label>
                  <label className={label}>City
                    <input className={input} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                  </label>
                  <label className={label}>Postal code (optional)
                    <input className={input} value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} />
                  </label>
                  {saved.length < 5 && (
                    <label className="text-sm flex items-center gap-2 sm:col-span-2">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      Save this address for next time
                    </label>
                  )}
                </div>
              )}
              {addrError && <p className="text-red-600 text-sm">{addrError}</p>}
              <button onClick={continueAddress} className={`${btnPrimary} w-max`}>Continue to shipping</button>
            </div>
          )}

          {/* SHIPPING */}
          {step === "shipping" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Choose a delivery method</h2>
              {quote.methods.map((m) => (
                <Choice key={m.key} selected={shippingKey === m.key} onClick={() => setShippingKey(m.key)}>
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{m.label}</div>
                      <div className="text-xs text-gray-500">{m.eta}</div>
                    </div>
                    <span className="text-sm font-medium">{m.free ? "Free" : money(m.fee)}</span>
                  </div>
                </Choice>
              ))}
              <div className="flex gap-3">
                <button onClick={back} className={btnGhost}>Back</button>
                <button onClick={next} className={btnPrimary}>Continue to payment</button>
              </div>
            </div>
          )}

          {/* PAYMENT */}
          {step === "payment" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Payment method</h2>
                <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-3 py-1 font-medium">
                  Test mode · no real charge
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {options.filter((o) => !o.hidden).map((o) => (
                  <Choice key={o.key} selected={option === o.key} onClick={() => setOption(o.key)}>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{o.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{o.title}</div>
                        <div className="text-xs text-gray-500">{o.text}</div>
                      </div>
                    </div>
                  </Choice>
                ))}
              </div>

              {option === "card" && (
                <div className={`${card} p-5 flex flex-col gap-4`}>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    Test cards:
                    {TEST_CARDS.map((t) => (
                      <button
                        key={t.number}
                        type="button"
                        className="rounded-full ring-1 ring-gray-300 px-3 py-1 hover:bg-gray-50"
                        onClick={() => {
                          setCardForm({ name: "Test User", number: formatCardNumber(t.number), expiry: "12/34", cvc: "123" });
                          setCardErrors({});
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <label className={label}>Name on card
                    <input className={input} autoComplete="cc-name" value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} />
                    <FieldError msg={cardErrors.name} />
                  </label>
                  <label className={label}>Card number
                    <div className="relative">
                      <input
                        className={`${input} pr-24 tracking-wider`}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="1234 5678 9012 3456"
                        value={cardForm.number}
                        onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs uppercase font-semibold text-gray-500">
                        {detectBrand(cardForm.number) !== "unknown" ? detectBrand(cardForm.number) : ""}
                      </span>
                    </div>
                    <FieldError msg={cardErrors.number} />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={label}>Expiry
                      <input className={input} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={cardForm.expiry}
                        onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })} />
                      <FieldError msg={cardErrors.expiry} />
                    </label>
                    <label className={label}>CVC
                      <input className={input} inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} value={cardForm.cvc}
                        onChange={(e) => setCardForm({ ...cardForm, cvc: digitsOnly(e.target.value).slice(0, 4) })} />
                      <FieldError msg={cardErrors.cvc} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Lock size={12} /> This is a simulation. Your card details are never stored.
                  </p>
                </div>
              )}

              {(option === "bkash" || option === "nagad") && (
                <div className={`${card} p-5 flex flex-col gap-4`}>
                  <label className={label}>{option === "bkash" ? "bKash" : "Nagad"} account number
                    <input className={input} inputMode="tel" placeholder="01XXXXXXXXX" value={mobile.number}
                      onChange={(e) => setMobile({ ...mobile, number: e.target.value })} />
                  </label>
                  <label className={label}>Verification code
                    <input className={`${input} tracking-[0.4em]`} inputMode="numeric" maxLength={6} placeholder="••••••" value={mobile.code}
                      onChange={(e) => setMobile({ ...mobile, code: digitsOnly(e.target.value) })} />
                  </label>
                  <p className="text-xs text-gray-500">
                    Test mode: use code <strong>123456</strong> to approve, or <strong>000000</strong> to simulate no balance.
                  </p>
                  {mobileError && <p className="text-red-600 text-sm">{mobileError}</p>}
                </div>
              )}

              {option === "cod" && (
                <div className={`${card} p-5 text-sm text-gray-600`}>
                  You&apos;ll pay in cash when the order is delivered. Please keep the exact amount ready.
                </div>
              )}

              <div className="flex gap-3">
                {stepIdx > 0 && <button onClick={back} className={btnGhost}>Back</button>}
                <button onClick={continuePayment} className={btnPrimary}>Review order</button>
              </div>
            </div>
          )}

          {/* REVIEW */}
          {step === "review" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Review and place your order</h2>

              {quote.shippable && (
                <div className={`${card} p-4 text-sm flex justify-between gap-4`}>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Deliver to</div>
                    <div className="font-medium">{chosenAddress.fullName}</div>
                    <div className="text-gray-600">{chosenAddress.line1}, {chosenAddress.city}</div>
                    <div className="text-gray-600">{chosenAddress.phone}</div>
                  </div>
                  <button className="underline self-start" onClick={() => setStepIdx(0)}>Change</button>
                </div>
              )}
              {quote.shippable && (
                <div className={`${card} p-4 text-sm flex justify-between gap-4`}>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Delivery</div>
                    <div className="font-medium">{quote.pricing.method.label}</div>
                    <div className="text-gray-600">{quote.pricing.method.eta}</div>
                  </div>
                  <button className="underline self-start" onClick={() => setStepIdx(1)}>Change</button>
                </div>
              )}
              <div className={`${card} p-4 text-sm flex justify-between gap-4`}>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Payment</div>
                  <div className="font-medium capitalize">{payLabel}</div>
                </div>
                <button className="underline self-start" onClick={() => setStepIdx(steps.indexOf("payment"))}>Change</button>
              </div>

              {payError && (
                <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm flex flex-col gap-2">
                  <strong>Payment failed</strong>
                  <span>{payError}</span>
                  <button className="underline w-max" onClick={() => { setPayError(""); setStepIdx(steps.indexOf("payment")); }}>
                    Try another payment method
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={back} className={btnGhost} disabled={placing}>Back</button>
                <button onClick={placeOrder} disabled={placing || !user.emailVerified} className={btnPrimary}>
                  {option === "cod" ? "Place order" : `Pay ${money(quote.pricing.total)}`}
                </button>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Lock size={12} /> Test mode: no real money is charged.
              </p>
            </div>
          )}
        </div>

        <Summary quote={quote} />
      </div>

      {placing && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-lama animate-spin" />
          <p className="font-medium">{option === "cod" ? "Placing your order..." : "Processing payment..."}</p>
          <p className="text-sm text-gray-500">Please don&apos;t close this page.</p>
        </div>
      )}
    </div>
  );
}