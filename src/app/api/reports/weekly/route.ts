import { NextResponse } from "next/server";
import { readDb } from "../../_lib/db";

export async function GET() {
  const db = readDb();

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recentLogs = db.logs.filter((log) => {
    const t = Date.parse(log.timestamp);
    if (Number.isNaN(t)) return false;
    return t >= weekAgo && t <= now;
  });

  const perCategory: Record<string, number> = {};
  const perItem: Record<string, { itemName: string; category: string; count: number }> =
    {};

  for (const log of recentLogs) {
    perCategory[log.category] = (perCategory[log.category] ?? 0) + 1;
    const key = `${log.itemId}|${log.itemName}`;
    if (!perItem[key]) {
      perItem[key] = {
        itemName: log.itemName,
        category: log.category,
        count: 0,
      };
    }
    perItem[key]!.count += 1;
  }

  let mostCommonItem: { itemName: string; category: string; count: number } | undefined;
  for (const item of Object.values(perItem)) {
    if (!mostCommonItem || item.count > mostCommonItem.count) {
      mostCommonItem = item;
    }
  }

  return NextResponse.json({
    report: {
      generatedAt: new Date().toISOString(),
      totalClassifications: recentLogs.length,
      perCategory,
      mostCommonItem,
    },
  });
}

