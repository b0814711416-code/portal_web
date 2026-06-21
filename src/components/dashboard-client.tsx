"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentCard } from "@/components/document-card";

type Category = { id: string; name: string };
type Session = { role: "admin" | "teacher" | "guest" } | null;
type Document = {
  id: string;
  doc_number: string;
  title: string;
  date: string;
  academic_year: number;
  is_public: boolean;
  view_link: string | null;
  download_link: string | null;
  tags: string[];
  category: Category;
};

interface Props {
  session: Session;
  categories: Category[];
  currentYear: number;
  years: number[];
}

export function DashboardClient({ session, categories, currentYear, years }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (selectedYear !== "all") params.set("year", selectedYear);
    if (selectedCategory !== "all") params.set("category", selectedCategory);

    try {
      const res = await fetch(`/api/documents?${params}`);
      const data = await res.json();
      setDocuments(data.documents);
      setTotal(data.total);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [search, selectedYear, selectedCategory, page]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedYear, selectedCategory]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    window.location.reload();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-base leading-tight">ไชยสอ DocHub</h1>
            <p className="text-blue-200 text-xs">โรงเรียนบ้านไชยสอ สพป.ขอนแก่น เขต 5</p>
          </div>
          <div className="flex items-center gap-2">
            {session?.role === "admin" && (
              <>
                <Link href="/admin/upload">
                  <Button size="sm" className="bg-white text-blue-900 hover:bg-blue-50 text-xs h-8 px-3">
                    + เพิ่มเอกสาร
                  </Button>
                </Link>
                <Link href="/admin/categories">
                  <Button size="sm" variant="ghost" className="text-blue-200 hover:text-white hover:bg-blue-800 text-xs h-8 px-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </Button>
                </Link>
              </>
            )}
            {session ? (
              <button
                onClick={handleLogout}
                className="text-blue-200 hover:text-white text-xs transition-colors"
              >
                ออกจากระบบ
              </button>
            ) : (
              <Link href="/login" className="text-blue-200 hover:text-white text-xs transition-colors">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5">
        {/* Role badge */}
        <div className="flex items-center gap-2 mb-4">
          {session ? (
            <Badge variant="secondary" className="text-xs">
              {session.role === "admin" ? "แอดมิน" : "ครู/บุคลากร"}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-gray-500">
              บุคคลทั่วไป (เฉพาะเอกสารสาธารณะ)
            </Badge>
          )}
          <span className="text-gray-400 text-xs">รวม {total} รายการ</span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
          <Input
            placeholder="ค้นหาเลขที่, ชื่อเรื่อง, หรือแท็ก..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-gray-200 focus:border-blue-500"
          />
          {/* Year quick filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedYear("all")}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                selectedYear === "all"
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
              }`}
            >
              ทุกปี
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(String(y))}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedYear === String(y)
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          {/* Category tab filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                selectedCategory === "all"
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
              }`}
            >
              ทุกประเภท
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedCategory === c.id
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Document list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            <p className="text-sm">ไม่พบเอกสาร</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                isAdmin={session?.role === "admin"}
                onDeleted={fetchDocuments}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ก่อนหน้า
            </Button>
            <span className="text-sm text-gray-500 self-center">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
