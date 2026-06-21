import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export const maxDuration = 60;

// Creates document record (no files) — files are added via /api/documents/[id]/files
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์การเข้าถึง" }, { status: 403 });
    }

    const body = await req.json();
    const { doc_number, title, date, academic_year, category_id, tags, is_public } = body;

    if (!doc_number || !title || !date || !academic_year || !category_id) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const category = await db.documentCategory.findUnique({ where: { id: category_id } });
    if (!category) {
      return NextResponse.json({ error: "ไม่พบประเภทเอกสาร" }, { status: 400 });
    }

    const doc = await db.document.create({
      data: {
        doc_number,
        title,
        date: new Date(date),
        academic_year: Number(academic_year),
        category_id,
        tags: tags ?? [],
        is_public: is_public ?? false,
        role_created: "admin",
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err: unknown) {
    console.error("[upload]", err);
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลด";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
