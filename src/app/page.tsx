import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard-client";

export default async function HomePage() {
  const [session, categories] = await Promise.all([
    getSession(),
    db.documentCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  // ปีการศึกษาปัจจุบันของโรงเรียนบ้านไชยสอ คือ 2569
  const currentYear = 2569;
  const years = Array.from({ length: 7 }, (_, i) => 2566 + i);

  return (
    <DashboardClient
      session={session}
      categories={categories}
      currentYear={currentYear}
      years={years}
    />
  );
}
