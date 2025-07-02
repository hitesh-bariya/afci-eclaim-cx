import React from "react";
import { Col, Form, Row } from "react-bootstrap";
import { updateExpenseDetailField } from "../hooks/claimFormSlice";
import { useAppDispatch } from "../hooks/hook";

interface Props {
  businessPurpose: string;
  attendees: string;
  validated: boolean;
}

const EntertainmentFields: React.FC<Props> = ({
  businessPurpose,
  attendees,
  validated,
}) => {
  const dispatch = useAppDispatch();

  return (
    <Row className="mb-3">
      <Col md={6}>
        <Form.Group controlId="businessPurpose">
          <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
            Business Purpose <sup className="text-danger">*</sup>
          </Form.Label>
          <Form.Control
            className="espense-detail-textarea"
            as="textarea"
            rows={2}
            name="businessPurpose"
            maxLength={32}
            required
            value={businessPurpose}
            onChange={(e) =>
              dispatch(
                updateExpenseDetailField({
                  field: "businessPurpose",
                  value: e.target.value,
                })
              )
            }
            isInvalid={validated && !businessPurpose}
          />
          <small className="text-danger">(Maximum 32 characters)</small>
          <Form.Control.Feedback type="invalid">
            This field is required.
          </Form.Control.Feedback>
        </Form.Group>
      </Col>

      <Col md={6}>
        <Form.Group controlId="attendees">
          <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
            Attendees
          </Form.Label>
          <Form.Control
            className="espense-detail-textarea"
            as="textarea"
            rows={2}
            name="attendees"
            maxLength={32}
            value={attendees}
            onChange={(e) =>
              dispatch(
                updateExpenseDetailField({
                  field: "attendees",
                  value: e.target.value,
                })
              )
            }
          />
          <small className="text-danger">(Maximum 32 characters)</small>
        </Form.Group>
      </Col>
    </Row>
  );
};

export default EntertainmentFields;
