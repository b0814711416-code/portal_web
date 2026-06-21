import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const categories = await db.documentCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์การเข้าถึง" }, { status: 403 });
  }
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 });
  }
  const existing = await db.documentCategory.findFirst({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "มีหมวดหมู่นี้อยู่แล้ว" }, { status: 409 });
  }
  const category = await db.documentCategory.create({ data: { name: name.trim() } });
  return NextResponse.json(category, { status: 201 });
}
