import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DryCleaningOutlinedIcon from '@mui/icons-material/DryCleaningOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { AppModal, AppButton } from '../../../components/common';
import { formatDateSafe, formatTimeSafe, updateOrder } from '../../../firebase/dbService';
import { USER_ROLES } from '../../../firebase/schema';
import { useAuth } from '../../../auth/context/AuthContext';
import './OrderDetailsModal.scss';

const OrderDetailsModal = ({
  open,
  onClose,
  order,
  readOnly = false,
  onStatusUpdated,
  onOrderUpdated,
}) => {
  const { currentUser, userProfile, isSuperAdmin, isAdmin, isStaff, canEdit, role } = useAuth();
  const [currentStatus, setCurrentStatus] = useState('in-progress');
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState('paid');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status || order.orderStatus || 'in-progress');
      setCurrentPaymentStatus(order.paymentStatus || 'paid');
    }
  }, [order]);

  if (!open || !order) return null;

  // Check if active user has admin/staff permissions to update workflow & payment statuses
  const canUpdate = !readOnly && (
    isSuperAdmin ||
    isAdmin ||
    isStaff ||
    canEdit ||
    role === USER_ROLES.SUPERADMIN ||
    role === USER_ROLES.ADMIN ||
    role === USER_ROLES.STAFF ||
    role === 'superadmin' ||
    role === 'admin' ||
    role === 'staff'
  );

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus) return;
    setUpdatingStatus(true);
    try {
      const activeUid = currentUser?.uid || userProfile?.id || '';
      await updateOrder(order.id, {
        status: newStatus,
        orderStatus: newStatus,
        updatedBy: activeUid,
        updatedAt: new Date().toISOString(),
      });
      setCurrentStatus(newStatus);
      toast.success(`Order ${order.id} status updated to "${newStatus}"!`);
      if (onStatusUpdated) {
        onStatusUpdated(order.id, newStatus);
      }
      if (onOrderUpdated) {
        onOrderUpdated(order.id, {
          status: newStatus,
          orderStatus: newStatus,
          updatedBy: activeUid,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newPayStatus) => {
    if (newPayStatus === currentPaymentStatus) return;
    setUpdatingStatus(true);
    try {
      const activeUid = currentUser?.uid || userProfile?.id || '';
      await updateOrder(order.id, {
        paymentStatus: newPayStatus,
        updatedBy: activeUid,
        updatedAt: new Date().toISOString(),
      });
      setCurrentPaymentStatus(newPayStatus);
      const label =
        newPayStatus === 'paid'
          ? 'Paid in Full'
          : newPayStatus === 'partial'
          ? 'Advance / Partial'
          : 'Pending Payment';
      toast.success(`Order ${order.id} payment updated to "${label}"!`);
      if (onOrderUpdated) {
        onOrderUpdated(order.id, {
          paymentStatus: newPayStatus,
          updatedBy: activeUid,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Payment status update failed:', err);
      toast.error('Failed to update payment status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const clientName = order.username || order.client?.username || (typeof order.client === 'string' ? order.client : 'Client');
  const clientMobile = order.userMobile || order.client?.userMobile || order.phone || '—';
  const clientEmail = order.email || order.client?.email || '—';
  const clientAddress = order.userAddress || order.client?.userAddress || order.address || '—';

  // Normalize items array
  const rawItems = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      itemId: 'default_1',
      serviceName: order.service || 'Saree Pre-Pleating & Fold',
      servicePrice: Number(String(order.amount || order.baseAmount || '0').replace(/[^0-9]/g, '')) || 1000,
      serviceDiscountedPrice: Number(String(order.amount || '0').replace(/[^0-9]/g, '')) || 1000,
      finalPrice: Number(String(order.amount || '0').replace(/[^0-9]/g, '')) || 1000,
      sareeType: order.sareeType || 'Silk Saree',
      measurementProfile: {
        title: 'Saved Profile',
        pallu: order.palluStyle || 'Standard Pin Fold',
        firstPleatSize: order.pleatCount || '6 Pleats (5.5" width)',
        notes: order.packaging || '',
      },
      itemNotes: order.notes || '',
    }
  ];

  const totalCalculatedAmount = order.totalAmount || rawItems.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <div className="order-details-modal-title">
          <span className="order-id-label">{order.id}</span>
          <span className={`status-pill ${currentStatus}`}>
            <span className="dot" />
            {currentStatus.replace('-', ' ')}
          </span>
        </div>
      }
      subtitle="Saree Pre-Pleating Job Sheet & Order Specifications"
      maxWidth="lg"
      className="order-details-app-modal"
      bodyClassName="order-details-modal-body"
      actions={
        <div className="order-details-actions-bar">
          <div className="order-summary-pill">
            <span className="summary-label">Total Amount:</span>
            <span className="summary-val">₹{Number(totalCalculatedAmount).toLocaleString('en-IN')}</span>
            <span className="summary-count">({rawItems.length} {rawItems.length === 1 ? 'Service' : 'Services'})</span>
          </div>
          <div className="actions-right">
            <AppButton
              variant="secondary"
              startIcon={<PrintOutlinedIcon />}
              onClick={handlePrint}
              className="print-btn"
            >
              Print Job Sheet / Invoice
            </AppButton>
            <AppButton
              variant="primary"
              onClick={onClose}
              className="close-btn"
            >
              Close
            </AppButton>
          </div>
        </div>
      }
    >
      <div className="order-details-content">
        <div className="modal-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {/* 1. Client Profile */}
          <div className="details-card">
            <div className="details-card__head">
              <PersonOutlineIcon className="card-head-icon" />
              <span className="card-head-title">Client Information</span>
            </div>
            <div className="details-card__body">
              <div className="info-row">
                <span className="info-label">Full Name</span>
                <span className="info-val highlight">{clientName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Mobile</span>
                <span className="info-val">
                  <PhoneOutlinedIcon className="inline-icon" />
                  {clientMobile}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-val">
                  <EmailOutlinedIcon className="inline-icon" />
                  {clientEmail}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Address</span>
                <span className="info-val">
                  <LocationOnOutlinedIcon className="inline-icon" />
                  {clientAddress}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Timeline & Occasion */}
          <div className="details-card">
            <div className="details-card__head">
              <CalendarMonthOutlinedIcon className="card-head-icon" />
              <span className="card-head-title">Timeline & Occasion</span>
            </div>
            <div className="details-card__body">
              <div className="info-row">
                <span className="info-label">Booking Date</span>
                <span className="info-val">
                  {formatDateSafe(order.orderDate || order.date || order.createdAt)}
                  {formatTimeSafe(order.orderDate || order.date || order.createdAt) ? ` (${formatTimeSafe(order.orderDate || order.date || order.createdAt)})` : ''}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Expected Delivery</span>
                <span className="info-val highlight">
                  <EventAvailableOutlinedIcon className="inline-icon" />
                  {formatDateSafe(order.deliveryDate || order.eventDate)}
                </span>
              </div>
              {order.occasion && (
                <div className="info-row">
                  <span className="info-label">Occasion / Event</span>
                  <span className="info-val">
                    <CelebrationOutlinedIcon className="inline-icon" />
                    {order.occasion}
                  </span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Total Sarees</span>
                <span className="info-val highlight">
                  {rawItems.length} {rawItems.length === 1 ? 'Saree Service' : 'Saree Services'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Ordered Services & Detailed Measurement Breakdown */}
        <div className="details-card" style={{ marginBottom: '16px' }}>
          <div className="details-card__head">
            <DryCleaningOutlinedIcon className="card-head-icon" />
            <span className="card-head-title">Ordered Saree Services ({rawItems.length})</span>
          </div>
          <div className="details-card__body">
            <div className="dossier-items-list">
              {rawItems.map((item, idx) => {
                const m = item.measurementProfile;
                return (
                  <div key={item.itemId || idx} className="dossier-item-box">
                    <div className="dossier-item-header">
                      <div className="item-title-wrap">
                        <span className="item-idx-tag">Service #{idx + 1}</span>
                        <span className="item-name-text">{item.serviceName}</span>
                      </div>
                      <div className="item-price-tag">
                        ₹{Number(item.finalPrice || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="dossier-item-specs-grid">
                      <div className="spec-tile">
                        <DryCleaningOutlinedIcon className="spec-icon" />
                        <span className="spec-label">Saree Fabric</span>
                        <span className="spec-val highlight">{item.sareeType || 'Silk'}</span>
                      </div>

                      {m?.title && (
                        <div className="spec-tile">
                          <StraightenOutlinedIcon className="spec-icon" />
                          <span className="spec-label">Measurement Profile</span>
                          <span className="spec-val">{m.title}</span>
                        </div>
                      )}

                      {m?.pallu && (
                        <div className="spec-tile">
                          <LayersOutlinedIcon className="spec-icon" />
                          <span className="spec-label">Pallu Spec</span>
                          <span className="spec-val">{m.pallu}&quot;</span>
                        </div>
                      )}

                      {m?.shoulderToRightTight && (
                        <div className="spec-tile">
                          <StraightenOutlinedIcon className="spec-icon" />
                          <span className="spec-label">Shoulder to Tight</span>
                          <span className="spec-val">{m.shoulderToRightTight}&quot;</span>
                        </div>
                      )}

                      {m?.chest && (
                        <div className="spec-tile">
                          <StraightenOutlinedIcon className="spec-icon" />
                          <span className="spec-label">Chest Size</span>
                          <span className="spec-val">{m.chest}&quot;</span>
                        </div>
                      )}

                      {m?.hip && (
                        <div className="spec-tile">
                          <StraightenOutlinedIcon className="spec-icon" />
                          <span className="spec-label">Hip Size</span>
                          <span className="spec-val">{m.hip}&quot;</span>
                        </div>
                      )}

                      {m?.firstPleatSize && (
                        <div className="spec-tile">
                          <StraightenOutlinedIcon className="spec-icon" />
                          <span className="spec-label">First Pleat</span>
                          <span className="spec-val">{m.firstPleatSize}&quot;</span>
                        </div>
                      )}

                      {m?.noOfChestPleats && (
                        <div className="spec-tile">
                          <LayersOutlinedIcon className="spec-icon" />
                          <span className="spec-label">Chest Pleats</span>
                          <span className="spec-val">{m.noOfChestPleats}</span>
                        </div>
                      )}

                      {m?.height && (
                        <div className="spec-tile">
                          <PersonOutlineIcon className="spec-icon" />
                          <span className="spec-label">Height</span>
                          <span className="spec-val">{m.height}</span>
                        </div>
                      )}

                      {m?.dressSize && (
                        <div className="spec-tile">
                          <StraightenOutlinedIcon className="spec-icon" />
                          <span className="spec-label">Dress Size</span>
                          <span className="spec-val">{m.dressSize}</span>
                        </div>
                      )}
                    </div>

                    {item.itemNotes && (
                      <div className="item-note-callout">
                        <InfoOutlinedIcon style={{ fontSize: 14 }} />
                        <span><strong>Special Care:</strong> {item.itemNotes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Special Instructions Callout */}
        {order.notes && (
          <div className="instructions-callout" style={{ marginBottom: '16px' }}>
            <NotesOutlinedIcon className="callout-icon" />
            <div>
              <span className="callout-title">Order Notes & Booking Instructions</span>
              <p className="callout-text">{order.notes}</p>
            </div>
          </div>
        )}

        {/* 5. Payment & Status Controls / Overview */}
        <div className="payment-card">
          <div className="payment-card__left">
            <div className="payment-head">
              <PaymentOutlinedIcon className="pay-icon" />
              <span className="pay-title">
                {canUpdate ? 'Billing & Workflow Controls' : 'Billing & Status Overview'}
              </span>
            </div>

            {canUpdate ? (
              <>
                <div className="status-button-group">
                  <span className="status-label">Update Order Status:</span>
                  <div className="status-buttons">
                    <button
                      type="button"
                      className={`btn-status btn-status--in-progress ${currentStatus === 'in-progress' ? 'active' : ''}`}
                      onClick={() => handleStatusChange('in-progress')}
                      disabled={updatingStatus}
                    >
                      In-Progress
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--completed ${currentStatus === 'completed' ? 'active' : ''}`}
                      onClick={() => handleStatusChange('completed')}
                      disabled={updatingStatus}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--pending ${currentStatus === 'pending' ? 'active' : ''}`}
                      onClick={() => handleStatusChange('pending')}
                      disabled={updatingStatus}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--cancelled ${currentStatus === 'cancelled' ? 'active' : ''}`}
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={updatingStatus}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>

                <div className="status-button-group" style={{ marginTop: 12 }}>
                  <span className="status-label">Update Payment Status:</span>
                  <div className="status-buttons">
                    <button
                      type="button"
                      className={`btn-status btn-pay--paid ${currentPaymentStatus === 'paid' ? 'active' : ''}`}
                      onClick={() => handlePaymentStatusChange('paid')}
                      disabled={updatingStatus}
                    >
                      Paid in Full
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-pay--partial ${currentPaymentStatus === 'partial' ? 'active' : ''}`}
                      onClick={() => handlePaymentStatusChange('partial')}
                      disabled={updatingStatus}
                    >
                      Partial / Advance
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-pay--pending ${currentPaymentStatus === 'pending' ? 'active' : ''}`}
                      onClick={() => handlePaymentStatusChange('pending')}
                      disabled={updatingStatus}
                    >
                      Pending Payment
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="info-row" style={{ padding: '6px 0' }}>
                  <span className="info-label">Workflow Status</span>
                  <span className={`status-pill ${currentStatus}`}>
                    <span className="dot" />
                    {currentStatus.replace('-', ' ')}
                  </span>
                </div>
                <div className="info-row" style={{ padding: '6px 0' }}>
                  <span className="info-label">Payment Status</span>
                  <span className={`status-pill ${currentPaymentStatus === 'paid' ? 'completed' : currentPaymentStatus === 'partial' ? 'in-progress' : 'pending'}`}>
                    <span className="dot" />
                    {currentPaymentStatus === 'paid'
                      ? 'Paid in Full'
                      : currentPaymentStatus === 'partial'
                      ? 'Advance / Partial'
                      : 'Pending Payment'}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="payment-card__breakdown">
            <div className="pay-row">
              <span className="pay-label">Payment Method:</span>
              <span className="pay-val">{order.paymentMethod || 'UPI / Cash'}</span>
            </div>
            <div className="pay-row">
              <span className="pay-label">Payment Status:</span>
              <span className="pay-val highlight" style={{ textTransform: 'capitalize' }}>
                {currentPaymentStatus === 'paid'
                  ? 'Paid in Full'
                  : currentPaymentStatus === 'partial'
                  ? 'Advance / Partial'
                  : 'Pending Payment'}
              </span>
            </div>
            <div className="pay-divider" />
            <div className="pay-row total">
              <span className="pay-total-label">Total Billed Amount:</span>
              <span className="pay-total-val">₹{Number(totalCalculatedAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
};

export default OrderDetailsModal;
