import React, { ReactNode } from "react";
import { Modal, Button } from "react-bootstrap";

interface CommonFormModalProps {
  show: boolean;
  title: string;
  onClose?: () => void;
  onSave?: () => void;
  children: ReactNode;
  validated?: boolean;
  saveButtonLabel?: string;
  cancelButtonLabel?: string;
  size?: "sm" | "lg" | "xl";
}

const CommonFormModal: React.FC<CommonFormModalProps> = ({
  show,
  title,
  onClose,
  onSave,
  children,
  validated = false,
  saveButtonLabel = "Save",
  cancelButtonLabel = "Cancel",
  size = "lg",
}) => {
  return (
    <Modal
      className="form-modal"
      show={show}
      onHide={onClose}
      size={size}
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button className="me-2 custom-button" onClick={onClose}>
          {cancelButtonLabel}
        </Button>
        {onSave && (
          <Button className="me-2 custom-button" onClick={onSave}>
            {saveButtonLabel}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CommonFormModal;
