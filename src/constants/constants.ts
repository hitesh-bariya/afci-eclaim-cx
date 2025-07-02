// Extend the Window interface to include themeDisplay
declare global {
  interface Window {
    themeDisplay?: {
      getScopeGroupId?: () => string;
      getUserId?: () => string;
      getUserEmailAddress?: () => string;
    };
  }
}

// eslint-disable-next-line no-undef
export const SITE_GROUP_ID = window?.themeDisplay?.getScopeGroupId
  ? window.themeDisplay.getScopeGroupId()
  : "0";
export const STATUS_DRAFT = 2;
export const STATUS_PENDING = 6;
export const LIST_TYPE_DEFINITIONS_ENDPOINT = `/o/headless-admin-list-type/v1.0/list-type-definitions/by-external-reference-code`;
export const CUSTOMER_OBJECT_ENDPOINT = `/o/c/customers?page=1&pageSize=1000`;
// export const CUSTOMER_OBJECT_ENDPOINT = `/o/c/customers/`;
//export const DLFILE_ENTRY_ENDPOINT = `/o/headless-delivery/v1.0/sites/${SITE_GROUP_ID}/documents`;
export const DLFILE_ENTRY_ENDPOINT = `/o/headless-delivery/v1.0/sites/${SITE_GROUP_ID}/document-folders`;
export const DLFILE_ENTRY_ENDPOINT_CNDN = `/o/headless-delivery/v1.0/document-folders`;
export const ECLAIM_DETAILS_OBJECT_ENDPOINT = `/o/c/eclaimdetails`;
export const RMA_ITEM_OBJECT_ENDPOINT = `/o/c/rmaitemses/`;
export const RMA_ATTACHMENTS_OBJECT_ENDPOINT = `/o/c/rmaattachmentses/`;
export const RMA_CSA_USE_OBJECT_ENDPOINT = `/o/c/csauseonlies/`;
export const RMA_METRICS_PROCESS_ID = `/o/portal-workflow-metrics/v1.0/processes/metrics`;
export const RMA_INSTANCE_ID = `/o/portal-workflow-metrics/v1.0/processes/`;
export const RMA_WORKFLOW_TASK_ID = `/o/headless-admin-workflow/v1.0/workflow-instances/`;
export const LOGGED_IN_USER_ID = window?.themeDisplay?.getUserId
  ? window.themeDisplay.getUserId()
  : null;

export const EMPLOYEE_MASTERS_OBJECT_ENDPOINT = `/o/c/employeemasters/`;
export const DEPARTMENT_MASTERS_OBJECT_ENDPOINT = `/o/c/eclaimdepartments`;
export const COST_CENTER_MASTERS_OBJECT_ENDPOINT = `/o/c/eclaimcostcenters`;
export const ECLAIM_CLAIM_CATEGORY_OBJECT_ENDPOINT = `/o/c/eclaimclaimcategories`;
export const ECLAIM_CLAIM_NUMBER_PREFIXES_OBJECT_ENDPOINT = `/o/c/eclaimclaimnumberprefixes`;
export const ECLAIM_ATTACHMENTS_OBJECT_ENDPOINT = `/o/c/eclaimattachments`;
export const ECLAIM_CURRENCY_MASTERS_OBJECT_ENDPOINT = `/o/c/eclaimcurrencymasters/`;
export const ECLAIM_QA_EXCHANGE_MASTERS_OBJECT_ENDPOINT = `/o/c/eclaimqadexchangemasters/`;
export const ECLAIM_ADVANCES_OBJECT_ENDPOINT = `/o/c/eclaimadvances/`;
export const ECLAIM_ADVANCE_TYPES_OBJECT_ENDPOINT = `/o/c/eclaimadvancetypes/`;

export const ECLAIM_CURRENCY_API = "/o/c/eclaimcurrencies/";

// Expense details end points
export const ECLAIM_EXPENSE_CATEGORIES_API = "/o/c/eclaimexpensecategories/";
export const ECLAIM_EXPENSE_CODES_API = "/o/c/eclaimexpensecodes/";
export const ECLAIM_EXPENSE_ITEMS = `/o/c/eclaimexpenseitems/`;
export const ECLAIM_EXPENSE_CATEGORIES = `/o/c/eclaimexpensecategories`;
export const ECLAIM_EXPENSE_CODES = `/o/c/eclaimexpensecodes`;
export const HEADLESS_DELIVERY_SITES = `/o/headless-delivery/v1.0/sites/`;
export const ECLAIM_CURRENCY_MASTER_API = "/o/c/eclaimcurrencymasters";
export const ECLAIM_QAD_RATE_API = "/o/c/eclaimexchangerates";
