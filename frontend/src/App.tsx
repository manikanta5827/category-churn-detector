import { useState } from "react";
import OverallChurn from "./components/OverallChurn";
import CategoryChurn from "./components/CategoryChurn";
import BlindSpots from "./components/BlindSpots";

function App() {
  const [active, setActive] = useState<"overall" | "category" | "blind">(
    "overall",
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex justify-center gap-4 p-4">
        <div
          onClick={() => setActive("overall")}
          className={`p-4 bg-gray-800 rounded cursor-pointer transition ${active === "overall" ? "border border-green-500" : "hover:bg-gray-700"}`}
        >
          Overall Churn
        </div>
        <div
          onClick={() => setActive("category")}
          className={`p-4 bg-gray-800 rounded cursor-pointer transition ${active === "category" ? "border border-green-500" : "hover:bg-gray-700"}`}
        >
          Category Churn
        </div>
        <div
          onClick={() => setActive("blind")}
          className={`p-4 bg-gray-800 rounded cursor-pointer transition ${active === "blind" ? "border border-green-500" : "hover:bg-gray-700"}`}
        >
          Blind Spots
        </div>
      </div>
      {active === "overall" && <OverallChurn />}
      {active === "category" && <CategoryChurn />}
      {active === "blind" && <BlindSpots />}
    </div>
  );
}

export default App;
