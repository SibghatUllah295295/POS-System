import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  CreditCard,
  Printer,
  Store,
  Table,
  Tag,
  DollarSign,
  ShoppingCart,
} from "lucide-react";

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

  // Generate invoice
  // Generate invoice
  // Generate invoice
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
      // Save order to database
      const result = await window.electronAPI.createOrder(orderData);
      if (result.success) {
        // Prepare invoice data for printer
        const invoiceData = {
          invoiceNumber: invoiceNumber.toString(),
          date: currentDate.toISOString(),
          tableName: selectedTable.name,
          cashier: "Admin",
          items: orderData.items,
          subtotal: subtotal,
          tax: tax,
          discount: discount,
          netTotal: netTotal,
          paymentMethod: "Cash",
        };

        // Try to print using thermal printer
        let printSuccess = false;

        // Method 1: Try ESC/POS USB printer
        try {
          const printResult =
            await window.electronAPI.printThermalInvoice(invoiceData);
          if (printResult.success) {
            printSuccess = true;
            alert("Invoice printed successfully!");
          }
        } catch (err) {
          console.log("ESC/POS printing failed:", err);
        }

        // Method 2: Try Windows printer
        if (!printSuccess) {
          try {
            const printResult =
              await window.electronAPI.printWindowsPrinter(invoiceData);
            if (printResult.success) {
              printSuccess = true;
              alert("Invoice sent to Windows printer!");
            }
          } catch (err) {
            console.log("Windows printing failed:", err);
          }
        }

        // Method 3: Fallback to browser print
        if (!printSuccess) {
          printToThermalPrinter(orderData, selectedTable, currentDate);
          alert("Invoice generated! Please use browser print dialog.");
        }

        setShowModal(false);
        setSelectedTable(null);
        setSelectedProduct(null);

        // Reload shifts to update sales
        if (window.electronAPI.getCurrentShift) {
          await window.electronAPI.getCurrentShift();
        }
      } else {
        alert("Failed to generate invoice: " + result.error);
      }
    } catch (err) {
      console.error("Error generating invoice:", err);
      alert("Error generating invoice: " + err.message);
    }
  };

  // Print invoice for 78mm thermal printer
  // Print invoice directly to thermal printer
  const printToThermalPrinter = async (order, table, date) => {
    // Get current shift info
    const currentShift = await window.electronAPI.getCurrentShift();
    const shiftInfo = currentShift.success ? currentShift.data : null;

    // Calculate totals
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );
    const tax = 0;
    const discount = 0;
    const netTotal = subtotal + tax - discount;

    // Create print content optimized for 78mm thermal printer
    const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${order.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
        body {
          width: 78mm;
          margin: 0 auto;
          padding: 2mm;
          font-family: 'Courier New', 'Monaco', monospace;
          font-size: 10px;
          line-height: 1.2;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 5px;
        }
        .shop-name {
          font-size: 14px;
          font-weight: bold;
          margin: 0;
        }
        .shop-address {
          font-size: 8px;
          margin: 1px 0;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 4px 0;
        }
        .divider-solid {
          border-top: 1px solid #000;
          margin: 4px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .info-label {
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 5px 0;
        }
        th, td {
          text-align: left;
          padding: 2px 0;
          font-size: 9px;
        }
        th {
          border-bottom: 1px dashed #000;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .total-section {
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 8px;
        }
        .thankyou {
          text-align: center;
          margin: 5px 0;
          font-weight: bold;
        }
        .developer {
          text-align: center;
          font-size: 7px;
          margin-top: 5px;
          border-top: 1px dashed #000;
          padding-top: 5px;
        }
        .barcode {
          text-align: center;
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
          margin: 5px 0;
        }
        @page {
          size: 78mm auto;
          margin: 0mm;
        }
      </style>
    </head>
    <body onload="window.print(); setTimeout(function(){ window.close(); }, 1000);">
      <!-- Header -->
      <div class="header">
        <div class="shop-name">PIZZA PARADISE</div>
        <div class="shop-address">Shan Sikander Road Poso Pump Near Gaddai</div>
        <div class="shop-address">Chungli Dera Ghazi Khan</div>
        <div class="shop-address">Tel: 0336-8576866 - 0336-7016666</div>
      </div>
      
      <div class="divider"></div>
      
      <!-- Invoice Info -->
      <div class="info-row">
        <span class="info-label">Invoice:</span>
        <span>${order.invoiceNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span>${date.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Table:</span>
        <span>${table.name} (${selectedHall?.name || "Main Hall"})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Cashier:</span>
        <span>Admin</span>
      </div>
      
      <div class="divider"></div>
      
      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item, index) => `
            <tr>
              <td style="vertical-align: top;">${index + 1}</td>
              <td style="vertical-align: top;">
                ${item.productName}
                ${item.productSize ? `<br/><small>(${item.productSize})</small>` : ""}
              </td>
              <td class="text-right" style="vertical-align: top;">${item.quantity}</td>
              <td class="text-right" style="vertical-align: top;">${item.unitPrice.toFixed(2)}</td>
              <td class="text-right" style="vertical-align: top;">${item.totalPrice.toFixed(2)}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
        <tfoot>
          <tr class="divider">
            <td colspan="5" style="padding: 0;"><div class="divider"></div></td>
          </tr>
          <tr>
            <td colspan="3"></td>
            <td class="text-right"><strong>Sub Total:</strong></td>
            <td class="text-right">${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3"></td>
            <td class="text-right">Tax (0%):</td>
            <td class="text-right">${tax.toFixed(2)}</td>
           </tr>
          <tr>
            <td colspan="3"></td>
            <td class="text-right">Discount:</td>
            <td class="text-right">${discount.toFixed(2)}</td>
           </tr>
          <tr>
            <td colspan="5"><div class="divider-solid"></div></td>
           </tr>
          <tr>
            <td colspan="3"></td>
            <td class="text-right"><strong>NET TOTAL:</strong></td>
            <td class="text-right"><strong>${netTotal.toFixed(2)}</strong></td>
           </tr>
        </tfoot>
      </table>
      
      <div class="divider"></div>
      
      <!-- Payment Info -->
      <div class="info-row">
        <span class="info-label">Payment Method:</span>
        <span>${order.paymentMethod || "Cash"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Amount Paid:</span>
        <span>Rs. ${netTotal.toFixed(2)}</span>
      </div>
      
      <div class="divider"></div>
      
      <!-- Thank You Message -->
      <div class="thankyou">
        Thank You for Shopping!
      </div>
      
      <div class="divider"></div>
      
      <!-- Developer Info -->
      <div class="developer">
        Software Developed by The Ghazian<br/>
        Sibghatullah | +923348691010
      </div>
      
      <!-- Feed space for thermal printer -->
      <div style="height: 20mm;"></div>
    </body>
    </html>
  `;

    // Method 1: Try to use Electron's native printing
    if (window.electronAPI && window.electronAPI.printInvoice) {
      try {
        await window.electronAPI.printInvoice(printContent);
        return;
      } catch (err) {
        console.error("Electron print failed:", err);
      }
    }

    // Method 2: Open print window (may be blocked by popup blocker)
    const printWindow = window.open(
      "",
      "_blank",
      "width=400,height=600,toolbar=no,menubar=no,scrollbars=yes",
    );
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Method 3: If popup blocked, create an iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }
  };

  const testPrinter = async () => {
    const testData = {
      invoiceNumber: "TEST001",
      date: new Date().toISOString(),
      tableName: "Test Table",
      cashier: "Admin",
      items: [
        {
          productName: "Test Product",
          productSize: "Regular",
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
        },
      ],
      subtotal: 100,
      tax: 0,
      discount: 0,
      netTotal: 100,
      paymentMethod: "Cash",
    };

    try {
      // Try ESC/POS printing
      const result = await window.electronAPI.printThermalInvoice(testData);
      if (result.success) {
        alert("Test print sent to thermal printer!");
      } else {
        alert("Thermal printer not found. Please check USB connection.");
      }
    } catch (err) {
      // Try Windows printing as fallback
      try {
        const result = await window.electronAPI.printWindowsPrinter(testData);
        if (result.success) {
          alert("Test print sent to Windows printer!");
        }
      } catch (err2) {
        alert("No printer found. Please install printer drivers.");
      }
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
            onClick={testPrinter}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm ml-2"
          >
            Test Printer
          </button>

          <button
            onClick={() => setShowTableModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Create Table</span>
          </button>
          <button
            onClick={testPrinter}
            className="bg-blue-600 px-3 py-1 rounded text-sm"
          >
            Test Printer
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
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center space-x-2"
              >
                <Printer size={18} />
                <span>Generate Invoice</span>
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
