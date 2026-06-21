import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์การเข้าถึง" }, { status: 403 });
  }
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 });
  }
  const existing = await db.documentCategory.findFirst({
    where: { name: name.trim(), NOT: { id } },
  });
  if (existing) {
    return NextResponse.json({ error: "มีหมวดหมู่นี้อยู่แล้ว" }, { status: 409 });
  }
  const category = await db.documentCategory.update({
    where: { id },
    data: { name: name.trim() },
  });
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์การเข้าถึง" }, { status: 403 });
  }
  const { id } = await params;
  const count = await db.document.count({ where: { category_id: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `ไม่สามารถลบได้ มีเอกสาร ${count} รายการในหมวดนี้` },
      { status: 409 }
    );
  }
  await db.documentCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
