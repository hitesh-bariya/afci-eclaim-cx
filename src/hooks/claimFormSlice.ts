import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EmployeeData {
  name: string;
  location: string;
  costCenter: string;
  department: string;
  qadNumber: string;
  entity?: string;
  employeeEmail?: string;
}

export interface Attachment {
  id?: string;
  //file: File;
  name: string;
  type: string;
  size: number;
}

interface AdvanceEntry {
  id: any;
  givenCurrency: string;
  givenAmount: number;
  givenPaidThrough: string;
  returnedCurrency: string;
  returnedAmount: number;
  returnedPaidThrough: string;
  spentAmount: number;
  spentAmountINR: number;
  advanceGivenDate: string;
  advanceReturnDate: string;
}
export interface ExpenseItem {
  id: number;
  eclaimDetailId?: string;
  expenseType: string;
  expenseCode: string;
  currency: string;
  glCode: string;
  expenseAmount: number;
  expenseDate: string;
  remarks: string;
  businessPurpose: string;
  attendees: string;
  inrAmount: number;
  attachments: Attachment[];
}

export interface CurrencyItem {
  id: number;
  destinationCurrency: string;
  exchangeRate: number;
  localCurrency: string;
  eclaimDetailId: string;
  attachments: Attachment[];
}

interface ClaimData {
  id: any;
  claimNumber: any;
  category: string;
  n1Approval: string;
  n1ApprovalEmail: string;
  n2Approval: string;
  n2ApprovalEmail: string;
  hrApproval: string;
  hrApprovalEmail: string;
  purpose: string;
  daysAway: number;
  remarks: string;
  eclaimDetailId: string;
  eclaimApprovalStatus: string;
  attachments: Attachment[];
  advanceEntries: AdvanceEntry[];
  expenseEntries: ExpenseItem[];
  currencyEntries: CurrencyItem[];
  approvalRequirements?: {
    needsN1: boolean;
    needsN2: boolean;
    needsHR: boolean;
  };
  validation?: {
    requiresApprovalDocs: boolean;
    requiresTAForm: boolean;
  };
}

interface FormState {
  advanceEntries: any;
  employee: EmployeeData;
  claim: ClaimData;
  featureFlag: number;
  isNewForm: boolean;
  claimNumber?: string;
  expenseData: ExpenseItem;
  currencyData: CurrencyItem;
}

const initialState: FormState = {
  employee: {
    name: "",
    location: "",
    costCenter: "",
    department: "",
    qadNumber: "",
  },
  claim: {
    id: "",
    category: "",
    claimNumber: "",
    n1Approval: "",
    n1ApprovalEmail: "",
    n2ApprovalEmail: "",
    n2Approval: "",
    hrApproval: "",
    hrApprovalEmail: "",
    purpose: "",
    daysAway: 0,
    remarks: "",
    eclaimDetailId: "",
    eclaimApprovalStatus: "",
    attachments: [],
    advanceEntries: [],
    expenseEntries: [],
    currencyEntries: [],
    validation: {
      requiresApprovalDocs: false,
      requiresTAForm: false,
    },
  },
  expenseData: {
    id: 0,
    expenseType: "",
    expenseCode: "",
    currency: "",
    glCode: "",
    expenseAmount: 0,
    expenseDate: "",
    remarks: "",
    businessPurpose: "",
    attendees: "",
    inrAmount: 0,
    attachments: [],
  },
  currencyData: {
    id: 0,
    destinationCurrency: "",
    exchangeRate: 0,
    localCurrency: "",
    eclaimDetailId: "",
    attachments: [],
  },
  featureFlag: 2,
  isNewForm: true,
  advanceEntries: undefined,
};

