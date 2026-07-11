/**
 * GET /api/analytics
 * Returns aggregated data for the analytics dashboard:
 *   - weeklyApplications: [{ week: "W27", submitted: 3, rejected: 1, pending: 2 }]
 *   - statusDistribution: [{ status: "submitted", count: 8 }, ...]
 *   - topPlatforms: [{ name: "Indeed", count: 5 }, ...]
 *   - contractTypeDistribution: [{ type: "remote", count: 6 }, ...]
 *   - languageDistribution: [{ lang: "en", count: 7 }, ...]
 *   - qualityTrend: [{ date: "2025-07-01", avgScore: 0.82 }, ...]
 *   - summary: { total, submitted, rejected, pending, avgQuality, responseRate }
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // All applications with their job offer + platform
  const applications = await db.application.findMany({
    select: {
      id: true,
      status: true,
      qualityScore: true,
      language: true,
      createdAt: true,
      submittedAt: true,
      jobOffer: {
        select: {
          id: true,
          contractType: true,
          platform: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // --- Weekly applications (last 8 weeks) ---
  const now = new Date();
  const weeks: Array<{ week: string; submitted: number; rejected: number; pending: number }> = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7 - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekNum = Math.ceil(
      ((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / 86400000 +
        new Date(weekStart.getFullYear(), 0, 1).getDay() +
        1) /
        7
    );
    const inWeek = applications.filter((a) => {
      const d = new Date(a.submittedAt ?? a.createdAt);
      return d >= weekStart && d < weekEnd;
    });
    weeks.push({
      week: `W${weekNum}`,
      submitted: inWeek.filter((a) => a.status === "submitted").length,
      rejected: inWeek.filter((a) => a.status === "rejected").length,
      pending: inWeek.filter(
        (a) => a.status === "pending_approval" || a.status === "draft"
      ).length,
    });
  }

  // --- Status distribution ---
  const statusMap = new Map<string, number>();
  for (const a of applications) {
    statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1);
  }
  const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  // --- Top platforms (by application count) ---
  const platformMap = new Map<string, number>();
  for (const a of applications) {
    const name = a.jobOffer?.platform?.name ?? "Unknown";
    platformMap.set(name, (platformMap.get(name) ?? 0) + 1);
  }
  const topPlatforms = Array.from(platformMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // --- Contract type distribution ---
  const contractMap = new Map<string, number>();
  for (const a of applications) {
    const type = a.jobOffer?.contractType ?? "unknown";
    contractMap.set(type, (contractMap.get(type) ?? 0) + 1);
  }
  const contractTypeDistribution = Array.from(contractMap.entries()).map(([type, count]) => ({
    type,
    count,
  }));

  // --- Language distribution ---
  const langMap = new Map<string, number>();
  for (const a of applications) {
    const lang = a.language ?? "en";
    langMap.set(lang, (langMap.get(lang) ?? 0) + 1);
  }
  const languageDistribution = Array.from(langMap.entries()).map(([lang, count]) => ({
    lang,
    count,
  }));

  // --- Quality trend (last 14 days, avg score per day) ---
  const qualityTrend: Array<{ date: string; avgScore: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setDate(day.getDate() + 1);
    const inDay = applications.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= day && d < dayEnd && a.qualityScore != null;
    });
    const avg =
      inDay.length > 0
        ? inDay.reduce((s, a) => s + (a.qualityScore ?? 0), 0) / inDay.length
        : 0;
    qualityTrend.push({
      date: day.toISOString().slice(5, 10), // MM-DD
      avgScore: Math.round(avg * 100) / 100,
    });
  }

  // --- Summary ---
  const total = applications.length;
  const submitted = applications.filter((a) => a.status === "submitted").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  const pending = applications.filter(
    (a) => a.status === "pending_approval" || a.status === "draft"
  ).length;
  const scoredApps = applications.filter((a) => a.qualityScore != null);
  const avgQuality =
    scoredApps.length > 0
      ? scoredApps.reduce((s, a) => s + (a.qualityScore ?? 0), 0) / scoredApps.length
      : 0;
  const responseRate = submitted > 0 ? (submitted - rejected) / submitted : 0;

  return NextResponse.json({
    weeklyApplications: weeks,
    statusDistribution,
    topPlatforms,
    contractTypeDistribution,
    languageDistribution,
    qualityTrend,
    summary: {
      total,
      submitted,
      rejected,
      pending,
      avgQuality: Math.round(avgQuality * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
    },
  });
}
