import React from 'react';
import { Box, Typography, Button, Grid, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import DryCleaningOutlinedIcon from '@mui/icons-material/DryCleaningOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StatCard from '../../components/StatCard/StatCard';
import OrdersTable from '../../components/OrdersTable/OrdersTable';
import { useAuth } from '../../../auth/context/AuthContext';
import { USER_ROLES } from '../../../firebase/schema';
import './Overview.scss';

const Overview = () => {
  const { role, isSuperAdmin } = useAuth();
  const userRole = (role || '').toLowerCase();
  const isCustomer = !isSuperAdmin && (userRole === USER_ROLES.CUSTOMER || userRole === 'customer' || userRole === '');

  return (
    <Box className="overview-page">
      {/* Header Section with Dashboard Title and Action Buttons */}
      <Box className="overview-page__header">
        <Box className="overview-header-title-wrap">
          <Typography variant="h4" className="overview-page-title">
            Dashboard
          </Typography>
          <Typography variant="caption" className="overview-page-caption">
            {isCustomer
              ? 'Real-time overview of your saree pre-pleating orders & bookings'
              : 'Real-time overview of saree pre-pleating operations, orders & revenue'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} className="action-buttons">
          {!isCustomer && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FileDownloadIcon sx={{ color: '#d4af37 !important' }} />}
              className="export-btn"
            >
              Export Report
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon sx={{ color: '#000000 !important' }} />}
            className="new-booking-btn"
          >
            New Booking
          </Button>
        </Stack>
      </Box>

      {/* Key Metric Stat Cards - hidden for customer role */}
      {!isCustomer && (
        <Box className="overview-page__stats-grid">
        {/* Card 1: Orders with Previous Month on the left (small), Current Month on the right (big) */}
        <StatCard
          title="Orders"
          value="148"
          prevValue="116"
          change="+27.6% this month"
          trendType="up"
          icon={<ReceiptLongOutlinedIcon />}
        />

        {/* Card 2: Services */}
        <StatCard
          title="Services"
          value="8"
          change="All Active Offerings"
          trendType="completed"
          icon={<DryCleaningOutlinedIcon />}
        />

        {/* Card 3: Customers */}
        <StatCard
          title="Customers"
          value="342"
          change="+28 new this month"
          trendType="up"
          icon={<PeopleOutlineIcon />}
        />

        {/* Card 4: Monthly Revenue with Previous Month on the left (small), Current Month on the right (big) */}
        <StatCard
          title="Monthly Revenue"
          value="₹84,500"
          prevValue="₹69,200"
          change="+22.1% this month"
          trendType="up"
          icon={<CurrencyRupeeIcon />}
        />
      </Box>
      )}

      {/* Recent Orders Table (Schedule section removed) */}
      <OrdersTable />
    </Box>
  );
};

export default Overview;