export const claimFormSlice = createSlice({
  name: "claimForm",
  initialState,
  reducers: {
    updateEmployeeField: (
      state,
      action: PayloadAction<{ field: keyof EmployeeData; value: string }>
    ) => {
      state.employee[action.payload.field] = action.payload.value;
    },
    updateClaimField: (
      state,
      action: PayloadAction<{ field: keyof ClaimData; value: any }>
    ) => {
      (state.claim as any)[action.payload.field] = action.payload.value;
    },
    addExpenseEntry: (state, action: PayloadAction<ExpenseItem>) => {
      state.claim.expenseEntries.push(action.payload);
    },
    updateExpenseEntry: (state, action: PayloadAction<ExpenseItem>) => {
      const index = state.claim.expenseEntries.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        state.claim.expenseEntries[index] = action.payload;
      }
    },
    removeExpenseEntry: (state, action: PayloadAction<number>) => {
      state.claim.expenseEntries = state.claim.expenseEntries.filter(
        (item) => item.id !== action.payload
      );
    },
    resetExpenseForm(state) {
      state.expenseData = { ...initialState.expenseData };
    },
    addCurrencyEntry: (state, action: PayloadAction<CurrencyItem>) => {
      state.claim.currencyEntries.push(action.payload);
    },
    updateCurrencyEntry: (state, action: PayloadAction<CurrencyItem>) => {
      const index = state.claim.currencyEntries.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        state.claim.currencyEntries[index] = action.payload;
      }
    },
    removeCurrencyEntry: (state, action: PayloadAction<number>) => {
      state.claim.currencyEntries = state.claim.currencyEntries.filter(
        (item) => item.id !== action.payload
      );
    },
    resetCurrancyForm(state) {
      state.currencyData = { ...initialState.currencyData };
    },
    updateCurrancyDetailField: (
      state,
      action: PayloadAction<{ field: keyof CurrencyItem; value: any }>
    ) => {
      (state.currencyData as any)[action.payload.field] = action.payload.value;
    },
    updateExpenseDetailField: (
      state,
      action: PayloadAction<{ field: keyof ExpenseItem; value: any }>
    ) => {
      (state.expenseData as any)[action.payload.field] = action.payload.value;
    },
    addAttachment: (state, action: PayloadAction<Attachment[]>) => {
      const newAttachments = action.payload.map((file) => ({
        // file,
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      state.claim.attachments = [...state.claim.attachments, ...newAttachments];
    },
    addExpenseAttachment: (state, action) => {
      const fileMetas = action.payload.map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      state.expenseData.attachments.push(...fileMetas);
    },
    addCurrencyAttachment: (state, action) => {
      const fileMetas = action.payload.map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      state.currencyData.attachments.push(...fileMetas);
    },
    removeAttachment: (state, action: PayloadAction<number>) => {
      state.claim.attachments = state.claim.attachments.filter(
        (_, index) => index !== action.payload
      );
    },
    removeExpenseAttachment: (state, action: PayloadAction<number>) => {
      state.expenseData.attachments = state.expenseData.attachments.filter(
        (_, index) => index !== action.payload
      );
    },
    removeCurrencyAttachment: (state, action: PayloadAction<number>) => {
      state.currencyData.attachments = state.currencyData.attachments.filter(
        (_, index) => index !== action.payload
      );
    },
    setFeatureFlag: (state, action: PayloadAction<number>) => {
      state.featureFlag = action.payload;
    },
    setIsNewForm: (state, action) => {
      state.isNewForm = action.payload;
    },
    updateAttachmentIds: (
      state,
      action: PayloadAction<{ index: number; id: string }[]>
    ) => {
      action.payload.forEach(({ index, id }) => {
        if (state.claim.attachments[index]) {
          state.claim.attachments[index].id = id;
        }
      });
    },
    setApprovalRequirements: (
      state,
      action: PayloadAction<{
        needsN1: boolean;
        needsN2: boolean;
        needsHR: boolean;
      }>
    ) => {
      state.claim.approvalRequirements = action.payload;
    },
    setValidationRequirements: (
      state,
      action: PayloadAction<{
        requiresApprovalDocs: boolean;
        requiresTAForm: boolean;
      }>
    ) => {
      state.claim.validation = action.payload;
    },

    addAdvanceEntry: (state, action) => {
      state.claim.advanceEntries.push(action.payload);
    },
    // In claimFormSlice.ts
    updateAdvanceEntry: (state, action) => {
      const index = state.claim.advanceEntries.findIndex(
        (entry) => entry.id === action.payload.id
      );
      if (index !== -1) {
        state.claim.advanceEntries[index] = action.payload;
      }
    },
    removeAdvanceEntry: (state, action: PayloadAction<number>) => {
      state.claim.advanceEntries = state.claim.advanceEntries.filter(
        (entry) => entry.id !== action.payload
      );
    },

    clearAdvanceEntries: (state) => {
      state.claim.advanceEntries = [];
    },
    resetForm: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  updateEmployeeField,
  updateClaimField,
  addAttachment,
  removeAttachment,
  setFeatureFlag,
  resetForm,
  updateAttachmentIds,
  setIsNewForm,
  setApprovalRequirements,
  updateExpenseDetailField,
  resetExpenseForm,
  addAdvanceEntry,
  updateAdvanceEntry,
  removeAdvanceEntry,
  setValidationRequirements,
  addExpenseEntry,
  updateExpenseEntry,
  removeExpenseEntry,
  addExpenseAttachment,
  removeExpenseAttachment,
  addCurrencyEntry,
  updateCurrencyEntry,
  removeCurrencyEntry,
  resetCurrancyForm,
  updateCurrancyDetailField,
  addCurrencyAttachment,
  removeCurrencyAttachment,
} = claimFormSlice.actions;

export default claimFormSlice.reducer;
