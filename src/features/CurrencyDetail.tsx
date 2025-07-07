import React, { useState, useEffect, useRef } from "react";
import { Button, Form, Row, Col, Modal } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import {
  ECLAIM_CURRENCY_API,
  ECLAIM_CURRENCY_MASTER_API,
  ECLAIM_QA_EXCHANGE_MASTERS_OBJECT_ENDPOINT,
} from "../constants/constants";
import CurrencyDetailForm from "../pages/CurencyDetailForm";
import CommonDataTable from "../components/CommonDataTable";
import ActionButtons from "../components/ActionButtons";
import { useAppSelector, useAppDispatch } from "../hooks/hook";
import {
  addCurrencyEntry,
  CurrencyItem,
  removeCurrencyAttachment,
  removeCurrencyEntry,
  resetCurrancyForm,
  updateCurrancyDetailField,
  updateCurrencyEntry,
} from "../hooks/claimFormSlice";
import CommonFormModal from "../components/CommonFormModal";
import baseFetch from "../services/api";
import AttachmentViewer from "../components/AttachmentViewer";
import { uploadAttachments } from "../utils/api";

interface ExpenseDetailsProps {
  goToNext: () => void;
  goToPrevious: () => void;
}

const CurrencyDetail: React.FC<ExpenseDetailsProps> = ({
  goToNext,
  goToPrevious,
}) => {
  const [multiCurrency, setMultiCurrency] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currencyData, setCurrencyData] = useState<CurrencyItem[]>([]);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyItem | null>(
    null
  );
  const [validated, setValidated] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localCurrency, setLocalCurrency] = useState("");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const dispatch = useAppDispatch();
  const claimForm = useAppSelector((state) => state.claimForm);
  const countryCode = claimForm?.employee?.location;
  const { employee: employeeData, claim: claimData } = claimForm;
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(
    null
  );
  const [saveResultModal, setSaveResultModal] = useState(false);

  const fetchLocalCurrency = async () => {
    if (!countryCode) return;
    try {
      const response = await baseFetch(
        `${ECLAIM_CURRENCY_MASTER_API}/?filter=location eq '${countryCode}' or currencyCodeDescription eq '${countryCode}'`,
        { headers: { accept: "application/json" } }
      );
      const data = await response.json();
      const currency = data?.items?.[0];
      const currencyCode = currency?.currencyCode || "";
      const currencyLabel = currency
        ? `${currency.currencyCode} - ${currency.currencyDescription}`
        : "";

      setLocalCurrency(currencyCode);
      setCurrencyLabel(currencyLabel);
      const noCurrencyEntries = claimData.currencyEntries.length === 0;
      if (currencyCode && noCurrencyEntries) {
        const rate = await handleRejectApplyQADRate(currency.currencyCode);
        const newCurrency: CurrencyItem = {
          id: editingCurrency?.id || Date.now(),
          destinationCurrency: currencyCode,
          exchangeRate: rate || 0,
          localCurrency: currencyCode,
          eclaimDetailId: claimForm.claim.eclaimDetailId || "",
          attachments: claimForm.currencyData.attachments || [],
        };
        dispatch(addCurrencyEntry(newCurrency));
      }
    } catch (error) {
      console.error("Failed to fetch currency:", error);
      setLocalCurrency("");
      setCurrencyLabel("");
    }
  };
  useEffect(() => {
    fetchLocalCurrency();
  }, [claimForm?.employee?.location]);

  const handleRejectApplyQADRate = async (
    currencyCode: string
  ): Promise<number> => {
    try {
      if (!currencyCode) {
        console.warn("Destination currency is not selected.");
        return 0;
      }
      const response = await baseFetch(
        `${ECLAIM_QA_EXCHANGE_MASTERS_OBJECT_ENDPOINT}/?filter=currency eq '${currencyCode}'&page=1&pageSize=1&sort=monthAndYear:desc`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      const exchangeRate = data.items?.[0]?.exchangeRate ?? 0;
      dispatch(
        updateCurrancyDetailField({
          field: "exchangeRate",
          value: exchangeRate,
        })
      );
      return exchangeRate;
    } catch (error) {
      dispatch(updateCurrancyDetailField({ field: "exchangeRate", value: "" }));
      return 0;
    }
  };

  useEffect(() => {
    if (
      claimForm.claim.currencyEntries &&
      Array.isArray(claimForm.claim.currencyEntries)
    ) {
      setCurrencyData(claimForm.claim.currencyEntries);
    }
  }, [claimForm.claim.currencyEntries]);

  const handleMultiCurrencyToggle = () => {
    setMultiCurrency((prev) => !prev);
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
          "CURRENCY_DETAIL"
        );
        fileMetas = files.map((file, idx) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          id: uploadedAttachmentIds[idx]?.toString(),
        }));
        dispatch({
          type: "claimForm/updateCurrancyDetailField",
          payload: { field: "attachments", value: fileMetas },
        });
      } catch (uploadError) {
        console.error("Error uploading attachments:", uploadError);
        throw new Error("Failed to upload attachments");
      }
    }
    if (formRef.current && !formRef.current.checkValidity()) {
      setValidated(true);
      return;
    }

    if (exchangeRateError) {
      return;
    }
    try {
      const newCurrency: CurrencyItem = {
        id: editingCurrency ? editingCurrency.id : Date.now(),
        destinationCurrency: claimForm.currencyData.destinationCurrency || "",
        exchangeRate: claimForm.currencyData.exchangeRate || 0,
        localCurrency: claimForm.currencyData.localCurrency,
        eclaimDetailId: claimForm.claim.eclaimDetailId,
        attachments:
          fileMetas.length > 0
            ? fileMetas
            : claimForm.currencyData.attachments || [],
      };
      if (editingCurrency) {
        dispatch(updateCurrencyEntry(newCurrency));
        setCurrencyData((prev) =>
          prev.map((item) =>
            item.id === editingCurrency.id ? newCurrency : item
          )
        );
      } else {
        dispatch(addCurrencyEntry(newCurrency));
        setCurrencyData((prev) => [...prev, newCurrency]);
      }
      setShowModal(false);
      setEditingCurrency(null);
      setValidated(false);
      formRef.current?.reset();
      dispatch(resetCurrancyForm());
    } catch (error) {
      console.error("Error saving currency data", error);
      alert("Failed to save currency data.");
    }
  };

  const handleSaveCurrencyDataToObject = async () => {
    const currencyData = claimForm.claim.currencyEntries
      .filter((entry) => entry.localCurrency !== entry.destinationCurrency)
      .map((entry) => {
        return {
          destinationCurrency: entry.destinationCurrency || "",
          localCurrency: entry.localCurrency || "",
          eclaimDetailId: claimForm.claim.eclaimDetailId || "",
          exchangeRateInitial: entry.exchangeRate || 0,
          exchangeRateFinal: entry.exchangeRate || 0,
          attachmentName: "",
          attachmentURL: "",
          currencyDetailsAttachmentsRelation: (entry.attachments || []).map(
            (att) => {
              return {
                eclaimAttachment: att.id,
                fileName: att.name || "",
                fileSize: att.size || "",
                fileType: att.type || "",
              };
            }
          ),
        };
      });

    for (const data of currencyData) {
      try {
        const response = await baseFetch(ECLAIM_CURRENCY_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          alert(`Failed to save entry: ${data.destinationCurrency}`);
        }
      } catch (error) {
        console.error(`Error saving ${data.destinationCurrency}:`, error);
      }
    }
    setSaveResultModal(true);
  };

  const handleDelete = (id?: number): void => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this currency entry?"))
      return;
    dispatch(removeCurrencyEntry(id));
    setCurrencyData((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="datatable-striped px-3 mb-3 pt-3 pb-3">
      <div className="bg-white rounded-bottom-2 datatable-striped-sub shadow-sm">
        <div className="bg-color-gradient px-3 py-1 rounded-top-4">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="text-white mt-3 mb-3">Currency Details</h6>
            {multiCurrency && (
              <Button
                className="datatable-striped-add-btn"
                variant="light"
                onClick={() => {
                  setEditingCurrency(null);
                  setShowModal(true);
                  setValidated(false);
                  formRef.current?.reset();
                  dispatch(resetCurrancyForm());
                }}
              >
                Add New {FaPlus({ size: 16, style: { marginLeft: "4px" } })}
              </Button>
            )}
          </div>
        </div>

        <Form
          className="px-3 py-3"
          noValidate
          validated={validated}
          ref={formRef}
        >
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="localCurrency">
                <Form.Label className="fw-bold" style={{ fontSize: "13px" }}>
                  Local Currency
                </Form.Label>
                <Form.Control
                  type="text"
                  readOnly
                  value={currencyLabel}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="multiCurrencySwitch">
                <Form.Label className="fw-bold" style={{ fontSize: "13px" }}>
                  Would you like to add multiple currencies?
                </Form.Label>
                <Form.Check
                  type="switch"
                  checked={multiCurrency}
                  onChange={handleMultiCurrencyToggle}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>

        <CommonDataTable
          data={currencyData.filter(
            (item) => item.localCurrency !== localCurrency
          )}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          columns={[
            { field: "destinationCurrency", header: "Currency" },
            {
              field: "exchangeRate",
              header: "Exchange Rate",
              body: (rowData: CurrencyItem) => {
                const rate = rowData.exchangeRate;
                const rateStr = rate.toString();
                const formattedRate = rateStr.includes(".")
                  ? Number(rate).toFixed(5)
                  : Number(rate).toFixed(4);
                return <span>{formattedRate}</span>;
              },
            },
            {
              header: "Attachment",
              body: (rowData: CurrencyItem) => (
                <AttachmentViewer
                  attachments={rowData.attachments}
                  onRemove={(index) =>
                    dispatch(removeCurrencyAttachment(index))
                  }
                />
              ),
            },
            {
              header: "Action",
              body: (rowData: CurrencyItem) => (
                <ActionButtons
                  rowData={rowData}
                  onEdit={(row) => {
                    setEditingCurrency(row);
                    setShowModal(true);
                  }}
                  onDelete={handleDelete}
                />
              ),
            },
          ]}
        />
        <div className="text-end datatable-striped-btn mt-3 px-2 pb-4 pt-3">
          <Button className="me-2 custom-button" onClick={goToPrevious}>
            &lt; Back
          </Button>
          <Button
            className="me-2 custom-button"
            onClick={handleSaveCurrencyDataToObject}
          >
            Save
          </Button>
          <Button className="me-2 custom-button" onClick={goToNext}>
            Next &gt;
          </Button>
        </div>

        <CommonFormModal
          show={showModal}
          title="Currency Details"
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        >
          <CurrencyDetailForm
            editingCurrency={editingCurrency}
            formRef={formRef}
            fileInputRef={fileInputRef}
            validated={validated}
            exchangeRateError={exchangeRateError}
            setExchangeRateError={setExchangeRateError}
          />
        </CommonFormModal>

        <CommonFormModal
          show={saveResultModal}
          title="Alert"
          cancelButtonLabel="Close"
          onClose={() => setSaveResultModal(false)}
        >
          <div className="custom-model-success" role="alert">
            <div className="fs-5">THANK YOU!</div>
            <div>Your Currency Details successfully saved!</div>
          </div>
        </CommonFormModal>
      </div>
    </div>
  );
};

export default CurrencyDetail;
