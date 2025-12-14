"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { 
  ArrowLeft, Upload, Loader2, Camera, Plus, Trash2, ImageIcon, 
  ScanLine, FileText, DollarSign, MapPin, Tag, AlertCircle 
} from "lucide-react"
import { motion } from "framer-motion"
import Stack from "@/components/fancy/stack"

export default function CreateListingPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [condition, setCondition] = useState("")
  const [location, setLocation] = useState("")

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [extraImages, setExtraImages] = useState<File[]>([])

  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/auth/login")
      setChecking(false)
    }
    check()
  }, [])

  async function uploadImage(file: File) {
    const filePath = `${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from("listing-images").upload(filePath, file)
    if (uploadError) return null
    const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(filePath)
    return publicUrl
  }

  async function handleSubmit() {
    if (!coverImage) return alert("Please add a cover image")
    if (extraImages.length < 2) return alert("Please add at least 2 extra images")
    if (!title || !price || !description || !category || !condition || !location)
      return alert("Please fill in all required fields")

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert("Please login first"); router.push("/auth/login"); return }

    const coverUrl = await uploadImage(coverImage)
    if (!coverUrl) { alert("Failed to upload cover image"); setLoading(false); return }

    const extraUrls: string[] = []
    for (const f of extraImages) {
      const u = await uploadImage(f)
      if (u) extraUrls.push(u)
    }
    if (extraUrls.length < 2) { alert("Failed to upload some images"); setLoading(false); return }

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
    })

    if (error) { alert(error.message); setLoading(false); return }
    router.push("/")
  }

  function handleExtraImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setExtraImages([...extraImages, ...Array.from(e.target.files)])
  }

  function removeExtraImage(index: number) {
    setExtraImages(extraImages.filter((_, i) => i !== index))
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#111418] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Stack />
          <p className="text-[#8F9399] font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Initializing Secure Link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111418] text-[#F2F2F3] font-sans pb-32 selection:bg-[#E24B4B]/20 selection:text-[#F2F2F3] relative">

      {/* Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.05] mix-blend-overlay"
        style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#181B20]/80 backdrop-blur-xl border-b border-[#2A2F37] py-4">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-3 text-[#8F9399] hover:text-[#F2F2F3] text-xs font-semibold uppercase tracking-widest transition-colors group"
          >
            <div className="p-2 border border-[#3A404A] rounded-full group-hover:border-[#C7C9CC] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#E24B4B] rounded-full animate-pulse shadow-[0_0_10px_#E24B4B]" />
           
          </div>

        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 pt-28">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2A2F37] pb-8"
        >
          <div>
            <h1 className="text-5xl font-black tracking-tight uppercase text-[#F2F2F3]">New Listing</h1>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-mono text-[#5C6066] uppercase tracking-widest">Session ID</p>
            <p className="text-sm font-mono text-[#C7C9CC]">8X-2049-CRT</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* LEFT: IMAGES */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-8"
          >

            {/* COVER IMAGE */}
            <div className="bg-[#181B20] border border-[#2A2F37] rounded-2xl p-1 shadow-xl">
              <div className="bg-[#1F2329] rounded-xl p-6 border border-[#3A404A]">

                <div className="flex items-center justify-between mb-6">
                  <label className="text-xs text-[#C7C9CC] uppercase tracking-[0.2em] font-semibold flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-[#E24B4B] rounded-sm"></span>
                    cover <span className="text-[#5C6066]">*</span>
                  </label>
                </div>

                <div className="relative w-full aspect-video bg-[#111418] rounded-lg border-2 border-dashed border-[#2A2F37] hover:border-[#3A404A] transition-all duration-300 overflow-hidden group">

                  {coverImage ? (
                    <>
                      <img src={URL.createObjectURL(coverImage)} className="w-full h-full object-cover" />

                      <div className="absolute inset-0 bg-[#111418]/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                        <button 
                          onClick={() => setCoverImage(null)} 
                          className="px-6 py-3 bg-[#E24B4B]/10 border border-[#E24B4B]/40 text-[#E24B4B] text-xs font-bold tracking-widest uppercase rounded hover:bg-[#E24B4B] hover:text-white transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Reset Data
                        </button>
                      </div>

                      <div className="absolute top-4 left-4 bg-[#E24B4B] text-white text-[10px] font-bold px-2 py-1 uppercase rounded-sm shadow">
                        Cover
                      </div>
                    </>
                  ) : (

                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group">
                      <div className="w-16 h-16 bg-[#181B20] rounded-full border border-[#2A2F37] flex items-center justify-center mb-4 text-[#8F9399] group-hover:text-[#F2F2F3] group-hover:border-[#C7C9CC] transition-all">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-[#8F9399] group-hover:text-[#C7C9CC] uppercase tracking-widest">
                        Upload Main Asset
                      </span>
                      <input type="file" className="hidden" accept="image/*"
                        onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
                    </label>

                  )}

                </div>

              </div>
            </div>

            {/* GALLERY */}
            <div className="bg-[#181B20] border border-[#2A2F37] rounded-2xl p-1 shadow-xl">
              <div className="bg-[#1F2329] rounded-xl p-6 border border-[#3A404A]">

                <div className="flex justify-between items-center mb-6">
                  <label className="text-xs font-semibold text-[#C7C9CC] uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-[#8F9399] rounded-sm"></span>
                    Gallery <span className="text-[#5C6066]">*</span>
                  </label>

                  <span className={`text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-widest 
                    ${extraImages.length < 2 
                      ? "text-[#E24B4B] border border-[#E24B4B]/40 bg-[#E24B4B]/10" 
                      : "text-emerald-400 border border-emerald-400/40 bg-emerald-400/10"
                    }`}
                  >
                    {extraImages.length} / 2 Verified
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">

                  {extraImages.map((file, i) => (
                    <div key={i} className="aspect-square bg-[#111418] border border-[#2A2F37] rounded-lg relative overflow-hidden group hover:border-[#3A404A]">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                      
                      <button 
                        onClick={() => removeExtraImage(i)}
                        className="absolute top-2 right-2 p-2 bg-[#181B20] text-[#E24B4B] border border-[#2A2F37] rounded opacity-0 group-hover:opacity-100 transition hover:bg-[#E24B4B] hover:text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div className="absolute bottom-2 left-2 text-[8px] font-mono text-[#8F9399] bg-[#111418]/80 px-1 py-0.5 rounded border border-[#2A2F37]">
                        IMG_0{i+1}
                      </div>
                    </div>
                  ))}

                  <label className="aspect-square bg-[#111418] border-2 border-dashed border-[#2A2F37] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#181B20] hover:border-[#3A404A] transition group">
                    <Plus className="w-6 h-6 text-[#5C6066] group-hover:text-[#C7C9CC] transition" />
                    <span className="text-[9px] text-[#5C6066] uppercase font-bold tracking-widest group-hover:text-[#C7C9CC]">Add</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleExtraImagesChange} />
                  </label>

                </div>

              </div>
            </div>

          </motion.div>

          {/* RIGHT: FORM */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 sticky top-28"
          >
            <div className="bg-[#181B20] border border-[#2A2F37] rounded-2xl p-8 shadow-xl relative">

              <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-[#3A404A] to-transparent"></div>

              <div className="flex items-center gap-3 pb-6 border-b border-[#2A2F37]">
                <div className="p-2 bg-[#1F2329] border border-[#3A404A] rounded">
                  <ScanLine className="w-4 h-4 text-[#F2F2F3]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#F2F2F3]">Info</h2>
                  
                </div>
              </div>

              {/* Title */}
              <div className="space-y-3 group">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8F9399] group-focus-within:text-[#F2F2F3] flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Title Identifier
                </label>
                <input 
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="ITEM NAME"
                  className="w-full bg-[#1F2329] border border-[#2A2F37] rounded-lg px-5 py-4 text-sm text-[#F2F2F3] placeholder:text-[#5C6066]
                    focus:border-[#4EA3FF] focus:ring-1 focus:ring-[#4EA3FF] outline-none transition"
                />
              </div>

              {/* Price + Location */}
              <div className="grid grid-cols-2 gap-6">

                {/* Price */}
                <div className="space-y-3 group">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8F9399] group-focus-within:text-[#F2F2F3] flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> Valuation
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8F9399] text-xs font-mono">₹</span>
                    <input 
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full bg-[#1F2329] border border-[#2A2F37] rounded-lg pl-8 pr-4 py-4 text-sm text-[#F2F2F3] placeholder:text-[#5C6066]
                        focus:border-[#4EA3FF] focus:ring-1 focus:ring-[#4EA3FF] outline-none transition"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3 group">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8F9399] group-focus-within:text-[#F2F2F3] flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Sector
                  </label>
                  <input 
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="CITY"
                    className="w-full bg-[#1F2329] border border-[#2A2F37] rounded-lg px-5 py-4 text-sm text-[#F2F2F3] placeholder:text-[#5C6066]
                      focus:border-[#4EA3FF] focus:ring-1 focus:ring-[#4EA3FF] outline-none transition"
                  />
                </div>

              </div>

              {/* Category + Condition */}
              <div className="grid grid-cols-2 gap-6">

                {/* Category */}
                <div className="space-y-3 group">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8F9399] group-focus-within:text-[#F2F2F3] flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Class
                  </label>
                                    <div className="relative">
                                      <select 
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-[#1F2329] border border-[#2A2F37] rounded-lg px-5 py-4 text-sm text-[#F2F2F3] focus:border-[#4EA3FF] focus:ring-1 focus:ring-[#4EA3FF] outline-none cursor-pointer appearance-none transition shadow-sm hover:border-[#4EA3FF]/60 focus:shadow-lg"
                                      >
                                        <option value="" disabled hidden>Choose category</option>
                                        <option value="electronics">ELECTRONICS</option>
                                        <option value="lifestyle">LIFESTYLE</option>
                                        <option value="collectables">COLLECTABLES</option>
                                        <option value="car">CAR</option>
                                        <option value="bike">BIKE</option>
                                      </select>
                                      <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
                                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#8F9399]" />
                                      </div>
                                    </div>

                </div>

                {/* Condition */}
                <div className="space-y-3 group">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8F9399] group-focus-within:text-[#F2F2F3] flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Integrity
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <select 
                        value={condition}
                        onChange={e => setCondition(e.target.value)}
                        className="w-full bg-[#1F2329] border border-[#2A2F37] rounded-lg px-5 py-4 text-sm text-[#F2F2F3] focus:border-[#4EA3FF] focus:ring-1 focus:ring-[#4EA3FF] outline-none cursor-pointer appearance-none transition shadow-sm hover:border-[#4EA3FF]/60 focus:shadow-lg"
                      >
                        <option value="" disabled hidden>Choose condition</option>
                        <option value="brand_new">BRAND NEW</option>
                        <option value="opened_not_used">OPENED (NOT USED)</option>
                        <option value="used">USED</option>
                      </select>
                      <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#8F9399]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Description */}
              <div className="space-y-3 group">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8F9399] group-focus-within:text-[#F2F2F3]">
                  Detailed Specs
                </label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={6}
                  placeholder="ENTER DESCRIPTION"
                  className="w-full bg-[#1F2329] border border-[#2A2F37] rounded-lg px-5 py-4 text-sm text-[#F2F2F3] placeholder:text-[#5C6066]
                    focus:border-[#4EA3FF] focus:ring-1 focus:ring-[#4EA3FF] outline-none resize-y font-mono"
                />
              </div>

              {/* Submit */}
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-5 bg-[#F2F2F3] text-black font-black text-xs uppercase tracking-[0.2em] rounded-lg hover:bg-[#E2E2E2] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> PUBLISH ASSET
                  </>
                )}
              </button>

            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
