// components/OffersList.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Check, X, MessageCircle } from "lucide-react";

type Offer = {
  id: string;
  buyer_name?: string;
  offered_price: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  created_at: string;
  expires_at: string;
};

type OffersListProps = {
  offers: Offer[];
  userIsOwner: boolean;
  onAccept?: (offerId: string) => Promise<void>;
  onReject?: (offerId: string) => Promise<void>;
  onCounter?: (offerId: string) => void;
  loading?: boolean;
};

const statusConfig = {
  pending: { color: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400", label: "Pending" },
  accepted: { color: "bg-green-500/20 border-green-500/50 text-green-400", label: "Accepted" },
  rejected: { color: "bg-red-500/20 border-red-500/50 text-red-400", label: "Rejected" },
  countered: { color: "bg-blue-500/20 border-blue-500/50 text-blue-400", label: "Countered" },
};

export default function OffersList({
  offers,
  userIsOwner,
  onAccept,
  onReject,
  onCounter,
  loading = false,
}: OffersListProps) {
  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-12 text-white/40">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No offers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer, index) => (
        <motion.div
          key={offer.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`border border-white/10 rounded-lg p-4 bg-white/5 hover:bg-white/10 transition-colors`}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm font-bold text-white">{offer.buyer_name}</p>
              <p className="text-[10px] text-white/40">
                {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className={`text-xs font-bold uppercase px-2 py-1 rounded border ${statusConfig[offer.status].color}`}>
              {statusConfig[offer.status].label}
            </div>
          </div>

          {/* Price */}
          <p className="text-lg font-bold text-red-600 mb-2">₹{offer.offered_price.toLocaleString()}</p>

          {/* Message */}
          {offer.message && (
            <p className="text-sm text-white/70 bg-white/5 rounded p-2 mb-3 border-l-2 border-red-600">
              "{offer.message}"
            </p>
          )}

          {/* Expiry */}
          <p className="text-[9px] text-white/40 mb-3">
            Expires: {formatDistanceToNow(new Date(offer.expires_at), { addSuffix: true })}
          </p>

          {/* Actions */}
          {userIsOwner && offer.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => onAccept?.(offer.id)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase py-2 rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                <Check className="w-3 h-3" /> Accept
              </button>
              <button
                onClick={() => onCounter?.(offer.id)}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase py-2 rounded transition-colors disabled:opacity-50"
              >
                Counter
              </button>
              <button
                onClick={() => onReject?.(offer.id)}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase py-2 rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" /> Reject
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
