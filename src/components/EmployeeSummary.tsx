import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';

interface EmployeeData {
    name?: string;
    qadNumber?: string;
    department?: string;
    costCenter?: string;
    location?: string;
}

interface ClaimData {
    daysAway?: number;
    n1Approval?: string;
    n1ApprovalEmail?: string;
    n2Approval?: string;
    n2ApprovalEmail?: string;
    hrApproval?: string;
    hrApprovalEmail?: string;
    eclaimApprovalStatus?: string;
}

interface EmployeeSummaryProps {
    employee: EmployeeData;
    claim: ClaimData;
    localCurrency?: string;
    reimbursementDate: string;
}

const EmployeeSummary: React.FC<EmployeeSummaryProps> = ({
    employee,
    claim,
    localCurrency,
    reimbursementDate
}) => {
    return (
        <>
            <Row className="mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Employee Name</Form.Label>
                        <div>{employee.name || ''}</div>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Employee No.</Form.Label>
                        <div>{employee.qadNumber || ''}</div>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Department</Form.Label>
                        <div>{employee.department || ''}</div>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Cost Center</Form.Label>
                        <div>{employee.costCenter || ''}</div>
                    </Form.Group>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Reimbursement Date</Form.Label>
                        <div>{reimbursementDate}</div>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Days Away From Home / Biz</Form.Label>
                        <div>{claim.daysAway?.toString() || '0'}</div>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Local Currency</Form.Label>
                        <div>{localCurrency || ''}</div>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Location</Form.Label>
                        <div>{employee.location || ''}</div>
                    </Form.Group>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Supervisor Approval (N+1)</Form.Label>
                        <div>{claim.n1Approval || ''}</div>
                        <Form.Text>{claim.n1ApprovalEmail || ''}</Form.Text>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Supervisor Approval (N+2)</Form.Label>
                        <div>{claim.n2Approval || ''}</div>
                        <Form.Text>{claim.n2ApprovalEmail || ''}</Form.Text>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>HR Approval</Form.Label>
                        <div>{claim.hrApproval || ''}</div>
                        <Form.Text>{claim.hrApprovalEmail || ''}</Form.Text>
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <div>{claim.eclaimApprovalStatus || ''}</div>
                    </Form.Group>
                </Col>
            </Row>
        </>
    );
};

export default EmployeeSummary;
