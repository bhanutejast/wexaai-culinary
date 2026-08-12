import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { Dashboard } from "./pages/Dashboard";
import { FoodExplorer } from "./pages/FoodExplorer";
import { GraphExplorer } from "./pages/GraphExplorer";
import { Recommendations } from "./pages/Recommendations";

function App() {
  // Global active profile context, default to Srinivas (pre-seeded user)
  const [activeUser, setActiveUser] = useState<string>("Srinivas");

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-950">
        <NavBar activeUser={activeUser} setActiveUser={setActiveUser} />
        <main className="flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard activeUser={activeUser} />} />
            <Route path="/explorer" element={<FoodExplorer activeUser={activeUser} />} />
            <Route path="/graph" element={<GraphExplorer activeUser={activeUser} />} />
            <Route path="/recommendations" element={<Recommendations activeUser={activeUser} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
