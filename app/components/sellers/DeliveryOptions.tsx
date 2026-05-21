"use client";

type Props = {
  deliveryType: string;
  deliveryCharge: string;
  setDeliveryType: (type: string) => void;
  setDeliveryCharge: (charge: string) => void;
};

export default function DeliveryOptions({
  deliveryType,
  deliveryCharge,
  setDeliveryType,
  setDeliveryCharge,
}: Props) {
  return (
    <div className="border rounded-2xl p-4 space-y-4 bg-white">
      <div className="flex gap-3">
        {/* FREE DELIVERY */}
        <button
          type="button"
          onClick={() => {
            setDeliveryType("free");
            setDeliveryCharge("");
          }}
          className={`flex-1 py-3 rounded-xl border transition ${
            deliveryType === "free"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Free Delivery
        </button>

        {/* PAID DELIVERY */}
        <button
          type="button"
          onClick={() => {
            setDeliveryType("paid");
          }}
          className={`flex-1 py-3 rounded-xl border transition ${
            deliveryType === "paid"
              ? "bg-black text-white"
              : "bg-white text-black"
          }`}
        >
          Paid Delivery
        </button>
      </div>

      {/* DELIVERY CHARGE */}
      {deliveryType === "paid" && (
        <input
          type="number"
          placeholder="Delivery Charge"
          value={deliveryCharge}
          onChange={(e) => setDeliveryCharge(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 outline-none"
        />
      )}
    </div>
  );
}