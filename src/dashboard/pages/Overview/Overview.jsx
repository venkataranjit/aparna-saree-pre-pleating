import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import DryCleaningOutlinedIcon from '@mui/icons-material/DryCleaningOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StatCard from '../../components/StatCard/StatCard';
import OrdersTable from '../../components/OrdersTable/OrdersTable';
import { AppButton } from '../../../components/common';
import { useAuth } from '../../../auth/context/AuthContext';
import { USER_ROLES } from '../../../firebase/schema';
import './Overview.scss';

const Overview = () => {
  const { role, isSuperAdmin } = useAuth();
  const userRole = (role || '').toLowerCase();
  const isCustomer = !isSuperAdmin && (userRole === USER_ROLES.CUSTOMER || userRole === 'customer' || userRole === '');

  return (
    <div className="overview-page">
      {/* Header Section with Dashboard Title and Action Buttons */}
      <div className="overview-page__header">
        <div className="overview-header-title-wrap">
          <h1 className="overview-page-title">
            Dashboard
          </h1>
          <p className="overview-page-caption">
            {isCustomer
              ? 'Real-time overview of your saree pre-pleating orders & bookings'
              : 'Real-time overview of saree pre-pleating operations, orders & revenue'}
          </p>
        </div>

        <div className="action-buttons">
          {!isCustomer && (
            <AppButton
              variant="secondary"
              startIcon={<FileDownloadIcon />}
              className="export-btn"
            >
              Export Report
            </AppButton>
          )}
          <AppButton
            variant="primary"
            startIcon={<AddIcon />}
            className="new-booking-btn"
          >
            New Booking
          </AppButton>
        </div>
      </div>

      {/* Key Metric Stat Cards - hidden for customer role */}
      {!isCustomer && (
        <div className="overview-page__stats-grid">
          {/* Card 1: Orders */}
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

          {/* Card 4: Monthly Revenue */}
          <StatCard
            title="Monthly Revenue"
            value="₹84,500"
            prevValue="₹69,200"
            change="+22.1% this month"
            trendType="up"
            icon={<CurrencyRupeeIcon />}
          />
        </div>
      )}

      {/* Recent Orders Table */}
      <OrdersTable />
    </div>
  );
};

export default Overview;
