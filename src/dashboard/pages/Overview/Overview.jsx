import React, { useState, useEffect, useCallback } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import DryCleaningOutlinedIcon from '@mui/icons-material/DryCleaningOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import StatCard from '../../components/StatCard/StatCard';
import { AppButton, AppSpinner } from '../../../components/common';
import CreateOrderModal from '../../components/CreateOrderModal/CreateOrderModal';
import { useAuth } from '../../../auth/context/AuthContext';
import { USER_ROLES } from '../../../firebase/schema';
import { getAllOrders, getAllServices, getAllClients, getAllUsers } from '../../../firebase/dbService';
import './Overview.scss';

const Overview = () => {
  const { role, isSuperAdmin } = useAuth();
  const userRole = (role || '').toLowerCase();
  const isClient = !isSuperAdmin && (userRole === USER_ROLES.CLIENT || userRole === 'client' || userRole === '');

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const loadOverviewData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, servicesData, clientsData, usersData] = await Promise.all([
        getAllOrders().catch(() => []),
        getAllServices(false).catch(() => []),
        getAllClients().catch(() => []),
        getAllUsers().catch(() => []),
      ]);

      setOrders(ordersData || []);
      setServices(servicesData || []);

      // Build unique clients count
      const clientIds = new Set();
      (clientsData || []).forEach((c) => {
        if (c && c.id) clientIds.add(c.id);
      });
      (usersData || []).forEach((u) => {
        if (u && (u.role === USER_ROLES.CLIENT || !u.role)) {
          clientIds.add(u.id || u.email);
        }
      });
      setClientsCount(clientIds.size);
    } catch (err) {
      console.error('Failed to load overview metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  const totalOrders = orders.length;
  const totalServices = services.length;
  const totalRevenue = orders.reduce((sum, ord) => {
    const val = Number(ord.totalAmount) || Number(String(ord.amount || 0).replace(/[^0-9]/g, '')) || 0;
    return sum + val;
  }, 0);

  return (
    <div className="overview-page">
      {/* Header Section with Dashboard Title and Action Buttons */}
      <div className="overview-page__header">
        <div className="overview-header-title-wrap">
          <h1 className="overview-page-title">
            Dashboard
          </h1>
          <p className="overview-page-caption">
            {isClient
              ? 'Real-time overview of your saree pre-pleating orders & bookings'
              : 'Real-time overview of saree pre-pleating operations, orders & revenue'}
          </p>
        </div>

        <div className="action-buttons">
          <AppButton
            variant="secondary"
            startIcon={<RefreshOutlinedIcon />}
            className="refresh-btn"
            onClick={loadOverviewData}
            disabled={loading}
          >
            Refresh
          </AppButton>
          <AppButton
            variant="primary"
            startIcon={<AddIcon />}
            className="new-booking-btn"
            onClick={() => setOpenCreateModal(true)}
          >
            New Booking
          </AppButton>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <AppSpinner size="lg" color="gold" />
        </div>
      )}

      {/* Key Metric Stat Cards - hidden for client role */}
      {!loading && !isClient && (
        <div className="overview-page__stats-grid">
          {/* Card 1: Orders */}
          <StatCard
            title="Orders"
            value={String(totalOrders)}
            change={totalOrders === 1 ? '1 Active Job' : `${totalOrders} Orders Total`}
            trendType="completed"
            icon={<ReceiptLongOutlinedIcon />}
          />

          {/* Card 2: Services */}
          <StatCard
            title="Services"
            value={String(totalServices)}
            change={totalServices === 1 ? '1 Active Offering' : `${totalServices} Saree Offerings`}
            trendType="completed"
            icon={<DryCleaningOutlinedIcon />}
          />

          {/* Card 3: Clients */}
          <StatCard
            title="Clients"
            value={String(clientsCount)}
            change={clientsCount === 1 ? '1 Registered Client' : `${clientsCount} Registered Clients`}
            trendType="completed"
            icon={<PeopleOutlineIcon />}
          />

          {/* Card 4: Total Revenue */}
          <StatCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            change="All Billed Orders"
            trendType="completed"
            icon={<CurrencyRupeeIcon />}
          />
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onOrderCreated={loadOverviewData}
      />
    </div>
  );
};

export default Overview;
