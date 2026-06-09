const { contextBridge, ipcRenderer } = require("electron");

// Expose safe API to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Test connection
  testConnection: () => ipcRenderer.invoke("test-connection"),

  // Category operations
  getCategories: () => ipcRenderer.invoke("get-categories"),
  createCategory: (category) => ipcRenderer.invoke("create-category", category),
  updateCategory: (id, category) =>
    ipcRenderer.invoke("update-category", id, category),
  deleteCategory: (id) => ipcRenderer.invoke("delete-category", id),
  getCategory: (id) => ipcRenderer.invoke("get-category", id),

  // Employee operations
  getEmployees: () => ipcRenderer.invoke("get-employees"),
  createEmployee: (employee) => ipcRenderer.invoke("create-employee", employee),
  updateEmployee: (id, employee) =>
    ipcRenderer.invoke("update-employee", id, employee),
  deleteEmployee: (id) => ipcRenderer.invoke("delete-employee", id),
  getEmployee: (id) => ipcRenderer.invoke("get-employee", id),

  // Expense operations
  getExpenses: () => ipcRenderer.invoke("get-expenses"),
  getExpense: (id) => ipcRenderer.invoke("get-expense", id),
  createExpense: (expense) => ipcRenderer.invoke("create-expense", expense),
  updateExpense: (id, expense) =>
    ipcRenderer.invoke("update-expense", id, expense),
  deleteExpense: (id) => ipcRenderer.invoke("delete-expense", id),
  getExpenseStats: (period) => ipcRenderer.invoke("get-expense-stats", period),

  // Product operations
  getProductsByCategory: (categoryId) =>
    ipcRenderer.invoke("get-products-by-category", categoryId),
  getAllProducts: () => ipcRenderer.invoke("get-all-products"),
  createProduct: (product) => ipcRenderer.invoke("create-product", product),
  updateProduct: (id, product) =>
    ipcRenderer.invoke("update-product", id, product),
  deleteProduct: (id) => ipcRenderer.invoke("delete-product", id),
  getProduct: (id) => ipcRenderer.invoke("get-product", id),

  // Shift operations
  getCurrentShift: () => ipcRenderer.invoke("get-current-shift"),
  getAllShifts: () => ipcRenderer.invoke("get-all-shifts"),
  startShift: (shiftData) => ipcRenderer.invoke("start-shift", shiftData),
  closeShift: (shiftId, closingData) =>
    ipcRenderer.invoke("close-shift", shiftId, closingData),
  updateShiftSales: (amount) =>
    ipcRenderer.invoke("update-shift-sales", amount),
  deleteShift: (id) => ipcRenderer.invoke("delete-shift", id),

  // Hall operations
  getHalls: () => ipcRenderer.invoke("get-halls"),
  createHall: (hall) => ipcRenderer.invoke("create-hall", hall),
  deleteHall: (id) => ipcRenderer.invoke("delete-hall", id),

  // Table operations
  getTablesByHall: (hallId) => ipcRenderer.invoke("get-tables-by-hall", hallId),
  createTable: (table) => ipcRenderer.invoke("create-table", table),
  deleteTable: (id) => ipcRenderer.invoke("delete-table", id),

  // Order operations
  createOrder: (orderData) => ipcRenderer.invoke("create-order", orderData),
  getOrdersByShift: (shiftId) =>
    ipcRenderer.invoke("get-orders-by-shift", shiftId),
});
