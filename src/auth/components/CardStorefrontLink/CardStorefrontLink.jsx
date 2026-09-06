import React from 'react';
import { Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import './CardStorefrontLink.scss';

const CardStorefrontLink = () => {
  return (
    <div className="card-storefront-bar">
      <Link to="/landing" className="storefront-link" title="Return to Storefront">
        <ArrowBackIcon className="storefront-arrow" />
        <StorefrontOutlinedIcon className="storefront-icon" />
        <span>Return to Storefront</span>
      </Link>
    </div>
  );
};

export default CardStorefrontLink;
