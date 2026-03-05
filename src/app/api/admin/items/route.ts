import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, type WasteItem } from "../../_lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const db = readDb();
  return NextResponse.json({
    categories: db.categories,
    items: db.items,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Partial<WasteItem>
    | null;

  if (!body) {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const name = body.name?.trim() ?? "";
  const category = body.category?.trim() ?? "";
  const instructions = body.instructions?.trim() ?? "";
  const synonyms = Array.isArray(body.synonyms) ? body.synonyms : [];

  if (!name || !category || !instructions) {
    return NextResponse.json(
      { message: "Name, category, and instructions are required." },
      { status: 400 }
    );
  }

  const db = readDb();
  if (!db.categories.includes(category)) {
    db.categories.push(category);
  }

  const id = randomUUID();
  const item: WasteItem = {
    id,
    name,
    category,
    instructions,
    synonyms: synonyms.map((s) => String(s)),
  };
  db.items.push(item);
  writeDb(db);

  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | Partial<WasteItem>
    | null;

  if (!body?.id) {
    return NextResponse.json(
      { message: "Item id is required for update." },
      { status: 400 }
    );
  }

  const db = readDb();
  const index = db.items.findIndex((it) => it.id === body.id);
  if (index === -1) {
    return NextResponse.json({ message: "Item not found." }, { status: 404 });
  }

  const current = db.items[index]!;

  const updated: WasteItem = {
    ...current,
    name: body.name?.trim() ?? current.name,
    category: body.category?.trim() ?? current.category,
    instructions: body.instructions?.trim() ?? current.instructions,
    synonyms: Array.isArray(body.synonyms)
      ? body.synonyms.map((s) => String(s))
      : current.synonyms,
  };

  if (!db.categories.includes(updated.category)) {
    db.categories.push(updated.category);
  }

  db.items[index] = updated;
  writeDb(db);

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { message: "Item id is required for deletion." },
      { status: 400 }
    );
  }

  const db = readDb();
  const index = db.items.findIndex((it) => it.id === id);
  if (index === -1) {
    return NextResponse.json({ message: "Item not found." }, { status: 404 });
  }

  db.items.splice(index, 1);
  writeDb(db);

  return NextResponse.json({ success: true });
}

