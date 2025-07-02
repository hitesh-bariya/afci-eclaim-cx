import React, { useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import "../css/CustomTabs.css";
import EmployeeForm from "../pages/EmployeeForm";
import AdvanceForm from "../pages/AdvanceForm";
import CurrencyDetail from "../features/CurrencyDetail";
import ExpenseDetails from "../features/ExpenseDetails";
import SummaryDetails from "../features/SummaryDetails";

const TAB_KEYS = ["employee", "currency", "expense", "advance", "summary"];

const CustomTabs = () => {
  const [activeKey, setActiveKey] = useState("employee");

  const handleSelect = (key: string | null) => {
    if (key) setActiveKey(key);
  };

  const goToNext = () => {
    const currentIndex = TAB_KEYS.indexOf(activeKey);
    if (currentIndex < TAB_KEYS.length - 1) {
      setActiveKey(TAB_KEYS[currentIndex + 1]);
    }
  };

  const goToPrevious = () => {
    const currentIndex = TAB_KEYS.indexOf(activeKey);
    if (currentIndex > 0) {
      setActiveKey(TAB_KEYS[currentIndex - 1]);
    }
  };

  return (
    <div className="custom-tab-container mt-3">
      <Tabs
        activeKey={activeKey}
        onSelect={handleSelect}
        id="custom-tabs"
        className="custom-tabs nav nav-tabs nav-justified nav-pills justify-content-center mb-4 ps4"
        justify
      >
        <Tab eventKey="employee" title="Employee Details">
          <div className="tab-content-wrapper">
            <EmployeeForm goToNext={goToNext} goToPrevious={goToPrevious} />
          </div>
        </Tab>
        <Tab eventKey="currency" title="Currency">
          <CurrencyDetail goToNext={goToNext} goToPrevious={goToPrevious} />
        </Tab>
        <Tab eventKey="expense" title="Expense Details">
          <ExpenseDetails goToNext={goToNext} goToPrevious={goToPrevious} />
        </Tab>
        <Tab eventKey="advance" title="Advance Report">
          <div className="tab-content-wrapper">
            <AdvanceForm goToNext={goToNext} goToPrevious={goToPrevious} />
          </div>
        </Tab>
        <Tab eventKey="summary" title="Summary">
          <div className="tab-content-wrapper">
            <SummaryDetails goToNext={goToNext} goToPrevious={goToPrevious} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default CustomTabs;
