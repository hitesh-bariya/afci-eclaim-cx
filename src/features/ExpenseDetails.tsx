import React, { useState, useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import ExpenseDetailForm from "../pages/ExpenseDetailForm";
import { FaPlus } from "react-icons/fa";
import { useAppSelector } from "../hooks/hook";
import { useDispatch } from "react-redux";
import {
  addExpenseEntry,
  ExpenseItem,
  removeExpenseAttachment,
  removeExpenseEntry,
  resetExpenseForm,
  updateExpenseEntry,
} from "../hooks/claimFormSlice";
import CommonDataTable from "../components/CommonDataTable";
import ActionButtons from "../components/ActionButtons";
import CommonFormModal from "../components/CommonFormModal";
import baseFetch from "../services/api";
import AttachmentViewer from "../components/AttachmentViewer";
import { ECLAIM_EXPENSE_ITEMS } from "../constants/constants";
import { uploadAttachments } from "../utils/api";

interface ExpenseDetailsProps {
  goToNext: () => void;
  goToPrevious: () => void;
}
const ExpenseDetails: React.FC<ExpenseDetailsProps> = ({
  goToNext,
  goToPrevious,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expenseData, setExpenseData] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(
    null
  );
  const [validated, setValidated] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const claimForm = useAppSelector((state) => state.claimForm);
  const formData = useAppSelector((state) => state.claimForm.expenseData);
  const claimData = useAppSelector((state) => state.claimForm.claim);
  const [saveResultModal, setSaveResultModal] = useState(false);
  const [saveResultMessageModal, setSaveResultMessageModal] = useState("");
  const [saveStatus, setSaveStatus] = useState<"success" | "danger">("success");

  const dispatch = useDispatch();
  useEffect(() => {
    if (claimData.expenseEntries && Array.isArray(claimData.expenseEntries)) {
      const sortedExpenses = [...claimData.expenseEntries].sort(
        (a, b) =>
          new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime()
      );
      setExpenseData(sortedExpenses);
      setLoading(false);
    }
  }, [claimData.expenseEntries]);

  const handleDelete = (id?: number): void => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    dispatch(removeExpenseEntry(id));
    setExpenseData((prevData) => prevData.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    const fileInput = fileInputRef.current;
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    let uploadedAttachmentIds: number[] = [];
    let fileMetas: any[] = [];
    if (files.length > 0) {
      try {
        uploadedAttachmentIds = await uploadAttachments(
          files,
          "EXPENSE_DETAILS"
        );
        fileMetas = files.map((file, idx) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          id: uploadedAttachmentIds[idx]?.toString(),
        }));
        dispatch({
          type: "claimForm/updateExpenseDetailField",
          payload: { field: "attachments", value: fileMetas },
        });
      } catch (uploadError) {
        console.error("Error uploading attachments:", uploadError);
        throw new Error("Failed to upload attachments");
      }
    }

    const isDateValid = !!formData.expenseDate;
    if ((formRef.current && !formRef.current.checkValidity()) || !isDateValid) {
      setValidated(true);
      return;
    }
    const newExpense: ExpenseItem = {
      id: editingExpense ? editingExpense.id : Date.now(),
      expenseType: formData.expenseType,
      expenseCode: formData.expenseCode,
      glCode: formData.glCode,
      expenseAmount: formData.expenseAmount,
      expenseDate: formData.expenseDate,
      attachments:
        fileMetas.length > 0
          ? fileMetas
          : claimForm.currencyData.attachments || [],
      remarks: formData.remarks,
      currency: formData.currency,
      businessPurpose: formData.businessPurpose,
      attendees: formData.attendees,
      inrAmount: formData.inrAmount,
      eclaimDetailId: claimForm.claim.eclaimDetailId,
    };
    if (editingExpense) {
      dispatch(updateExpenseEntry(newExpense));
      setExpenseData((prev) =>
        prev.map((item) => (item.id === editingExpense.id ? newExpense : item))
      );
    } else {
      dispatch(addExpenseEntry(newExpense));
      setExpenseData((prev) => [...prev, newExpense]);
    }
    setShowModal(false);
    setEditingExpense(null);
    setValidated(false);
    formRef.current?.reset();
    dispatch(resetExpenseForm());
  };

  const handleSaveExpenseDataToObject = async () => {
    const expenseDataArray = claimData.expenseEntries.map((entry) => ({
      externalReferenceCode: String(entry.id),
      taxonomyCategoryIds: [],
      amount: entry.inrAmount || 0,
      attachmentName: "",
      attachmentURL: "",
      attendees: entry.attendees || "",
      businessPurpose: entry.businessPurpose || "",
      currency: entry.currency || "",
      exchangeRate: 0,
      expenseAmount: entry.expenseAmount || 0,
      expenseCode: entry.expenseCode || "",
      expenseDate: entry.expenseDate,
      expenseType: entry.expenseType,
      gLCode: entry.glCode || "",
      vendor: "",
      expenseDetailsAttachmentsRelation: (entry.attachments || []).map(
        (att) => {
          return {
            eclaimAttachment: att.id,
            fileName: att.name || "",
            fileSize: att.size || "",
            fileType: att.type || "",
          };
        }
      ),
    }));
    for (const data of expenseDataArray) {
      try {
        const response = await baseFetch(ECLAIM_EXPENSE_ITEMS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          setSaveStatus("danger");
          setSaveResultModal(true);
          setSaveResultMessageModal(
            `Failed to save expense ID: ${data.externalReferenceCode}`
          );
        } else {
          setSaveStatus("success");
          setSaveResultModal(true);
          setSaveResultMessageModal("Your Expense Details successfully saved!");
        }
      } catch (error) {
        console.error(
          `Error saving expense ID ${data.externalReferenceCode}:`,
          error
        );
      }
    }
  };

  const showInfoModal = async () => {
    setSaveStatus("danger");
    setSaveResultModal(true);
    setSaveResultMessageModal("Please add at least One Expense Item");
  };

  const showAttendeesColumn =
    claimData?.category === "Travel and Entertainment" &&
    expenseData.some((item) => item.expenseType === "Entertainment");
  return (
    <div className="datatable-striped px-3 mb-3 pt-3 pb-3">
      <div className="bg-white rounded-bottom-2 shadow-sm datatable-striped-sub pb-3">
        <div className="bg-color-gradient px-3 py-1 rounded-top-4">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="text-white mt-3 mb-3">Expense Details</h6>
            <Button
              className="datatable-striped-add-btn"
              variant="light"
              onClick={() => {
                setEditingExpense(null);
                setShowModal(true);
                setValidated(false);
                formRef.current?.reset();
                dispatch(resetExpenseForm());
              }}
            >
              Add New {FaPlus({ size: 16, style: { marginLeft: "4px" } })}
            </Button>
          </div>
        </div>

        <CommonDataTable
          data={expenseData}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          loading={loading}
          columns={[
            { field: "expenseType", header: "Claim Type" },
            { field: "expenseCode", header: "Expense Code" },
            { field: "glCode", header: "GL Code" },
            {
              header: "Expense Amount",
              body: (rowData: ExpenseItem) => {
                const amount = Number(rowData.expenseAmount);
                const currency = rowData.currency ?? "";
                return `${currency} ${isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
              },
            },
            { field: "expenseDate", header: "Expense Date" },
            {
              header: "Attachment",
              body: (rowData: ExpenseItem) => (
                <AttachmentViewer
                  attachments={rowData.attachments}
                  onRemove={(index) => dispatch(removeExpenseAttachment(index))}
                />
              ),
            },
            ...(showAttendeesColumn
              ? [
                  {
                    header: "Attendees",
                    body: (rowData: ExpenseItem) => rowData.attendees || "-",
                  },
                ]
              : []),
            { field: "remarks", header: "Remarks" },
            {
              header: "Action",
              body: (rowData: ExpenseItem) => (
                <ActionButtons
                  rowData={rowData}
                  onEdit={(row) => {
                    setEditingExpense(row);
                    setShowModal(true);
                  }}
                  onDelete={handleDelete}
                />
              ),
            },
          ]}
        />

        <div className="datatable-striped-btn text-end mt-3 px-2 pb-3 pt-3">
          <Button className="me-2 custom-button" onClick={goToPrevious}>
            &lt; Back
          </Button>
          <Button
            className="me-2 custom-button"
            onClick={handleSaveExpenseDataToObject}
          >
            Save
          </Button>
          <Button
            className="me-2 custom-button"
            onClick={() => {
              if (expenseData.length === 0) {
                showInfoModal();
              } else {
                goToNext();
              }
            }}
          >
            Next &gt;
          </Button>
        </div>

        <CommonFormModal
          show={showModal}
          title="Expense Details"
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        >
          <ExpenseDetailForm
            editingExpense={editingExpense}
            formRef={formRef}
            fileInputRef={fileInputRef}
            validated={validated}
          />
        </CommonFormModal>

        <CommonFormModal
          show={saveResultModal}
          title="Alert"
          cancelButtonLabel="Close"
          onClose={() => setSaveResultModal(false)}
        >
          <div className={`custom-model-${saveStatus}`} role="alert">
            <div className="fs-5">
              {saveStatus === "success" ? "THANK YOU!" : ""}
            </div>
            <div>{saveResultMessageModal}</div>
          </div>
        </CommonFormModal>
      </div>
    </div>
  );
};

export default ExpenseDetails;
