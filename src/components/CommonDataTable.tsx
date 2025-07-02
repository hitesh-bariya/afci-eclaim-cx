import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";

interface ColumnConfig<T> {
  field?: keyof T;
  header: string;
  sortable?: boolean;
  body?: (rowData: T) => React.ReactNode;
  responsive?: boolean;
}

interface CommonDataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  showGlobalFilter?: boolean;
  showRowsPerPage?: boolean;
  rowsPerPage?: number;
  setRowsPerPage?: (value: number) => void;
  loading?: boolean;
  scrollable?: boolean; // New prop for horizontal scrolling
}

const CommonDataTable = <T extends object>({
  data,
  columns,
  globalFilter = "",
  setGlobalFilter,
  showGlobalFilter = false,
  showRowsPerPage = false,
  rowsPerPage = 10,
  setRowsPerPage,
  loading = false,
  scrollable = true, // Default to scrollable for mobile
}: CommonDataTableProps<T>) => {
  return (
    <div className="datatable-container px-1 mt-3">
      {/* Controls Row - Made responsive */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center mb-2 gap-2">
        {showRowsPerPage && (
          <div className="d-flex align-items-center">
            <select
              className="form-select form-select-sm"
              style={{ width: "auto" }}
              value={rowsPerPage}
              onChange={(e) =>
                setRowsPerPage && setRowsPerPage(Number(e.target.value))
              }
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
            <span className="ms-2 d-none d-sm-inline">entries per page</span>
          </div>
        )}

        {showGlobalFilter && setGlobalFilter && (
          <div
            className="flex-grow-1 flex-md-grow-0"
            style={{ minWidth: "200px" }}
          >
            <span className="p-input-icon-left w-100">
              <InputText
                type="search"
                value={globalFilter}
                onInput={(e) => setGlobalFilter(e.currentTarget.value)}
                className="form-control form-control-sm w-100"
                placeholder="Search..."
              />
            </span>
          </div>
        )}
      </div>

      {/* Responsive DataTable */}
      <div className={scrollable ? "table-responsive" : ""}>
        <DataTable
          value={data}
          rows={rowsPerPage}
          globalFilter={globalFilter}
          loading={loading}
          emptyMessage="No data available"
          className="small table-striped"
          onPage={(e) => setRowsPerPage && setRowsPerPage(e.rows)}
          scrollable={scrollable}
          scrollHeight="flex"
          responsiveLayout="stack"
          breakpoint="960px"
        >
          {columns.map((col, idx) => (
            <Column
              key={idx}
              field={col.field as string}
              header={col.header}
              sortable={col.sortable}
              body={col.body}
              headerClassName={col.responsive ? "responsive-header" : ""}
              className={col.responsive ? "responsive-column" : ""}
            />
          ))}
        </DataTable>
      </div>

      {/* Add some custom styles */}
      <style>{`
        @media (max-width: 768px) {
          .datatable-container {
            padding-left: 0.25rem;
            padding-right: 0.25rem;
          }

          .p-datatable .p-datatable-thead > tr > th,
          .p-datatable .p-datatable-tbody > tr > td {
            padding: 0.5rem;
          }

          .responsive-header {
            display: none;
          }

          .responsive-column::before {
            content: attr(data-label);
            font-weight: bold;
            display: inline-block;
            width: 120px;
          }
        }

        @media (max-width: 576px) {
          .p-datatable {
            font-size: 0.85rem;
          }

          .form-select-sm,
          .form-control-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CommonDataTable;
