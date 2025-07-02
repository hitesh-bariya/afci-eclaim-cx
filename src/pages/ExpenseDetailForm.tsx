import React, { useRef, useState, useEffect } from "react";
import { Row, Col, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import DatePicker from "react-datepicker";
import Select, { SingleValue } from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import baseFetch from "../services/api";
import { useAppDispatch, useAppSelector } from "../hooks/hook";
import {
  addExpenseAttachment,
  ExpenseItem,
  removeExpenseAttachment,
  updateExpenseDetailField,
} from "../hooks/claimFormSlice";
import { uploadAttachments } from "../utils/api";
import { FaCalendarAlt } from "react-icons/fa";
import {
  ECLAIM_CURRENCY_MASTER_API,
  ECLAIM_EXPENSE_CATEGORIES_API,
  ECLAIM_EXPENSE_CODES_API,
} from "../constants/constants";
import { FaTimes } from "react-icons/fa";
import AttachmentUploader from "../components/AttachmentUploader";
import EntertainmentFields from "../components/EntertainmentFields";

interface ExpenseCategory {
  id: number;
  expenseCategoryID: string;
  expenseCategory: string;
  [key: string]: any;
}

interface ExpenseCode {
  id: number;
  expenseCodeID: string;
  expenseCode: string;
  expenseCodeDisp: string;
  expenseName: string;
  gLCode: string;
  expenseCategory: string;
  [key: string]: any;
}

interface OptionType {
  value: string;
  label: string;
}

interface Props {
  editingExpense: ExpenseItem | null;
  formRef: React.RefObject<HTMLFormElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  validated: boolean;
}

const ExpenseDetailForm: React.FC<Props> = ({
  editingExpense,
  formRef,
  fileInputRef,
  validated,
}) => {
  const CloseIcon = FaTimes as unknown as React.FC<
    React.SVGProps<SVGSVGElement>
  >;
  const dispatch = useAppDispatch();
  const expenseData = useAppSelector((state) => state.claimForm.expenseData);
  const claimData = useAppSelector((state) => state.claimForm.claim);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseCategory[]>([]);
  const [expenseCodes, setExpenseCodes] = useState<ExpenseCode[]>([]);
  const [hasInitializedCode, setHasInitializedCode] = useState<boolean>(false);
  const [claimCategoryFilter, setClaimCategoryFilter] = useState<string>(
    claimData?.category || ""
  );
  const [currencyOptions, setCurrencyOptions] = useState<OptionType[]>([]);

  useEffect(() => {
    if (claimData?.category) {
      setClaimCategoryFilter(claimData.category);
    }
  }, [claimData?.category]);

  const expenseTypeOptions: OptionType[] = expenseTypes.map((type) => ({
    value: type.expenseCategory,
    label: type.expenseCategory,
  }));

  console.log("expenseTypeOptions>>>>", expenseTypeOptions);
  const expenseCodeOptions: OptionType[] = expenseCodes.map((code) => ({
    value: code.expenseCode,
    label: code.expenseName,
  }));

  const getGLCodeForExpenseCode = (codeValue: string) => {
    const code = expenseCodes.find((c) => c.expenseCode === codeValue);
    return code?.gLCode || "";
  };

  useEffect(() => {
    if (editingExpense) {
      dispatch(
        updateExpenseDetailField({
          field: "expenseDate",
          value: editingExpense.expenseDate,
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "currency",
          value: editingExpense.currency,
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "expenseAmount",
          value: editingExpense.expenseAmount,
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "remarks",
          value: editingExpense.remarks,
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "businessPurpose",
          value: editingExpense.businessPurpose || "",
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "attendees",
          value: editingExpense.attendees || "",
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "attachments",
          value: editingExpense.attachments || [],
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "expenseType",
          value: editingExpense.expenseType || "",
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "expenseCode",
          value: editingExpense.expenseCode || "",
        })
      );
      dispatch(
        updateExpenseDetailField({
          field: "glCode",
          value: editingExpense.glCode || "",
        })
      );
      setHasInitializedCode(false);
    }
  }, [editingExpense, dispatch]);

  useEffect(() => {
    const fetchExpenseTypes = async () => {
      try {
        const filterQuery = `?filter=${encodeURIComponent(`claimCategory eq '${claimCategoryFilter}'`)}`;
        const response = await baseFetch(
          `${ECLAIM_EXPENSE_CATEGORIES_API}${filterQuery}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch expense types");
        const data = await response.json();
        setExpenseTypes(data.items || []);
      } catch (error) {
        console.error("Error fetching expense types:", error);
      }
    };
    if (claimCategoryFilter) {
      fetchExpenseTypes();
    }
  }, [claimCategoryFilter]);

  useEffect(() => {
    const fetchExpenseCodes = async () => {
      if (!expenseData.expenseType) {
        setExpenseCodes([]);
        dispatch(updateExpenseDetailField({ field: "expenseCode", value: "" }));
        dispatch(updateExpenseDetailField({ field: "glCode", value: "" }));
        return;
      }
      try {
        const filter = encodeURIComponent(
          `expenseCategory eq '${expenseData.expenseType}'`
        );
        const response = await baseFetch(
          `${ECLAIM_EXPENSE_CODES_API}?filter=${filter}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok)
          throw new Error("Failed to fetch filtered expense codes");
        const data = await response.json();
        const fetchedCodes = data.items || [];
        setExpenseCodes(fetchedCodes);
        if (editingExpense && !hasInitializedCode) {
          const matchedCode = fetchedCodes.find(
            (code: ExpenseCode) =>
              code.expenseCode === editingExpense.expenseCode
          );
          if (matchedCode) {
            dispatch(
              updateExpenseDetailField({
                field: "expenseCode",
                value: matchedCode.expenseCode,
              })
            );
            dispatch(
              updateExpenseDetailField({
                field: "glCode",
                value: matchedCode.gLCode,
              })
            );
          }
          setHasInitializedCode(true);
        }
      } catch (error) {
        console.error("Error fetching filtered expense codes:", error);
      }
    };
    fetchExpenseCodes();
  }, [expenseData.expenseType, editingExpense, hasInitializedCode, dispatch]);

  const handleExpenseTypeChange = (selected: SingleValue<OptionType>) => {
    const val = selected?.value || "";
    dispatch(updateExpenseDetailField({ field: "expenseType", value: val }));
    dispatch(updateExpenseDetailField({ field: "expenseCode", value: "" }));
    dispatch(updateExpenseDetailField({ field: "glCode", value: "" }));
  };

  const handleExpenseCodeChange = (selected: SingleValue<OptionType>) => {
    const val = selected?.value || "";
    dispatch(updateExpenseDetailField({ field: "expenseCode", value: val }));
    const glCode = getGLCodeForExpenseCode(val);
    dispatch(updateExpenseDetailField({ field: "glCode", value: glCode }));
  };

  const handleCurrencyChange = (selected: SingleValue<OptionType>) => {
    const val = selected?.value || "";
    dispatch(updateExpenseDetailField({ field: "currency", value: val }));
  };

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const currencyData = claimData.currencyEntries || [];
        const currencyCodes = currencyData.map(
          (entry) => entry.destinationCurrency
        );
        if (currencyCodes.length === 0) return;
        const filterString = encodeURIComponent(
          `currencyCode in (${currencyCodes.map((code: string) => `'${code}'`).join(",")})`
        );
        const detailsResponse = await baseFetch(
          `${ECLAIM_CURRENCY_MASTER_API}/?filter=${filterString}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!detailsResponse.ok)
          throw new Error("Failed to fetch currency details");
        const detailsData = await detailsResponse.json();
        const finalOptions = detailsData.items.map((item: any) => ({
          value: item.currencyCode,
          label: item.currencyCode + " - " + item.currencyDescription,
        }));
        setCurrencyOptions(finalOptions);
      } catch (error) {
        console.error("Error fetching currencies:", error);
      }
    };
    fetchCurrencies();
  }, []);

  const fetchExchangeRate = (currencyCode: string): number | null => {
    try {
      const entry = claimData.currencyEntries.find(
        (item: any) => item.destinationCurrency === currencyCode
      );
      return entry?.exchangeRate ?? null;
    } catch (error) {
      console.error("Error extracting exchange rate:", error);
      return null;
    }
  };

  const handleFileUpload = (files: File[]) => {
    const fileMetas = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    dispatch(addExpenseAttachment(fileMetas));
  };

  const handleRemoveAttachment = (index: number) => {
    dispatch(removeExpenseAttachment(index));
  };

  useEffect(() => {
    const updateINRAmount = async () => {
      const { currency, expenseAmount } = expenseData;
      if (!currency || !expenseAmount) {
        dispatch(updateExpenseDetailField({ field: "inrAmount", value: "" }));
        return;
      }
      const amountNum = parseFloat(expenseAmount.toString());
      if (currency === "INR") {
        dispatch(
          updateExpenseDetailField({
            field: "inrAmount",
            value: amountNum.toFixed(2),
          })
        );
        return;
      }
      const exchangeRate = await fetchExchangeRate(currency);
      if (exchangeRate !== null) {
        const converted = amountNum * exchangeRate;
        dispatch(
          updateExpenseDetailField({
            field: "inrAmount",
            value: converted.toFixed(2),
          })
        );
      } else {
        dispatch(
          updateExpenseDetailField({ field: "inrAmount", value: "0.00" })
        );
      }
    };
    updateINRAmount();
  }, [expenseData.currency, expenseData.expenseAmount, dispatch]);
  return (
    <Form ref={formRef} noValidate validated={validated}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="expenseDate">
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Expense Date <sup className="text-danger">*</sup>
            </Form.Label>
            <div className="d-flex align-items-center position-relative">
              <DatePicker
                selected={
                  expenseData.expenseDate
                    ? new Date(expenseData.expenseDate)
                    : null
                }
                onChange={(date) =>
                  dispatch(
                    updateExpenseDetailField({
                      field: "expenseDate",
                      value: date ? date.toISOString().split("T")[0] : "",
                    })
                  )
                }
                className={`form-control ${validated && !expenseData.expenseDate ? "is-invalid" : ""}`}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select a date"
                maxDate={new Date()}
                id="expenseDate"
              />
              {FaCalendarAlt({
                size: 16,
                color: "#555",
                style: {
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  marginRight: "4px",
                },
              })}
            </div>
            {validated && !expenseData.expenseDate && (
              <div className="invalid-feedback d-block">
                This field is required.
              </div>
            )}
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="expenseType">
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Expense Type <sup className="text-danger">*</sup>
            </Form.Label>
            <Select
              inputId="expenseType"
              options={expenseTypeOptions}
              value={
                expenseData.expenseType
                  ? {
                      value: expenseData.expenseType,
                      label: `${expenseData.expenseType}`,
                    }
                  : null
              }
              onChange={handleExpenseTypeChange}
              placeholder="Please select Exp Type"
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  fontSize: "14px",
                  backgroundColor: "#f5f5fa",
                  borderColor:
                    validated && !expenseData.expenseType
                      ? "#dc3545"
                      : "#ced4da",
                  boxShadow: "none",
                }),
              }}
            />
            {validated && !expenseData.expenseType && (
              <div className="invalid-feedback d-block">
                This field is required.
              </div>
            )}
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="expenseCode">
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Expense Code <sup className="text-danger">*</sup>
            </Form.Label>
            <Select
              inputId="expenseCode"
              options={expenseCodeOptions}
              value={
                expenseData.expenseCode
                  ? expenseCodeOptions.find(
                      (option) => option.value === expenseData.expenseCode
                    ) || null
                  : null
              }
              onChange={handleExpenseCodeChange}
              placeholder="Please select Exp Code"
              isClearable
              isDisabled={!expenseData.expenseType}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  fontSize: "14px",
                  backgroundColor: "#f5f5fa",
                  borderColor:
                    validated && !expenseData.expenseCode
                      ? "#dc3545"
                      : "#ced4da",
                  boxShadow: "none",
                }),
              }}
            />
            {validated && !expenseData.expenseCode && (
              <div className="invalid-feedback d-block">
                This field is required.
              </div>
            )}
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="glCode">
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              GL Code <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="text"
              name="glCode"
              readOnly
              required
              value={expenseData.glCode}
              isInvalid={validated && !expenseData.glCode}
            />
            <Form.Control.Feedback type="invalid">
              This field is required.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="currency">
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Currency <sup className="text-danger">*</sup>
            </Form.Label>
            <Select
              inputId="currency"
              options={currencyOptions}
              value={
                expenseData.currency
                  ? { value: expenseData.currency, label: expenseData.currency }
                  : null
              }
              onChange={handleCurrencyChange}
              placeholder="Select Currency"
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  fontSize: "14px",
                  backgroundColor: "#f5f5fa",
                  borderColor:
                    validated && !expenseData.currency ? "#dc3545" : "#ced4da",
                  boxShadow: "none",
                }),
              }}
            />
            {validated && !expenseData.currency && (
              <div className="invalid-feedback d-block">
                This field is required.
              </div>
            )}
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="expenseAmount">
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Amount <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="number"
              name="expenseAmount"
              min={1}
              required
              value={expenseData.expenseAmount || ""}
              onChange={(e) =>
                dispatch(
                  updateExpenseDetailField({
                    field: "expenseAmount",
                    value: e.target.value,
                  })
                )
              }
              isInvalid={
                validated &&
                (!expenseData.expenseAmount || expenseData.expenseAmount < 1)
              }
            />
            <Form.Control.Feedback type="invalid">
              {!expenseData.expenseAmount
                ? "This field is required."
                : "Please enter a value greater than or equal to 1."}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <AttachmentUploader
            ref={fileInputRef}
            attachments={expenseData.attachments}
            onUpload={handleFileUpload}
            onRemove={handleRemoveAttachment}
            label="Upload File"
            accept=".pdf"
          />
        </Col>

        <Col md={6}>
          <Form.Group controlId="remarks">
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Vendor Name/Expense Description{" "}
              <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="text"
              name="remarks"
              maxLength={32}
              required
              value={expenseData.remarks}
              onChange={(e) =>
                dispatch(
                  updateExpenseDetailField({
                    field: "remarks",
                    value: e.target.value,
                  })
                )
              }
              isInvalid={validated && !expenseData.remarks}
            />
            <small className="text-danger">(Maximum 32 characters)</small>
            <Form.Control.Feedback type="invalid">
              This field is required.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      {expenseData.expenseType === "Entertainment" && (
        <EntertainmentFields
          businessPurpose={expenseData.businessPurpose}
          attendees={expenseData.attendees}
          validated={validated}
        />
      )}
    </Form>
  );
};

export default ExpenseDetailForm;
