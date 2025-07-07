import React, { useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import "../css/CustomTabs.css";
import EmployeeForm from "../pages/EmployeeForm";
import AdvanceForm from "../pages/AdvanceForm";
import CurrencyDetail from "../features/CurrencyDetail";
import ExpenseDetails from "../features/ExpenseDetails";
import SummaryDetails from "../features/SummaryDetails";
import { useAppSelector } from "../hooks/hook";

const TAB_KEYS = ["employee", "currency", "expense", "advance", "summary"];

const TAB_TITLES: Record<string, string> = {
  employee: "Employee Detail",
  currency: "Currency",
  expense: "Expense Detail",
  advance: "Advance Report",
  summary: "Summary",
};

const CustomTabs = () => {
  const [activeKey, setActiveKey] = useState("employee");
  const [enabledTabs, setEnabledTabs] = useState(new Set(["employee"]));

  const formData = useAppSelector((state) => state.claimForm);
  const isEmployeeComplete = !!formData.employee?.name && !!formData.employee?.qadNumber;
  const isCurrencyComplete = formData.claim?.currencyEntries?.length > 0;
  const isExpenseComplete = formData.claim?.expenseEntries?.length > 0;
  //const isAdvanceComplete = formData.claim?.advanceEntries?.length > 0;

  const validationMap: Record<string, boolean> = {
    employee: isEmployeeComplete,
    currency: isCurrencyComplete,
    expense: isExpenseComplete,
    advance: true,
    summary: true,
  };

  const handleSelect = (key: string | null) => {
    if (key && enabledTabs.has(key)) {
      setActiveKey(key);
    }
  };

  const goToNext = () => {
    if (!validationMap[activeKey]) {
      alert("Please complete the current section before proceeding.");
      return;
    }

    const currentIndex = TAB_KEYS.indexOf(activeKey);
    const nextTab = TAB_KEYS[currentIndex + 1];
    if (nextTab) {
      setEnabledTabs((prev) => new Set(prev).add(nextTab));
      setActiveKey(nextTab);
    }
  };

  const goToPrevious = () => {
    const currentIndex = TAB_KEYS.indexOf(activeKey);
    if (currentIndex > 0) {
      setActiveKey(TAB_KEYS[currentIndex - 1]);
    }
  };

  const renderTabContent = (key: string) => {
    switch (key) {
      case "employee":
        return <EmployeeForm goToNext={goToNext} goToPrevious={goToPrevious} />;
      case "currency":
        return <CurrencyDetail goToNext={goToNext} goToPrevious={goToPrevious} />;
      case "expense":
        return <ExpenseDetails goToNext={goToNext} goToPrevious={goToPrevious} />;
      case "advance":
        return <AdvanceForm goToNext={goToNext} goToPrevious={goToPrevious} />;
      case "summary":
        return <SummaryDetails goToNext={goToNext} goToPrevious={goToPrevious} />;
      default:
        return null;
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
        {TAB_KEYS.map((key) => (
          <Tab
            key={key}
            eventKey={key}
            title={
              <span
                className={`tab-title ${key === activeKey
                    ? "active-tab"
                    : enabledTabs.has(key)
                      ? "enabled-tab"
                      : "disabled-tab"
                  }`}
              >
                 {TAB_TITLES[key]}
              </span>
            }
          >
            {activeKey === key && (
              <div className="tab-content-wrapper">{renderTabContent(key)}</div>
            )}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};

export default CustomTabs;
