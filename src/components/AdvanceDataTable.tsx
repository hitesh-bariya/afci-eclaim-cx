import React from "react";
import { AdvanceEntry } from "../types/AdvanceEntry";
import CommonDataTable from "./CommonDataTable";
import ActionButtons from "./ActionButtons";

interface AdvanceDataTableProps {
  advanceEntries: AdvanceEntry[];
  onEdit?: (entry: AdvanceEntry) => void;
  onDelete?: (entry: AdvanceEntry) => void;
}

const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getFullYear()}`;
};

const formatCurrency = (value: number | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const AdvanceDataTable = ({
  advanceEntries,
  onEdit,
  onDelete,
}: AdvanceDataTableProps) => {
  const calculateTotal = () =>
    advanceEntries.reduce((sum, entry) => sum + (entry.spentAmountINR || 0), 0);

  const columns = [
    {
      field: "givenCurrency" as keyof AdvanceEntry,
      header: "Given Currency",
      sortable: false,
    },
    {
      field: "givenAmount" as keyof AdvanceEntry,
      header: "Given Amount",
      sortable: false,
      body: (row: AdvanceEntry) => formatCurrency(row.givenAmount),
    },
    {
      field: "paidThrough" as keyof AdvanceEntry,
      header: "Paid Through",
      sortable: false,
    },
    {
      field: "advanceDate" as keyof AdvanceEntry,
      header: "Advance Date",
      sortable: true,
      body: (row: AdvanceEntry) => formatDate(row.advanceGivenDate),
    },
    {
      field: "returnedCurrency" as keyof AdvanceEntry,
      header: "Return Currency",
      sortable: false,
    },
    {
      field: "returnedAmount" as keyof AdvanceEntry,
      header: "Return Amount",
      sortable: false,
      body: (row: AdvanceEntry) => formatCurrency(row.returnedAmount),
    },
    {
      field: "returnThrough" as keyof AdvanceEntry,
      header: "Return Through",
      sortable: false,
    },
    {
      field: "returnDate" as keyof AdvanceEntry,
      header: "Return Date",
      sortable: true,
      body: (row: AdvanceEntry) => formatDate(row.advanceReturnDate),
    },
    {
      field: "spentAmount" as keyof AdvanceEntry,
      header: "Spent Amount",
      sortable: false,
      body: (row: AdvanceEntry) => formatCurrency(row.spentAmount),
    },
    {
      field: "spentAmountINR" as keyof AdvanceEntry,
      header: "Spent Amount (INR)",
      sortable: false,
      body: (row: AdvanceEntry) => (
        <span className="font-semibold">
          {formatCurrency(row.spentAmountINR)}
        </span>
      ),
    },
    {
      field: undefined,
      header: "Actions",
      sortable: false,
      body: (row: AdvanceEntry) => (
        <ActionButtons<AdvanceEntry>
          rowData={row}
          onEdit={onEdit}
          onDelete={
            onDelete
              ? (id) => {
                  const entry = advanceEntries.find((e) => e.id === id);
                  if (entry) onDelete(entry);
                }
              : undefined
          }
          showEdit={!!onEdit}
          showDelete={!!onDelete}
        />
      ),
    },
  ];

  return (
    <div>
      <CommonDataTable
        data={advanceEntries}
        columns={columns}
        showRowsPerPage={false}
        rowsPerPage={10}
      />
      <div className="text-right font-bold mt-3">
        Total Amount - INR: {formatCurrency(calculateTotal())}
      </div>
    </div>
  );
};

export default AdvanceDataTable;
