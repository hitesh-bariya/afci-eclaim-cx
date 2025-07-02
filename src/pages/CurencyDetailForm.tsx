import React, { useRef, useEffect, useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import baseFetch from "../services/api";
import Select from "react-select";
import { useAppDispatch, useAppSelector } from "../hooks/hook";
import {
  addCurrencyAttachment,
  CurrencyItem,
  removeCurrencyAttachment,
  updateCurrancyDetailField,
} from "../hooks/claimFormSlice";
import AttachmentUploader from "../components/AttachmentUploader";
import {
  ECLAIM_CURRENCY_MASTER_API,
  ECLAIM_QA_EXCHANGE_MASTERS_OBJECT_ENDPOINT,
} from "../constants/constants";

interface CurrencyMaster {
  currencyCode: string;
  currencyDescription: string;
}

interface Props {
  editingCurrency: CurrencyItem | null;
  formRef: React.RefObject<HTMLFormElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  validated: boolean;
  exchangeRateError: string | null;
  setExchangeRateError: (error: string | null) => void;
}

const CurrencyDetailForm: React.FC<Props> = ({
  editingCurrency,
  fileInputRef,
  formRef,
  validated,
  exchangeRateError,
  setExchangeRateError,
}) => {
  const [isFinance, setIsFinance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currencyMasters, setCurrencyMasters] = useState<CurrencyMaster[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const dispatch = useAppDispatch();
  const [localCurrency, setLocalCurrency] = useState("");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const claimForm = useAppSelector((state) => state.claimForm);
  const { currencyData: currencyData, claim: claimData } = claimForm;

  useEffect(() => {
    if (editingCurrency) {
      dispatch(
        updateCurrancyDetailField({
          field: "exchangeRate",
          value: editingCurrency.exchangeRate,
        })
      );
      dispatch(
        updateCurrancyDetailField({
          field: "destinationCurrency",
          value: editingCurrency.destinationCurrency,
        })
      );
      dispatch(
        updateCurrancyDetailField({
          field: "localCurrency",
          value: editingCurrency.localCurrency || "",
        })
      );
      dispatch(
        updateCurrancyDetailField({
          field: "attachments",
          value: editingCurrency.attachments || [],
        })
      );
    }
  }, [editingCurrency, dispatch]);

  const fetchLocalCurrency = async () => {
    try {
      const countryCode = claimForm?.employee?.location;
      if (!countryCode) {
        setLocalCurrency("THB");
        setCurrencyLabel("THB - Thai Baht");
        return;
      }
      const response = await baseFetch(
        `${ECLAIM_CURRENCY_MASTER_API}/?filter=location eq '${countryCode}'`,
        { headers: { accept: "application/json" } }
      );
      const data = await response.json();
      const items = data.items;
      let currencyCode = "";
      let currencyLabel = "";
      if (items && items.length > 0) {
        const currency = items[0];
        currencyCode = currency.currencyCode;
        currencyLabel = `${currency.currencyCode} - ${currency.currencyDescription}`;
      }
      setLocalCurrency(currencyCode);
      setCurrencyLabel(currencyLabel);
    } catch (error) {
      console.error("Failed to fetch currency:", error);
      setLocalCurrency("");
      setCurrencyLabel("");
    }
  };

  useEffect(() => {
    fetchLocalCurrency();
  }, [claimForm?.employee?.location]);

  useEffect(() => {
    async function fetchUserRoles() {
      try {
        const userId = (window as any)?.themeDisplay?.getUserId();
        const response = await baseFetch(
          `/o/headless-admin-user/v1.0/user-accounts/${userId}`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await response.json();
        const roles = data.roleBriefs || [];
        const financeRoleExists = roles.some((role: { name: string }) =>
          role.name.toLowerCase().includes("finance")
        );
        setIsFinance(financeRoleExists);
      } catch (error) {
        console.error("Error fetching user roles:", error);
        setIsFinance(false);
      } finally {
        setLoading(false);
      }
    }
    fetchUserRoles();
  }, []);

  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const response = await baseFetch(`${ECLAIM_CURRENCY_MASTER_API}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        const currencyList = (data.items || []).map((item: any) => ({
          currencyCode: item.currencyCode,
          currencyDescription:
            item.currencyCode + " - " + item.currencyDescription,
        }));
        setCurrencyMasters(currencyList);
      } catch (error) {
        console.error("Error fetching currencies:", error);
      } finally {
        setLoadingCurrencies(false);
      }
    }
    fetchCurrencies();
  }, []);

  const currencyOptions = currencyMasters.map((currency) => ({
    value: currency.currencyCode,
    label: `${currency.currencyDescription}`,
  }));

  const handleRejectApplyQADRate = async () => {
    try {
      const destinationCurrency = currencyData.destinationCurrency || "";
      if (!destinationCurrency) {
        console.warn("Destination currency is not selected.");
        return;
      }
      const response = await baseFetch(
        `${ECLAIM_QA_EXCHANGE_MASTERS_OBJECT_ENDPOINT}/?filter=currency eq '${destinationCurrency}'&page=1&pageSize=1&sort=monthAndYear:desc`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      const exchangeRate = data.items?.[0]?.exchangeRate ?? "";
      dispatch(
        updateCurrancyDetailField({
          field: "exchangeRate",
          value: exchangeRate,
        })
      );
    } catch (error) {
      dispatch(updateCurrancyDetailField({ field: "exchangeRate", value: "" }));
    }
  };

  const handleFileUpload = (files: File[]) => {
    const fileMetas = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      //url: URL.createObjectURL(file),
    }));

    dispatch(addCurrencyAttachment(fileMetas));
  };

  const handleRemoveAttachment = (index: number) => {
    dispatch(removeCurrencyAttachment(index));
  };

  return (
    <Form noValidate validated={validated} ref={formRef}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="localCurrency">
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Local Currency <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="text"
              name="localCurrency"
              value={currencyLabel}
              readOnly
              required
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="destinationCurrency">
            <Form.Label className="fw-bold mb-1">
              Destination Currency <sup className="text-danger">*</sup>
            </Form.Label>
            <Select
              placeholder={
                loadingCurrencies
                  ? "Loading currencies..."
                  : "Please Select Destination Currency"
              }
              isSearchable
              className={`basic-single ${validated ? "invalid" : "valid"}`}
              classNamePrefix="select"
              isDisabled={loadingCurrencies}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "38px",
                  height: "38px",
                  fontSize: "14px",
                  backgroundColor: "#f5f5fa",
                  borderColor: "#ced4da",
                  boxShadow: "none",
                }),
                menu: (base) => ({
                  ...base,
                  minHeight: "50px",
                  maxHeight: "400px",
                  zIndex: 9999,
                }),
                menuList: (base) => ({
                  ...base,
                  maxHeight: "400px",
                  overflowY: "auto",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={document.body}
              options={currencyOptions.filter(
                (option) => option.value !== localCurrency
              )}
              value={
                currencyData.destinationCurrency
                  ? {
                      value: currencyData.destinationCurrency,
                      label:
                        currencyMasters.find(
                          (c) =>
                            c.currencyCode === currencyData.destinationCurrency
                        )?.currencyDescription || "",
                    }
                  : null
              }
              onChange={(selectedOption) => {
                const selectedValue = selectedOption
                  ? selectedOption.value
                  : "";
                dispatch(
                  updateCurrancyDetailField({
                    field: "destinationCurrency",
                    value: selectedValue,
                  })
                );
                if (editingCurrency) {
                  dispatch(
                    updateCurrancyDetailField({
                      field: "exchangeRate",
                      value: editingCurrency.exchangeRate,
                    })
                  );
                }
              }}
            />
            {validated && !currencyData.destinationCurrency && (
              <div className="invalid-feedback d-block">
                This field is required.
              </div>
            )}
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="exchangeRate">
            <Form.Label className="fw-bold mb-1">
              Currency Exchange Rate <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="number"
              name="exchangeRate"
              value={currencyData.exchangeRate || ""}
              placeholder="1 Local Currency to X Destination Currency"
              required
              step="any"
              onChange={(e) => {
                const value = e.target.value;
                const rate = parseFloat(value);
                if (value && isNaN(rate)) {
                  setExchangeRateError("Please enter a valid number.");
                } else {
                  const decimalPlacesMatch = value.match(/\.(\d*)$/);
                  if (decimalPlacesMatch && decimalPlacesMatch[1].length > 5) {
                    setExchangeRateError(
                      "Please enter a valid number. Maximum only 5 decimal points are allowed."
                    );
                  } else {
                    setExchangeRateError(null);
                  }
                }
                dispatch(
                  updateCurrancyDetailField({
                    field: "exchangeRate",
                    value,
                  })
                );
              }}
              isInvalid={!!exchangeRateError}
            />
            <Form.Control.Feedback type="invalid">
              {currencyData.exchangeRate
                ? exchangeRateError
                : "This field is required."}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <AttachmentUploader
            ref={fileInputRef}
            attachments={currencyData.attachments}
            onUpload={handleFileUpload}
            onRemove={handleRemoveAttachment}
            label="Upload Exchange Receipt"
            accept=".pdf"
            noteMassage="(Company Exchange Rate will apply if no receipt) Note: Only PDF allowed"
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={12} className="d-flex justify-content-center">
          {!loading && isFinance && (
            <Button
              className="me-2 custom-button"
              type="button"
              onClick={handleRejectApplyQADRate}
            >
              Reject & Apply QAD Rate
            </Button>
          )}
        </Col>
      </Row>
    </Form>
  );
};

export default CurrencyDetailForm;
