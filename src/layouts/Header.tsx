import { Outlet, Link } from "react-router-dom";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import "../css/Header.css";
import { useState, useEffect } from "react";
import { ECLAIM_DETAILS_OBJECT_ENDPOINT } from "../constants/constants";
import baseFetch from "../services/api";
import Logo from "../assets/Logo";

interface RoleBrief {
  name: string;
  [key: string]: any;
}

interface UserAccountResponse {
  roleBriefs?: RoleBrief[];
  [key: string]: any;
}

interface RMAItem {
  id: number;
  approvalStatus?: {
    key: string;
    [key: string]: any;
  };
  cSManager?: string;
  salesDirector?: string;
  financeController?: string;
  generalManager?: string;
  cSManagerStatus?: string;
  salesDirectorStatus?: string;
  financeControllerStatus?: string;
  generalManagerStatus?: string;
  [key: string]: any;
}

interface RMAItemsResponse {
  items: RMAItem[];
  totalPages: number;
  [key: string]: any;
}

function Header() {
  const [roles, setRoles] = useState<string[]>([]);
  const [filteredItems, setFilteredItems] = useState<RMAItem[]>([]);

  const currentUserEmail = window?.themeDisplay?.getUserEmailAddress
    ? window.themeDisplay.getUserEmailAddress()
    : null;

  useEffect(() => {
    const fetchData = async () => {
      let allItems: RMAItem[] = [];
      let page = 1;
      const pageSize = 100;

      if (!currentUserEmail) {
        console.warn("User email is not available.");
        return;
      }

      try {
        // Fetch user roles
        const roleResponse = await baseFetch(
          `/o/headless-admin-user/v1.0/user-accounts/by-email-address/${encodeURIComponent(
            currentUserEmail
          )}`
        );

        if (!roleResponse.ok) {
          console.error("Failed to fetch user roles:", roleResponse.statusText);
          return;
        }

        const roleData: UserAccountResponse = await roleResponse.json();
        const fetchedRoles =
          roleData?.roleBriefs?.map((role) => role.name.trim()) || [];
        setRoles(fetchedRoles);

        // Fetch RMA items
        while (true) {
          const noteResponse = await baseFetch(
            `${ECLAIM_DETAILS_OBJECT_ENDPOINT}?page=${page}&pageSize=${pageSize}`
          );

          if (!noteResponse.ok) {
            console.error(
              `Error fetching page ${page}, Status Code:`,
              noteResponse.status
            );
            break;
          }

          const noteData: RMAItemsResponse = await noteResponse.json();

          if (!Array.isArray(noteData.items) || noteData.items.length === 0) {
            break;
          }

          allItems = [...allItems, ...noteData.items];

          if (page >= noteData.totalPages) break;
          page += 1;
        }

        // Sort items by ID in descending order
        allItems.sort((a, b) => b.id - a.id);

        // Filter items where the user is an approver
        const filteredItems = allItems.filter((item) => {
          const approvers = [
            item.cSManager,
            item.salesDirector,
            item.financeController,
            item.generalManager,
          ];

          const isUserApprover = approvers.some(
            (approver) => approver === currentUserEmail
          );

          if (isUserApprover) {
            const statusKey = item.approvalStatus?.key || "";
            if (
              (statusKey === "pendingAtCSManager" &&
                item.cSManager === currentUserEmail) ||
              (statusKey === "pendingAtSalesDirector" &&
                item.salesDirector === currentUserEmail) ||
              (statusKey === "pendingAtFinanceController" &&
                item.financeController === currentUserEmail) ||
              (statusKey === "pendingAtGM" &&
                item.generalManager === currentUserEmail) ||
              ((item.cSManagerStatus === "approved" ||
                item.cSManagerStatus === "rejected") &&
                item.cSManager === currentUserEmail) ||
              ((item.salesDirectorStatus === "approved" ||
                item.salesDirectorStatus === "rejected") &&
                item.salesDirector === currentUserEmail) ||
              ((item.financeControllerStatus === "approved" ||
                item.financeControllerStatus === "rejected") &&
                item.financeController === currentUserEmail) ||
              ((item.generalManagerStatus === "approved" ||
                item.generalManagerStatus === "rejected") &&
                item.generalManager === currentUserEmail)
            ) {
              return true;
            }
          }

          return false;
        });
        setFilteredItems(filteredItems);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [currentUserEmail]);

  const hasRole = (...requiredRoles: string[]): boolean => {
    return roles.some((userRole) =>
      requiredRoles.some(
        (requiredRole) => userRole.toLowerCase() === requiredRole.toLowerCase()
      )
    );
  };

  return (
    <header>
      <Navbar expand="lg" className="bg-color px-2">
        <Navbar.Brand className="logo-brand">
          <Logo />
        </Navbar.Brand>
        <div className="navbar-center">
          <span className="app-title">Eclaim</span>
        </div>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto me-4">
            <Nav className="me-auto">
              <Nav.Link
                as="a"
                href="https://eformstst.fciconnect.com/home"
                className="custom-nav-link text-decoration-none"
              >
                Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/create-eclaim"
                state={{ reset: true }}
                className="custom-nav-link text-decoration-none"
              >
                Create
              </Nav.Link>
            </Nav>
            <NavDropdown
              title="Eclaim Report"
              id="dropdown-cndn-form"
              className="custom-dropdown"
            >
              <NavDropdown.Item
                as={Link}
                to="/view-my-claims"
                className="custom-dropdown-item text-decoration-none"
              >
                View My Claims
              </NavDropdown.Item>
              {hasRole("CSA Admin", "Administrator") && (
                <NavDropdown.Item
                  as={Link}
                  to="/view-my-team-claims"
                  className="custom-dropdown-item text-decoration-none"
                >
                  View My Team Claims
                </NavDropdown.Item>
              )}
              {(filteredItems.length > 0 || hasRole("Administrator")) && (
                <NavDropdown.Item
                  as={Link}
                  to="/waiting-for-approval"
                  className="custom-dropdown-item text-decoration-none"
                >
                  Waiting for Approval
                </NavDropdown.Item>
              )}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
        <Outlet />
      </Navbar>
    </header>
  );
}

export default Header;
