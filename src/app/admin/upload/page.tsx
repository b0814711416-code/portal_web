import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { UploadForm } from "@/components/upload-form";

export default async function AdminUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/login?redirect=/admin/upload");

  const { edit } = await searchParams;
  const [categories, editDoc] = await Promise.all([
    db.documentCategory.findMany({ orderBy: { name: "asc" } }),
    edit ? db.document.findUnique({ where: { id: edit } }) : null,
  ]);

  return <UploadForm categories={categories} editDocument={editDoc} />;
}
