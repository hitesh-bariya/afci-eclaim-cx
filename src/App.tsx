import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import EmployeeTab from "./components/CustomTabs";
import Header from "./layouts/Header";
import Footer from "./layouts/Footer";
import ViewMyClaims from "./reports/ViewMyClaims";

function App() {
  return (
    <Router>
      <div className="app-container d-flex flex-column">
        <Header />
        <main className="flex-grow-1 px-2 py-3">
          <Routes>
            <Route path="/create-eclaim" element={<EmployeeTab />} />
            <Route path="/eclaim" element={<EmployeeTab />} />
            <Route path="/view-my-claims" element={<ViewMyClaims />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
