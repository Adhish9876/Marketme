"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminReportItem({ report }: any) {
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);

  async function loadListing() {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("id", report.listing_id)
      .single();

    setListing(data);
  }

  async function hideListing() {
    await supabase
      .from("listings")
      .update({ status: "hidden" })
      .eq("id", report.listing_id);

    alert("Listing hidden");
    router.refresh();
  }

  async function deleteReport() {
    await supabase.from("reports").delete().eq("id", report.id);
    alert("Report removed");
    router.refresh();
  }

  async function banUser() {
    await supabase
      .from("profiles")
      .update({ banned: true })
      .eq("id", listing.user_id);

    alert("User banned");
  }

  useEffect(() => {
    loadListing();
  }, []);

  if (!listing) return <p>Loading listing...</p>;

  return (
    <div className="border p-4 rounded">
      <h2 className="text-lg font-semibold">Reason: {report.reason}</h2>
      <p className="text-sm text-gray-500">
        {new Date(report.created_at).toLocaleString()}
      </p>

      {listing.images?.[0] && (
        <img src={listing.images[0]} className="mt-2 rounded h-40 w-full object-cover" />
      )}

      <p className="mt-2 font-bold">{listing.title}</p>
      <p>₹{listing.price}</p>

      <div className="flex gap-3 mt-4">
        <button className="px-3 py-1 border" onClick={hideListing}>
          Hide Listing
        </button>

        <button className="px-3 py-1 border" onClick={deleteReport}>
          Remove Report
        </button>

        <button className="px-3 py-1 border bg-red-300" onClick={banUser}>
          Ban User
        </button>
      </div>
    </div>
  );
}
