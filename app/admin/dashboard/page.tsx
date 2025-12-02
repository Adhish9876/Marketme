"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  async function check() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/admin/login");

    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!data?.is_admin) return router.push("/");

    setIsAdmin(true);
  }

  useEffect(() => { check(); }, []);

  if (!isAdmin) return <p className="pt-20 text-center">Checking admin...</p>;

  return (
    <div className="max-w-xl mx-auto pt-20">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <button className="w-full mb-3"
        onClick={() => router.push("/admin/reports")}
      >
        View Reports
      </button>

      <button className="w-full"
        onClick={() => alert("User analytics page coming soon")}
      >
        User Analytics
      </button>
    </div>
  );
}
