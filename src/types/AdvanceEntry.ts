export interface AdvanceEntry {
  id: number;
  givenCurrency: string;
  givenAmount: number;
  givenPaidThrough: string;
  returnedCurrency: string;
  returnedAmount: number;
  returnedPaidThrough: string;
  advanceGivenDate: string;
  advanceReturnDate: string;
  spentAmount: number;
  spentAmountINR: number;
}
