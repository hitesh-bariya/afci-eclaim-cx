import ClaimDetails from "../features/ClaimDetails";
import EmployeeDetails from "../features/EmployeeDetails";
import { Button } from "react-bootstrap";
import { useAppDispatch, useAppSelector } from "../hooks/hook";
import { resetForm } from "../hooks/claimFormSlice";
import { useState } from "react";
import {
  ECLAIM_ATTACHMENTS_OBJECT_ENDPOINT,
  ECLAIM_DETAILS_OBJECT_ENDPOINT,
} from "../constants/constants";
import baseFetch from "../services/api";
import { generateSequence } from "../features/Sequence";
import { uploadAttachmentsWithMeta } from "../utils/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ExpenseDetailsProps {
  goToNext: () => void;
  goToPrevious: () => void;
}

const EmployeeForm: React.FC<ExpenseDetailsProps> = ({
  goToNext,
  goToPrevious,
}) => {
  const dispatch = useAppDispatch();
  const formData = useAppSelector((state) => state.claimForm);
  const isNewForm = useAppSelector((state) => state.claimForm.isNewForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employeeEmail = formData.employee.employeeEmail;
    const isSelfApproving =
      (formData.claim.n1ApprovalEmail &&
        formData.claim.n1ApprovalEmail === employeeEmail) ||
      (formData.claim.n2ApprovalEmail &&
        formData.claim.n2ApprovalEmail === employeeEmail) ||
      (formData.claim.hrApprovalEmail &&
        formData.claim.hrApprovalEmail === employeeEmail);

    // Validate attachments
    if (
      (isSelfApproving || formData.claim.daysAway > 0) &&
      formData.claim.attachments.length === 0
    ) {
      toast.error("Please upload required documents before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      let claimNumber = formData.claim.claimNumber;

      if (isNewForm) {
        claimNumber = await generateSequence({
          location: formData.employee.location,
          entity: formData.employee.entity || "",
        });
      }

      let uploadedAttachmentIds: number[] = [];

      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      const files = fileInput?.files ? Array.from(fileInput.files) : [];

      // Upload attachments
      if (files.length > 0) {
        try {
          const uploadedMetas = await uploadAttachmentsWithMeta(
            files,
            "EMP_FORM"
          );
          uploadedAttachmentIds = uploadedMetas.map((meta) => Number(meta.id));
          const fileMetas = uploadedMetas.map((meta) => ({
            name: meta.name,
            size: meta.size,
            type: meta.type,
            id: meta.id?.toString(),
          }));

          dispatch({
            type: "claimForm/updateClaimField",
            payload: { field: "attachments", value: fileMetas },
          });
        } catch (uploadError) {
          console.error("Error uploading attachments:", uploadError);
          toast.error("Failed to upload attachments");
          throw new Error("Failed to upload attachments");
        }
      }

      // Fetch existing attachments if editing
      let existingAttachmentIds: number[] = [];
      if (!isNewForm && formData.claim.id) {
        try {
          const existingResponse = await baseFetch(
            `${ECLAIM_ATTACHMENTS_OBJECT_ENDPOINT}?filter=r_eclaimDetailsAttachmentsRelation_c_eclaimdetailsId eq '${formData.claim.id}'`
          );
          const existingData = await existingResponse.json();
          existingAttachmentIds = existingData.items.map(
            (item: any) => item.id
          );
        } catch (fetchError) {
          console.error("Error fetching existing attachments:", fetchError);
        }
      }

      const allAttachmentIds = [
        ...existingAttachmentIds,
        ...uploadedAttachmentIds,
      ];

      const payload = {
        claimNumber,
        employeeName: formData.employee.name,
        employeeEmail: formData.employee.employeeEmail || " ",
        employeeEntity: formData.employee.entity || " ",
        location: formData.employee.location,
        costCenter: formData.employee.costCenter,
        department: formData.employee.department,
        employeeQADNo: formData.employee.qadNumber,
        claimCategory: formData.claim.category,
        n1: formData.claim.n1Approval,
        n1Email: formData.claim.n1ApprovalEmail,
        n2Email: formData.claim.n2ApprovalEmail,
        n2: formData.claim.n2Approval,
        hR: formData.claim.hrApproval || undefined,
        hREmail: formData.claim.hrApprovalEmail || undefined,
        purpose: formData.claim.purpose,
        daysAwayFromHome: formData.claim.daysAway.toString(),
        remarks: formData.claim.remarks || " ",
        eclaimApprovalStatus: {
          key: "DRAFT",
          name: "DRAFT",
        },
        eclaimDetailsAttachmentsRelation:
          allAttachmentIds.map((id) => {
            const meta = formData.claim.attachments.find(
              (file: any) => file.id === id.toString()
            );
            return {
              eclaimAttachment: id,
              fileName: meta?.name || "",
              fileSize: meta?.size || "",
              fileType: meta?.type || "",
            };
          }) || [],
      };

      const response = await baseFetch(ECLAIM_DETAILS_OBJECT_ENDPOINT, {
        method: isNewForm ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Submission failed:", errorData);
        toast.error(`Submission failed: ${errorData.title || "Unknown error"}`);
        return;
      }

      const result = await response.json();
      //toast.success("Employee Details submitted successfully!");
      console.log("Submission successful:", result);

      dispatch({
        type: "claimForm/updateClaimField",
        payload: { field: "eclaimDetailId", value: result.id },
      });

      dispatch({
        type: "claimForm/updateClaimField",
        payload: {
          field: "eclaimApprovalStatus",
          value: result?.eclaimApprovalStatus?.key,
        },
      });
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(`Error submitting form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="custom-toast"
        progressClassName="custom-progress"
      />

      <div className="datatable-striped px-3 mb-3 pt-3 pb-3">
        <div className="bg-white rounded-bottom-2 shadow-sm datatable-striped-sub pb-3">
          <form onSubmit={handleSubmit}>
            <div className="bg-color-gradient px-3 py-1 rounded-top-4">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="text-white mt-3 mb-3">Employee Details</h6>
              </div>
            </div>

            <div className="p-3">
              {/* <div className="bg-color-gradient px-3 py-3 rounded-top-4 mb-3">
                <h6 className="text-white mb-0">Employee Details</h6>
              </div> */}
              <EmployeeDetails />

              <div className="bg-color-gradient px-3 py-3 rounded-top-4 mb-3 mt-4">
                <h6 className="text-white mb-0">Claim Details</h6>
              </div>
              <ClaimDetails />

              {/* Footer with buttons */}
              <div className="datatable-striped-btn text-end mt-4 px-2 pb-3 pt-3">
                <Button className="me-2 custom-button" type="submit">
                  Save
                </Button>
                <Button
                  className="me-2 custom-button"
                  type="submit"
                  onClick={goToNext}
                >
                  Next &gt;
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EmployeeForm;
