import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
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
import './OrderDetailsModal.scss';

const OrderDetailsModal = ({ open, onClose, order }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="order-details-modal"
      PaperProps={{
        className: 'order-details-paper',
      }}
    >
      <div className="order-details-paper__top-bar" />

      {/* Header */}
      <DialogTitle className="modal-header">
        <Box className="modal-header__title-wrap">
          <Typography variant="overline" className="modal-header__subtitle">
            Booking Specification & Order Details
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Typography variant="h5" className="modal-header__id">
              {order.id}
            </Typography>
            <span className={`status-pill ${order.status}`}>
              <span className="dot" />
              {order.status.replace('-', ' ')}
            </span>
          </Stack>
        </Box>
        <IconButton onClick={onClose} className="modal-close-btn" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider className="modal-divider" />

      {/* Main Content */}
      <DialogContent className="modal-content">
        <Grid container spacing={2.5}>
          {/* 1. Customer Profile */}
          <Grid item xs={12} md={6}>
            <Box className="details-card">
              <Box className="details-card__head">
                <PersonOutlineIcon className="card-head-icon" />
                <Typography className="card-head-title">Customer Information</Typography>
              </Box>
              <Box className="details-card__body">
                <Box className="info-row">
                  <Typography className="info-label">Full Name</Typography>
                  <Typography className="info-val highlight">{order.customer}</Typography>
                </Box>
                <Box className="info-row">
                  <Typography className="info-label">Phone</Typography>
                  <Typography className="info-val">
                    <PhoneOutlinedIcon className="inline-icon" />
                    {order.phone || '+91 98490 12345'}
                  </Typography>
                </Box>
                <Box className="info-row">
                  <Typography className="info-label">Email</Typography>
                  <Typography className="info-val">
                    <EmailOutlinedIcon className="inline-icon" />
                    {order.email || `${order.customer.toLowerCase().replace(' ', '.')}@example.com`}
                  </Typography>
                </Box>
                <Box className="info-row">
                  <Typography className="info-label">Location</Typography>
                  <Typography className="info-val">
                    <LocationOnOutlinedIcon className="inline-icon" />
                    {order.address || 'Jubilee Hills, Hyderabad'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* 2. Timeline & Delivery */}
          <Grid item xs={12} md={6}>
            <Box className="details-card">
              <Box className="details-card__head">
                <CalendarMonthOutlinedIcon className="card-head-icon" />
                <Typography className="card-head-title">Timeline & Fulfillment</Typography>
              </Box>
              <Box className="details-card__body">
                <Box className="info-row">
                  <Typography className="info-label">Booking Date</Typography>
                  <Typography className="info-val">{order.date}</Typography>
                </Box>
                <Box className="info-row">
                  <Typography className="info-label">Event / Due Date</Typography>
                  <Typography className="info-val highlight">
                    <EventAvailableOutlinedIcon className="inline-icon" />
                    {order.eventDate || '2026-09-08 (Reception)'}
                  </Typography>
                </Box>
                <Box className="info-row">
                  <Typography className="info-label">Fulfillment Mode</Typography>
                  <Typography className="info-val">
                    <LocalShippingOutlinedIcon className="inline-icon" />
                    {order.deliveryType || 'Store Pickup (Scheduled)'}
                  </Typography>
                </Box>
                <Box className="info-row">
                  <Typography className="info-label">Order Status</Typography>
                  <Typography className="info-val status-text">
                    <CheckCircleOutlineIcon className="inline-icon" />
                    {order.status === 'completed'
                      ? 'Ready for Pickup / Delivered'
                      : order.status === 'in-progress'
                      ? 'Pleating in Progress'
                      : 'Pending Processing'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* 3. Saree & Pleating Specifications */}
          <Grid item xs={12}>
            <Box className="details-card">
              <Box className="details-card__head">
                <DryCleaningOutlinedIcon className="card-head-icon" />
                <Typography className="card-head-title">Saree Pre-Pleating Specifications</Typography>
              </Box>
              <Box className="details-card__body">
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box className="spec-tile">
                      <LayersOutlinedIcon className="spec-icon" />
                      <Typography className="spec-label">Service Type</Typography>
                      <Typography className="spec-val">{order.service}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={6} md={3}>
                    <Box className="spec-tile">
                      <DryCleaningOutlinedIcon className="spec-icon" />
                      <Typography className="spec-label">Saree Fabric</Typography>
                      <Typography className="spec-val highlight">{order.sareeType}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={6} md={3}>
                    <Box className="spec-tile">
                      <StraightenOutlinedIcon className="spec-icon" />
                      <Typography className="spec-label">Front Pleats</Typography>
                      <Typography className="spec-val">
                        {order.pleatCount || '6 Front Pleats (5.5" width)'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={6} md={3}>
                    <Box className="spec-tile">
                      <Inventory2OutlinedIcon className="spec-icon" />
                      <Typography className="spec-label">Pallu & Packaging</Typography>
                      <Typography className="spec-val">
                        {order.packaging || 'Hardboard Box Fold + Butter Paper'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>

          {/* 4. Special Instructions Callout */}
          <Grid item xs={12}>
            <Box className="instructions-callout">
              <InfoOutlinedIcon className="callout-icon" />
              <Box>
                <Typography className="callout-title">Special Instructions & Care Notes</Typography>
                <Typography className="callout-text">
                  {order.notes ||
                    'Handle delicate zari border with extra care. Steam iron on reverse side only. Pre-pinned with brass safety pins.'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* 5. Payment Breakdown */}
          <Grid item xs={12}>
            <Box className="payment-card">
              <Box className="payment-card__left">
                <Box className="payment-head">
                  <PaymentOutlinedIcon className="pay-icon" />
                  <Typography className="pay-title">Billing & Payment Summary</Typography>
                </Box>
                <Typography className="pay-method">
                  Payment Status:{' '}
                  <span className="pay-method-bold">
                    {order.paymentStatus || 'Paid in Full (UPI / Online)'}
                  </span>
                </Typography>
              </Box>

              <Box className="payment-card__breakdown">
                <Box className="pay-row">
                  <Typography className="pay-label">Base Pleating Service:</Typography>
                  <Typography className="pay-val">{order.baseAmount || '₹1,000'}</Typography>
                </Box>
                <Box className="pay-row">
                  <Typography className="pay-label">Steam Iron & Box Add-on:</Typography>
                  <Typography className="pay-val">{order.addonAmount || '₹200'}</Typography>
                </Box>
                <Divider className="pay-divider" />
                <Box className="pay-row total">
                  <Typography className="pay-total-label">Total Amount:</Typography>
                  <Typography className="pay-total-val">{order.amount}</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider className="modal-divider" />

      {/* Footer Actions */}
      <DialogActions className="modal-actions">
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PrintOutlinedIcon sx={{ color: '#d4af37 !important' }} />}
          onClick={handlePrint}
          className="print-btn"
        >
          Print Invoice
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          className="close-btn"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailsModal;
