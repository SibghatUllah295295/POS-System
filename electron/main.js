const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const ThermalPrinter = require("node-thermal-printer");
const PrinterTypes = require("node-thermal-printer").types;

const isDev = process.env.NODE_ENV === "development";

// Database path - stored in user's app data directory
const dbPath = path.join(app.getPath("userData"), "pizza_pos.sqlite");
let db = null;

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Database connection failed:", err.message);
        reject(err);
      } else {
        console.log("SQLite connected successfully to:", dbPath);

        db.serialize(() => {
          // Categories table with price_type field
          db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price_type TEXT DEFAULT 'fixed',
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

          // Products table - with size column
          db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            name TEXT NOT NULL,
            description TEXT,
            size TEXT,
            price DECIMAL(10,2),
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
          )`);

          // MIGRATION: Add size column to existing products table
          db.all("PRAGMA table_info(products)", (err, columns) => {
            if (!err) {
              const hasSize = columns.some((col) => col.name === "size");
              if (!hasSize) {
                console.log("Migrating products table: Adding size column...");
                db.run("ALTER TABLE products ADD COLUMN size TEXT", (err) => {
                  if (err) {
                    console.error("Error adding size column:", err.message);
                  } else {
                    console.log("Size column added successfully");
                  }
                });
              } else {
                console.log("Size column already exists");
              }
            }
          });

          // Check and add price_type column to categories if needed
          db.all("PRAGMA table_info(categories)", (err, columns) => {
            if (!err) {
              const hasPriceType = columns.some(
                (col) => col.name === "price_type",
              );
              if (!hasPriceType) {
                console.log(
                  "Migrating categories table: Adding price_type column...",
                );
                db.run(
                  "ALTER TABLE categories ADD COLUMN price_type TEXT DEFAULT 'fixed'",
                );
              }
            }
          });

          // Employees table
          db.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT UNIQUE,
            address TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

          // Expenses table
          db.run(`CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            description TEXT,
            expense_date DATE NOT NULL,
            payment_method TEXT,
            receipt_number TEXT,
            status TEXT DEFAULT 'active',
            created_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

          // Insert sample categories with price_type
          db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
            if (!err && row.count === 0) {
              const sampleCategories = [
                [
                  "Pizzas",
                  "Delicious pizzas with various toppings",
                  "fixed",
                  "active",
                ],
                ["Sides", "Appetizers and side dishes", "fixed", "active"],
                [
                  "Beverages",
                  "Soft drinks and refreshments",
                  "editable",
                  "active",
                ],
                ["Desserts", "Sweet treats", "fixed", "active"],
                ["Salads", "Fresh and healthy salads", "fixed", "active"],
              ];

              sampleCategories.forEach((category) => {
                db.run(
                  `INSERT INTO categories (name, description, price_type, status) VALUES (?, ?, ?, ?)`,
                  category,
                );
              });
            }
          });

          // Insert sample employees
          db.get("SELECT COUNT(*) as count FROM employees", (err, row) => {
            if (!err && row.count === 0) {
              const sampleEmployees = [
                [
                  "John Doe",
                  "+1 234-567-8900",
                  "john.doe@example.com",
                  "123 Main St, New York, NY 10001",
                  "active",
                ],
                [
                  "Jane Smith",
                  "+1 234-567-8901",
                  "jane.smith@example.com",
                  "456 Oak Ave, Los Angeles, CA 90001",
                  "active",
                ],
                [
                  "Mike Johnson",
                  "+1 234-567-8902",
                  "mike.johnson@example.com",
                  "789 Pine Rd, Chicago, IL 60601",
                  "active",
                ],
                [
                  "Sarah Williams",
                  "+1 234-567-8903",
                  "sarah.williams@example.com",
                  "321 Elm St, Houston, TX 77001",
                  "active",
                ],
                [
                  "David Brown",
                  "+1 234-567-8904",
                  "david.brown@example.com",
                  "654 Maple Dr, Phoenix, AZ 85001",
                  "inactive",
                ],
              ];

              sampleEmployees.forEach((employee) => {
                db.run(
                  `INSERT INTO employees (name, phone, email, address, status) VALUES (?, ?, ?, ?, ?)`,
                  employee,
                );
              });
            }
          });

          // Insert sample products with sizes
          db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (!err && row.count === 0) {
              const sampleProducts = [
                [
                  1,
                  "Margherita Pizza",
                  "Classic cheese and tomato pizza",
                  "Small",
                  8.99,
                  "active",
                ],
                [
                  1,
                  "Margherita Pizza",
                  "Classic cheese and tomato pizza",
                  "Medium",
                  12.99,
                  "active",
                ],
                [
                  1,
                  "Margherita Pizza",
                  "Classic cheese and tomato pizza",
                  "Large",
                  16.99,
                  "active",
                ],
                [
                  1,
                  "Pepperoni Pizza",
                  "Pepperoni and cheese pizza",
                  "Small",
                  10.99,
                  "active",
                ],
                [
                  1,
                  "Pepperoni Pizza",
                  "Pepperoni and cheese pizza",
                  "Medium",
                  14.99,
                  "active",
                ],
                [
                  1,
                  "Pepperoni Pizza",
                  "Pepperoni and cheese pizza",
                  "Large",
                  18.99,
                  "active",
                ],
                [
                  1,
                  "Supreme Pizza",
                  "Loaded with toppings",
                  "Small",
                  12.99,
                  "active",
                ],
                [
                  1,
                  "Supreme Pizza",
                  "Loaded with toppings",
                  "Medium",
                  16.99,
                  "active",
                ],
                [
                  1,
                  "Supreme Pizza",
                  "Loaded with toppings",
                  "Large",
                  20.99,
                  "active",
                ],
                [
                  2,
                  "Garlic Bread",
                  "Toasted bread with garlic butter",
                  "Regular",
                  4.99,
                  "active",
                ],
                [
                  2,
                  "Mozzarella Sticks",
                  "Fried cheese sticks with marinara",
                  "6 pcs",
                  6.99,
                  "active",
                ],
                [
                  2,
                  "Mozzarella Sticks",
                  "Fried cheese sticks with marinara",
                  "12 pcs",
                  11.99,
                  "active",
                ],
                [3, "Coca Cola", "Regular soda", "330ml", null, "active"],
                [3, "Coca Cola", "Regular soda", "500ml", null, "active"],
                [3, "Coca Cola", "Regular soda", "1L", null, "active"],
                [3, "Sprite", "Lemon-lime soda", "330ml", null, "active"],
                [3, "Sprite", "Lemon-lime soda", "500ml", null, "active"],
                [
                  4,
                  "Chocolate Cake",
                  "Rich chocolate layer cake",
                  "Slice",
                  5.99,
                  "active",
                ],
                [
                  4,
                  "Chocolate Cake",
                  "Rich chocolate layer cake",
                  "Whole",
                  25.99,
                  "active",
                ],
                [4, "Ice Cream", "Vanilla ice cream", "Scoop", 3.99, "active"],
                [
                  4,
                  "Ice Cream",
                  "Vanilla ice cream",
                  "Double Scoop",
                  6.99,
                  "active",
                ],
                [
                  5,
                  "Caesar Salad",
                  "Romaine lettuce with Caesar dressing",
                  "Regular",
                  7.99,
                  "active",
                ],
                [
                  5,
                  "Caesar Salad",
                  "Romaine lettuce with Caesar dressing",
                  "Large",
                  10.99,
                  "active",
                ],
                [
                  5,
                  "Garden Salad",
                  "Mixed greens with vegetables",
                  "Regular",
                  6.99,
                  "active",
                ],
                [
                  5,
                  "Garden Salad",
                  "Mixed greens with vegetables",
                  "Large",
                  9.99,
                  "active",
                ],
              ];

              sampleProducts.forEach((product) => {
                db.run(
                  `INSERT INTO products (category_id, name, description, size, price, status) VALUES (?, ?, ?, ?, ?, ?)`,
                  product,
                );
              });
            }
          });

          // Insert sample expenses
          db.get("SELECT COUNT(*) as count FROM expenses", (err, row) => {
            if (!err && row.count === 0) {
              const sampleExpenses = [
                [
                  "Vegetables Purchase",
                  "Food Supplies",
                  350.0,
                  "Fresh vegetables for pizzas",
                  "2024-01-15",
                  "Cash",
                  "EXP-001",
                  "active",
                  "Admin",
                ],
                [
                  "Cheese Order",
                  "Food Supplies",
                  1250.0,
                  "Mozzarella cheese bulk order",
                  "2024-01-20",
                  "Bank Transfer",
                  "EXP-002",
                  "active",
                  "Admin",
                ],
                [
                  "Electricity Bill",
                  "Utilities",
                  450.0,
                  "Monthly electricity bill",
                  "2024-01-25",
                  "Bank Transfer",
                  "EXP-003",
                  "active",
                  "Admin",
                ],
                [
                  "Marketing - Flyers",
                  "Marketing",
                  200.0,
                  "Printing flyers for promotion",
                  "2024-01-28",
                  "Cash",
                  "EXP-004",
                  "active",
                  "Admin",
                ],
                [
                  "Equipment Repair",
                  "Maintenance",
                  150.0,
                  "Oven repair service",
                  "2024-02-01",
                  "Cash",
                  "EXP-005",
                  "active",
                  "Admin",
                ],
                [
                  "Employee Salary",
                  "Salaries",
                  3000.0,
                  "January salary",
                  "2024-01-31",
                  "Bank Transfer",
                  "EXP-006",
                  "active",
                  "Admin",
                ],
                [
                  "Water Bill",
                  "Utilities",
                  120.0,
                  "Monthly water bill",
                  "2024-01-25",
                  "Bank Transfer",
                  "EXP-007",
                  "active",
                  "Admin",
                ],
                [
                  "Cleaning Supplies",
                  "Supplies",
                  85.0,
                  "Detergents and cleaning materials",
                  "2024-02-05",
                  "Cash",
                  "EXP-008",
                  "active",
                  "Admin",
                ],
                [
                  "Gas Bill",
                  "Utilities",
                  280.0,
                  "Monthly gas bill",
                  "2024-01-25",
                  "Bank Transfer",
                  "EXP-009",
                  "active",
                  "Admin",
                ],
                [
                  "Software License",
                  "Other",
                  99.0,
                  "POS software monthly fee",
                  "2024-02-01",
                  "Credit Card",
                  "EXP-010",
                  "active",
                  "Admin",
                ],
              ];

              sampleExpenses.forEach((expense) => {
                db.run(
                  `INSERT INTO expenses (title, category, amount, description, expense_date, payment_method, receipt_number, status, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  expense,
                );
              });
            }
          });

          // Shifts table
          db.run(`CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_date DATETIME NOT NULL,
  opening_balance DECIMAL(10,2) DEFAULT 0,
  closing_balance DECIMAL(10,2) DEFAULT 0,
  close_time DATETIME,
  remarks TEXT DEFAULT 'Ubaid',
  status TEXT DEFAULT 'active',
  total_sales DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
          // Insert sample shifts (for testing)
          db.get("SELECT COUNT(*) as count FROM shifts", (err, row) => {
            if (!err && row.count === 0) {
              const sampleShifts = [
                [
                  "2025-10-25 10:18:00",
                  0,
                  0,
                  "2025-10-31 10:21:00",
                  "Ubaid",
                  "closed",
                  0,
                ],
                [
                  "2025-10-22 16:28:00",
                  0,
                  0,
                  "2025-10-25 10:19:35",
                  "Ubaid",
                  "closed",
                  0,
                ],
                [
                  "2025-10-19 13:43:00",
                  0,
                  0,
                  "2025-10-22 16:05:21",
                  "Ubaid",
                  "closed",
                  0,
                ],
                [
                  "2025-10-18 14:29:00",
                  0,
                  0,
                  "2025-10-19 13:48:42",
                  "Ubaid",
                  "closed",
                  0,
                ],
              ];

              sampleShifts.forEach((shift) => {
                db.run(
                  `INSERT INTO shifts (shift_date, opening_balance, closing_balance, close_time, remarks, status, total_sales) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  shift,
                );
              });
            }
          });
          // Halls table
          db.run(`CREATE TABLE IF NOT EXISTS halls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

          // Tables table
          db.run(`CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hall_id INTEGER,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE
)`);

          // Orders table
          db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  table_id INTEGER,
  shift_id INTEGER,
  total_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  net_total DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES tables(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
)`);

          // Order items table
          db.run(`CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  product_id INTEGER,
  product_name TEXT,
  product_size TEXT,
  quantity INTEGER DEFAULT 1,
  bonus_quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
)`);

          // Insert sample halls
          db.get("SELECT COUNT(*) as count FROM halls", (err, row) => {
            if (!err && row.count === 0) {
              const sampleHalls = [
                ["Main Hall", "active"],
                ["Family Hall", "active"],
                ["VIP Hall", "active"],
              ];

              sampleHalls.forEach((hall) => {
                db.run(`INSERT INTO halls (name, status) VALUES (?, ?)`, hall);
              });
            }
          });

          // Insert sample tables
          db.get("SELECT COUNT(*) as count FROM tables", (err, row) => {
            if (!err && row.count === 0) {
              const sampleTables = [
                [1, "Table 1", "available"],
                [1, "Table 2", "available"],
                [1, "Table 3", "available"],
                [1, "Table 4", "available"],
                [2, "Table 5", "available"],
                [2, "Table 6", "available"],
                [3, "VIP Table 1", "available"],
                [3, "VIP Table 2", "available"],
              ];

              sampleTables.forEach((table) => {
                db.run(
                  `INSERT INTO tables (hall_id, name, status) VALUES (?, ?, ?)`,
                  table,
                );
              });
            }
          });
        });

        resolve(true);
      }
    });
  });
}

// Helper functions for database operations
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  return win;
}

app.whenReady().then(async () => {
  try {
    await initializeDatabase();
    createWindow();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (db) {
      db.close((err) => {
        if (err) console.error("Error closing database:", err);
        else console.log("Database connection closed");
      });
    }
    app.quit();
  }
});

// ==================== TEST CONNECTION ====================
ipcMain.handle("test-connection", async () => {
  try {
    const result = await dbGet("SELECT sqlite_version() as version");
    return {
      success: true,
      message: `SQLite is connected - Version: ${result.version}`,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      success: false,
      message: `Database error: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
});

// ==================== CATEGORY OPERATIONS ====================

// Get all categories
ipcMain.handle("get-categories", async () => {
  try {
    const categories = await dbAll(
      "SELECT * FROM categories ORDER BY created_at DESC",
    );
    return { success: true, data: categories };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get category by ID
ipcMain.handle("get-category", async (event, id) => {
  try {
    const category = await dbGet("SELECT * FROM categories WHERE id = ?", [id]);
    return { success: true, data: category };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Create new category
ipcMain.handle("create-category", async (event, category) => {
  try {
    const result = await dbRun(
      `INSERT INTO categories (name, description, price_type, status) VALUES (?, ?, ?, ?)`,
      [
        category.name,
        category.description,
        category.price_type || "fixed",
        category.status,
      ],
    );
    return { success: true, id: result.lastID };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Update category
ipcMain.handle("update-category", async (event, id, category) => {
  try {
    const result = await dbRun(
      `UPDATE categories SET name=?, description=?, price_type=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [
        category.name,
        category.description,
        category.price_type,
        category.status,
        id,
      ],
    );
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Delete category
ipcMain.handle("delete-category", async (event, id) => {
  try {
    // First check if category has products
    const products = await dbAll(
      "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
      [id],
    );
    if (products[0].count > 0) {
      return {
        success: false,
        error: "Cannot delete category with existing products",
      };
    }

    const result = await dbRun("DELETE FROM categories WHERE id=?", [id]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==================== PRODUCT OPERATIONS ====================

// Get products by category
ipcMain.handle("get-products-by-category", async (event, categoryId) => {
  try {
    const products = await dbAll(
      "SELECT * FROM products WHERE category_id = ? ORDER BY created_at DESC",
      [categoryId],
    );
    return { success: true, data: products };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get all products
ipcMain.handle("get-all-products", async () => {
  try {
    const products = await dbAll(
      "SELECT p.*, c.name as category_name, c.price_type FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC",
    );
    return { success: true, data: products };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Create new product (with size field)
ipcMain.handle("create-product", async (event, product) => {
  try {
    // Get category price type
    const category = await dbGet(
      "SELECT price_type FROM categories WHERE id = ?",
      [product.categoryId],
    );

    // Validate price based on category price type
    if (category && category.price_type === "fixed") {
      if (!product.price || product.price <= 0) {
        return {
          success: false,
          error: "Price is required for fixed price categories",
        };
      }
    }

    const result = await dbRun(
      `INSERT INTO products (category_id, name, description, size, price, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        product.categoryId,
        product.name,
        product.description || "",
        product.size || "",
        product.price || null,
        product.status || "active",
      ],
    );
    return { success: true, id: result.lastID };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Update product (with size field)
ipcMain.handle("update-product", async (event, id, product) => {
  try {
    // Get category price type
    const category = await dbGet(
      "SELECT c.price_type FROM categories c JOIN products p ON p.category_id = c.id WHERE p.id = ?",
      [id],
    );

    // Validate price based on category price type
    if (category && category.price_type === "fixed") {
      if (!product.price || product.price <= 0) {
        return {
          success: false,
          error: "Price is required for fixed price categories",
        };
      }
    }

    const result = await dbRun(
      `UPDATE products SET name=?, description=?, size=?, price=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [
        product.name,
        product.description || "",
        product.size || "",
        product.price || null,
        product.status,
        id,
      ],
    );
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Delete product
ipcMain.handle("delete-product", async (event, id) => {
  try {
    const result = await dbRun("DELETE FROM products WHERE id=?", [id]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get product by ID
ipcMain.handle("get-product", async (event, id) => {
  try {
    const product = await dbGet("SELECT * FROM products WHERE id = ?", [id]);
    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==================== EMPLOYEE OPERATIONS ====================

// Get all employees
ipcMain.handle("get-employees", async () => {
  try {
    const employees = await dbAll(
      "SELECT * FROM employees ORDER BY created_at DESC",
    );
    return { success: true, data: employees };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get employee by ID
ipcMain.handle("get-employee", async (event, id) => {
  try {
    const employee = await dbGet("SELECT * FROM employees WHERE id = ?", [id]);
    return { success: true, data: employee };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Create new employee
ipcMain.handle("create-employee", async (event, employee) => {
  try {
    // Check if email already exists
    const existing = await dbGet("SELECT id FROM employees WHERE email = ?", [
      employee.email,
    ]);
    if (existing) {
      return {
        success: false,
        error: "Employee with this email already exists",
      };
    }

    const result = await dbRun(
      `INSERT INTO employees (name, phone, email, address, status) VALUES (?, ?, ?, ?, ?)`,
      [
        employee.name,
        employee.phone,
        employee.email,
        employee.address,
        employee.status || "active",
      ],
    );
    return { success: true, id: result.lastID };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Update employee
ipcMain.handle("update-employee", async (event, id, employee) => {
  try {
    // Check if email already exists for another employee
    const existing = await dbGet(
      "SELECT id FROM employees WHERE email = ? AND id != ?",
      [employee.email, id],
    );
    if (existing) {
      return {
        success: false,
        error: "Employee with this email already exists",
      };
    }

    const result = await dbRun(
      `UPDATE employees SET name=?, phone=?, email=?, address=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [
        employee.name,
        employee.phone,
        employee.email,
        employee.address,
        employee.status,
        id,
      ],
    );
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Delete employee
ipcMain.handle("delete-employee", async (event, id) => {
  try {
    const result = await dbRun("DELETE FROM employees WHERE id=?", [id]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==================== EXPENSE OPERATIONS ====================

// Get all expenses
ipcMain.handle("get-expenses", async () => {
  try {
    const expenses = await dbAll(
      "SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC",
    );
    return { success: true, data: expenses };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get expense by ID
ipcMain.handle("get-expense", async (event, id) => {
  try {
    const expense = await dbGet("SELECT * FROM expenses WHERE id = ?", [id]);
    return { success: true, data: expense };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Create new expense
ipcMain.handle("create-expense", async (event, expense) => {
  try {
    if (expense.amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    const result = await dbRun(
      `INSERT INTO expenses (title, category, amount, description, expense_date, payment_method, receipt_number, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.title,
        expense.category,
        expense.amount,
        expense.description,
        expense.expenseDate,
        expense.paymentMethod,
        expense.receiptNumber,
        expense.status || "active",
        expense.createdBy || "System",
      ],
    );
    return { success: true, id: result.lastID };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Update expense
ipcMain.handle("update-expense", async (event, id, expense) => {
  try {
    if (expense.amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    const result = await dbRun(
      `UPDATE expenses SET title=?, category=?, amount=?, description=?, expense_date=?, payment_method=?, receipt_number=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [
        expense.title,
        expense.category,
        expense.amount,
        expense.description,
        expense.expenseDate,
        expense.paymentMethod,
        expense.receiptNumber,
        expense.status,
        id,
      ],
    );
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Delete expense
ipcMain.handle("delete-expense", async (event, id) => {
  try {
    const result = await dbRun("DELETE FROM expenses WHERE id=?", [id]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get expense summary/stats
ipcMain.handle("get-expense-stats", async (event, period = "month") => {
  try {
    let dateFilter = "";
    if (period === "month") {
      dateFilter =
        "AND strftime('%Y-%m', expense_date) = strftime('%Y-%m', 'now')";
    } else if (period === "year") {
      dateFilter = "AND strftime('%Y', expense_date) = strftime('%Y', 'now')";
    }

    const totalResult = await dbGet(
      `SELECT SUM(amount) as total FROM expenses WHERE status = 'active' ${dateFilter}`,
    );
    const categorySummary = await dbAll(`
      SELECT category, SUM(amount) as total, COUNT(*) as count 
      FROM expenses WHERE status = 'active' ${dateFilter}
      GROUP BY category ORDER BY total DESC
    `);
    const recentExpenses = await dbAll(
      `SELECT * FROM expenses WHERE status = 'active' ORDER BY expense_date DESC LIMIT 5`,
    );

    return {
      success: true,
      data: {
        totalExpenses: totalResult.total || 0,
        categorySummary,
        recentExpenses,
        totalCount: categorySummary.reduce((sum, cat) => sum + cat.count, 0),
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==================== SHIFT OPERATIONS ====================

// Get current active shift
ipcMain.handle("get-current-shift", async () => {
  try {
    const shift = await dbGet(
      "SELECT * FROM shifts WHERE status = 'active' ORDER BY created_at DESC LIMIT 1",
    );
    return { success: true, data: shift };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get all shifts
ipcMain.handle("get-all-shifts", async () => {
  try {
    const shifts = await dbAll("SELECT * FROM shifts ORDER BY shift_date DESC");
    return { success: true, data: shifts };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Start new shift
ipcMain.handle("start-shift", async (event, shiftData) => {
  try {
    // Check if there's already an active shift
    const activeShift = await dbGet(
      "SELECT id FROM shifts WHERE status = 'active'",
    );
    if (activeShift) {
      return {
        success: false,
        error: "There is already an active shift. Please close it first.",
      };
    }

    const result = await dbRun(
      `INSERT INTO shifts (shift_date, opening_balance, closing_balance, remarks, status, total_sales) 
       VALUES (datetime('now'), ?, ?, ?, ?, ?)`,
      [
        shiftData.openingBalance || 0,
        0,
        shiftData.remarks || "Ubaid",
        "active",
        0,
      ],
    );
    return {
      success: true,
      id: result.lastID,
      message: "Shift started successfully",
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Close shift
ipcMain.handle("close-shift", async (event, shiftId, closingData) => {
  try {
    // Calculate total sales from orders within this shift period
    // For now, we'll use the total_sales from the shift record
    const result = await dbRun(
      `UPDATE shifts SET 
        closing_balance = ?, 
        close_time = datetime('now'), 
        status = 'closed',
        updated_at = CURRENT_TIMESTAMP,
        remarks = ?
       WHERE id = ? AND status = 'active'`,
      [closingData.closingBalance, closingData.remarks || "Ubaid", shiftId],
    );

    if (result.changes === 0) {
      return { success: false, error: "No active shift found to close" };
    }

    return { success: true, message: "Shift closed successfully" };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Update shift sales (called when an order is created)
ipcMain.handle("update-shift-sales", async (event, amount) => {
  try {
    const activeShift = await dbGet(
      "SELECT id, total_sales FROM shifts WHERE status = 'active'",
    );
    if (activeShift) {
      const newTotal = (activeShift.total_sales || 0) + amount;
      await dbRun(
        "UPDATE shifts SET total_sales = ?, closing_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [newTotal, newTotal, activeShift.id],
      );
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Delete shift (for admin purposes)
ipcMain.handle("delete-shift", async (event, id) => {
  try {
    const result = await dbRun(
      "DELETE FROM shifts WHERE id = ? AND status = 'closed'",
      [id],
    );
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==================== HALL OPERATIONS ====================

// Get all halls
ipcMain.handle("get-halls", async () => {
  try {
    const halls = await dbAll(
      "SELECT * FROM halls WHERE status = 'active' ORDER BY name",
    );
    return { success: true, data: halls };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Create hall
ipcMain.handle("create-hall", async (event, hall) => {
  try {
    const result = await dbRun(
      `INSERT INTO halls (name, status) VALUES (?, ?)`,
      [hall.name, "active"],
    );
    return { success: true, id: result.lastID };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Delete hall
ipcMain.handle("delete-hall", async (event, id) => {
  try {
    await dbRun("DELETE FROM tables WHERE hall_id = ?", [id]);
    const result = await dbRun("DELETE FROM halls WHERE id = ?", [id]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==================== TABLE OPERATIONS ====================

// Get tables by hall
ipcMain.handle("get-tables-by-hall", async (event, hallId) => {
  try {
    const tables = await dbAll(
      "SELECT * FROM tables WHERE hall_id = ? ORDER BY name",
      [hallId],
    );
    return { success: true, data: tables };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Create table
ipcMain.handle("create-table", async (event, table) => {
  try {
    const result = await dbRun(
      `INSERT INTO tables (hall_id, name, status) VALUES (?, ?, ?)`,
      [table.hallId, table.name, "available"],
    );
    return { success: true, id: result.lastID };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Delete table
ipcMain.handle("delete-table", async (event, id) => {
  try {
    const result = await dbRun("DELETE FROM tables WHERE id = ?", [id]);
    return { success: true, changes: result.changes };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==================== ORDER OPERATIONS ====================

// Create order
ipcMain.handle("create-order", async (event, orderData) => {
  try {
    // Get current shift
    const currentShift = await dbGet(
      "SELECT id FROM shifts WHERE status = 'active'",
    );

    const result = await dbRun(
      `INSERT INTO orders (invoice_number, table_id, shift_id, total_amount, tax_amount, discount_amount, net_total, payment_method, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderData.invoiceNumber,
        orderData.tableId,
        currentShift?.id || null,
        orderData.totalAmount,
        orderData.taxAmount || 0,
        orderData.discountAmount || 0,
        orderData.netTotal,
        orderData.paymentMethod || "Cash",
        "completed",
        orderData.createdBy || "Admin",
      ],
    );

    // Insert order items
    for (const item of orderData.items) {
      await dbRun(
        `INSERT INTO order_items (order_id, product_id, product_name, product_size, quantity, bonus_quantity, unit_price, total_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.lastID,
          item.productId,
          item.productName,
          item.productSize || "",
          item.quantity,
          item.bonusQuantity || 0,
          item.unitPrice,
          item.totalPrice,
        ],
      );
    }

    // Update shift sales
    if (currentShift) {
      const shift = await dbGet("SELECT total_sales FROM shifts WHERE id = ?", [
        currentShift.id,
      ]);
      const newTotal = (shift.total_sales || 0) + orderData.netTotal;
      await dbRun(
        "UPDATE shifts SET total_sales = ?, closing_balance = ? WHERE id = ?",
        [newTotal, newTotal, currentShift.id],
      );
    }

    return {
      success: true,
      id: result.lastID,
      invoiceNumber: orderData.invoiceNumber,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get orders by shift
ipcMain.handle("get-orders-by-shift", async (event, shiftId) => {
  try {
    const orders = await dbAll(
      "SELECT * FROM orders WHERE shift_id = ? ORDER BY created_at DESC",
      [shiftId],
    );
    return { success: true, data: orders };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Add this handler for direct printing from Electron
ipcMain.handle("print-invoice", async (event, htmlContent) => {
  try {
    // Create a hidden browser window for printing
    const printWindow = new BrowserWindow({
      show: false,
      width: 400,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load the HTML content
    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
    );

    // Wait for content to load
    printWindow.webContents.on("did-finish-load", () => {
      // Print silently to default printer
      printWindow.webContents.print(
        {
          silent: false, // Set to true for silent printing without dialog
          printBackground: true,
          deviceName: "", // Leave empty for default printer
        },
        (success, errorType) => {
          if (!success) {
            console.error("Print failed:", errorType);
          }
          // Close the window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        },
      );
    });

    return { success: true };
  } catch (err) {
    console.error("Print error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("get-printers", async () => {
  try {
    const { exec } = require("child_process");
    const printers = [];

    if (process.platform === "win32") {
      // For Windows
      exec("wmic printer get name", (error, stdout) => {
        if (!error) {
          const lines = stdout.split("\n");
          lines.forEach((line) => {
            if (line.trim() && !line.includes("Name")) {
              printers.push(line.trim());
            }
          });
        }
      });
    }

    return { success: true, printers: printers };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Print invoice to thermal printer using ESC/POS
ipcMain.handle("print-thermal-invoice", async (event, invoiceData) => {
  try {
    // Configure the thermal printer
    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // For Epson compatible printers
      interface: "usb", // or 'tcp' for network, or 'serial'
      options: {
        timeout: 5000,
      },
      width: 48, // 48 characters per line (for 78mm paper)
      characterSet: "UTF-8",
      removeSpecialCharacters: false,
      lineCharacter: "-",
    });

    // Try to connect to printer
    try {
      await printer.isPrinterConnected();
    } catch (err) {
      console.log("USB connection failed, trying Windows driver...");
      // Fallback to Windows printer driver
      printer = new ThermalPrinter({
        type: PrinterTypes.WINDOWS,
        interface: `EPSON TM-T20II`, // Change to your printer name
        options: { timeout: 5000 },
        width: 48,
        characterSet: "UTF-8",
        removeSpecialCharacters: false,
        lineCharacter: "-",
      });
    }

    // Start building the receipt
    printer.alignCenter();
    printer.setTextDoubleHeight();
    printer.println("PIZZA PARADISE");
    printer.setTextNormal();
    printer.println("Shan Sikander Road Poso Pump");
    printer.println("Near Gaddai Chungli Dera Ghazi Khan");
    printer.println("Tel: 0336-8576866 - 0336-7016666");
    printer.newLine();

    printer.alignLeft();
    printer.println("----------------------------------------");

    // Invoice details
    printer.println(`Invoice: ${invoiceData.invoiceNumber}`);
    printer.println(`Date: ${new Date(invoiceData.date).toLocaleString()}`);
    printer.println(`Table: ${invoiceData.tableName}`);
    printer.println(`Cashier: ${invoiceData.cashier || "Admin"}`);

    printer.println("----------------------------------------");

    // Table header
    printer.println(
      `${"#".padEnd(3)} ${"Item".padEnd(20)} ${"Qty".padEnd(4)} ${"Price".padEnd(8)} ${"Total".padEnd(8)}`,
    );
    printer.println("----------------------------------------");

    // Items
    let itemNumber = 1;
    for (const item of invoiceData.items) {
      let itemName = item.productName;
      if (item.productSize) {
        itemName += ` (${item.productSize})`;
      }

      // Truncate item name if too long
      if (itemName.length > 20) {
        itemName = itemName.substring(0, 18) + "..";
      }

      printer.println(
        `${String(itemNumber).padEnd(3)} ${itemName.padEnd(20)} ${String(item.quantity).padEnd(4)} ${String(item.unitPrice).padEnd(8)} ${String(item.totalPrice).padEnd(8)}`,
      );
      itemNumber++;
    }

    printer.println("----------------------------------------");

    // Totals
    printer.println(`Sub Total:${" ".repeat(30)} Rs. ${invoiceData.subtotal}`);
    printer.println(`Tax (0%):${" ".repeat(32)} Rs. ${invoiceData.tax}`);
    printer.println(`Discount:${" ".repeat(32)} Rs. ${invoiceData.discount}`);
    printer.println("----------------------------------------");
    printer.setTextDoubleHeight();
    printer.println(`NET TOTAL:${" ".repeat(25)} Rs. ${invoiceData.netTotal}`);
    printer.setTextNormal();

    printer.println("----------------------------------------");
    printer.println(`Payment: ${invoiceData.paymentMethod || "Cash"}`);
    printer.println(`Amount Paid: Rs. ${invoiceData.netTotal}`);

    printer.println("----------------------------------------");

    // Thank you message
    printer.alignCenter();
    printer.println("Thank You for Shopping!");

    printer.println("----------------------------------------");

    // Developer info
    printer.alignCenter();
    printer.println("Software Developed by The Ghazian");
    printer.println("Sibghatullah | +923348691010");

    printer.newLine();
    printer.newLine();
    printer.newLine();

    // Cut paper (if auto-cutter available)
    printer.cut();

    // Execute print
    const execute = await printer.execute();

    return { success: true, message: "Invoice sent to printer" };
  } catch (err) {
    console.error("Printer error:", err);
    return { success: false, error: err.message };
  }
});

// Alternative: Print using Windows printer directly
ipcMain.handle("print-windows-printer", async (event, invoiceData) => {
  try {
    const { exec } = require("child_process");
    const fs = require("fs");
    const path = require("path");
    const os = require("os");

    // Create a simple text version of the invoice
    let invoiceText = "";
    invoiceText += "\x1B\x40"; // Reset printer
    invoiceText += "\x1B\x61\x01"; // Center align
    invoiceText += "\x1B\x45\x01"; // Bold on
    invoiceText += "PIZZA PARADISE\n";
    invoiceText += "\x1B\x45\x00"; // Bold off
    invoiceText += "Shan Sikander Road Poso Pump\n";
    invoiceText += "Near Gaddai Chungli Dera Ghazi Khan\n";
    invoiceText += "Tel: 0336-8576866 - 0336-7016666\n";
    invoiceText += "\n";
    invoiceText += "----------------------------------------\n";
    invoiceText += `Invoice: ${invoiceData.invoiceNumber}\n`;
    invoiceText += `Date: ${new Date(invoiceData.date).toLocaleString()}\n`;
    invoiceText += `Table: ${invoiceData.tableName}\n`;
    invoiceText += `Cashier: ${invoiceData.cashier || "Admin"}\n`;
    invoiceText += "----------------------------------------\n";
    invoiceText += "#  Item                 Qty Price Total\n";
    invoiceText += "----------------------------------------\n";

    let itemNumber = 1;
    for (const item of invoiceData.items) {
      let itemName = item.productName;
      if (item.productSize) {
        itemName += ` (${item.productSize})`;
      }
      invoiceText += `${itemNumber}  ${itemName.padEnd(20)} ${item.quantity}   ${item.unitPrice}   ${item.totalPrice}\n`;
      itemNumber++;
    }

    invoiceText += "----------------------------------------\n";
    invoiceText += `Sub Total:${" ".repeat(30)} Rs. ${invoiceData.subtotal}\n`;
    invoiceText += `Tax (0%):${" ".repeat(32)} Rs. ${invoiceData.tax}\n`;
    invoiceText += `Discount:${" ".repeat(32)} Rs. ${invoiceData.discount}\n`;
    invoiceText += "----------------------------------------\n";
    invoiceText += `NET TOTAL:${" ".repeat(25)} Rs. ${invoiceData.netTotal}\n`;
    invoiceText += "----------------------------------------\n";
    invoiceText += `Payment: ${invoiceData.paymentMethod || "Cash"}\n`;
    invoiceText += `Amount Paid: Rs. ${invoiceData.netTotal}\n`;
    invoiceText += "----------------------------------------\n";
    invoiceText += "Thank You for Shopping!\n";
    invoiceText += "----------------------------------------\n";
    invoiceText += "Software Developed by The Ghazian\n";
    invoiceText += "Sibghatullah | +923348691010\n";
    invoiceText += "\n\n\n";
    invoiceText += "\x1D\x56\x00"; // Cut paper

    // Save to temp file
    const tempFile = path.join(os.tmpdir(), `invoice_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, invoiceText);

    // Print using Windows command
    exec(`notepad /p "${tempFile}"`, (error) => {
      if (error) {
        console.error("Print error:", error);
      }
      setTimeout(() => {
        fs.unlinkSync(tempFile);
      }, 5000);
    });

    return { success: true, message: "Invoice sent to printer" };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
