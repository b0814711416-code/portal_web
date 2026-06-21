import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatThaiDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ file?: string }>;
}) {
  const { id } = await params;
  const { file: fileIndex } = await searchParams;

  const [session, doc] = await Promise.all([
    getSession(),
    db.document.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        files: { orderBy: { sort_order: "asc" } },
      },
    }),
  ]);

  if (!doc) notFound();
  if (!doc.is_public && !session) redirect(`/login?redirect=/document/${id}`);

  // Build unified file list (new multi-file + legacy single-file fallback)
  const fileList = doc.files.length > 0
    ? doc.files
    : doc.google_drive_file_id
    ? [{
        id: "legacy",
        file_name: doc.title,
        mime_type: "application/octet-stream",
        google_drive_file_id: doc.google_drive_file_id,
        view_link: doc.view_link ?? "",
        download_link: doc.download_link ?? "",
        sort_order: 0,
      }]
    : [];

  const selectedIdx = Math.min(Number(fileIndex ?? 0), fileList.length - 1);
  const activeFile = fileList[selectedIdx] ?? null;
  const previewUrl = activeFile
    ? `https://drive.google.com/file/d/${activeFile.google_drive_file_id}/preview`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-900 text-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <button className="text-blue-200 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-300 font-mono truncate">{doc.doc_number}</p>
            <h1 className="font-semibold text-sm leading-snug line-clamp-1">{doc.title}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 py-4">
        {/* Meta */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">
              {doc.category.name}
            </Badge>
            {doc.is_public ? (
              <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">สาธารณะ</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">ภายใน</Badge>
            )}
            <span className="text-xs text-gray-400 self-center">ปีการศึกษา {doc.academic_year}</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">ลงวันที่ {formatThaiDate(doc.date)}</p>
          {doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {doc.tags.map((tag: string) => (
                <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {activeFile?.download_link && (
              <a href={activeFile.download_link} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white text-xs h-8">
                  ดาวน์โหลด
                </Button>
              </a>
            )}
            {activeFile?.view_link && (
              <a href={activeFile.view_link} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="text-xs h-8">
                  เปิดใน Drive
                </Button>
              </a>
            )}
            {session?.role === "admin" && (
              <Link href={`/admin/upload?edit=${doc.id}`}>
                <Button size="sm" variant="outline" className="text-xs h-8 text-orange-600 border-orange-200">
                  แก้ไข
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* File tabs (if multiple) */}
        {fileList.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {fileList.map((f, i) => (
              <Link key={f.id} href={`/document/${id}?file=${i}`}>
                <button className={`text-xs px-3 py-1.5 rounded-lg border transition-colors truncate max-w-[200px] ${
                  i === selectedIdx
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}>
                  {f.file_name}
                </button>
              </Link>
            ))}
          </div>
        )}

        {/* Preview */}
        {previewUrl ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <iframe
              src={previewUrl}
              className="w-full"
              style={{ height: "calc(100vh - 260px)", minHeight: "500px" }}
              allow="autoplay"
              title={activeFile?.file_name ?? doc.title}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm">ไม่มีไฟล์แนบ</p>
          </div>
        )}
      </div>
    </div>
  );
}
