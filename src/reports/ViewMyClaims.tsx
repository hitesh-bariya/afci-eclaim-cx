import React, { useState, useEffect } from "react";
import { Tabs, Tab } from "react-bootstrap";
import CommonDataTable from "../components/CommonDataTable";
import baseFetch from "../services/api";
import { ECLAIM_DETAILS_OBJECT_ENDPOINT } from "../constants/constants";
import "./ViewMyClaims.css";

interface Claim {
  id: number;
  name: string;
  claimNumber: string;
  employeeQADNo: string;
  reimbursementDate: string;
  location: string;
  purpose: string;
  totalExpenses: string;
  remarks: string;
  status: { label: string };
  creator?: { id: number };
  requestor?: string;
}

const ViewMyClaims: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [inProgressClaims, setInProgressClaims] = useState<Claim[]>([]);
  const [draftClaims, setDraftClaims] = useState<Claim[]>([]);
  const [approvedClaims, setApprovedClaims] = useState<Claim[]>([]);
  const [cancelledClaims, setCancelledClaims] = useState<Claim[]>([]);
  const [rejectedClaims, setRejectedClaims] = useState<Claim[]>([]);
  const [createdForOthersClaims, setCreatedForOthersClaims] = useState<Claim[]>(
    []
  );

  const currentUserEmail =
    window?.themeDisplay?.getUserEmailAddress?.() || null;
  const currentUserId = window?.themeDisplay?.getUserId?.() || null;

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      let allItems: Claim[] = [];
      let page = 1;
      const pageSize = 50;

      try {
        console.log("Fetching claims for user:", currentUserEmail);
        while (true) {
          const response = await baseFetch(
            `${ECLAIM_DETAILS_OBJECT_ENDPOINT}?page=${page}&pageSize=${pageSize}`
          );
          if (!response.ok) break;

          const data = await response.json();
          if (!Array.isArray(data.items) || data.items.length === 0) break;

          allItems = [...allItems, ...data.items];

          if (page >= data.totalPages) break;
          page++;
        }

        allItems.sort((a, b) => b.id - a.id);

        const myClaims = allItems.filter(
          (item) => String(item?.creator?.id) === String(currentUserId)
        );

        const othersClaims = allItems.filter(
          (item) => String(item?.creator?.id) !== String(currentUserId)
        );

        const transform = (list: Claim[]) =>
          list.map((item) => ({
            id: item.id,
            name: item.name || "-",
            claimNumber: item.claimNumber || "-",
            employeeQADNo: item.employeeQADNo || "-",
            reimbursementDate: item.reimbursementDate || "-",
            location: item.location || "-",
            purpose: item.purpose || "-",
            totalExpenses: item.totalExpenses || "-",
            remarks: item.remarks || "-",
            status: { label: item.status?.label || "-" },
            creator: item.creator,
            requestor: item.requestor,
          }));

          setInProgressClaims(
            transform(
              myClaims.filter((item) =>
                [
                  "Pending From Finance1",
                  "Pending From N2",
                  "Pending From N1",
                  "Pending From HR",
                ].includes(item.status?.label)
              )
            )
          );
          setDraftClaims(
            transform(myClaims.filter((item) => item.status?.label === "Draft"))
          );
          setApprovedClaims(
            transform(
              myClaims.filter((item) => item.status?.label === "approved")
            )
          );
          setCancelledClaims(
            transform(
              myClaims.filter((item) => item.status?.label === "Cancelled")
            )
          );
          setRejectedClaims(
            transform(
              myClaims.filter((item) => item.status?.label === "Rejected")
            )
          );
        setCreatedForOthersClaims(transform(othersClaims));
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [currentUserId]);

  const commonColumns = [
    { field: "id" as keyof Claim, header: "ID" },
    { field: "name" as keyof Claim, header: "Name" },
    {
      field: "claimNumber" as keyof Claim,
      header: "Claim Number",
      body: (row: Claim) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a href="#" className="text-primary text-decoration-none">
          {row.claimNumber}
        </a>
      ),
    },
    { field: "employeeQADNo" as keyof Claim, header: "Employee No" },
    { field: "reimbursementDate" as keyof Claim, header: "Reimbursement Date" },
    { field: "location" as keyof Claim, header: "Location" },
    { field: "purpose" as keyof Claim, header: "Purpose" },
    { field: "totalExpenses" as keyof Claim, header: "Total Expenses" },
    { field: "remarks" as keyof Claim, header: "Remarks" },
    {
      field: "status" as keyof Claim,
      header: "Status",
      body: (row: Claim) => row.status?.label || "-",
    },
  ];

  const renderTab = (title: string, data: Claim[]) => (
    <div className="cus-dl-form-container">
      <div className="bg-color-gradient px-3 py-2 rounded-top-4">
        <h6 className="text-white mt-2 mb-2">{title}</h6>
      </div>
      <div className="bg-white small-shadow p-2 rounded-bottom-2">
        <CommonDataTable
          data={data}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          loading={loading}
          columns={commonColumns}
        />
      </div>
    </div>
  );

  return (
    <div className="px-3 mt-3">
      <Tabs
        defaultActiveKey="inProgress"
        id="claims-tab"
        className="mb-3 shadow-sm bg-white border-rounded mt-3 py-1 progress-tabs"
        justify
      >
        <Tab eventKey="inProgress" title="In Progress Claims">
          {renderTab("In Progress Claims", inProgressClaims)}
        </Tab>
        <Tab eventKey="draft" title="Draft Claims">
          {renderTab("Draft Claims", draftClaims)}
        </Tab>
        <Tab eventKey="approved" title="Approved Claims">
          {renderTab("Approved Claims", approvedClaims)}
        </Tab>
        <Tab eventKey="cancelled" title="Cancelled Claims">
          {renderTab("Cancelled Claims", cancelledClaims)}
        </Tab>
        <Tab eventKey="rejected" title="Rejected Claims">
          {renderTab("Rejected Claims", rejectedClaims)}
        </Tab>
        <Tab eventKey="others" title="Created for others">
          {renderTab("Created for Others", createdForOthersClaims)}
        </Tab>
      </Tabs>
    </div>
  );
};

export default ViewMyClaims;
