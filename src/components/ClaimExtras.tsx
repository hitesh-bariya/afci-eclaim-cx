import { useRef, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../hooks/hook";
import {
  addAttachment,
  removeAttachment,
  updateClaimField,
} from "../hooks/claimFormSlice";
import AttachmentUploader from "./AttachmentUploader";
import CommonModal from "./CommonModal";

interface ClaimExtrasProps {
  triggerSelfApprovalModal: boolean;
  onSelfApprovalHandled: () => void;
  onDaysAwayChanged?: (value: number) => void;
  modalType?: "selfApproval" | "daysAway" | null;
}

const ClaimExtras = ({
  triggerSelfApprovalModal,
  onSelfApprovalHandled,
  onDaysAwayChanged,
  modalType,
}: ClaimExtrasProps) => {
  const dispatch = useAppDispatch();
  const { claim } = useAppSelector((state) => state.claimForm);
  const employeeEmail = useAppSelector(
    (state) => state.claimForm.employee.employeeEmail
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showModal, setShowModal] = useState(false);

  const isSelfApproving = () => {
    return (
      (claim.n1ApprovalEmail && claim.n1ApprovalEmail === employeeEmail) ||
      (claim.n2ApprovalEmail && claim.n2ApprovalEmail === employeeEmail) ||
      (claim.hrApprovalEmail && claim.hrApprovalEmail === employeeEmail)
    );
  };

  const areAttachmentsRequired = () => {
    return isSelfApproving() || claim.daysAway > 0;
  };

  const handleFileUpload = (files: File[]) => {
    const fileMetas = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      //url: URL.createObjectURL(file),
    }));

    dispatch(addAttachment(fileMetas));
  };

  const handleRemoveAttachment = (index: number) => {
    dispatch(removeAttachment(index));
  };

  const handleChange = (field: keyof typeof claim, value: any) => {
    dispatch(updateClaimField({ field, value }));
  };

  if (triggerSelfApprovalModal && !showModal) {
    setShowModal(true);
  }

  const handleModalClose = () => {
    setShowModal(false);
    onSelfApprovalHandled();
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 200);
  };

  return (
    <>
      <CommonModal
        show={showModal}
        title="Alert"
        onClose={handleModalClose}
        onSave={handleModalClose}
        showFooter={false}
      >
        <div>
          <p style={{ fontSize: "14px" }}>
            {modalType === "selfApproval"
              ? "Note: You are required to upload your Manager's approval mail if you are selecting yourself as the approver."
              : "Note: You are required to upload your TA form."}
          </p>
          <div className="text-end">
            <button className="btn btn-primary" onClick={handleModalClose}>
              Close
            </button>
          </div>
        </div>
      </CommonModal>

      <Row className="gy-3 mt-3">
        {/* Purpose */}
        <Col xs={12} md={3}>
          <Form.Group>
            <Form.Label
              className="fw-bold mb-1"
              style={{ fontSize: "13px", fontWeight: "lighter" }}
            >
              Purpose <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Maximum 18 characters"
              maxLength={18}
              className="rounded-1 p-2"
              style={{
                height: "44px",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
              value={claim.purpose}
              onChange={(e) => handleChange("purpose", e.target.value)}
            />
            <Form.Text
              style={{ fontSize: "11px", color: "red", fontWeight: "lighter" }}
            >
              Maximum 18 characters
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Days Away */}
        <Col xs={12} md={3}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Days Away From Home / Biz
            </Form.Label>
            <Form.Control
              type="number"
              value={claim.daysAway}
              className="rounded-1 p-2"
              style={{
                height: "44px",
                fontSize: "15px",
                lineHeight: "1.6",
              }}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                handleChange("daysAway", value);
                onDaysAwayChanged?.(value);
              }}
            />
            <Form.Text
              style={{ fontSize: "11px", color: "red", fontWeight: "lighter" }}
            >
              No. of nights of hotel accommodation (0 for day trips)
            </Form.Text>
          </Form.Group>
        </Col>

        {/* Remarks */}
        <Col xs={12} md={3}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Remarks
            </Form.Label>
            <Form.Control
              type="text"
              className="rounded-1 p-2"
              style={{ height: "44px", fontSize: "15px", lineHeight: "1.6" }}
              value={claim.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
            />
          </Form.Group>
        </Col>

        {/* Attachment */}
        <Col xs={12} md={3}>
          <AttachmentUploader
            ref={fileInputRef}
            attachments={claim.attachments}
            onUpload={handleFileUpload}
            onRemove={handleRemoveAttachment}
            accept=".pdf"
            label="Upload File"
            required={areAttachmentsRequired()}
          />
        </Col>
      </Row>
    </>
  );
};

export default ClaimExtras;
