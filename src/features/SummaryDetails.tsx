import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import CommonDataTable from '../components/CommonDataTable';
import { useAppDispatch, useAppSelector } from "../hooks/hook";
import baseFetch from '../services/api';
import AttachmentViewer from '../components/AttachmentViewer';
import { CurrencyItem, ExpenseItem } from '../hooks/claimFormSlice';
import { ECLAIM_CURRENCY_MASTER_API } from '../constants/constants';
import SummaryFinancialDetails from '../components/SummaryFinancialDetails';
import EmployeeSummary from '../components/EmployeeSummary';
import CommonFormModal from '../components/CommonFormModal';

interface ExpenseDetailsProps {
  goToNext: () => void;
  goToPrevious: () => void;
}

const SummaryDetails: React.FC<ExpenseDetailsProps> = ({ goToNext, goToPrevious }) => {
  const claimForm = useAppSelector((state) => state.claimForm);
  const { employee: employeeData, claim: claimData } = claimForm;

  const [expenseData, setExpenseData] = useState<ExpenseItem[]>([]);
  const [currencyData, setCurrencyData] = useState<CurrencyItem[]>([]);
  const [reimbursementDate, setReimbursementDate] = useState<string>('');
  const [expenseTotals, setExpenseTotals] = useState<{ [currency: string]: number }>({});
  const [totalExpenseInLocal, setTotalExpenseInLocal] = useState<number>(0);
  const [localCurrency, setLocalCurrency] = useState("");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const [perDiemTotal, setPerDiemTotal] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [dueToCompany, setDueToCompany] = useState<number>(0);
  const [dueToYou, setDueToYou] = useState<number>(0);
  const [saveResultModal, setSaveResultModal] = useState(false);
  const countryCode = claimForm?.employee?.location;
  const dispatch = useAppDispatch();

  useEffect(() => {
    let totalINR = 0;
    if (Array.isArray(claimData.advanceEntries)) {
      claimData.advanceEntries.forEach((entry) => {
        const amount = Number(entry.spentAmountINR) || 0;
        if (amount > 0) {
          totalINR += amount;
        }
      });
    }
    setAdvanceAmount(totalINR);
  }, [claimData.advanceEntries]);

  const fetchLocalCurrency = async () => {
    if (!countryCode) return;
    try {
      const response = await baseFetch(
        `${ECLAIM_CURRENCY_MASTER_API}/?filter=location eq '${countryCode}' or currencyCodeDescription eq '${countryCode}'`,
        { headers: { 'accept': 'application/json' } }
      );
      const data = await response.json();
      const items = data.items;
      if (items && items.length > 0) {
        const currency = items[0];
        setLocalCurrency(currency.currencyCode);
        setCurrencyLabel(`${currency.currencyCode} - ${currency.currencyDescription}`);
      }
    } catch (error) {
      console.error('Failed to fetch currency:', error);
      setLocalCurrency("");
      setCurrencyLabel("");
    }
  };

  useEffect(() => {
    fetchLocalCurrency();
  }, [claimForm?.employee?.location]);

  useEffect(() => {
    if (claimData.expenseEntries && Array.isArray(claimData.expenseEntries)) {
      const sortedExpenses = [...claimData.expenseEntries].sort(
        (a, b) =>
          new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime()
      );
      setExpenseData(sortedExpenses);
    }
  }, [claimData.expenseEntries]);

  useEffect(() => {
    if (claimData.currencyEntries && Array.isArray(claimData.currencyEntries)) {
      setCurrencyData(claimData.currencyEntries);
    }
  }, [claimData.currencyEntries]);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    setReimbursementDate(formatDate(new Date()));
  }, []);

  useEffect(() => {
    const totals: { [currency: string]: number } = {};
    let totalInLocalCurrency = 0;
    let perDiemTotalLocal = 0;

    expenseData.forEach((item) => {
      const currency = item.currency?.trim();
      const amount = Number(item.expenseAmount) || 0;
      const isPerDiem = item.expenseCode === "Per diem";
      if (!currency || amount <= 0) return;
      if (!totals[currency]) {
        totals[currency] = 0;
      }
      totals[currency] += amount;
      const addToTotal = !isPerDiem;
      if (currency === localCurrency) {
        if (addToTotal) totalInLocalCurrency += amount;
        if (isPerDiem) perDiemTotalLocal += amount;
      } else {
        const rateEntry = currencyData.find(
          (c) => c.destinationCurrency === currency && c.exchangeRate > 0
        );
        if (rateEntry) {
          const converted = amount * rateEntry.exchangeRate;
          if (addToTotal) totalInLocalCurrency += converted;
          if (isPerDiem) perDiemTotalLocal += converted;
        } else {
          console.warn(`Missing or invalid exchange rate for currency: ${currency}`);
        }
      }
    });
    setExpenseTotals(totals);
    setTotalExpenseInLocal(totalInLocalCurrency);
    setPerDiemTotal(perDiemTotalLocal);
  }, [expenseData, currencyData, localCurrency]);

  useEffect(() => {
    const totalClaim = totalExpenseInLocal + perDiemTotal;
    if (totalClaim < advanceAmount) {
      setDueToCompany(advanceAmount - totalClaim);
      setDueToYou(0);
    } else {
      setDueToYou(totalClaim - advanceAmount);
      setDueToCompany(0);
    }
  }, [totalExpenseInLocal, perDiemTotal, advanceAmount]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to Cancel"))
      return;
    try {
      const payload = {
        eclaimApprovalStatus: {
          key: "Cancelled",
          name: "Cancelled"
        },
        isCancelled: "Yes",
      };
      const response = await baseFetch(
        `/o/c/eclaimdetails/${claimForm.claim.eclaimDetailId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        setSaveResultModal(true);
      } else {
        console.error('Failed to save summary', await response.text());
      }
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };

  const handleSaveSummary = async () => {
    try {
      const payload = {
        advanceAmount: advanceAmount,
        totalExpense: totalExpenseInLocal,
        perDiemAmount: perDiemTotal,
        dueToCompany: dueToCompany,
        dueToYou: dueToYou,
        localCurrency: localCurrency,
        eclaimApprovalStatus: {
          key: "Draft",
          name: "Draft"
        }
      };
      const response = await baseFetch(
        `/o/c/eclaimdetails/${claimForm.claim.eclaimDetailId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result = await response.json();

        dispatch({
          type: "claimForm/updateClaimField",
          payload: { field: "eclaimApprovalStatus", value: result?.eclaimApprovalStatus?.key },
        });
        setSaveResultModal(true);
      } else {
        console.error('Failed to save summary', await response.text());
      }
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };

  const handleFinalSaveSummary = async () => {
    try {
      const payload = {
        advanceAmount: advanceAmount,
        totalExpense: totalExpenseInLocal,
        perDiemAmount: perDiemTotal,
        dueToCompany: dueToCompany,
        dueToYou: dueToYou,
        localCurrency: localCurrency,
        eclaimApprovalStatus: {
          key: "pendingAtFinanceController",
          name: "Pending at Finance Controller"
        }
      };
      const response = await baseFetch(
        `/o/c/eclaimdetails/${claimForm.claim.eclaimDetailId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result = await response.json();

        dispatch({
          type: "claimForm/updateClaimField",
          payload: { field: "eclaimApprovalStatus", value: result?.eclaimApprovalStatus?.key },
        });
        setSaveResultModal(true);
      } else {
        console.error('Failed to save summary', await response.text());
      }
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };

  const handleResubmitClaim = async () => {
    try {
      const payload = {
        advanceAmount: advanceAmount,
        totalExpense: totalExpenseInLocal,
        perDiemAmount: perDiemTotal,
        dueToCompany: dueToCompany,
        dueToYou: dueToYou,
        localCurrency: localCurrency,
        isResubmitted: "Yes",
        eclaimApprovalStatus: {
          key: "draft",
          name: "Draft"
        }
      };
      const response = await baseFetch(
        `/o/c/eclaimdetails/${claimForm.claim.eclaimDetailId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        const result = await response.json();

        dispatch({
          type: "claimForm/updateClaimField",
          payload: { field: "eclaimApprovalStatus", value: result?.eclaimApprovalStatus?.key },
        });
        setSaveResultModal(true);
      } else {
        console.error('Failed to save summary', await response.text());
      }
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };
  const showAttendeesColumn =
    claimData?.category === "Travel and Entertainment" &&
    expenseData.some((item) => item.expenseType === "Entertainment");

  return (
    <div className="datatable-striped px-3 mb-3 pt-3 pb-3">
      <div className="bg-white rounded-bottom-2 datatable-striped-sub shadow-sm">
        <div className="bg-color-gradient bg-color px-3 py-1 rounded-top-2">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="text-white mt-3 mb-3">Expense Reimbursement Report</h6>
            <span className="text-white mt-3 mb-3">Claim Number: {claimData.claimNumber || ''}</span>
          </div>
        </div>

        <Container fluid className="p-3 bg-white shadow rounded">
          <EmployeeSummary
            employee={employeeData}
            claim={claimData}
            localCurrency={localCurrency}
            reimbursementDate={reimbursementDate}
          />

          <Row className="mt-4 mb-2">
            <Col>
              <h6 className="border-bottom pb-2">Exchange Currency Rate</h6>
            </Col>
          </Row>

          <Row>
            <CommonDataTable
              data={currencyData.filter(item => item.localCurrency !== localCurrency)}
              columns={[
                { field: "destinationCurrency", header: "Currency" },
                {
                  field: "exchangeRate",
                  header: "Exchange Rate",
                  body: (rowData: CurrencyItem) => {
                    const rate = rowData.exchangeRate;
                    const rateStr = rate.toString();
                    const formattedRate = rateStr.includes('.')
                      ? Number(rate).toFixed(5)
                      : Number(rate).toFixed(4);
                    return <span>{formattedRate}</span>;
                  }
                },
                {
                  header: "Attachment",
                  body: (rowData: CurrencyItem) => <AttachmentViewer attachments={rowData.attachments} />,
                },
              ]}
            />
          </Row>

          <Row className="mt-4 mb-2">
            <Col>
              <h6 className="border-bottom pb-2">Expense Details</h6>
            </Col>
          </Row>

          <Row>
            <CommonDataTable
              data={expenseData}
              columns={[
                { field: "expenseType", header: "Claim Type" },
                { field: "expenseCode", header: "Expense Code" },
                { field: "glCode", header: "GL Code" },
                {
                  header: "Expense Amount", body: (rowData: ExpenseItem) => {
                    const amount = Number(rowData.expenseAmount);
                    const currency = rowData.currency ?? '';
                    return `${currency} ${isNaN(amount) ? '0.00' : amount.toFixed(2)}`;
                  }
                },
                { field: "expenseDate", header: "Expense Date" },
                ...(showAttendeesColumn
                  ? [{ header: "Attendees", body: (rowData: ExpenseItem) => rowData.attendees || "-" }]
                  : []),
                { field: "remarks", header: "Remarks" },
                {
                  header: "Attachment",
                  body: (rowData: ExpenseItem) => <AttachmentViewer attachments={rowData.attachments} />,
                },
              ]}
            />
          </Row>
          <SummaryFinancialDetails
            expenseData={expenseData}
            currencyData={currencyData}
            localCurrency={localCurrency}
            advanceAmount={advanceAmount}
            claimData={claimData}
            userRole="FBC"
          />

          <Row className="text-center mt-4">
            <Col>
              <Button className="me-2 custom-button" onClick={goToPrevious}>&lt; Back</Button>
              {claimData?.eclaimApprovalStatus === "draft" ? (
                <>
                  <Button className="me-2 custom-button" onClick={handleSaveSummary}>Save</Button>
                  <Button className="me-2 custom-button" onClick={handleFinalSaveSummary}>Confirm & Submit</Button>
                </>
              ) : (
                <>
                  <Button className="me-2 custom-button" onClick={handleCancel}>Cancel</Button>
                  <Button className="me-2 custom-button" onClick={handleResubmitClaim}>ReSubmit</Button>
                </>
              )}
            </Col>
          </Row>
        </Container>
        <CommonFormModal
          show={saveResultModal}
          title="Alert"
          cancelButtonLabel="Close"
          onClose={() => setSaveResultModal(false)}
        >
          <div className="custom-model-success" role="alert">
            <div className="fs-5">THANK YOU!</div>
            <div>Your claim has been successfully saved !</div>
          </div>
        </CommonFormModal>
      </div>
    </div>
  );
};

export default SummaryDetails;
