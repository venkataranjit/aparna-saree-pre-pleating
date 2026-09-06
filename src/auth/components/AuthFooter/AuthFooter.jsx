import React from 'react';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import './AuthFooter.scss';

const AuthFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="auth-footer">
      <div className="auth-footer__inner">
        <div className="auth-footer__copyright">
          <span>&copy; {currentYear} Aparna Saree Pre-Pleating.</span>
          <span className="divider-dot">&bull;</span>
          <span className="rights-text">All rights reserved.</span>
        </div>

        <div className="auth-footer__developer">
          <CodeOutlinedIcon className="dev-icon" />
          <span className="dev-text">Designed &amp; Developed by</span>
          <a
            href="https://venkataranjit.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="developer-link"
            title="Visit Venkata Ranjit's Portfolio"
          >
            <span className="name-glow">Venkata Ranjit</span>
            <LaunchOutlinedIcon className="ext-icon" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
