import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OrdersTable from '../../components/OrdersTable/OrdersTable';
import './Bookings.scss';

const Bookings = () => {
  return (
    <Box className="bookings-page">
      <Box className="bookings-page__header">
        <Box>
          <Typography variant="h4" component="h1" className="page-title">
            Bookings & Orders
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(212, 175, 55, 0.8)', mt: 0.5 }}>
            Comprehensive management of pre-pleating, draping, and dispatch orders
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon sx={{ color: '#000000 !important' }} />}
          className="create-order-btn"
        >
          Create Order
        </Button>
      </Box>

      <OrdersTable />
    </Box>
  );
};

export default Bookings;
