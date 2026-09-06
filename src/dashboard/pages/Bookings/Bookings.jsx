import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import { AppButton } from '../../../components/common';
import OrdersTable from '../../components/OrdersTable/OrdersTable';
import './Bookings.scss';

const Bookings = () => {
  return (
    <div className="bookings-page">
      <div className="bookings-page__header">
        <div>
          <h1 className="page-title">Bookings & Orders</h1>
          <p className="page-subtitle">
            Comprehensive management of pre-pleating, draping, and dispatch orders
          </p>
        </div>
        <AppButton
          variant="primary"
          icon={<AddIcon />}
          className="create-order-btn"
        >
          Create Order
        </AppButton>
      </div>

      <OrdersTable />
    </div>
  );
};

export default Bookings;
