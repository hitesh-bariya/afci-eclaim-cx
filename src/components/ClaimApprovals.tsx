// ✅ ClaimApprovals.tsx (Updated)

import { Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
import AutoCompleteField from "../components/AutoCompleteField";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/hook";
import { updateClaimField } from "../hooks/claimFormSlice";
import baseFetch from "../services/api";
import { ECLAIM_CLAIM_CATEGORY_OBJECT_ENDPOINT } from "../constants/constants";
import ClaimExtras from "./ClaimExtras";

interface ClaimCategory {
  id: number;
  categoryName: string;
  isActive: boolean;
}

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: "44px",
    height: "44px",
    fontSize: "15px",
    backgroundColor: "#f5f5fa",
    borderColor: state.isFocused ? "#2684FF" : "#ced4da",
    boxShadow: state.isFocused ? "0 0 0 1px #2684FF" : "none",
    "&:hover": {
      borderColor: "#2684FF",
    },
    padding: "0px",
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: "44px",
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: "44px",
  }),
  input: (base: any) => ({
    ...base,
    margin: "0px",
    padding: "0px",
  }),
  singleValue: (base: any) => ({
    ...base,
    lineHeight: "1.6",
  }),
};

const ClaimApprovals = () => {
  const dispatch = useAppDispatch();
  const { claim } = useAppSelector((state) => state.claimForm);
  const employeeEmail = useAppSelector(
    (state) => state.claimForm.employee.employeeEmail
  );
  const [claimCategories, setClaimCategories] = useState<ClaimCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelfApprovalModal, setShowSelfApprovalModal] = useState(false);
  const [modalType, setModalType] = useState<
    "selfApproval" | "daysAway" | null
  >(null);

  const getDisabledState = () => {
    if (!claim.category) {
      return {
        n1Disabled: true,
        n2Disabled: true,
        hrDisabled: true,
      };
    }

    if (claim.category.toLowerCase() === "staff hr claims") {
      return {
        n1Disabled: true,
        n2Disabled: true,
        hrDisabled: false,
      };
    } else {
      return {
        n1Disabled: false,
        n2Disabled: false,
        hrDisabled: true,
      };
    }
  };

  const { n1Disabled, n2Disabled, hrDisabled } = getDisabledState();

  const handleChange = (field: keyof typeof claim, value: any) => {
    dispatch(updateClaimField({ field, value }));

    if (field === "daysAway" && value > 0) {
      setModalType("daysAway");
      setShowSelfApprovalModal(true);
    }
  };

  useEffect(() => {
    const fetchClaimCategories = async () => {
      try {
        const response = await baseFetch(ECLAIM_CLAIM_CATEGORY_OBJECT_ENDPOINT);
        const data = await response.json();
        const activeCategories = data.items.filter(
          (item: any) => item.isActive === true
        );
        setClaimCategories(activeCategories);
      } catch (error) {
        console.error("Error fetching claim categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimCategories();
  }, []);

  const claimCategoryOptions = claimCategories.map((category) => ({
    value: category.categoryName,
    label: category.categoryName,
  }));

  return (
    <>
      <Row className="gy-3">
        <Col xs={12} md={3}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Claim Category <sup className="text-danger">*</sup>
            </Form.Label>
            {loading ? (
              <Form.Control
                type="text"
                placeholder="Loading categories..."
                readOnly
                className="rounded-1 p-2"
                style={{ height: "44px", fontSize: "15px", lineHeight: "1.6" }}
              />
            ) : (
              <Select
                required
                placeholder="Please select Claim Category"
                isSearchable
                classNamePrefix="select"
                options={claimCategoryOptions}
                styles={customSelectStyles}
                value={
                  claim.category
                    ? { value: claim.category, label: claim.category }
                    : null
                }
                onChange={(selectedOption) => {
                  const category = selectedOption?.value || "";
                  handleChange("category", category);

                  const { n1Disabled, n2Disabled, hrDisabled } =
                    getDisabledState();

                  if (n1Disabled) {
                    handleChange("n1Approval", "");
                    handleChange("n1ApprovalEmail", "");
                  }
                  if (n2Disabled) {
                    handleChange("n2Approval", "");
                    handleChange("n2ApprovalEmail", "");
                  }
                  if (hrDisabled) {
                    handleChange("hrApproval", "");
                    handleChange("hrApprovalEmail", "");
                  }
                }}
              />
            )}
            <Form.Text
              style={{ fontSize: "10px", color: "red", fontWeight: "lighter" }}
            >
              Note: In case you're unsure about claim category, expense type or
              expense code, please refer the category list before submission.{" "}
              <a
                href="/assets/eClaim-Claim-Categories.pdf"
                download="eClaim-Claim-Categories.pdf"
                style={{
                  color: "#0d6efd",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </Form.Text>
          </Form.Group>
        </Col>

        <Col xs={12} md={3}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Supervisor Approval (N+1){" "}
              {n1Disabled ? "" : <sup className="text-danger">*</sup>}
            </Form.Label>
            <AutoCompleteField
              required={!n1Disabled}
              type="text"
              placeholder={n1Disabled ? " " : "Enter a name or email address"}
              classname="rounded-1 form-control p-2"
              mandatoryfieldshide
              inputStyle={{
                height: "44px",
                fontSize: "15px",
                lineHeight: "1.6",
                marginBottom: "0.5rem",
                backgroundColor: n1Disabled ? "#e9ecef" : "#f5f5fa",
              }}
              value={claim.n1Approval}
              onSelect={(employee) => {
                handleChange("n1Approval", employee.title);
                handleChange("n1ApprovalEmail", employee.email);
                if (employee.email === employeeEmail) {
                  setModalType("selfApproval");
                  setShowSelfApprovalModal(true);
                }
              }}
              disabled={n1Disabled}
            />
          </Form.Group>
        </Col>

        <Col xs={12} md={3}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Supervisor Approval (N+2)
            </Form.Label>
            <AutoCompleteField
              type="text"
              placeholder={n2Disabled ? " " : "Enter a name or email address"}
              classname="rounded-1 form-control p-2"
              mandatoryfieldshide
              inputStyle={{
                height: "44px",
                fontSize: "15px",
                lineHeight: "1.6",
                marginBottom: "0.5rem",
                backgroundColor: n2Disabled ? "#e9ecef" : "#f5f5fa",
              }}
              value={claim.n2Approval}
              onSelect={(employee) => {
                handleChange("n2Approval", employee.title);
                handleChange("n2ApprovalEmail", employee.email);
                if (employee.email === employeeEmail) {
                  setModalType("selfApproval");
                  setShowSelfApprovalModal(true);
                }
              }}
              disabled={n2Disabled}
            />
          </Form.Group>
        </Col>

        <Col xs={12} md={3}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              HR Approval{" "}
              {hrDisabled ? "" : <sup className="text-danger">*</sup>}
            </Form.Label>
            <AutoCompleteField
              required={!hrDisabled}
              type="text"
              placeholder={hrDisabled ? " " : "Enter a name or email address"}
              classname="rounded-1 form-control p-2"
              mandatoryfieldshide
              inputStyle={{
                height: "44px",
                fontSize: "15px",
                lineHeight: "1.6",
                marginBottom: "0.5rem",
                backgroundColor: hrDisabled ? "#e9ecef" : "#f5f5fa",
              }}
              value={claim.hrApproval}
              onSelect={(employee) => {
                handleChange("hrApproval", employee.title);
                handleChange("hrApprovalEmail", employee.email);
                if (employee.email === employeeEmail) {
                  setModalType("selfApproval");
                  setShowSelfApprovalModal(true);
                }
              }}
              disabled={hrDisabled}
            />
          </Form.Group>
        </Col>
      </Row>

      <ClaimExtras
        triggerSelfApprovalModal={showSelfApprovalModal}
        onSelfApprovalHandled={() => {
          setShowSelfApprovalModal(false);
          setModalType(null);
        }}
        onDaysAwayChanged={(value) => {
          if (value > 0) {
            setModalType("daysAway");
            setShowSelfApprovalModal(true);
          }
        }}
        modalType={modalType}
      />
    </>
  );
};

export default ClaimApprovals;
