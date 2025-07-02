import React, { useState } from "react";
import { Attachment } from "../hooks/claimFormSlice";
import baseFetch from "../services/api";

interface AttachmentViewerProps {
  attachments: Attachment[];
  noAttachmentText?: string;
  imageWidth?: number;
  onRemove?: (index: number) => void;
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  noAttachmentText = "",
  onRemove,
}) => {
  const [fileUrls, setFileUrls] = useState<Map<number, string>>(new Map());

  const handleFileClick = async (attachment: Attachment) => {
    const existingUrl = fileUrls.get(Number(attachment.id));
    if (existingUrl) {
      window.open(existingUrl, "_blank");
      return;
    }

    try {
      const response = await baseFetch(
        `/o/headless-delivery/v1.0/documents/${attachment.id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      const data = await response.json();
      const rawUrl = data.contentUrl;
      if (rawUrl) {
        let cleanedUrl = "";
        try {
          const urlObj = new URL(rawUrl);
          urlObj.searchParams.delete("download");
          cleanedUrl = urlObj.toString();
        } catch (e) {
          const base = window.location.origin;
          const urlObj = new URL(rawUrl, base);
          urlObj.searchParams.delete("download");
          cleanedUrl = urlObj.toString();
        }

        setFileUrls((prev) =>
          new Map(prev).set(Number(attachment.id), cleanedUrl)
        );
        window.open(cleanedUrl, "_blank");
      } else {
        alert("No URL returned for the document.");
      }
    } catch (error) {
      console.error("Error fetching file URL:", error);
      alert("Unable to preview the file.");
    }
  };

  if (!attachments || attachments.length === 0) {
    return <span>{noAttachmentText}</span>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <ul className="list-unstyled">
        {attachments.map((attachment, index) => (
          <li key={attachment.id} className="d-flex align-items-center">
            <span
              style={{
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
                color: "#0d6efd",
              }}
              onClick={() => handleFileClick(attachment)}
              title="Click to preview"
            >
              {attachment.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttachmentViewer;
