import fs from "fs";
import path from "path";

export type WasteItem = {
  id: string;
  name: string;
  category: string;
  synonyms: string[];
  instructions: string;
};

export type WasteLog = {
  timestamp: string;
  itemId: string;
  itemName: string;
  category: string;
};

export type Database = {
  categories: string[];
  items: WasteItem[];
  logs: WasteLog[];
};

const DB_FILE = path.join(process.cwd(), "data", "db.json");

function ensureDbFile(): void {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: Database = {
      categories: [
        "Plastic",
        "Paper",
        "Glass",
        "Metal",
        "Organic",
        "Electronic",
      ],
      items: [],
      logs: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function readDb(): Database {
  ensureDbFile();
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw) as Database;
}

export function writeDb(db: Database): void {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function classifyItem(name: string): {
  item: WasteItem | null;
} {
  const db = readDb();
  const normalized = normalizeName(name);

  const item =
    db.items.find((it) => normalizeName(it.name) === normalized) ??
    db.items.find((it) =>
      it.synonyms.some((s) => normalizeName(s) === normalized)
    );

  return { item: item ?? null };
}

