import { useState, useEffect } from "react";
import { Plus, X, Store, Table, Tag } from "lucide-react";

const Sales = () => {
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editablePrice, setEditablePrice] = useState("");
  const [showHallModal, setShowHallModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [newHallName, setNewHallName] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newTableHallId, setNewTableHallId] = useState("");

  // Load halls
  const loadHalls = async () => {
    try {
      const result = await window.electronAPI.getHalls();
      if (result.success) {
        setHalls(result.data);
      }
    } catch (err) {
      console.error("Error loading halls:", err);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const result = await window.electronAPI.getCategories();
      if (result.success) {
        setCategories(result.data.filter((cat) => cat.status === "active"));
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  useEffect(() => {
    loadHalls();
    loadCategories();
  }, []);

  // Load tables when hall is selected
  const handleHallClick = async (hall) => {
    setSelectedHall(hall);
    setSelectedTable(null);
    try {
      const result = await window.electronAPI.getTablesByHall(hall.id);
      if (result.success) {
        setTables(result.data);
      }
    } catch (err) {
      console.error("Error loading tables:", err);
    }
  };

  // Load products when category is selected
  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    try {
      const result = await window.electronAPI.getProductsByCategory(
        category.id,
      );
      if (result.success) {
        setProducts(result.data.filter((p) => p.status === "active"));
      }
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  // Handle product selection
  const handleProductClick = (product) => {
    if (!selectedTable) {
      alert("Please select a table first");
      return;
    }

    setSelectedProduct(product);
    if (selectedCategory?.price_type === "editable") {
      setEditablePrice(product.price ? product.price.toString() : "");
    }
    setShowModal(true);
  };

  // Create hall
  const createHall = async () => {
    if (!newHallName.trim()) {
      alert("Please enter hall name");
      return;
    }

    try {
      const result = await window.electronAPI.createHall({ name: newHallName });
      if (result.success) {
        await loadHalls();
        setShowHallModal(false);
        setNewHallName("");
      } else {
        alert("Failed to create hall: " + result.error);
      }
    } catch (err) {
      console.error("Error creating hall:", err);
    }
  };

  // Create table
  const createTable = async () => {
    if (!newTableName.trim()) {
      alert("Please enter table name");
      return;
    }
    if (!newTableHallId) {
      alert("Please select a hall");
      return;
    }

    try {
      const result = await window.electronAPI.createTable({
        name: newTableName,
        hallId: parseInt(newTableHallId),
      });
      if (result.success) {
        if (selectedHall && selectedHall.id === parseInt(newTableHallId)) {
          const tablesResult = await window.electronAPI.getTablesByHall(
            parseInt(newTableHallId),
          );
          if (tablesResult.success) {
            setTables(tablesResult.data);
          }
        }
        setShowTableModal(false);
        setNewTableName("");
        setNewTableHallId("");
      } else {
        alert("Failed to create table: " + result.error);
      }
    } catch (err) {
      console.error("Error creating table:", err);
    }
  };

  // Handle invoice generation (just alert for now)
  const generateInvoice = async () => {
    const finalPrice =
      selectedCategory?.price_type === "editable"
        ? parseFloat(editablePrice)
        : selectedProduct.price;

    const invoiceNumber = Math.floor(Math.random() * 9000000) + 1000000;
    const currentDate = new Date();

    const subtotal = finalPrice;
    const tax = 0;
    const discount = 0;
    const netTotal = subtotal + tax - discount;

    const orderData = {
      invoiceNumber: invoiceNumber.toString(),
      tableId: selectedTable.id,
      totalAmount: finalPrice,
      taxAmount: 0,
      discountAmount: 0,
      netTotal: netTotal,
      paymentMethod: "Cash",
      createdBy: "Admin",
      items: [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productSize: selectedProduct.size || "",
          quantity: 1,
          bonusQuantity: 0,
          unitPrice: finalPrice,
          totalPrice: finalPrice,
        },
      ],
    };

    try {
      const result = await window.electronAPI.createOrder(orderData);
      if (result.success) {
        alert(
          `Invoice #${invoiceNumber} generated successfully!\nTable: ${selectedTable.name}\nProduct: ${selectedProduct.name}\nTotal: Rs. ${netTotal}`,
        );
        setShowModal(false);
        setSelectedTable(null);
        setSelectedProduct(null);
      } else {
        alert("Failed to generate invoice: " + result.error);
      }
    } catch (err) {
      console.error("Error generating invoice:", err);
      alert("Error generating invoice: " + err.message);
    }
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      {/* LEFT SIDE - Halls and Tables */}
      <div className="w-1/3 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
        {/* Action Buttons */}
        <div className="p-4 border-b border-gray-700 flex gap-2">
          <button
            onClick={() => setShowHallModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Create Hall</span>
          </button>
          <button
            onClick={() => setShowTableModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Create Table</span>
          </button>
        </div>

        {/* Halls List */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Halls</h3>
          <div className="flex flex-wrap gap-2">
            {halls.map((hall) => (
              <button
                key={hall.id}
                onClick={() => handleHallClick(hall)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedHall?.id === hall.id
                    ? "bg-orange-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Store size={16} className="inline mr-2" />
                {hall.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tables List */}
        {selectedHall && (
          <div className="p-4 flex-1 overflow-auto">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">
              Tables in {selectedHall.name}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTable?.id === table.id
                      ? "border-orange-500 bg-orange-600/20"
                      : "border-gray-600 bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  <Table size={20} className="mx-auto mb-1" />
                  <div className="text-sm font-medium">{table.name}</div>
                  <div className="text-xs text-gray-400">{table.status}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE - Categories and Products */}
      <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
        {/* Categories List */}
        <div className="p-4 border-b border-gray-700 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory?.id === category.id
                    ? "bg-orange-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Tag size={16} className="inline mr-2" />
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {selectedCategory && (
          <div className="p-4 flex-1 overflow-auto">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">
              Products in {selectedCategory.name}
              {selectedCategory.price_type === "editable" && (
                <span className="ml-2 text-xs text-purple-400">
                  (Editable Prices)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="p-3 rounded-lg border border-gray-600 bg-gray-700 hover:bg-gray-600 transition-all text-left"
                >
                  <div className="font-medium text-white mb-1">
                    {product.name}
                  </div>
                  {product.size && (
                    <div className="text-xs text-gray-400 mb-2">
                      {product.size}
                    </div>
                  )}
                  <div className="text-orange-400 font-bold">
                    {product.price ? `Rs. ${product.price}` : "Variable Price"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Info Bar */}
      {selectedTable && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg">
          Selected Table: {selectedTable.name}
        </div>
      )}

      {/* Invoice Modal */}
      {showModal && selectedProduct && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Generate Invoice</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-400">Table</p>
                <p className="text-white font-semibold">{selectedTable.name}</p>
              </div>

              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-400">Product</p>
                <p className="text-white font-semibold">
                  {selectedProduct.name}
                </p>
                {selectedProduct.size && (
                  <p className="text-sm text-gray-300">
                    Size: {selectedProduct.size}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price
                </label>
                {selectedCategory?.price_type === "editable" ? (
                  <input
                    type="number"
                    value={editablePrice}
                    onChange={(e) => setEditablePrice(e.target.value)}
                    step="10"
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    placeholder="Enter price"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    Rs. {selectedProduct.price}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Date & Time
                </label>
                <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedProduct(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={generateInvoice}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Hall Modal */}
      {showHallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Create Hall</h2>
              <button
                onClick={() => setShowHallModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hall Name
              </label>
              <input
                type="text"
                value={newHallName}
                onChange={(e) => setNewHallName(e.target.value)}
                placeholder="e.g., Main Hall, VIP Hall"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowHallModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createHall}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Create Table</h2>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Hall
                </label>
                <select
                  value={newTableHallId}
                  onChange={(e) => setNewTableHallId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select Hall</option>
                  {halls.map((hall) => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Table Name
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g., Table 1, VIP Table"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={createTable}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
