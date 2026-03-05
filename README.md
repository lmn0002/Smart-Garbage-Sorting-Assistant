## Smart Garbage Sorting Assistant

A minimal Next.js web interface that helps users classify household waste items into categories (Plastic, Paper, Glass, Metal, Organic, Electronic), and provides a lightweight administrator console for managing items and backing up the local database.

### Getting started

1. **Install dependencies**

```bash
npm install
```

2. **Run the development server**

```bash
npm run dev
```

3. Open `http://localhost:3000` in your browser.

### Features

- **General user interface**
  - Simple text input where users type the name or type of a waste item (e.g. “plastic bottle”, “battery”, “banana peel”).
  - Immediate display of:
    - Waste category: Plastic, Paper, Glass, Metal, Organic, or Electronic.
    - Short, friendly disposal instructions.
  - Clear error messages when an item cannot be found, with suggestions to retry input or contact an administrator to add the item.
  - Each successful classification is recorded to a local JSON “database” with timestamp, item, and category.
  - A weekly report panel summarizing:
    - Number of items classified per category.
    - The most common item in the last 7 days.

- **Administrator interface** (`/admin`)
  - Password‑gated access (default demo password: `admin123` – change or replace with real auth in production).
  - CRUD operations on waste items:
    - Create, edit, and delete items.
    - Manage categories and synonyms (what users might type).
  - Data backup and restore:
    - Download the local `data/db.json` file as a JSON backup.
    - Restore from a JSON backup file.

### Implementation notes

- **Tech stack**: Next.js 14, React, TypeScript.
- **Persistence**: A simple JSON file at `data/db.json` acts as a local database for categories, items, and classification logs.
- **Performance**: The classification flow is implemented as a small API endpoint, designed to respond well within 2 seconds under normal conditions.
- **Usability**:
  - Short, focused messages for classification results.
  - Friendly error text and suggestions when records are missing.
  - First‑time users can successfully classify an item by simply typing a description and pressing Enter or clicking “Classify waste”.

