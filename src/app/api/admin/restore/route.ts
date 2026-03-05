import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "db.json");

export async function POST(request: NextRequest) {
  const text = await request.text();

  if (!text.trim()) {
    return NextResponse.json(
      { message: "Backup file is empty." },
      { status: 400 }
    );
  }

  try {
    const parsed = JSON.parse(text);
    if (
      typeof parsed !== "object" ||
      !parsed ||
      !Array.isArray((parsed as any).categories) ||
      !Array.isArray((parsed as any).items) ||
      !Array.isArray((parsed as any).logs)
    ) {
      throw new Error("Backup format is invalid.");
    }

    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          (error as Error)?.message ?? "Failed to read or apply backup file.",
      },
      { status: 400 }
    );
  }
}

