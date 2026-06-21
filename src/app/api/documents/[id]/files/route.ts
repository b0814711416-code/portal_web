import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { uploadFileToDrive } from "@/lib/google-drive";
import { db } from "@/lib/db";
import Busboy from "busboy";
import { Readable } from "node:stream";

export const maxDuration = 60;

function parseMultipart(req: NextRequest): Promise<{ file: Readable; filename: string; mimeType: string; sortOrder: number }> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type") ?? "";
    const bb = Busboy({ headers: { "content-type": contentType } });

    let sortOrder = 0;
    let resolved = false;

    bb.on("field", (name, value) => {
      if (name === "sort_order") sortOrder = Number(value);
    });

    bb.on("file", (_name, stream, info) => {
      resolved = true;
      resolve({ file: stream, filename: info.filename, mimeType: info.mimeType || "application/octet-stream", sortOrder });
    });

    bb.on("error", reject);
    bb.on("finish", () => { if (!resolved) reject(new Error("ไม่พบไฟล์ใน request")); });

    // Pipe Web ReadableStream → Node.js stream → busboy
    Readable.fromWeb(req.body as Parameters<typeof Readable.fromWeb>[0]).pipe(bb);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์การเข้าถึง" }, { status: 403 });
    }

    const { id } = await params;
    const doc = await db.document.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!doc) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

    const { file, filename, mimeType, sortOrder } = await parseMultipart(req);

    const { fileId, viewLink, downloadLink } = await uploadFileToDrive(
      file,
      filename,
      mimeType,
      doc.academic_year,
      doc.category.name
    );

    const docFile = await db.documentFile.create({
      data: {
        document_id: id,
        file_name: filename,
        mime_type: mimeType,
        google_drive_file_id: fileId,
        view_link: viewLink,
        download_link: downloadLink,
        sort_order: sortOrder,
      },
    });

    return NextResponse.json(docFile, { status: 201 });
  } catch (err: unknown) {
    console.error("[files/upload]", err);
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลดไฟล์";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
