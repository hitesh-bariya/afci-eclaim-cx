import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Form } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";

interface FileAttachment {
  id?: string;
  name: string;
  type: string;
  size: number;
}

interface Props {
  attachments: FileAttachment[];
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
  accept?: string;
  label?: string;
  noteMassage?: string;
  required?: boolean;
}

const AttachmentUploader = forwardRef<HTMLInputElement, Props>(
  (
    {
      attachments,
      onUpload,
      onRemove,
      accept = ".pdf",
      label = "Upload File",
      noteMassage = "Note: Only PDF allowed",
      required = false,
      
    },
    ref
  ) => {
    const [fileObjects, setFileObjects] = useState<Map<number, File>>(
      new Map()
    );
    const internalInputRef = useRef<HTMLInputElement | null>(null);

    // Expose internal input ref to parent via forwarded ref
    useImperativeHandle(ref, () => internalInputRef.current!);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        const newFileObjects = new Map(fileObjects);
        files.forEach((file, i) => {
          newFileObjects.set(attachments.length + i, file);
        });
        setFileObjects(newFileObjects);
        onUpload(files);
      }
    };

    const handleRemove = (index: number) => {
      const newFileObjects = new Map(fileObjects);
      newFileObjects.delete(index);
      setFileObjects(newFileObjects);
      onRemove(index);
    };

    return (
      <Form.Group>
        <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
          {label} {required && <sup className="text-danger">*</sup>}
        </Form.Label>
        <div className="d-flex align-items-center">
          <Form.Control
            id="file-upload"
            type="file"
            accept={accept}
            ref={internalInputRef}
            className="rounded-1 p-1"
            onChange={handleChange}
            style={{ height: "38px", fontSize: "14px" }}
          />
        </div>
        <small className="note-massage">{noteMassage}</small>
        <div className="selected-files-list mt-2">
          {attachments.length > 0 ? (
            <ul className="list-unstyled">
              {attachments.map((file, index) => (
                <li key={index} className="d-flex align-items-center">
                  <span
                    style={{
                      fontSize: "12px",
                      cursor: "pointer",
                      textDecoration: "underline",
                      color: "#0d6efd",
                    }}
                    onClick={() => {
                      // Get the File object from fileObjects Map
                      const fileObj = fileObjects.get(index);
                      if (fileObj) {
                        const url = URL.createObjectURL(fileObj);
                        window.open(url, "_blank");
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      } else {
                        alert("File preview not available.");
                      }
                    }}
                    title="Click to preview"
                  >
                    {file.name}
                  </span>
                  {FaTimes({
                    className: "text-danger ms-2",
                    style: { cursor: "pointer" },
                    onClick: () => handleRemove(index),
                  })}
                </li>
              ))}
            </ul>
          ) : (
            <span style={{ fontSize: "12px" }}>No Attachments</span>
          )}
        </div>
      </Form.Group>
    );
  }
);

export default AttachmentUploader;
