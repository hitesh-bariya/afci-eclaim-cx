// src/forms/AdvanceForm.tsx
import React, { useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import { useAppSelector, useAppDispatch } from "../hooks/hook";
import {
  addAdvanceEntry,
  removeAdvanceEntry,
  updateAdvanceEntry,
} from "../hooks/claimFormSlice";
import CommonDataTable from "../components/CommonDataTable";
import ActionButtons from "../components/ActionButtons";
import CommonFormModal from "../components/CommonFormModal";
import AdvanceDetails from "../features/AdvanceDetails";
import baseFetch from "../services/api";
import {
  ECLAIM_ADVANCES_OBJECT_ENDPOINT,
  ECLAIM_DETAILS_OBJECT_ENDPOINT,
} from "../constants/constants";
import { AdvanceEntry } from "../types/AdvanceEntry";
import { format, parseISO } from "date-fns";
interface advanceDetailsProps {
  goToNext: () => void;
  goToPrevious: () => void;
}

const AdvanceForm : React.FC<advanceDetailsProps> = ({ goToNext, goToPrevious }) =>  {
  const [showModal, setShowModal] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingEntry, setEditingEntry] = useState<AdvanceEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const advanceDetailsRef = useRef<any>(null);

  const dispatch = useAppDispatch();
  const advanceEntries = useAppSelector(
    (state) => state.claimForm.claim.advanceEntries || []
  );

  const handleDelete = async (id: number) => {
    if (
      !window.confirm("Are you sure you want to delete this advance entry?")
    ) {
      return;
    }

    try {
      setLoading(true);
      await baseFetch(`${ECLAIM_ADVANCES_OBJECT_ENDPOINT}/${id}`, {
        method: "DELETE",
      });
      dispatch(removeAdvanceEntry(id));
    } catch (error) {
      console.error("Failed to delete advance:", error);
      alert("Failed to delete entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (entry: AdvanceEntry) => {
    try {
      setLoading(true);
      const isGivenComplete =
        entry.givenCurrency && entry.givenAmount && entry.advanceGivenDate;
      const isReturnComplete =
        entry.returnedCurrency &&
        entry.returnedAmount &&
        entry.advanceReturnDate;

      if (!isGivenComplete && !isReturnComplete) {
        alert("Please fill either Advance or Return section completely.");
        return;
      }
      if (
        isGivenComplete &&
        isReturnComplete &&
        entry.givenCurrency !== entry.returnedCurrency
      ) {
        alert("Given currency and returned currency must be the same.");
        return;
      }

      if (
        (entry.givenAmount && entry.givenAmount < 0) ||
        (entry.returnedAmount && entry.returnedAmount < 0)
      ) {
        alert("Amounts cannot be negative.");
        return;
      }

      const advancePayload = {
        givenCurrency: entry.givenCurrency,
        givenAmount: entry.givenAmount
          ? Number(entry.givenAmount.toFixed(2))
          : 0,
        givenPaidThrough: entry.givenPaidThrough,
        advanceGivenDate: entry.advanceGivenDate,
        returnedCurrency: entry.returnedCurrency,
        returnedAmount: entry.returnedAmount
          ? Number(entry.returnedAmount.toFixed(2))
          : 0,
        returnedPaidThrough: entry.returnedPaidThrough,
        advanceReturnDate: entry.advanceReturnDate,
        spentAmount: entry.spentAmount
          ? Number(entry.spentAmount.toFixed(2))
          : 0,
        spentAmountINR: entry.spentAmountINR
          ? Number(entry.spentAmountINR.toFixed(2))
          : 0,
      };

      let savedEntry;
      if (editingEntry) {
        const response = await baseFetch(
          `${ECLAIM_ADVANCES_OBJECT_ENDPOINT}/${entry.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(advancePayload),
          }
        );
        savedEntry = await response.json();
      } else {
        const response = await baseFetch(ECLAIM_ADVANCES_OBJECT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(advancePayload),
        });
        savedEntry = await response.json();
      }

      const completeEntry = {
        ...entry,
        id: savedEntry.id || Date.now(),
      };

      if (editingEntry) {
        dispatch(updateAdvanceEntry(completeEntry));
      } else {
        dispatch(addAdvanceEntry(completeEntry));
      }

      setShowModal(false);
      setEditingEntry(null);
    } catch (error) {
      console.error("Failed to save advance:", error);
      alert("Failed to save entry.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdvanceDataToObject = async () => {
    try {
      const totalSpent = advanceEntries.reduce(
        (sum, entry) => sum + (entry.spentAmountINR || 0),
        0
      );

      const patchPayload = {
        spentAmount: Number(totalSpent.toFixed(2)),
      };

      const detailsObjectId = 123;

      await baseFetch(`${ECLAIM_DETAILS_OBJECT_ENDPOINT}/${detailsObjectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchPayload),
      });

      alert("Total spent amount patched successfully!");
    } catch (error) {
      console.error("Error patching total:", error);
      alert("Failed to save total. Please try again.");
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "dd-MMM-yyyy");
    } catch {
      return "-";
    }
  };

  const formatAmount = (amount?: number) => {
    return amount !== undefined ? amount.toFixed(2) : "-";
  };

  const formatNegativeAmount = (amount?: number) => {
    return amount !== undefined ? Math.abs(amount).toFixed(2) : "-";
  };
  return (
    <div className="datatable-striped px-3 mb-3 pt-3 pb-3">
      <div className="bg-white rounded-bottom-2 shadow-sm datatable-striped-sub pb-3">
        <div className="bg-color-gradient px-3 py-1 rounded-top-4">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="text-white mt-3 mb-3">Advance Details</h6>
            <Button
              className="datatable-striped-add-btn"
              variant="light"
              onClick={() => {
                setEditingEntry(null);
                setShowModal(true);
              }}
            >
              Add New {FaPlus({ size: 16, style: { marginLeft: "4px" } })}
            </Button>
          </div>
        </div>

        <CommonDataTable
          data={advanceEntries}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          loading={loading}
          columns={[
            {
              field: "givenCurrency",
              header: "Given Currency",
              body: (rowData: AdvanceEntry) => rowData.givenCurrency || "-",
            },
            {
              field: "givenAmount",
              header: "Amount",
              body: (rowData: AdvanceEntry) =>
                formatAmount(rowData.givenAmount),
            },
            {
              field: "givenPaidThrough",
              header: "Paid Through",
              body: (rowData: AdvanceEntry) => rowData.givenPaidThrough || "-",
            },
            {
              field: "advanceGivenDate",
              header: "Advance Given Date",
              body: (rowData: AdvanceEntry) =>
                formatDateDisplay(rowData.advanceGivenDate),
            },
            {
              field: "returnedAmount",
              header: "Returned Currency",
              body: (rowData: AdvanceEntry) => rowData.returnedCurrency,
            },
            {
              field: "returnedAmount",
              header: "Returned Amount",
              body: (rowData: AdvanceEntry) =>
                formatAmount(rowData.returnedAmount),
            },
            {
              field: "returnedPaidThrough",
              header: "Return Through",
              body: (rowData: AdvanceEntry) =>
                rowData.returnedPaidThrough || "-",
            },
            {
              field: "advanceReturnDate",
              header: "Return Date",
              body: (rowData: AdvanceEntry) =>
                formatDateDisplay(rowData.advanceReturnDate),
            },
            {
              field: "spentAmount",
              header: "Spent Amount",
              body: (rowData: AdvanceEntry) =>
                formatNegativeAmount(rowData.spentAmount),
            },
            {
              field: "spentAmountINR",
              header: "Spent Amount (INR)",
              body: (rowData: AdvanceEntry) =>
                formatNegativeAmount(rowData.spentAmountINR),
            },
            {
              header: "Action",
              body: (rowData: AdvanceEntry) => (
                <ActionButtons
                  rowData={rowData}
                  onEdit={(row) => {
                    setEditingEntry(row);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDelete(rowData.id)}
                />
              ),
            },
          ]}
        />
        <div className="mt-3 fw-bold text-end p-column-title">
          Total Amount INR:{" "}
          {advanceEntries
            .reduce((sum, entry) => sum + (entry.spentAmountINR || 0), 0)
            .toFixed(2)}
        </div>
        <div className="datatable-striped-btn text-end mt-3 px-2 pb-3 pt-3">
          <Button className="me-2 custom-button" onClick={goToPrevious}>
            &lt; Back
          </Button>
          <Button
            className="me-2 custom-button"
            onClick={handleSaveAdvanceDataToObject}
          >
            Save
          </Button>
          <Button className="me-2 custom-button" onClick={goToNext}>
            Next &gt;
          </Button>
        </div>

        <CommonFormModal
          show={showModal}
          title={editingEntry ? "Edit Advance Entry" : "Add Advance Entry"}
          onClose={() => {
            setShowModal(false);
            setEditingEntry(null);
          }}
          onSave={() => {
            advanceDetailsRef.current?.save();
          }}
        >
          <AdvanceDetails
            ref={advanceDetailsRef}
            initialEntry={editingEntry}
            onSave={handleSave}
          />
        </CommonFormModal>
      </div>
    </div>
  );
};

export default AdvanceForm;
