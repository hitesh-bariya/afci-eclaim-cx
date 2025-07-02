import {
  DLFILE_ENTRY_ENDPOINT,
  DLFILE_ENTRY_ENDPOINT_CNDN,
  LIST_TYPE_DEFINITIONS_ENDPOINT,
} from "../constants/constants";
import api from "../services/api";

// Types
interface ListTypeEntry {
  key: string;
  name: string;
}

export interface UploadedFileMeta {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
}

// --- Upload with full metadata including Liferay-hosted URL ---
export const uploadAttachmentsWithMeta = async (
  attachments: File[],
  folderName: string = "CNDN",
  fields: string = "id,fileName,encodingFormat,sizeInBytes,contentUrl"
): Promise<UploadedFileMeta[]> => {
  const folderId = await getFolderIdByName(folderName);
  if (!folderId) {
    throw new Error(`Folder with name "${folderName}" not found.`);
  }

  const url = `${DLFILE_ENTRY_ENDPOINT_CNDN}/${folderId}/documents?fields=${fields}`;
  const uploadedFilesMeta: UploadedFileMeta[] = [];

  await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment?.name) return;

      const fileNameParts = attachment.name.split(".");
      const fileExtension = fileNameParts.pop();
      const baseFileName = fileNameParts.join(".");
      const uniqueTitle = `${baseFileName}-${Date.now()}.${fileExtension}`;
      const metadata = { title: uniqueTitle, fileName: uniqueTitle };

      const formData = new FormData();
      formData.append("file", attachment);
      formData.append("document", JSON.stringify(metadata));
      formData.append("title", attachment.name);
      formData.append("description", `Uploaded file: ${attachment.name}`);
      formData.append("documentFolderId", folderId.toString());

      const response = await api(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const result = await response.json();

      const liferayHost = process.env.REACT_APP_LIFERAY_HOST || "";
      uploadedFilesMeta.push({
        id: result.id,
        name: result.fileName,
        type: result.encodingFormat,
        size: result.sizeInBytes,
        url: result.contentUrl.startsWith("http")
          ? result.contentUrl
          : `${liferayHost}${result.contentUrl}`,
      });
    })
  );

  return uploadedFilesMeta;
};

// --- Upload just to get the attachment IDs ---
export const uploadAttachments = async (
  attachments: File[],
  folderName: string = "CNDN",
  fields: string = "id"
): Promise<number[]> => {
  const folderId = await getFolderIdByName(folderName);
  if (!folderId) {
    throw new Error(`Folder with name "${folderName}" not found.`);
  }

  const url = `${DLFILE_ENTRY_ENDPOINT_CNDN}/${folderId}/documents?fields=${fields}`;

  const attachmentIds: number[] = [];

  await Promise.all(
    attachments.map(async (attachment) => {
      if (!attachment?.name) return;

      const fileNameParts = attachment.name.split(".");
      const fileExtension = fileNameParts.pop();
      const baseFileName = fileNameParts.join(".");
      const uniqueTitle = `${baseFileName}-${Date.now()}.${fileExtension}`;
      const metadata = { title: uniqueTitle, fileName: uniqueTitle };

      const formData = new FormData();
      formData.append("file", attachment);
      formData.append("document", JSON.stringify(metadata));
      formData.append("title", attachment.name);
      formData.append("description", `Uploaded file: ${attachment.name}`);
      formData.append("documentFolderId", folderId.toString());

      const response = await api(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data: UploadResponse = await response.json();
      attachmentIds.push(data.id);
    })
  );

  return attachmentIds;
};

// --- Get Folder ID by name ---
const getFolderIdByName = async (
  folderName: string
): Promise<number | null> => {
  const url = DLFILE_ENTRY_ENDPOINT;
  const response = await api(url, { method: "GET" });

  if (!response.ok) {
    throw new Error("Failed to fetch document folders.");
  }

  const data: FolderResponse = await response.json();
  const folder = data.items.find((folder) => folder.name === folderName);
  return folder ? folder.id : null;
};

// --- Fetch List Type Entries (Dropdowns etc.) ---
interface ListTypeResponse {
  listTypeEntries: ListTypeEntry[];
}
interface Folder {
  id: number;
  name: string;
}
interface FolderResponse {
  items: Folder[];
}
interface UploadResponse {
  id: number;
}

export const fetchDropdownValues = async (
  erc: string,
  fields: string = "listTypeEntries.key,listTypeEntries.name"
): Promise<{ key: string; name: string }[]> => {
  const url = `${LIST_TYPE_DEFINITIONS_ENDPOINT}/${erc}?fields=${fields}`;

  try {
    const response = await api(url, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data: ListTypeResponse = await response.json();
    return data.listTypeEntries.map((entry) => ({
      key: entry.key,
      name: entry.name,
    }));
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    return [];
  }
};
