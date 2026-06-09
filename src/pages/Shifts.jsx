import { useState, useEffect } from "react";
import {
  Play,
  StopCircle,
  Trash2,
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

const Shifts = () => {
  const [currentShift, setCurrentShift] = useState(null);
  const [allShifts, setAllShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingData, setClosingData] = useState({
    closingBalance: 0,
    remarks: "Ubaid",
  });

  // Load shifts data
  const loadShifts = async () => {
    setLoading(true);
    try {
      const [currentResult, allResult] = await Promise.all([
        window.electronAPI.getCurrentShift(),
        window.electronAPI.getAllShifts(),
      ]);

      if (currentResult.success) {
        setCurrentShift(currentResult.data);
      }
      if (allResult.success) {
        setAllShifts(allResult.data);
      }
    } catch (err) {
      console.error("Error loading shifts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
    // Refresh every 30 seconds to update sales
    const interval = setInterval(loadShifts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Start new shift
  const startShift = async () => {
    if (!window.confirm("Are you sure you want to start a new shift?")) return;

    try {
      const result = await window.electronAPI.startShift({
        openingBalance: 0,
        remarks: "Ubaid",
      });

      if (result.success) {
        alert("Shift started successfully!");
        await loadShifts();
      } else {
        alert("Failed to start shift: " + result.error);
      }
    } catch (err) {
      console.error("Error starting shift:", err);
      alert("An error occurred while starting the shift");
    }
  };

  // Close shift
  const closeShift = async () => {
    if (!currentShift) return;

    try {
      const result = await window.electronAPI.closeShift(currentShift.id, {
        closingBalance: closingData.closingBalance,
        remarks: closingData.remarks,
      });

      if (result.success) {
        alert("Shift closed successfully!");
        setShowCloseModal(false);
        await loadShifts();
      } else {
        alert("Failed to close shift: " + result.error);
      }
    } catch (err) {
      console.error("Error closing shift:", err);
      alert("An error occurred while closing the shift");
    }
  };

  // Delete shift
  const deleteShift = async (id, shiftDate) => {
    if (
      window.confirm(
        `Are you sure you want to delete shift from ${new Date(
          shiftDate,
        ).toLocaleString()}? This action cannot be undone.`,
      )
    ) {
      try {
        const result = await window.electronAPI.deleteShift(id);
        if (result.success) {
          alert("Shift deleted successfully!");
          await loadShifts();
        } else {
          alert("Failed to delete shift: " + result.error);
        }
      } catch (err) {
        console.error("Error deleting shift:", err);
        alert("An error occurred while deleting the shift");
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
          <CheckCircle size={12} className="mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
          <XCircle size={12} className="mr-1" />
          Closed
        </span>
      );
    }
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">My Shifts</h1>
        <p className="text-gray-400">Manage your work shifts and track sales</p>
      </div>

      {/* Current Shift Section */}
      {currentShift ? (
        <div className="mb-6 bg-gradient-to-r from-orange-900/30 to-orange-800/20 border border-orange-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Clock size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Current Shift
              </h2>
              {getStatusBadge(currentShift.status)}
            </div>
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <StopCircle size={18} />
              <span>Close Shift</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Shift Started</p>
              <p className="text-white font-medium">
                {formatDate(currentShift.shift_date)}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Opening Balance</p>
              <p className="text-white font-medium">
                {formatCurrency(currentShift.opening_balance)}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Current Sales</p>
              <p className="text-green-400 font-bold text-xl">
                {formatCurrency(currentShift.total_sales || 0)}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-300">
              <span className="font-semibold">Note:</span> Closing balance will
              be automatically calculated based on total sales. You can modify
              it when closing the shift.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">No active shift</p>
          <button
            onClick={startShift}
            className="flex items-center space-x-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors mx-auto"
          >
            <Play size={18} />
            <span>Start Shift</span>
          </button>
        </div>
      )}

      {/* All Shifts Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Shift History</h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">Loading shifts...</div>
          </div>
        ) : allShifts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No shifts found</p>
            <button
              onClick={startShift}
              className="mt-4 text-orange-500 hover:text-orange-400"
            >
              Start your first shift
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-3">Shifts</th>
                  <th className="px-6 py-3">Opening Balance</th>
                  <th className="px-6 py-3">Closing Balance</th>
                  <th className="px-6 py-3">Close Time</th>
                  <th className="px-6 py-3">Remarks</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {allShifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-white">
                          {formatDate(shift.shift_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {formatCurrency(shift.opening_balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {formatCurrency(shift.closing_balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {shift.close_time ? formatDate(shift.close_time) : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300">
                        {shift.remarks || "Ubaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(shift.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {shift.status === "closed" && (
                        <button
                          onClick={() =>
                            deleteShift(shift.id, shift.shift_date)
                          }
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Shift"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      {shift.status === "active" && (
                        <button
                          onClick={() => setShowCloseModal(true)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                        >
                          Close Shift
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Close Shift Modal */}
      {showCloseModal && currentShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Close Shift</h2>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Shift Start Time
                </label>
                <input
                  type="text"
                  value={formatDate(currentShift.shift_date)}
                  disabled
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Sales
                </label>
                <input
                  type="text"
                  value={formatCurrency(currentShift.total_sales || 0)}
                  disabled
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-green-400 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Closing Balance
                </label>
                <input
                  type="number"
                  value={closingData.closingBalance}
                  onChange={(e) =>
                    setClosingData({
                      ...closingData,
                      closingBalance: parseFloat(e.target.value) || 0,
                    })
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current sales total:{" "}
                  {formatCurrency(currentShift.total_sales || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Remarks
                </label>
                <input
                  type="text"
                  value={closingData.remarks}
                  onChange={(e) =>
                    setClosingData({ ...closingData, remarks: e.target.value })
                  }
                  placeholder="Add closing remarks"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={closeShift}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Close Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
