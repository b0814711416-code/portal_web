"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

type Category = { id: string; name: string };
type EditDoc = {
  id: string;
  doc_number: string;
  title: string;
  date: Date;
  academic_year: number;
  category_id: string;
  tags: string[];
  is_public: boolean;
} | null;

interface Props {
  categories: Category[];
  editDocument: EditDoc;
}

const YEARS = Array.from({ length: 7 }, (_, i) => 2566 + i);

export function UploadForm({ categories, editDocument }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [docNumber, setDocNumber] = useState(editDocument?.doc_number ?? "");
  const [title, setTitle] = useState(editDocument?.title ?? "");
  const [date, setDate] = useState(
    editDocument ? new Date(editDocument.date).toISOString().split("T")[0] : ""
  );
  const [academicYear, setAcademicYear] = useState(
    String(editDocument?.academic_year ?? 2569)
  );
  const [categoryId, setCategoryId] = useState(editDocument?.category_id ?? "");
  const [tagInput, setTagInput] = useState(editDocument?.tags.join(", ") ?? "");
  const [isPublic, setIsPublic] = useState(editDocument?.is_public ?? false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [autoNumber, setAutoNumber] = useState(false);

  // Auto-fill doc_number when category or year changes (new doc only)
  useEffect(() => {
    if (editDocument || !categoryId || !academicYear) return;
    fetch(`/api/categories/${categoryId}/next-number?year=${academicYear}`)
      .then((r) => r.json())
      .then(({ next }) => {
        if (next) { setDocNumber(next); setAutoNumber(true); }
      })
      .catch(() => {});
  }, [categoryId, academicYear, editDocument]);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const next = Array.from(incoming).filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...next];
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDocument && files.length === 0) {
      toast.error("กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์");
      return;
    }
    if (!docNumber || !title || !date || !categoryId) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editDocument) {
        const res = await fetch(`/api/documents/${editDocument.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doc_number: docNumber,
            title,
            date,
            academic_year: Number(academicYear),
            category_id: categoryId,
            tags,
            is_public: isPublic,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success("แก้ไขข้อมูลเรียบร้อยแล้ว");
        router.push(`/document/${editDocument.id}`);
      } else {
        // Step 1: create document record (metadata only)
        setUploadProgress("กำลังสร้างเอกสาร...");
        const metaRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doc_number: docNumber,
            title,
            date,
            academic_year: Number(academicYear),
            category_id: categoryId,
            tags,
            is_public: isPublic,
          }),
        });
        if (!metaRes.ok) {
          let msg = "สร้างเอกสารไม่สำเร็จ";
          try { const err = await metaRes.json(); msg = err.error ?? msg; } catch {}
          throw new Error(msg);
        }
        const doc = await metaRes.json();

        // Step 2: upload each file one at a time
        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`กำลังอัปโหลดไฟล์ ${i + 1}/${files.length}...`);
          const fd = new FormData();
          fd.append("file", files[i]);
          fd.append("sort_order", String(i));
          const fileRes = await fetch(`/api/documents/${doc.id}/files`, { method: "POST", body: fd });
          if (!fileRes.ok) {
            let msg = `อัปโหลดไฟล์ที่ ${i + 1} ไม่สำเร็จ`;
            try { const err = await fileRes.json(); msg = err.error ?? msg; } catch {}
            // delete the created doc to avoid orphan records
            await fetch(`/api/documents/${doc.id}`, { method: "DELETE" }).catch(() => {});
            throw new Error(msg);
          }
        }

        toast.success("อัปโหลดเอกสารเรียบร้อยแล้ว");
        router.push(`/document/${doc.id}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
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
          <h1 className="font-semibold text-sm">
            {editDocument ? "แก้ไขข้อมูลเอกสาร" : "เพิ่มเอกสารใหม่"}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload (only for new) */}
          {!editDocument && (
            <div className="space-y-2">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative bg-white rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  dragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
              >
                {/* input ทับเต็มพื้นที่ — ทำงานได้ทั้ง desktop และมือถือ */}
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <div className="text-gray-400 pointer-events-none">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm">แตะหรือลากไฟล์มาวางที่นี่</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, รูปภาพ และอื่นๆ (เลือกได้หลายไฟล์)</p>
                </div>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="flex-1 text-sm text-gray-800 truncate">{f.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">เลขที่เอกสาร *</Label>
                  {autoNumber && !editDocument && (
                    <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">อัตโนมัติ</span>
                  )}
                </div>
                <Input
                  value={docNumber}
                  onChange={(e) => { setDocNumber(e.target.value); setAutoNumber(false); }}
                  placeholder="เช่น 12/2567"
                  className="text-sm h-9"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">วันที่ *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm h-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">ชื่อเรื่อง *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ชื่อเอกสารหรือคำสั่ง"
                className="text-sm h-9"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">ประเภทเอกสาร *</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="เลือกประเภท">
                      {(v: string) => v ? (categories.find(c => c.id === v)?.name ?? v) : "เลือกประเภท"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-sm">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">ปีการศึกษา *</Label>
                <Select value={academicYear} onValueChange={(v) => setAcademicYear(v ?? String(new Date().getFullYear() + 543))}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-sm">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-600">แท็ก (คั่นด้วยจุลภาค)</Label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="ฝ่ายวิชาการ, งบประมาณ, ONESQA"
                className="text-sm h-9"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-700">เอกสารสาธารณะ</p>
                <p className="text-xs text-gray-400">
                  {isPublic ? "บุคคลทั่วไปสามารถดูได้" : "เฉพาะครูและแอดมินเท่านั้น"}
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white h-10"
          >
            {submitting
              ? (uploadProgress || "กำลังบันทึก...")
              : editDocument
              ? "บันทึกการแก้ไข"
              : `อัปโหลดและบันทึกเอกสาร${files.length > 1 ? ` (${files.length} ไฟล์)` : ""}`}
          </Button>
        </form>
      </main>
    </div>
  );
}
