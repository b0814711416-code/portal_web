import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const year = Number(req.nextUrl.searchParams.get("year") ?? 0);
  if (!year) return NextResponse.json({ next: "" });

  const docs = await db.document.findMany({
    where: { category_id: id, academic_year: year },
    select: { doc_number: true },
  });

  // Parse numeric prefix: e.g. "12/2569" → 12, "003/2568" → 3
  const pattern = /^(\d+)\//;
  const nums = docs
    .map((d) => pattern.exec(d.doc_number)?.[1])
    .filter(Boolean)
    .map(Number);

  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return NextResponse.json({ next: `${next}/${year}` });
}
