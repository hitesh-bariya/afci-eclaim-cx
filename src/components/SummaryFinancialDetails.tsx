import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import AttachmentViewer from './AttachmentViewer';
import { ExpenseItem, CurrencyItem } from '../hooks/claimFormSlice';

interface Props {
    expenseData: ExpenseItem[];
    currencyData: CurrencyItem[];
    localCurrency: string;
    advanceAmount: number;
    claimData: any;
    userRole?: string;
}

const SummaryFinancialDetails: React.FC<Props> = ({
    expenseData,
    currencyData,
    localCurrency,
    advanceAmount,
    claimData,
    userRole
}) => {

    const [amountCurrency, setAmountCurrency] = useState("INR");
    useEffect(() => {
        if (userRole === 'FBC') {
            setAmountCurrency('INR');
        } else {
            setAmountCurrency(localCurrency);
        }
    }, [userRole, localCurrency]);

const {
    totalExpenseInLocal,
    perDiemTotal,
    dueToCompany,
    dueToYou,
    expenseTotals
} = useMemo(() => {
    const totals: { [currency: string]: number } = {};
    let localExpense = 0;
    let perDiem = 0;

    expenseData.forEach(item => {
        const currency = item.currency?.trim();
        const amount = Number(item.expenseAmount) || 0;
        const isPerDiem = item.expenseCode === 'Per diem';

        if (!currency || amount <= 0) return;
        totals[currency] = (totals[currency] || 0) + amount;
        const rate = currencyData.find(c => c.destinationCurrency === currency)?.exchangeRate || 1;
        let converted = amount;
        if (userRole === 'FBC') {
            converted = amount * rate;
        } else {
            const isSameCurrency = currency === localCurrency;
            converted = isSameCurrency ? amount : amount / rate;
        }
        if (userRole === 'FBC') {
            if (isPerDiem) perDiem += converted;
            else localExpense += converted;
        } else {
            if (!isPerDiem) localExpense += converted;
        }
    });

    const totalClaimed = userRole === 'FBC' ? localExpense + perDiem : localExpense;
    const dueToCompany = (userRole === 'FBC' && totalClaimed < advanceAmount)
        ? advanceAmount - totalClaimed
        : 0;

    const dueToYou = totalClaimed >= advanceAmount
        ? totalClaimed - advanceAmount
        : 0;

    return {
        expenseTotals: totals,
        totalExpenseInLocal: localExpense,
        perDiemTotal: userRole === 'FBC' ? perDiem : 0,
        dueToCompany,
        dueToYou
    };
}, [expenseData, currencyData, localCurrency, advanceAmount, userRole]);

    return (
        <>
            <Row className="mt-4">
                <Col md={6}>
                    <Form.Group>
                        <div className="d-flex align-items-center border-bottom summary-form-footer">
                            <Form.Label className="me-2 mb-0 summary-form-footer-label">Attachment</Form.Label>
                            <div><AttachmentViewer attachments={claimData.attachments} /></div>
                        </div>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group>
                        <div className="d-flex align-items-center border-bottom summary-form-footer">
                            <Form.Label className="me-2 mb-0 summary-form-footer-label">Total Expense</Form.Label>
                            <div>{`${amountCurrency} ${totalExpenseInLocal.toFixed(2)}`}</div>
                        </div>
                    </Form.Group>
                </Col>
            </Row>

            <Row className="mt-4">
                <Col md={6}>
                    <Form.Group>
                        <div className="d-flex align-items-center border-bottom summary-form-footer">
                            <Form.Label className="summary-form-footer-label">Remark</Form.Label>
                            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{claimData.remarks || ''}</div>
                        </div>
                    </Form.Group>
                </Col>
                {userRole === 'FBC' && (
                    <Col md={6}>
                        <Form.Group>
                            <div className="d-flex align-items-center border-bottom summary-form-footer">
                                <Form.Label className='summary-form-footer-label'>Per Diem Amount</Form.Label>
                                <div>{`${amountCurrency} ${perDiemTotal.toFixed(2)}`}</div>
                            </div>
                        </Form.Group>
                    </Col>
                )}
            </Row>

            <Row className="mt-3">
                <Col md={6}>
                    <table className="table summary-currency-table">
                        <thead>
                            <tr>
                                <th className='summary-form-footer-label'>Currency</th>
                                <th>Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(expenseTotals).map(([currency, total]) => (
                                <tr key={currency}>
                                    <td className='summary-form-footer-label'>{currency}</td>
                                    <td>{total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Col>
                <Col md={6}>
                    {userRole === 'FBC' && (
                        <>
                            <Form.Group>
                                <div className="d-flex align-items-center border-bottom summary-details-finance summary-form-footer mt-2">
                                    <Form.Label className='summary-form-footer-label'>Advance Amount</Form.Label>
                                    <div>{`${amountCurrency} ${advanceAmount.toFixed(2)}`}</div>
                                </div>
                            </Form.Group>
                            <Form.Group>
                                <div className="d-flex align-items-center border-bottom summary-details-finance summary-form-footer mt-3">
                                    <Form.Label className='summary-form-footer-label'>Due to Company</Form.Label>
                                    <div>{`${amountCurrency} ${dueToCompany.toFixed(2)}`}</div>
                                </div>
                            </Form.Group>
                        </>

                    )}
                    <Form.Group>
                        <div className="d-flex align-items-center border-bottom summary-details-finance summary-form-footer mt-3">
                            <Form.Label className='summary-form-footer-label'>Due to You</Form.Label>
                            <div>{`${amountCurrency} ${dueToYou.toFixed(2)}`}</div>
                        </div>
                    </Form.Group>
                </Col>
            </Row>
        </>
    );
};

export default SummaryFinancialDetails;