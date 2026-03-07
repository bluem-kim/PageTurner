import * as SQLite from "expo-sqlite";

let dbPromise = null;

const getDb = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("pageturnerr.db");
  }
  return dbPromise;
};

const initCartTable = async () => {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_json TEXT NOT NULL
    );
  `);
};

export const loadCartFromDb = async () => {
  await initCartTable();
  const db = await getDb();
  const rows = await db.getAllAsync("SELECT item_json FROM cart_items ORDER BY id ASC;");

  return (rows || [])
    .map((row) => {
      try {
        return JSON.parse(row.item_json);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
};

export const saveCartToDb = async (items = []) => {
  await initCartTable();
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM cart_items;");
    for (const item of items) {
      await db.runAsync("INSERT INTO cart_items (item_json) VALUES (?);", [JSON.stringify(item)]);
    }
  });
};

export const clearCartDb = async () => {
  await initCartTable();
  const db = await getDb();
  await db.runAsync("DELETE FROM cart_items;");
};
