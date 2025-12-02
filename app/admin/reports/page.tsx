"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AdminReportItem from "../../../../components/AdminReportItem";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ReportsPage() {
  const router = useRouter();

  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const PAGE_SIZE = 5;

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

  async function loadReports() {
    let query = supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim() !== "") {
      query = query.ilike("reason", `%${search}%`);
    }

    const { data } = await query;
    setReports(data || []);
  }

  useEffect(() => {
    check();
  }, []);

  useEffect(() => {
    if (isAdmin) loadReports();
  }, [isAdmin, page, search]);

  if (!isAdmin) return <p className="pt-20 text-center">Checking...</p>;

  return (
    <div className="max-w-2xl mx-auto pt-10 pb-20">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>

      <input
        placeholder="Search by reason..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full"
      />

      <div className="space-y-6">
        {reports.map((r: any) => (
          <AdminReportItem key={r.id} report={r} />
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          Prev
        </button>

        <button onClick={() => setPage(p => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
