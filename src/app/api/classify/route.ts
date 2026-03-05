import { NextRequest, NextResponse } from "next/server";
import { classifyItem, readDb, writeDb } from "../_lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";

  if (!name.trim()) {
    return NextResponse.json(
      { message: "Please provide the name or type of a waste item." },
      { status: 400 }
    );
  }

  const { item } = classifyItem(name);

  if (!item) {
    return NextResponse.json(
      {
        message:
          "That item is not yet in the database. Please try a simpler description or ask an administrator to add it.",
      },
      { status: 404 }
    );
  }

  const db = readDb();
  const now = new Date().toISOString();
  db.logs.push({
    timestamp: now,
    itemId: item.id,
    itemName: item.name,
    category: item.category,
  });
  writeDb(db);

  return NextResponse.json({
    result: {
      itemName: item.name,
      normalizedName: item.name.toLowerCase(),
      category: item.category,
      instructions: item.instructions,
    },
  });
}

