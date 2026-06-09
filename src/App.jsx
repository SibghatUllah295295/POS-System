import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Employees from "./pages/Employees";
import Expenses from "./pages/Expenses";
import Products from "./pages/Products";
import Shifts from "./pages/Shifts";
import Sales from "./pages/Sales"; // Add this import

function App() {
  const [activePage, setActivePage] = useState("sales"); // Change default to 'sales'
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      setIsElectron(true);
      window.electronAPI
        .testConnection()
        .then((result) => {
          if (result.success) {
            console.log("Database connected:", result.message);
          }
        })
        .catch((err) => {
          console.error("Error testing connection:", err);
        });
    }
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "sales":
        return <Sales />;
      case "dashboard":
        return <Dashboard />;
      case "categories":
        return <Categories />;
      case "employees":
        return <Employees />;
      case "expenses":
        return <Expenses />;
      case "products":
        return <Products />;
      case "shifts":
        return <Shifts />;
      default:
        return <Sales />;
    }
  };

  if (!isElectron) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md text-center">
          <h1 className="text-xl font-bold text-white mb-2">
            Electron Environment Required
          </h1>
          <p className="text-red-200">Please launch the app using Electron.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-hidden p-6">{renderPage()}</main>
    </div>
  );
}

export default App;
