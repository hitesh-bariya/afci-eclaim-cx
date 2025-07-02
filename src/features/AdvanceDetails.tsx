import { Form, Row, Col } from "react-bootstrap";
import { useEffect, useImperativeHandle, useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import baseFetch from "../services/api";
import {
  ECLAIM_ADVANCE_TYPES_OBJECT_ENDPOINT,
  ECLAIM_QA_EXCHANGE_MASTERS_OBJECT_ENDPOINT,
} from "../constants/constants";
import { FaCalendarAlt } from "react-icons/fa";
//import "../css/AdvanceDetails.css";
import { AdvanceEntry } from "../types/AdvanceEntry";

interface AdvanceDetailsProps {
  initialEntry?: AdvanceEntry | null;
  onSave?: (entry: AdvanceEntry) => void;
}

interface PaymentOption {
  description: string;
  type: string;
}

interface CurrencyOption {
  exchangeRate: number;
  monthAndYear: Date;
  currency: string;
  creationDate: Date;
}

const AdvanceDetails = forwardRef(
  ({ initialEntry, onSave }: AdvanceDetailsProps, ref) => {
    const [currentEntry, setCurrentEntry] = useState<Partial<AdvanceEntry>>(
      initialEntry ?? {
        givenCurrency: "",
        givenPaidThrough: "",
        advanceGivenDate: "",
        returnedCurrency: "",
        returnedPaidThrough: "",
        advanceReturnDate: "",
        givenAmount: 0,
        returnedAmount: 0,
        spentAmount: 0,
        spentAmountINR: 0,
      }
    );

    const [currency, setCurrency] = useState<CurrencyOption[]>([]);
    const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const currencyResponse = await baseFetch(
            ECLAIM_QA_EXCHANGE_MASTERS_OBJECT_ENDPOINT,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const currencyData = await currencyResponse.json();
          setCurrency(currencyData.items);

          const paymentResponse = await baseFetch(
            ECLAIM_ADVANCE_TYPES_OBJECT_ENDPOINT,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const paymentData = await paymentResponse.json();
          setPaymentOptions(paymentData.items);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, []);

    useImperativeHandle(ref, () => ({
      save: () => {
        const isAdvanceComplete =
          currentEntry.givenCurrency?.trim() &&
          currentEntry.givenPaidThrough?.trim() &&
          currentEntry.advanceGivenDate &&
          currentEntry.givenAmount !== undefined;

        const isReturnComplete =
          currentEntry.returnedCurrency?.trim() &&
          currentEntry.returnedPaidThrough?.trim() &&
          currentEntry.advanceReturnDate &&
          currentEntry.returnedAmount !== undefined;

        if (!isAdvanceComplete && !isReturnComplete) {
          alert("Please fill either Advance or Return section completely.");
          return;
        }

        // Calculate spent amount in original currency
        const spentAmount =
          Number(currentEntry.givenAmount || 0) -
          Number(currentEntry.returnedAmount || 0);

        // Determine which currency's exchange rate to use
        let exchangeRate = 1;
        if (isAdvanceComplete) {
          exchangeRate =
            currency.find((c) => c.currency === currentEntry.givenCurrency)
              ?.exchangeRate || 1;
        } else if (isReturnComplete) {
          exchangeRate =
            currency.find((c) => c.currency === currentEntry.returnedCurrency)
              ?.exchangeRate || 1;
        }

        const spentAmountINR = spentAmount * exchangeRate;

        const formatDate = (date: Date | string | null | undefined): string => {
          if (!date) return "";
          if (typeof date === "string") return new Date(date).toISOString();
          return date.toISOString();
        };

        const completeEntry: AdvanceEntry = {
          id: currentEntry.id ?? Date.now(),
          givenCurrency: currentEntry.givenCurrency || "",
          givenAmount: Number(currentEntry.givenAmount) || 0,
          givenPaidThrough: currentEntry.givenPaidThrough || "",
          advanceGivenDate: formatDate(currentEntry.advanceGivenDate),
          returnedCurrency: currentEntry.returnedCurrency || "",
          returnedAmount: Number(currentEntry.returnedAmount) || 0,
          returnedPaidThrough: currentEntry.returnedPaidThrough || "",
          advanceReturnDate: formatDate(currentEntry.advanceReturnDate),
          spentAmount,
          spentAmountINR,
        };

        onSave?.(completeEntry);
      },
    }));

    useEffect(() => {
      setCurrentEntry((prev) => ({
        ...prev,
        ...initialEntry,
      }));
    }, [initialEntry]);

    const handleInputChange = (
      field: keyof AdvanceEntry,
      value: string | number | Date
    ) => {
      setCurrentEntry((prev) => ({ ...prev, [field]: value }));
    };

    const CustomInput = ({
      value,
      onClick,
    }: {
      value?: string;
      onClick?: () => void;
    }) => (
      <div className="d-flex align-items-center position-relative">
        <Form.Control
          onClick={onClick}
          value={value}
          readOnly
          className="rounded-1 p-2"
          style={{
            height: "38px",
            fontSize: "14px",
            lineHeight: "1.5",
            cursor: "pointer",
          }}
        />
        {FaCalendarAlt({
          className: "position-absolute end-0 me-2",
          style: { pointerEvents: "none" },
        })}
      </div>
    );

    const currencyOptions = currency.map((c) => ({
      value: c.currency,
      name: c.currency,
    }));
    const paymentMethodOptions = paymentOptions.map((opt) => ({
      value: opt.type,
      name: opt.description,
    }));

    return (
      <>
        {/* Given Section with Header */}
        <div className="mb-4 p-3 bg-light rounded">
          <h6 className="mb-3 text-primary">Advance Given</h6>
          <Row className="mb-3">
            <Col xs={12} md={3}>
              <Form.Group controlId="givenCurrency">
                <Form.Label className="form-label">Currency</Form.Label>
                <Form.Select
                  className="form-control"
                  style={{ height: "38px", fontSize: "14px" }}
                  value={currentEntry.givenCurrency}
                  onChange={(e) =>
                    handleInputChange("givenCurrency", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">Select Currency</option>
                  {currencyOptions.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group controlId="givenPaidThrough">
                <Form.Label className="form-label">Paid Through</Form.Label>
                <Form.Select
                  className="form-control"
                  style={{ height: "38px", fontSize: "14px" }}
                  value={currentEntry.givenPaidThrough}
                  onChange={(e) =>
                    handleInputChange("givenPaidThrough", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">Select payment</option>
                  {paymentMethodOptions.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group controlId="givenAmount">
                <Form.Label className="form-label">Amount</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  className="form-control"
                  style={{ height: "38px", fontSize: "14px" }}
                  value={currentEntry.givenAmount || ""}
                  onChange={(e) =>
                    handleInputChange("givenAmount", e.target.value)
                  }
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group controlId="advanceGivenDate">
                <Form.Label className="form-label">Advance Date</Form.Label>
                <DatePicker
                  selected={
                    currentEntry.advanceGivenDate
                      ? new Date(currentEntry.advanceGivenDate)
                      : null
                  }
                  onChange={(date: Date | null) =>
                    date && handleInputChange("advanceGivenDate", date)
                  }
                  customInput={<CustomInput />}
                  dateFormat="dd-MM-yyyy"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>

        {/* Return Section with Header */}
        <div className="p-3 bg-light rounded">
          <h6 className="mb-3 text-primary">Advance Return</h6>
          <Row className="mb-3">
            <Col xs={12} md={3}>
              <Form.Group controlId="returnedCurrency">
                <Form.Label className="form-label">Return Currency</Form.Label>
                <Form.Select
                  className="form-control"
                  style={{ height: "38px", fontSize: "14px" }}
                  value={currentEntry.returnedCurrency}
                  onChange={(e) =>
                    handleInputChange("returnedCurrency", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">Select Currency</option>
                  {currencyOptions.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group controlId="returnedPaidThrough">
                <Form.Label className="form-label">Return Through</Form.Label>
                <Form.Select
                  className="form-control"
                  style={{ height: "38px", fontSize: "14px" }}
                  value={currentEntry.returnedPaidThrough}
                  onChange={(e) =>
                    handleInputChange("returnedPaidThrough", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">Select payment</option>
                  {paymentMethodOptions.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group controlId="returnedAmount">
                <Form.Label className="form-label">Amount Returned</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  className="form-control"
                  style={{ height: "38px", fontSize: "14px" }}
                  value={currentEntry.returnedAmount || ""}
                  onChange={(e) =>
                    handleInputChange("returnedAmount", e.target.value)
                  }
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={3}>
              <Form.Group controlId="advanceReturnDate">
                <Form.Label className="form-label">Return Date</Form.Label>
                <DatePicker
                  selected={
                    currentEntry.advanceReturnDate
                      ? new Date(currentEntry.advanceReturnDate)
                      : null
                  }
                  onChange={(date: Date | null) =>
                    date && handleInputChange("advanceReturnDate", date)
                  }
                  customInput={<CustomInput />}
                  dateFormat="dd-MM-yyyy"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
      </>
    );
  }
);

export default AdvanceDetails;
