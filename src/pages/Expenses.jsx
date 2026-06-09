import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  DollarSign,
  Calendar,
  CreditCard,
  Receipt,
  Tag,
  FileText,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Eye,
} from "lucide-react";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    amount: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    receiptNumber: "",
    status: "active",
    createdBy: "Admin",
  });

  // Expense categories
  const expenseCategories = [
    "Food Supplies",
    "Beverages",
    "Utilities",
    "Salaries",
    "Marketing",
    "Maintenance",
    "Rent",
    "Insurance",
    "Taxes",
    "Supplies",
    "Equipment",
    "Transportation",
    "Other",
  ];

  // Payment methods
  const paymentMethods = [
    "Cash",
    "Bank Transfer",
    "Credit Card",
    "Debit Card",
    "Check",
    "Mobile Payment",
  ];

  // Load expenses from database
  const loadExpenses = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getExpenses();
      if (result.success) {
        setExpenses(result.data);
      } else {
        console.error("Failed to load expenses:", result.error);
      }
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load expense statistics
  const loadStats = async () => {
    try {
      const result = await window.electronAPI.getExpenseStats("month");
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  useEffect(() => {
    loadExpenses();
    loadStats();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for creating new expense
  const openCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      title: "",
      category: "",
      amount: "",
      description: "",
      expenseDate: new Date().toISOString().split("T")[0],
      paymentMethod: "Cash",
      receiptNumber: "",
      status: "active",
      createdBy: "Admin",
    });
    setShowModal(true);
  };

  // Open modal for editing expense
  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description || "",
      expenseDate: expense.expense_date,
      paymentMethod: expense.payment_method,
      receiptNumber: expense.receipt_number || "",
      status: expense.status,
      createdBy: expense.created_by || "Admin",
    });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  // Save expense (create or update)
  const saveExpense = async () => {
    // Validate form
    if (!formData.title.trim()) {
      alert("Expense title is required");
      return;
    }

    if (!formData.category) {
      alert("Please select a category");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    if (!formData.expenseDate) {
      alert("Please select an expense date");
      return;
    }

    try {
      const expenseData = {
        title: formData.title.trim(),
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        expenseDate: formData.expenseDate,
        paymentMethod: formData.paymentMethod,
        receiptNumber: formData.receiptNumber.trim(),
        status: formData.status,
        createdBy: formData.createdBy,
      };

      if (editingExpense) {
        // Update existing expense
        const result = await window.electronAPI.updateExpense(
          editingExpense.id,
          expenseData,
        );
        if (result.success) {
          await loadExpenses();
          await loadStats();
          closeModal();
        } else {
          alert("Failed to update expense: " + result.error);
        }
      } else {
        // Create new expense
        const result = await window.electronAPI.createExpense(expenseData);
        if (result.success) {
          await loadExpenses();
          await loadStats();
          closeModal();
        } else {
          alert("Failed to create expense: " + result.error);
        }
      }
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("An error occurred while saving the expense");
    }
  };

  // Delete expense
  const deleteExpense = async (id, title) => {
    if (
      window.confirm(
        `Are you sure you want to delete expense "${title}"? This action cannot be undone.`,
      )
    ) {
      try {
        const result = await window.electronAPI.deleteExpense(id);
        if (result.success) {
          await loadExpenses();
          await loadStats();
        } else {
          alert("Failed to delete expense: " + result.error);
        }
      } catch (err) {
        console.error("Error deleting expense:", err);
        alert("An error occurred while deleting the expense");
      }
    }
  };

  // Filter expenses based on search and category
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.description &&
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.receipt_number &&
        expense.receipt_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesCategory =
      filterCategory === "all" || expense.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate total of filtered expenses
  const totalFilteredAmount = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      "Food Supplies": "bg-green-900 text-green-300",
      Beverages: "bg-blue-900 text-blue-300",
      Utilities: "bg-yellow-900 text-yellow-300",
      Salaries: "bg-purple-900 text-purple-300",
      Marketing: "bg-pink-900 text-pink-300",
      Maintenance: "bg-orange-900 text-orange-300",
      Rent: "bg-indigo-900 text-indigo-300",
      Insurance: "bg-cyan-900 text-cyan-300",
      Taxes: "bg-red-900 text-red-300",
      Supplies: "bg-teal-900 text-teal-300",
      Equipment: "bg-gray-900 text-gray-300",
      Transportation: "bg-lime-900 text-lime-300",
    };
    return colors[category] || "bg-gray-900 text-gray-300";
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Expenses</h1>
        <p className="text-gray-400">Track and manage your business expenses</p>
      </div>

      {/* Statistics Cards */}
      {stats && showStats && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-white">
              Monthly Summary
            </h3>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Total Expenses</p>
                <DollarSign className="text-orange-500" size={20} />
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalExpenses)}
              </p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Number of Expenses</p>
                <Receipt className="text-blue-500" size={20} />
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.totalCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total transactions</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-sm">Top Category</p>
                <Tag className="text-green-500" size={20} />
              </div>
              <p className="text-xl font-bold text-white truncate">
                {stats.categorySummary[0]?.category || "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.categorySummary[0]
                  ? formatCurrency(stats.categorySummary[0].total)
                  : "$0"}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          {stats.categorySummary.length > 0 && (
            <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-3">
                Expense by Category
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.categorySummary.slice(0, 4).map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {cat.category}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search and Filter */}
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Categories</option>
            {expenseCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Create Button */}
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Total Display */}
      {filteredExpenses.length > 0 && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700 inline-block">
          <span className="text-gray-400">Showing total: </span>
          <span className="text-xl font-bold text-orange-500">
            {formatCurrency(totalFilteredAmount)}
          </span>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">Loading expenses...</div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No expenses found</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-orange-500 hover:text-orange-400"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Payment Method</th>
                  <th className="px-6 py-3">Receipt #</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">
                          {expense.title}
                        </div>
                        {expense.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {expense.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-gray-300">
                        <Calendar size={14} />
                        <span className="text-sm">
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-gray-300">
                        <CreditCard size={14} />
                        <span className="text-sm">
                          {expense.payment_method}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {expense.receipt_number ? (
                        <div className="flex items-center space-x-1 text-gray-300">
                          <Receipt size={14} />
                          <span className="text-sm font-mono">
                            {expense.receipt_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit Expense"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() =>
                            deleteExpense(expense.id, expense.title)
                          }
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingExpense ? "Edit Expense" : "Add New Expense"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expense Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Vegetable Purchase, Electricity Bill"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              {/* Category and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select Category</option>
                    {expenseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Expense Date and Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Receipt Number
                </label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  placeholder="Optional: Enter receipt or reference number"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter additional details about this expense..."
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-800 flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveExpense}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                {editingExpense ? "Update Expense" : "Create Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
