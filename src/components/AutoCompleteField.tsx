import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FC,
  MouseEvent,
} from "react";

import { Form, ListGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import debounce from "lodash/debounce";
import { FaTimes } from "react-icons/fa";
import { EMPLOYEE_MASTERS_OBJECT_ENDPOINT } from "../constants/constants";
import baseFetch from "../services/api";

const { REACT_APP_LIFERAY_HOST = window.location.origin } = process.env;

interface Employee {
  employeeEmail: string;
  title: string;
  entity: string;
  city: string;
  costCenterName: string;
  departmentName: string;
  employeeNumber: string;
}

interface AutoCompleteProps {
  label?: string;
  defaultValue?: string;
  value?: string;
  onSelect?: (employee: {
    email: string;
    title: string;
    entity: string;
    city: string;
    costCenterName: string;
    departmentName: string;
    employeeNumber: string;
  }) => void;
  onClear?: () => void;
  clear?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  type?: string;
  classname?: string;
  mandatoryfieldshide?: boolean;
  inputStyle?: React.CSSProperties;
}

const AutoComplete: FC<AutoCompleteProps> = ({ clear, ...props }) => {
  
  const baseUrl = REACT_APP_LIFERAY_HOST;
  const [query, setQuery] = useState<string>(props.defaultValue || "");
  const [suggestions, setSuggestions] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [cachedResults, setCachedResults] = useState<
    Record<string, Employee[]>
  >({});
  const [selected, setSelected] = useState<boolean>(false);
  const [programmaticUpdate, setProgrammaticUpdate] = useState<boolean>(false);

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query || selected || programmaticUpdate) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      try {
        const response = await baseFetch(EMPLOYEE_MASTERS_OBJECT_ENDPOINT, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const json = await response.json();
        const data: Employee[] = json?.items || [];
        const lowerQuery = query.toLowerCase().replace(/[,\s]/g, "");

        const filtered = data.filter((employee) => {
          const normalizedTitle =
            employee.title?.toLowerCase().replace(/[,\s]/g, "") || "";
          const normalizedEmail = employee.employeeEmail?.toLowerCase() || "";

          return (
            normalizedTitle.includes(lowerQuery) ||
            normalizedEmail.includes(lowerQuery)
          );
        });

        setCachedResults((prevCache) => ({
          ...prevCache,
          [query]: filtered,
        }));
        setSuggestions(filtered);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, 300),
    [cachedResults, selected, programmaticUpdate]
  );

  useEffect(() => {
    if (clear) {
      handleClear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear]);

  // useEffect(() => {
  //   if (query && !selected && !programmaticUpdate) {
  //     fetchSuggestions(query);
  //   } else if (!query) {
  //     setSuggestions([]);
  //     setSelected(false);
  //     setProgrammaticUpdate(false);
  //   }
  // }, [query, selected, programmaticUpdate, fetchSuggestions]);
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed && !selected && !programmaticUpdate) {
      fetchSuggestions(trimmed);
    }

    // Clear suggestions only when query is fully empty
    if (!trimmed) {
      setSuggestions([]);
    }
  }, [query]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelected(false);
    setProgrammaticUpdate(false);
  };

  const handleSuggestionClick = (employee: Employee) => {
    setQuery(employee.title);
    setSuggestions([]);
    setSelected(true);
    setProgrammaticUpdate(false);
    setLoading(false);

    if (props.onSelect) {
      props.onSelect({
        email: employee.employeeEmail,
        title: employee.title,
        entity: employee.entity,
        city: employee.city,
        costCenterName: employee.costCenterName,
        departmentName: employee.departmentName,
        employeeNumber: employee.employeeNumber,
      });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setSelected(false);
    setProgrammaticUpdate(false);

    if (props.onSelect) {
      props.onSelect({
        email: "",
        title: "",
        entity: "",
        city: "",
        costCenterName: "",
        departmentName: "",
        employeeNumber: "",
      });
    }
    if (props.onClear) {
      props.onClear();
    }
  };

  useEffect(() => {
    if (props.value && props.value !== query) {
      setQuery(props.value);
      setSelected(true);
      setSuggestions([]);
      setProgrammaticUpdate(true);
    }
  }, [props.value, query]);

  return (
    <div className="position-relative">
      <Form.Group>
        {/* <Form.Label className="d-flex fw-bold">{props.label}</Form.Label> */}

        <div className="d-flex align-items-center position-relative">
          <Form.Control
            type={props.type}
            value={query}
            onChange={handleChange}
            placeholder={props.placeholder}
            required={props.required}
            disabled={props.disabled}
            name={props.name}
            className={`${props.classname ?? ""} ${error ? "is-invalid" : ""}`}
            style={{
              paddingRight: "30px",
              height: "38px",
              ...props.inputStyle,
            }}
          />

          {query &&
            FaTimes({
              className: "position-absolute end-0 me-2",
              style: {
                cursor: props.disabled ? "not-allowed" : "pointer",
                color: props.disabled ? "lightgray" : "gray",
                fontSize: "16px",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: props.disabled ? "none" : "auto",
              },
              onClick: !props.disabled ? handleClear : undefined,
              tabIndex: -1,
            })}
        </div>

        <ListGroup>
          {suggestions.map((employee) => (
            <ListGroup.Item
              key={employee.employeeEmail}
              action
              onClick={() => handleSuggestionClick(employee)}
            >
              {employee.title}
            </ListGroup.Item>
          ))}
        </ListGroup>

        {loading && <div className="text-muted mt-1 small">Loading...</div>}

        {error && (
          <div
            className="invalid-feedback d-block mt-1"
            style={{ fontWeight: "bold" }}
          >
            {error.response?.status === 403 && "Unauthorized access (403)"}
            {error.response?.status === 404 &&
              "No users found matching your input (404)"}
            {!error.response?.status && `Error: ${error.message}`}
          </div>
        )}
      </Form.Group>
    </div>
  );
};

export default AutoComplete;
