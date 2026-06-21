import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategoriesClient } from "@/components/categories-client";

export default async function AdminCategoriesPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/login?redirect=/admin/categories");

  const categories = await db.documentCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  return <CategoriesClient categories={categories} />;
}
