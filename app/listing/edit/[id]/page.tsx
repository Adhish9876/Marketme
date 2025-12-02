"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function fetchListing() {
    const { data, error } = await supabase
      .from("listings")
      .select("*, cover_image, banner_image, gallery_images")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      alert("Listing not found");
      router.push("/");
      return;
    }

    setTitle(data.title);
    setPrice(data.price.toString());
    setDescription(data.description);
    setCategory(data.category);
    setCondition(data.condition);
    setLocation(data.location);

    // Combine all existing images
    const images: string[] = [];
    if (data.cover_image) images.push(data.cover_image);
    if (data.banner_image) images.push(data.banner_image);
    if (data.gallery_images && Array.isArray(data.gallery_images)) {
      images.push(...data.gallery_images);
    }
    setExistingImages(images);
    setLoading(false);
  }

  useEffect(() => {
    fetchListing();
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

  async function deleteImage(imageUrl: string) {
    const filename = imageUrl.split("/").pop();
    if (!filename) return;
    await supabase.storage.from("listing-images").remove([filename]);
  }

  async function handleUpdate() {
    const totalImages = existingImages.length + newImages.length;
    
    if (totalImages < 3) {
      alert("You need at least 3 total images (1 cover + 2 additional)");
      return;
    }

    if (!title || !price || !description || !category || !condition || !location) {
      alert("Please fill in all required fields");
      return;
    }

    setUpdating(true);

    // Upload new images
    const newImageUrls: string[] = [];
    for (const file of newImages) {
      const url = await uploadImage(file);
      if (url) newImageUrls.push(url);
    }

    // Combine all images
    const allImages = [...existingImages, ...newImageUrls];

    // Update listing
    const { error } = await supabase
      .from("listings")
      .update({
        title,
        price: Number(price),
        description,
        category,
        condition,
        location,
        cover_image: allImages[0] || null,
        banner_image: allImages[1] || null,
        gallery_images: allImages.slice(2),
      })
      .eq("id", params.id);

    if (error) {
      alert(error.message);
      setUpdating(false);
      return;
    }

    alert("Listing updated successfully!");
    router.push(`/listing/${params.id}`);
  }

  function removeExistingImage(index: number) {
    const imageToDelete = existingImages[index];
    deleteImage(imageToDelete);
    setExistingImages(existingImages.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    setNewImages(newImages.filter((_, i) => i !== index));
  }

  function handleNewImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setNewImages([...newImages, ...newFiles]);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/listing/${params.id}`)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Listing
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Edit Listing</h1>
          <p className="mt-2 text-gray-600">Update your listing details</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="space-y-8">
            {/* Images Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">📸 Photos</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  totalImages >= 3 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {totalImages} / 3 minimum
                </span>
              </div>
              
              {/* Current Images */}
              {existingImages.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Current Photos
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          {index === 0 ? 'Cover' : index === 1 ? 'Banner' : `#${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {newImages.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    New Photos to Add
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {newImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="w-full h-48 object-cover rounded-xl border-2 border-green-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          NEW
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add More Photos */}
              <div className="border-3 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <input
                  multiple
                  type="file"
                  accept="image/*"
                  onChange={handleNewImagesChange}
                  className="hidden"
                  id="add-photos"
                />
                <label htmlFor="add-photos" className="cursor-pointer">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-700">Add more photos</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click to select images
                  </p>
                </label>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Details Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">📝 Details</h2>

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
                  placeholder="Tell buyers about your item..."
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
                    placeholder="e.g., Electronics"
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

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={() => router.push(`/listing/${params.id}`)}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                {updating ? (
                  <span className="flex items-center justify-center">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Updating...
                  </span>
                ) : (
                  "✨ Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}