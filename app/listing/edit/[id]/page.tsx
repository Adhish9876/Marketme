"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Save, Loader2, Trash2, Plus } from "lucide-react"
import Stack from "@/components/fancy/stack"

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()

  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [condition, setCondition] = useState("")
  const [location, setLocation] = useState("")

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  async function fetchListing() {
    const { data, error } = await supabase
      .from("listings")
      .select("*, cover_image, banner_image, gallery_images")
      .eq("id", params.id)
      .single()

    if (error || !data) {
      alert("Listing not found")
      router.push("/")
      return
    }

    setTitle(data.title)
    setPrice(data.price.toString())
    setDescription(data.description)
    setCategory(data.category)
    setCondition(data.condition)
    setLocation(data.location)

    const images: string[] = []
    if (data.cover_image) images.push(data.cover_image)
    if (data.banner_image) images.push(data.banner_image)
    if (data.gallery_images && Array.isArray(data.gallery_images)) {
      images.push(...data.gallery_images)
    }
    setExistingImages(images)
    setLoading(false)
  }

  useEffect(() => { fetchListing() }, [])

  async function uploadImage(file: File) {
    const filePath = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from("listing-images").upload(filePath, file)
    if (uploadError) return null
    const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(filePath)
    return publicUrl
  }

  async function deleteImage(imageUrl: string) {
    const filename = imageUrl.split("/").pop()
    if (!filename) return
    await supabase.storage.from("listing-images").remove([filename])
  }

  async function handleUpdate() {
    const totalImages = existingImages.length + newImages.length
    if (totalImages < 3) { alert("You need at least 3 total images (1 cover + 2 additional)"); return }
    if (!title || !price || !description || !category || !condition || !location) { alert("Please fill in all required fields"); return }

    setUpdating(true)
    const newImageUrls: string[] = []
    for (const file of newImages) {
      const url = await uploadImage(file)
      if (url) newImageUrls.push(url)
    }

    const allImages = [...existingImages, ...newImageUrls]

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
      .eq("id", params.id)

    if (error) { alert(error.message); setUpdating(false); return }
    alert("Listing updated successfully!")
    router.push(`/listing/${params.id}`)
  }

  function removeExistingImage(index: number) {
    const imageToDelete = existingImages[index]
    deleteImage(imageToDelete)
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  function removeNewImage(index: number) {
    setNewImages(newImages.filter((_, i) => i !== index))
  }

  function handleNewImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    setNewImages([...newImages, ...Array.from(files)])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Stack />
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Retrieving Data...</p>
        </div>
      </div>
    )
  }

  const totalImages = existingImages.length + newImages.length

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-red-600 selection:text-white relative pb-24">
      
      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-white/10 py-3 sm:py-4 shadow-lg">
              <div className="max-w-4xl mx-4 sm:mx-10 flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg sm:rounded-xl border border-white/10 transition-all shadow-sm group text-xs sm:text-sm">
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-bold uppercase tracking-widest hidden sm:inline">Back</span>
                </button>
            
              </div>
            </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32">
        <div className="mb-8 sm:mb-12">
           <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-2">Edit Listing</h1>
           <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Update asset parameters</p>
        </div>

        <div className="space-y-12 sm:space-y-16">
           
           {/* --- IMAGES --- */}
           <section className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 gap-4 sm:gap-0">
                 <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center font-bold text-xs text-white">01</div>
                    <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest text-white">Visuals</h2>
                 </div>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${totalImages >= 3 ? "bg-green-900/30 border-green-800 text-green-400" : "bg-red-900/30 border-red-800 text-red-400"}`}>
                    {totalImages} / 3 Required
                 </span>
              </div>

              {/* Existing Images Grid */}
              <div className="space-y-3 sm:space-y-4">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Current Database</label>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    {existingImages.map((img, i) => (
                       <div key={i} className="relative group aspect-square bg-[#1a1a1a] rounded-lg sm:rounded-xl border border-white/10 overflow-hidden">
                          <img src={img} className="w-full h-full object-cover" />
                          <button onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/80 text-white p-1 sm:p-1.5 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                             <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 text-[9px] sm:text-[10px] font-mono font-bold text-white/50 bg-black/50 px-1 rounded">{i === 0 ? "COVER" : `IMG_${i+1}`}</div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* New Images Grid */}
              <div className="space-y-3 sm:space-y-4">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">New Additions</label>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                    {newImages.map((file, i) => (
                       <div key={i} className="relative group aspect-square bg-[#1a1a1a] rounded-lg sm:rounded-xl border border-green-500/30 overflow-hidden">
                          <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                          <button onClick={() => removeNewImage(i)} className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/80 text-white p-1 sm:p-1.5 rounded-full hover:bg-red-600 transition-colors">
                             <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 text-[9px] sm:text-[10px] font-mono font-bold text-green-400 bg-black/50 px-1 rounded">NEW</div>
                       </div>
                    ))}
                    
                    {/* Add Button */}
                    <label className="aspect-square border border-dashed border-white/10 rounded-lg sm:rounded-xl flex flex-col items-center justify-center hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer">
                       <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white/20 mb-2" />
                       <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/40">Add More</span>
                       <input type="file" multiple accept="image/*" onChange={handleNewImagesChange} className="hidden" />
                    </label>
                 </div>
              </div>
           </section>

           {/* --- INTEL --- */}
           <section className="space-y-6 sm:space-y-8">
              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                 <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center font-bold text-xs text-white">02</div>
                 <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest text-white">Data Points</h2>
              </div>

              <div className="space-y-4 sm:space-y-6">
                 <div className="space-y-2 group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:border-red-600 focus:outline-none transition-all font-mono" />
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">Price (₹)</label>
                       <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:border-red-600 focus:outline-none transition-all font-mono" />
                    </div>
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">Location</label>
                       <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:border-red-600 focus:outline-none transition-all font-mono" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">Category</label>
                       <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:border-red-600 focus:outline-none transition-all font-mono" />
                    </div>
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">Condition</label>
                       <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:border-red-600 focus:outline-none transition-all font-mono appearance-none cursor-pointer">
                          <option value="New" className="bg-[#1a1a1a]">New</option>
                          <option value="Like New" className="bg-[#1a1a1a]">Like New</option>
                          <option value="Good" className="bg-[#1a1a1a]">Good</option>
                          <option value="Fair" className="bg-[#1a1a1a]">Fair</option>
                          <option value="Used" className="bg-[#1a1a1a]">Used</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2 group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-sm focus:border-red-600 focus:outline-none transition-all font-mono resize-none" />
                 </div>
              </div>
           </section>

           {/* Submit */}
           <button onClick={handleUpdate} disabled={updating} className="w-full py-4 sm:py-5 bg-red-600 text-white rounded-lg sm:rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group">
              {updating ? (
                 <><Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Patching Database...</>
              ) : (
                 <><Save className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" /> Save Updates</>
              )}
           </button>

        </div>
      </main>
    </div>
  )
}