import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") ?? "";
  const year = searchParams.get("year");
  const categoryId = searchParams.get("category");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: Record<string, unknown> = {};

  if (!session) {
    where.is_public = true;
  }

  if (year) {
    where.academic_year = Number(year);
  }

  if (categoryId) {
    where.category_id = categoryId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { doc_number: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ date: "desc" }, { created_at: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.document.count({ where }),
  ]);

  return NextResponse.json({ documents, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์การเข้าถึง" }, { status: 403 });
  }

  const body = await req.json();
  const {
    doc_number,
    title,
    date,
    academic_year,
    category_id,
    google_drive_file_id,
    view_link,
    download_link,
    tags,
    is_public,
  } = body;

  const doc = await db.document.create({
    data: {
      doc_number,
      title,
      date: new Date(date),
      academic_year: Number(academic_year),
      category_id,
      google_drive_file_id,
      view_link,
      download_link,
      tags: tags ?? [],
      is_public: is_public ?? false,
      role_created: "admin",
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(doc, { status: 201 });
}
