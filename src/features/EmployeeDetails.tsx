import { Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
import AutoCompleteField from "../components/AutoCompleteField";
import { useAppDispatch, useAppSelector } from "../hooks/hook";
import { updateEmployeeField } from "../hooks/claimFormSlice";
import { useEffect, useState } from "react";
import baseFetch from "../services/api";
import {
  DEPARTMENT_MASTERS_OBJECT_ENDPOINT,
  COST_CENTER_MASTERS_OBJECT_ENDPOINT,
} from "../constants/constants";

interface OptionType {
  value: string;
  label: string;
}

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    height: "45px",
    minHeight: "45px",
    backgroundColor: "#f5f5fa",
    borderColor: "#ced4da",
    borderRadius: "4px",
    fontSize: "14px",
    boxShadow: "none",
    padding: "0",
    "&:hover": {
      borderColor: "#ced4da",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: "45px",
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  input: (base: any) => ({
    ...base,
    margin: "0px",
    padding: "0px",
  }),
  singleValue: (base: any) => ({
    ...base,
    lineHeight: "1.5",
  }),
};

const EmployeeDetails = () => {
  const dispatch = useAppDispatch();
  const employee = useAppSelector((state) => state.claimForm.employee);
  const [costCenterOptions, setCostCenterOptions] = useState<OptionType[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState({
    costCenters: true,
    departments: true,
  });

  useEffect(() => {
    const fetchCostCenters = async () => {
      try {
        const response = await baseFetch(COST_CENTER_MASTERS_OBJECT_ENDPOINT);
        const data = await response.json();
        const options = data.items.map((item: any) => ({
          value: item.costCenterName,
          label: item.costCenterName,
        }));
        setCostCenterOptions(options);

        if (
          employee.costCenter &&
          !options.some((opt: any) => opt.value === employee.costCenter)
        ) {
          setCostCenterOptions((prev) => [
            ...prev,
            { value: employee.costCenter, label: employee.costCenter },
          ]);
        }
      } catch (error) {
        console.error("Error fetching cost centers:", error);
      } finally {
        setLoading((prev) => ({ ...prev, costCenters: false }));
      }
    };

    fetchCostCenters();
  }, [employee.costCenter]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await baseFetch(DEPARTMENT_MASTERS_OBJECT_ENDPOINT);
        const data = await response.json();
        const options = data.items.map((item: any) => ({
          value: item.departmentName,
          label: item.departmentName,
        }));
        setDepartmentOptions(options);

        if (
          employee.department &&
          !options.some((opt: any) => opt.value === employee.department)
        ) {
          setDepartmentOptions((prev) => [
            ...prev,
            { value: employee.department, label: employee.department },
          ]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setLoading((prev) => ({ ...prev, departments: false }));
      }
    };

    fetchDepartments();
  }, [employee.department]);

  const handleChange = (field: keyof typeof employee, value: string) => {
    dispatch(updateEmployeeField({ field, value }));
  };

  const handleEmployeeSelect = (selectedEmployee: {
    email: string;
    title: string;
    entity: string;
    city: string;
    costCenterName: string;
    departmentName: string;
    employeeNumber: string;
  }) => {
    dispatch(
      updateEmployeeField({ field: "name", value: selectedEmployee.title })
    );
    dispatch(
      updateEmployeeField({
        field: "employeeEmail",
        value: selectedEmployee.email,
      })
    );
    dispatch(
      updateEmployeeField({ field: "location", value: selectedEmployee.city })
    );
    dispatch(
      updateEmployeeField({
        field: "qadNumber",
        value: selectedEmployee.employeeNumber,
      })
    );
    dispatch(
      updateEmployeeField({ field: "entity", value: selectedEmployee.entity })
    );

    if (selectedEmployee.costCenterName) {
      dispatch(
        updateEmployeeField({
          field: "costCenter",
          value: selectedEmployee.costCenterName,
        })
      );
      if (
        !costCenterOptions.some(
          (opt) => opt.value === selectedEmployee.costCenterName
        )
      ) {
        setCostCenterOptions((prev) => [
          ...prev,
          {
            value: selectedEmployee.costCenterName,
            label: selectedEmployee.costCenterName,
          },
        ]);
      }
    }

    if (selectedEmployee.departmentName) {
      dispatch(
        updateEmployeeField({
          field: "department",
          value: selectedEmployee.departmentName,
        })
      );
      if (
        !departmentOptions.some(
          (opt) => opt.value === selectedEmployee.departmentName
        )
      ) {
        setDepartmentOptions((prev) => [
          ...prev,
          {
            value: selectedEmployee.departmentName,
            label: selectedEmployee.departmentName,
          },
        ]);
      }
    }
  };

  return (
    <div className="bg-white px-3 rounded-bottom-2 mb-3 pt-3 pb-3 shadow-sm">
      <Row className="gy-3">
        {/* Employee Name */}
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Employee Name <sup className="text-danger">*</sup>
            </Form.Label>
            <AutoCompleteField
              required
              type="text"
              placeholder="Enter a name or email address"
              classname="rounded-1 form-control p-2"
              mandatoryfieldshide
              inputStyle={{
                height: "45px",
                fontSize: "14px",
                lineHeight: "1.5",
                marginBottom: "0.5rem",
              }}
              value={employee.name}
              onSelect={handleEmployeeSelect}
            />
          </Form.Group>
        </Col>

        {/* QAD Number (Disabled) */}
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              QAD Number <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter QAD Number"
              className="rounded-1 p-2"
              style={{ height: "45px", fontSize: "14px", lineHeight: "1.5" }}
              value={employee.qadNumber}
              disabled
            />
          </Form.Group>
        </Col>

        {/* Department */}
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Department <sup className="text-danger">*</sup>
            </Form.Label>
            {loading.departments ? (
              <Form.Control
                type="text"
                placeholder="Loading departments..."
                readOnly
                className="rounded-1 p-2"
                style={{ height: "45px", fontSize: "14px", lineHeight: "1.5" }}
              />
            ) : (
              <Select
                required
                placeholder="Select Department"
                isSearchable
                classNamePrefix="select"
                styles={customSelectStyles}
                value={
                  employee.department
                    ? { value: employee.department, label: employee.department }
                    : null
                }
                onChange={(selectedOption) =>
                  handleChange("department", selectedOption?.value || "")
                }
                options={departmentOptions}
              />
            )}
          </Form.Group>
        </Col>

        {/* Cost Center */}
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Cost Center <sup className="text-danger">*</sup>
            </Form.Label>
            {loading.costCenters ? (
              <Form.Control
                type="text"
                placeholder="Loading cost centers..."
                readOnly
                className="rounded-1 p-2"
                style={{ height: "45px", fontSize: "14px", lineHeight: "1.5" }}
              />
            ) : (
              <Select
                required
                placeholder="Select Cost Center"
                isSearchable
                classNamePrefix="select"
                styles={customSelectStyles}
                value={
                  employee.costCenter
                    ? { value: employee.costCenter, label: employee.costCenter }
                    : null
                }
                onChange={(selectedOption) =>
                  handleChange("costCenter", selectedOption?.value || "")
                }
                options={costCenterOptions}
              />
            )}
          </Form.Group>
        </Col>

        {/* Location (Disabled) */}
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Location <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Location"
              className="rounded-1 p-2"
              style={{ height: "45px", fontSize: "14px", lineHeight: "1.5" }}
              value={employee.location}
              disabled
            />
          </Form.Group>
        </Col>

        {/* Entity (Disabled) */}
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label className="fw-bold mb-1" style={{ fontSize: "13px" }}>
              Entity <sup className="text-danger">*</sup>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Employee Entity"
              className="rounded-1 p-2"
              style={{ height: "45px", fontSize: "14px", lineHeight: "1.5" }}
              value={employee.entity}
              disabled
            />
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDetails;
