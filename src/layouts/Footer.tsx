import React from "react";
//import './Footer.css';  // Optional for custom styling

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content py-2 bg-color d-flex justify-content-center align-content-center align-items-center px-2">
        <p className="m-0 text-white small">
          &copy; {new Date().getFullYear()} Amphenol. All rights reserved.
          Version 1.0
        </p>
      </div>
    </footer>
  );
}

export default Footer;
