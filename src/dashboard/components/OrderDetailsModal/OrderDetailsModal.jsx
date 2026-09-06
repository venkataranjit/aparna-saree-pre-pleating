import React, { useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DryCleaningOutlinedIcon from '@mui/icons-material/DryCleaningOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { AppButton } from '../../../components/common';
import { formatDateSafe } from '../../../firebase/dbService';
import './OrderDetailsModal.scss';

const OrderDetailsModal = ({ open, onClose, order }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="order-details-modal">
      <div className="order-details-backdrop" onClick={onClose} />

      <div className="order-details-paper" role="dialog" aria-modal="true">
        <div className="order-details-paper__top-bar" />

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header__title-wrap">
            <span className="modal-header__subtitle">
              Booking Specification & Order Details
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 className="modal-header__id">
                {order.id}
              </h3>
              <span className={`status-pill ${order.status}`}>
                <span className="dot" />
                {order.status.replace('-', ' ')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal-divider" />

        {/* Main Content */}
        <div className="modal-content">
          <div className="modal-grid-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* 1. Customer Profile */}
            <div className="details-card">
              <div className="details-card__head">
                <PersonOutlineIcon className="card-head-icon" />
                <span className="card-head-title">Customer Information</span>
              </div>
              <div className="details-card__body">
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <span className="info-val highlight">{order.customer}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone</span>
                  <span className="info-val">
                    <PhoneOutlinedIcon className="inline-icon" />
                    {order.phone || '+91 98490 12345'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-val">
                    <EmailOutlinedIcon className="inline-icon" />
                    {order.email || `${order.customer.toLowerCase().replace(' ', '.')}@example.com`}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Location</span>
                  <span className="info-val">
                    <LocationOnOutlinedIcon className="inline-icon" />
                    {order.address || 'Jubilee Hills, Hyderabad'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Timeline & Delivery */}
            <div className="details-card">
              <div className="details-card__head">
                <CalendarMonthOutlinedIcon className="card-head-icon" />
                <span className="card-head-title">Timeline & Fulfillment</span>
              </div>
              <div className="details-card__body">
                <div className="info-row">
                  <span className="info-label">Booking Date</span>
                  <span className="info-val">{formatDateSafe(order.date)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Event / Due Date</span>
                  <span className="info-val highlight">
                    <EventAvailableOutlinedIcon className="inline-icon" />
                    {order.eventDate || '08-Sep-2026 (Reception)'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fulfillment Mode</span>
                  <span className="info-val">
                    <LocalShippingOutlinedIcon className="inline-icon" />
                    {order.deliveryType || 'Store Pickup (Scheduled)'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Order Status</span>
                  <span className="info-val status-text">
                    <CheckCircleOutlineIcon className="inline-icon" />
                    {order.status === 'completed'
                      ? 'Ready for Pickup / Delivered'
                      : order.status === 'in-progress'
                      ? 'Pleating in Progress'
                      : 'Pending Processing'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Saree & Pleating Specifications */}
          <div className="details-card" style={{ marginBottom: '16px' }}>
            <div className="details-card__head">
              <DryCleaningOutlinedIcon className="card-head-icon" />
              <span className="card-head-title">Saree Pre-Pleating Specifications</span>
            </div>
            <div className="details-card__body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div className="spec-tile">
                  <LayersOutlinedIcon className="spec-icon" />
                  <span className="spec-label">Service Type</span>
                  <span className="spec-val">{order.service}</span>
                </div>

                <div className="spec-tile">
                  <DryCleaningOutlinedIcon className="spec-icon" />
                  <span className="spec-label">Saree Fabric</span>
                  <span className="spec-val highlight">{order.sareeType}</span>
                </div>

                <div className="spec-tile">
                  <StraightenOutlinedIcon className="spec-icon" />
                  <span className="spec-label">Front Pleats</span>
                  <span className="spec-val">
                    {order.pleatCount || '6 Front Pleats (5.5" width)'}
                  </span>
                </div>

                <div className="spec-tile">
                  <Inventory2OutlinedIcon className="spec-icon" />
                  <span className="spec-label">Pallu & Packaging</span>
                  <span className="spec-val">
                    {order.packaging || 'Hardboard Box Fold + Butter Paper'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Special Instructions Callout */}
          <div className="instructions-callout" style={{ marginBottom: '16px' }}>
            <InfoOutlinedIcon className="callout-icon" />
            <div>
              <span className="callout-title">Special Instructions & Care Notes</span>
              <p className="callout-text">
                {order.notes ||
                  'Handle delicate zari border with extra care. Steam iron on reverse side only. Pre-pinned with brass safety pins.'}
              </p>
            </div>
          </div>

          {/* 5. Payment Breakdown */}
          <div className="payment-card">
            <div className="payment-card__left">
              <div className="payment-head">
                <PaymentOutlinedIcon className="pay-icon" />
                <span className="pay-title">Billing & Payment Summary</span>
              </div>
              <span className="pay-method">
                Payment Status:{' '}
                <span className="pay-method-bold">
                  {order.paymentStatus || 'Paid in Full (UPI / Online)'}
                </span>
              </span>
            </div>

            <div className="payment-card__breakdown">
              <div className="pay-row">
                <span className="pay-label">Base Pleating Service:</span>
                <span className="pay-val">{order.baseAmount || '₹1,000'}</span>
              </div>
              <div className="pay-row">
                <span className="pay-label">Steam Iron & Box Add-on:</span>
                <span className="pay-val">{order.addonAmount || '₹200'}</span>
              </div>
              <div className="pay-divider" />
              <div className="pay-row total">
                <span className="pay-total-label">Total Amount:</span>
                <span className="pay-total-val">{order.amount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-divider" />

        {/* Footer Actions */}
        <div className="modal-actions">
          <AppButton
            variant="secondary"
            startIcon={<PrintOutlinedIcon />}
            onClick={handlePrint}
            className="print-btn"
          >
            Print Invoice
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
    </div>
  );
};

export default OrderDetailsModal;
