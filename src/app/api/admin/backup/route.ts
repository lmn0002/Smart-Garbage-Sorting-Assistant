import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "db.json");

export async function GET() {
  if (!fs.existsSync(DB_FILE)) {
    return NextResponse.json(
      { message: "No database file found to back up." },
      { status: 404 }
    );
  }

  const content = fs.readFileSync(DB_FILE, "utf-8");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="waste-db-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}

