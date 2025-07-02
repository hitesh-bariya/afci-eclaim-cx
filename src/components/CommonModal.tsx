import React, { ReactNode } from "react";
import { Modal, Button } from "react-bootstrap";

interface CommonModalProps<T = any> {
    show: boolean;
    title: string;
    onClose: () => void;
    onSave: (formData?: T) => void;
    size?: "sm" | "lg" | "xl";
    disableBackdropClick?: boolean;
    children: ReactNode;
    formData?: T;
    footerButtons?: ReactNode;
    showFooter?: boolean;
}

const CommonModal = <T,>({
    show,
    title,
    onClose,
    onSave,
    size = "lg",
    disableBackdropClick = false,
    children,
    formData,
    footerButtons,
    showFooter = true,
}: CommonModalProps<T>) => {
    return (
        <Modal
            show={show}
            onHide={onClose}
            size={size}
            backdrop={disableBackdropClick ? "static" : true}
            keyboard={!disableBackdropClick}
            className="form-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            {showFooter && (
                <Modal.Footer>
                    {footerButtons ?? (
                        <>
                            <Button className="me-2 custom-button" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button className="me-2 custom-button" onClick={() => onSave(formData)}>
                                Save
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            )}
        </Modal>
    );
};

export default CommonModal;
