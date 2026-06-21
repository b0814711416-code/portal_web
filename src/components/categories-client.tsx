"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: string; name: string; _count: { documents: number } };

export function CategoriesClient({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("เพิ่มหมวดหมู่เรียบร้อยแล้ว");
      setNewName("");
      setAdding(false);
      router.refresh();
      const updated = await fetch("/api/categories").then((r) => r.json());
      setCategories(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("แก้ไขหมวดหมู่เรียบร้อยแล้ว");
      setEditId(null);
      const updated = await fetch("/api/categories").then((r) => r.json());
      setCategories(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ลบหมวดหมู่ "${name}" ?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("ลบหมวดหมู่เรียบร้อยแล้ว");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <button className="text-blue-200 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Link>
          <h1 className="font-semibold text-sm">จัดการหมวดหมู่เอกสาร</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Add new */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          {adding ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setAdding(false); setNewName(""); }
                }}
                placeholder="ชื่อหมวดหมู่ใหม่"
                className="text-sm h-9"
              />
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={loading || !newName.trim()}
                className="bg-blue-900 hover:bg-blue-800 text-white h-9 px-4"
              >
                เพิ่ม
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setAdding(false); setNewName(""); }}
                className="h-9"
              >
                ยกเลิก
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center gap-2 text-blue-700 text-sm hover:text-blue-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มหมวดหมู่ใหม่
            </button>
          )}
        </div>

        {/* Category list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {categories.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">ยังไม่มีหมวดหมู่</p>
          ) : (
            categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                {editId === c.id ? (
                  <>
                    <Input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEdit(c.id);
                        if (e.key === "Escape") setEditId(null);
                      }}
                      className="text-sm h-8 flex-1"
                    />
                    <button
                      onClick={() => handleEdit(c.id)}
                      disabled={loading || !editName.trim()}
                      className="text-blue-700 hover:text-blue-900 text-xs font-medium disabled:opacity-40"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-400">{c._count.documents} รายการ</span>
                    <button
                      onClick={() => { setEditId(c.id); setEditName(c.name); }}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="แก้ไข"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      disabled={loading}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-40"
                      title="ลบ"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
