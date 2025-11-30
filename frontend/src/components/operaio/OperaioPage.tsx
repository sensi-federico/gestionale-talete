import { useState } from "react";
import NuovoRilevamentoForm from "./NuovoRilevamentoForm";
import MieiRilevamenti from "./MieiRilevamenti";

type TabId = "nuovo" | "lista";

const OperaioPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("nuovo");

  return (
    <main className="operaio-page">
      {/* Tab Navigation */}
      <nav className="operaio-tabs">
        <button
          type="button"
          className={`operaio-tab ${activeTab === "nuovo" ? "operaio-tab--active" : ""}`}
          onClick={() => setActiveTab("nuovo")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Nuovo</span>
        </button>
        <button
          type="button"
          className={`operaio-tab ${activeTab === "lista" ? "operaio-tab--active" : ""}`}
          onClick={() => setActiveTab("lista")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>I miei</span>
        </button>
      </nav>

      {/* Tab Content */}
      <div className="operaio-content">
        {activeTab === "nuovo" && <NuovoRilevamentoForm />}
        {activeTab === "lista" && <MieiRilevamenti />}
      </div>
    </main>
  );
};

export default OperaioPage;
