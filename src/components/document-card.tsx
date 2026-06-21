"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  category: { id: string; name: string };
};

interface Props {
  document: Document;
  isAdmin: boolean;
  onDeleted: () => void;
}

function formatThaiDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function DocumentCard({ document: doc, isAdmin, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบเอกสารเรียบร้อยแล้ว");
        onDeleted();
      } else {
        toast.error("ไม่สามารถลบเอกสารได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link href={`/document/${doc.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* เลขที่ */}
          <span className="flex-shrink-0 text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
            {doc.doc_number}
          </span>

          {/* ชื่อเรื่อง */}
          <span className="flex-1 text-sm font-medium text-gray-800 truncate">
            {doc.title}
          </span>

          {/* หมวดหมู่ */}
          <span className="flex-shrink-0 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hidden sm:inline">
            {doc.category.name}
          </span>

          {/* วันที่ */}
          <span className="flex-shrink-0 text-xs text-gray-400 hidden md:inline">
            {formatThaiDate(doc.date)}
          </span>

          {/* สถานะ */}
          {!doc.is_public && (
            <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded hidden sm:inline">
              ภายใน
            </span>
          )}

          {/* Actions */}
          {isAdmin && (
            <div className="flex-shrink-0 flex items-center gap-2 ml-1" onClick={(e) => e.preventDefault()}>
              <Link href={`/admin/upload?edit=${doc.id}`} onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-orange-500 hover:text-orange-700">แก้ไข</span>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger
                  disabled={deleting}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  ลบ
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>ยืนยันการลบเอกสาร</AlertDialogTitle>
                    <AlertDialogDescription>
                      ต้องการลบเอกสาร &ldquo;{doc.title}&rdquo; หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      ลบเอกสาร
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
