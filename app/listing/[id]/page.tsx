"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ListingDetails({ params }: any) {
  const router = useRouter();

  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [imgIndex, setImgIndex] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);

  function prevImage() {
    if (!allImages.length) return;
    setImgIndex((imgIndex - 1 + allImages.length) % allImages.length);
  }

  function nextImage() {
    if (!allImages.length) return;
    setImgIndex((imgIndex + 1) % allImages.length);
  }

  async function fetchListing() {
    const { data, error } = await supabase
      .from("listings")
      .select("*, cover_image, banner_image, gallery_images")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setListing(data);
    
    // Combine all images into one array for carousel
    const images: string[] = [];
    if (data.cover_image) images.push(data.cover_image);
    if (data.banner_image) images.push(data.banner_image);
    if (data.gallery_images && Array.isArray(data.gallery_images)) {
      images.push(...data.gallery_images);
    }
    setAllImages(images);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user_id)
      .single();

    setSeller(profile);
    setLoading(false);
  }

  useEffect(() => {
    fetchListing();
  }, []);

  async function submitReport() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first");
      router.push("/login");
      return;
    }

    if (reportText.trim() === "") {
      alert("Please enter a reason");
      return;
    }

    const { error } = await supabase.from("reports").insert({
      listing_id: listing.id,
      reporter_id: user.id,
      reason: reportText,
    });

    if (error) {
      alert("Could not submit report");
      return;
    }

    alert("Report submitted");
    setReportOpen(false);
    setReportText("");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-gray-800">
        Listing not found.
      </div>
    );
  }

 return (
  <div className="min-h-screen bg-neutral-50 pb-10">

    {/* Back Button */}
    <button
      onClick={() => router.back()}
      className="fixed top-5 left-5 z-50 bg-white text-gray-800 p-2.5 rounded-lg shadow-sm hover:shadow transition border border-gray-200"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>

    <div className="max-w-7xl mx-auto px-6 pt-10">

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ---------------- LEFT SECTION ---------------- */}
        <div className="lg:col-span-2 space-y-4">

          {/* MAIN IMAGE */}
          <div className="relative w-full h-[480px] bg-white border rounded-xl overflow-hidden shadow-sm">
            {allImages.length > 0 ? (
              <>
                <img
                  src={allImages[imgIndex]}
                  alt="Listing"
                  className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300"
                />

                {/* LEFT ARROW */}
                {allImages.length > 1 && (
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow hover:bg-white transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* RIGHT ARROW */}
                {allImages.length > 1 && (
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow hover:bg-white transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400">
                No images uploaded
              </div>
            )}
          </div>

          {/* THUMBNAILS */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1">
              {allImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => setImgIndex(i)}
                  className={`w-24 h-20 rounded-lg object-cover cursor-pointer border ${
                    imgIndex === i ? "border-blue-600 shadow-sm" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{listing.title}</h1>
            </div>

            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>

            {/* LOCATION & REPORT */}
            <div className="pt-4 border-t flex items-center">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
              </div>

              <button
                onClick={() => setReportOpen(true)}
                className="ml-auto text-gray-500 hover:text-red-600 text-sm"
              >
                Report
              </button>
            </div>
          </div>

        </div>

        {/* ---------------- RIGHT SECTION (STICKY SIDEBAR) ---------------- */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-5">

          {/* PRICE BOX */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <div className="text-xs text-gray-500">PRICE</div>
            <div className="text-4xl font-semibold text-gray-900 mt-1">
              ₹{listing.price.toLocaleString()}
            </div>
          </div>

          {/* CATEGORY + CONDITION */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
            <div>
              <div className="text-xs text-gray-500">Category</div>
              <div className="font-medium text-gray-900">{listing.category}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Condition</div>
              <div className="font-medium text-gray-900">{listing.condition}</div>
            </div>
          </div>

          {/* SELLER INFO */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-5">

            <div className="flex items-center gap-4">
              {/* Avatar circle */}
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold rounded-full flex items-center justify-center text-xl">
                {seller?.name ? seller.name[0].toUpperCase() : "?"}
              </div>

              <div>
                <div className="font-semibold text-gray-900">{seller?.name || "Unknown Seller"}</div>
                <div className="text-sm text-gray-500">{seller?.city || "Location not set"}</div>
              </div>
            </div>

            {/* CHAT */}
            {listing.status === "sold" ? (
              <div className="text-center text-red-600 font-medium">
                Item Sold
              </div>
            ) : (
              <button
                onClick={() => router.push(`/chat/${listing.user_id}`)}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Chat with Seller
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* REPORT MODAL */}
    {reportOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
        <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900">Report Listing</h3>
          <p className="text-sm text-gray-600 mt-1">
            Please describe the issue with this listing.
          </p>

          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            className="w-full mt-4 p-3 border rounded-lg text-sm"
            rows={4}
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setReportOpen(false)}
              className="w-1/2 py-2 rounded border text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={submitReport}
              className="w-1/2 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);


}