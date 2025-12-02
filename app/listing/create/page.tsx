"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateListingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/auth/login");
      setChecking(false);
    }
    check();
  }, []);

  async function uploadImage(file: File) {
    const filePath = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(filePath, file);

    if (uploadError) {
      console.log(uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("listing-images")
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleSubmit() {
    if (!coverImage) {
      alert("Please add a cover image");
      return;
    }

    if (extraImages.length < 2) {
      alert("Please add at least 2 extra images");
      return;
    }

    if (!title || !price || !description || !category || !condition || !location) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first");
      router.push("/auth/login");
      return;
    }

    // Upload cover image
    const coverUrl = await uploadImage(coverImage);
    if (!coverUrl) {
      alert("Failed to upload cover image");
      setLoading(false);
      return;
    }

    // Upload extra images
    const extraUrls: string[] = [];
    for (const file of extraImages) {
      const url = await uploadImage(file);
      if (url) extraUrls.push(url);
    }

    if (extraUrls.length < 2) {
      alert("Failed to upload some images. Please try again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      title,
      price: Number(price),
      description,
      category,
      condition,
      location,
      cover_image: coverUrl,
      banner_image: extraUrls[0],
      gallery_images: extraUrls.slice(1),
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Listing created successfully!");
    router.push("/");
  }

  function handleExtraImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    setExtraImages([...extraImages, ...newFiles]);
  }

  function removeExtraImage(index: number) {
    setExtraImages(extraImages.filter((_, i) => i !== index));
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Create Listing</h1>
          <p className="mt-2 text-gray-600">Share your item with the world</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="space-y-8">
            {/* Images Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900"> Photos</h2>
              
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Cover Image <span className="text-red-500">*</span>
                </label>
                {coverImage ? (
                  <div className="relative group">
                    <img
                      src={URL.createObjectURL(coverImage)}
                      alt="Cover preview"
                      className="w-full h-96 object-cover rounded-2xl border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage(null)}
                      className="absolute top-4 right-4 bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-all shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-2xl"></div>
                  </div>
                ) : (
                  <div className="border-3 border-dashed border-blue-300 bg-blue-50 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-100 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label htmlFor="cover-upload" className="cursor-pointer">
                      <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-gray-700">Click to upload your main photo</p>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                    </label>
                  </div>
                )}
              </div>

              {/* Extra Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Additional Photos <span className="text-red-500">* (minimum 2)</span>
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {extraImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Extra ${index + 1}`}
                        className="w-full h-40 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeExtraImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-3 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                  <input
                    multiple
                    type="file"
                    accept="image/*"
                    onChange={handleExtraImagesChange}
                    className="hidden"
                    id="extra-upload"
                  />
                  <label htmlFor="extra-upload" className="cursor-pointer">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-gray-700">Add more photos</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {extraImages.length} / minimum 2 added
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Details Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Details</h2>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="What are you selling?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Tell buyers about your item - condition, features, reason for selling..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
                />
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Electronics, Furniture"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-lg"
                  >
                    <option value="">Select condition</option>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="City"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Creating your listing...
                  </span>
                ) : (
                  "Create Listing"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}