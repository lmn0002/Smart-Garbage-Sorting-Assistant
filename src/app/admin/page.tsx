"use client";

import { useEffect, useState } from "react";

type WasteItem = {
  id: string;
  name: string;
  category: string;
  synonyms: string[];
  instructions: string;
};

type AdminSummary = {
  categories: string[];
  items: WasteItem[];
};

const ADMIN_PASSWORD = "admin123"; // For demo only; replace with secure auth in production.

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<WasteItem | null>(null);
  const [synonymInput, setSynonymInput] = useState("");

  const [backupUrl, setBackupUrl] = useState<string | null>(null);

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("Incorrect administrator password.");
    }
  }

  async function loadSummary() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/items");
      if (!response.ok) {
        throw new Error("Failed to load items.");
      }
      const data = (await response.json()) as AdminSummary;
      setSummary(data);
      if (!editingItem && data.items.length > 0) {
        setEditingItem(data.items[0]);
        setSynonymInput("");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadSummary();
    }
  }, [isAuthenticated]);

  function startNewItem() {
    setEditingItem({
      id: "",
      name: "",
      category: summary?.categories[0] ?? "Plastic",
      synonyms: [],
      instructions: "",
    });
    setSynonymInput("");
  }

  function addSynonym() {
    const value = synonymInput.trim();
    if (!value || !editingItem) return;
    if (editingItem.synonyms.includes(value)) {
      setSynonymInput("");
      return;
    }
    setEditingItem({
      ...editingItem,
      synonyms: [...editingItem.synonyms, value],
    });
    setSynonymInput("");
  }

  function removeSynonym(s: string) {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      synonyms: editingItem.synonyms.filter((x) => x !== s),
    });
  }

  async function saveItem() {
    if (!editingItem) return;
    if (!editingItem.name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!editingItem.category.trim()) {
      setError("Category is required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const method = editingItem.id ? "PUT" : "POST";
      const response = await fetch("/api/admin/items", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to save item.");
      }
      await loadSummary();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this item from the database?")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/items?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to delete item.");
      }
      if (editingItem && editingItem.id === id) {
        setEditingItem(null);
      }
      await loadSummary();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function backupDatabase() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/backup");
      if (!response.ok) {
        throw new Error("Failed to create backup.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setBackupUrl(url);

      const a = document.createElement("a");
      a.href = url;
      a.download = `waste-db-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function restoreDatabase(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const response = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Failed to restore backup.");
      }
      await loadSummary();
      alert("Database restored successfully.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="card" style={{ gridColumn: "1 / -1", maxWidth: 480 }}>
        <h2>Administrator access</h2>
        <p>
          This area is for authorized administrators and maintenance personnel.
          Use it to manage items, categories, and database backups.
        </p>
        <label className="field-label" htmlFor="admin-password">
          Administrator password
        </label>
        <input
          id="admin-password"
          className="text-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleLogin();
            }
          }}
        />
        <button
          type="button"
          className="primary-button"
          onClick={handleLogin}
        >
          Enter admin workspace
        </button>
        {error && (
          <div className="inline-message inline-error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      <section className="card">
        <div className="section-title-row">
          <div>
            <h2>Manage waste items</h2>
            <p>
              Add, update, or remove items and their synonyms. These definitions
              drive classification for all general users.
            </p>
          </div>
          <small>{loading ? "Saving…" : "Up to date"}</small>
        </div>

        {error && (
          <div className="inline-message inline-error" style={{ marginBottom: 10 }}>
            {error}
          </div>
        )}

        <div className="stack">
          <div className="stack-row">
            <div className="small-input">
              <label className="field-label" htmlFor="item-name">
                Item name
              </label>
              <input
                id="item-name"
                className="text-input"
                value={editingItem?.name ?? ""}
                onChange={(e) =>
                  editingItem &&
                  setEditingItem({ ...editingItem, name: e.target.value })
                }
              />
            </div>
            <div style={{ width: 160 }}>
              <label className="field-label" htmlFor="item-category">
                Category
              </label>
              <select
                id="item-category"
                className="text-input"
                style={{ paddingTop: 7, paddingBottom: 7 }}
                value={editingItem?.category ?? ""}
                onChange={(e) =>
                  editingItem &&
                  setEditingItem({ ...editingItem, category: e.target.value })
                }
              >
                {(summary?.categories ?? []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="item-instructions">
              Disposal instructions
            </label>
            <textarea
              id="item-instructions"
              className="text-input"
              style={{ minHeight: 88, resize: "vertical" }}
              value={editingItem?.instructions ?? ""}
              onChange={(e) =>
                editingItem &&
                setEditingItem({ ...editingItem, instructions: e.target.value })
              }
            />
          </div>

          <div>
            <label className="field-label" htmlFor="synonym-input">
              Synonyms (what users might type)
            </label>
            <div className="stack-row">
              <input
                id="synonym-input"
                className="text-input small-input"
                placeholder="e.g. soda can, food scraps, phone charger"
                value={synonymInput}
                onChange={(e) => setSynonymInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSynonym();
                  }
                }}
              />
              <button
                type="button"
                className="secondary-button"
                onClick={addSynonym}
              >
                Add synonym
              </button>
            </div>
            {editingItem && editingItem.synonyms.length > 0 && (
              <div className="tag-list">
                {editingItem.synonyms.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="tag"
                    onClick={() => removeSynonym(s)}
                    title="Remove synonym"
                  >
                    {s} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="stack-row">
            <button
              type="button"
              className="primary-button"
              onClick={saveItem}
              disabled={loading || !editingItem}
            >
              Save item
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={startNewItem}
            >
              New item
            </button>
            {editingItem?.id && (
              <button
                type="button"
                className="secondary-button danger"
                onClick={() => deleteItem(editingItem.id)}
              >
                Delete item
              </button>
            )}
          </div>
        </div>
      </section>

      <aside className="card">
        <div className="section-title-row">
          <div>
            <h2>Items and database</h2>
            <p>
              Review existing items and manage backups of the local JSON
              database used by this assistant.
            </p>
          </div>
        </div>

        <div className="badge-row">
          <span className="badge badge-strong">
            {summary?.items.length ?? 0} items
          </span>
          <span className="badge">
            Categories: {(summary?.categories ?? []).join(", ")}
          </span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Synonyms</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(summary?.items ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.synonyms.join(", ")}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setEditingItem(item);
                        setSynonymInput("");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="secondary-button danger"
                      onClick={() => deleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(summary?.items.length ?? 0) === 0 && (
              <tr>
                <td colSpan={4}>No items defined yet.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="stack" style={{ marginTop: 16 }}>
          <div className="stack-row">
            <button
              type="button"
              className="secondary-button"
              onClick={backupDatabase}
              disabled={loading}
            >
              Download backup (JSON)
            </button>
            <label className="secondary-button" style={{ cursor: "pointer" }}>
              Restore from file
              <input
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => restoreDatabase(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {backupUrl && (
            <small style={{ color: "#9ca3af" }}>
              A recent backup file has been downloaded to your machine.
            </small>
          )}
        </div>
      </aside>
    </>
  );
}

