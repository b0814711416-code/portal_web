import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { deleteFileFromDrive } from "@/lib/google-drive";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);

  const doc = await db.document.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!doc) {
    return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
  }

  if (!doc.is_public && !session) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  return NextResponse.json(doc);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์การเข้าถึง" }, { status: 403 });
  }

  const body = await req.json();
  const doc = await db.document.update({
    where: { id },
    data: {
      ...(body.doc_number !== undefined && { doc_number: body.doc_number }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.academic_year !== undefined && { academic_year: Number(body.academic_year) }),
      ...(body.category_id !== undefined && { category_id: body.category_id }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.is_public !== undefined && { is_public: body.is_public }),
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(doc);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์การเข้าถึง" }, { status: 403 });
  }

  const doc = await db.document.findUnique({
    where: { id },
    include: { files: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });
  }

  const driveIds = [
    ...(doc.google_drive_file_id ? [doc.google_drive_file_id] : []),
    ...doc.files.map((f) => f.google_drive_file_id),
  ];
  await Promise.allSettled(driveIds.map((fid) => deleteFileFromDrive(fid)));

  await db.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
