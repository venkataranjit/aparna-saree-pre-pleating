import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import OrderDetailsModal from "../OrderDetailsModal/OrderDetailsModal";
import "./OrdersTable.scss";

const initialOrders = [
  {
    id: "ORD-101",
    customer: "Priya Sharma",
    phone: "+91 98490 12345",
    email: "priya.sharma@gmail.com",
    service: "Bridal Saree Pre-Pleating + Box Fold",
    sareeType: "Kanjeevaram Silk (Pure Zari)",
    pleatCount: '6 Front Pleats (5.5" width)',
    palluStyle: 'Pin-ready Box Pleats (38" length)',
    packaging: "Rigid Hardboard Box + Butter Paper Wrap",
    date: "2026-09-04",
    eventDate: "2026-09-08 (Muhurtham Ceremony)",
    deliveryType: "Store Pickup (Scheduled)",
    address: "Plot 42, Road 10, Banjara Hills, Hyderabad",
    status: "completed",
    paymentStatus: "Paid in Full (UPI)",
    baseAmount: "₹1,000",
    addonAmount: "₹200 (Box Pack & Press)",
    amount: "₹1,200",
    notes:
      "Customer requested extra pins on the pallu pleats for heavy bridal movement. Extra care for pure gold zari border.",
  },
  {
    id: "ORD-102",
    customer: "Ananya Reddy",
    phone: "+91 99887 65432",
    email: "ananya.reddy@outlook.com",
    service: "Pre-Pleating & Ironing",
    sareeType: "Banarasi Georgette",
    pleatCount: '7 Front Pleats (4.5" width)',
    palluStyle: "Classic Free-flow / Ironed Pin",
    packaging: "Standard Hanger Garment Bag",
    date: "2026-09-04",
    eventDate: "2026-09-06 (Sangeet Night)",
    deliveryType: "Doorstep Delivery",
    address: "Flat 302, Green Meadows, Jubilee Hills, Hyderabad",
    status: "in-progress",
    paymentStatus: "Advance Paid (₹500 / ₹350 due at delivery)",
    baseAmount: "₹750",
    addonAmount: "₹100 (Steam Pressing)",
    amount: "₹850",
    notes:
      "Delicate georgette fabric. Use low temperature steam iron only. Deliver before 4 PM on Sep 6.",
  },
  {
    id: "ORD-103",
    customer: "Deepa Krishnan",
    phone: "+91 94401 98765",
    email: "deepa.k@yahoo.com",
    service: "Pallu Pinning & Pleating",
    sareeType: "Tussar Silk",
    pleatCount: '5 Front Pleats (6" width)',
    palluStyle: 'Shoulder Pleats Only (34" length)',
    packaging: "Neat Protective Polybag",
    date: "2026-09-03",
    eventDate: "2026-09-07 (Family Function)",
    deliveryType: "Store Pickup",
    address: "Cyber Towers Lane, Madhapur, Hyderabad",
    status: "pending",
    paymentStatus: "Payment Pending at Pickup",
    baseAmount: "₹600",
    addonAmount: "₹0",
    amount: "₹600",
    notes:
      "Awaiting customer confirmation on exact pallu length before final pressing.",
  },
  {
    id: "ORD-104",
    customer: "Sneha Patel",
    phone: "+91 97033 11223",
    email: "sneha.patel@gmail.com",
    service: "Box Folding & Travel Pack",
    sareeType: "Chanderi Cotton Silk",
    pleatCount: '6 Front Pleats (5" width)',
    palluStyle: 'Neat Pin-fold (36" length)',
    packaging: "Compact Anti-wrinkle Travel Box Fold",
    date: "2026-09-02",
    eventDate: "2026-09-05 (Destination Wedding)",
    deliveryType: "Store Pickup",
    address: "Near Botanical Garden, Kondapur, Hyderabad",
    status: "completed",
    paymentStatus: "Paid in Full (Card)",
    baseAmount: "₹600",
    addonAmount: "₹150 (Travel Box Pack)",
    amount: "₹750",
    notes:
      "Packed ready for flight luggage. Anti-wrinkle folding confirmed by client.",
  },
  {
    id: "ORD-105",
    customer: "Meenakshi Sundaram",
    phone: "+91 91234 56789",
    email: "meenakshi.s@gmail.com",
    service: "Bridal Kanjeevaram Draping",
    sareeType: "Pure Handloom Silk",
    pleatCount: '8 Front Pleats (4.5" width)',
    palluStyle: "Traditional Temple Border Pleats",
    packaging: "Deluxe Hardcase Saree Box + Fragrance Mist",
    date: "2026-09-01",
    eventDate: "2026-09-05 (Wedding Ceremony)",
    deliveryType: "VIP Doorstep Delivery",
    address: "Financial District, Gachibowli, Hyderabad",
    status: "completed",
    paymentStatus: "Paid in Full (NetBanking)",
    baseAmount: "₹1,150",
    addonAmount: "₹250 (Deluxe Box & Fragrance Mist)",
    amount: "₹1,400",
    notes:
      "Heritage saree with heavy pallu. Handled with protective cotton lining and safety golden pins.",
  },
];

const filterOptions = ["All", "In Progress", "Completed", "Pending"];

const OrdersTable = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = initialOrders.filter((order) => {
    const matchesFilter =
      activeFilter === "All" ||
      order.status.toLowerCase() ===
        activeFilter.toLowerCase().replace(" ", "-");
    const matchesSearch =
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.sareeType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Paper className="orders-table-card">
      {/* Table Header & Controls */}
      <Box className="orders-table-card__top">
        <Box>
          <Typography variant="h6" className="title">
            Recent Orders
          </Typography>
          <Typography variant="caption" className="subtitle">
            Manage your recent orders
          </Typography>
        </Box>

        {/* Search Bar & Action */}
        <Box className="controls-row">
          <TextField
            size="small"
            placeholder="Search booking or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="search-icon" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            size="small"
            color="primary"
            className="view-all-btn"
          >
            View All
          </Button>
        </Box>
      </Box>

      {/* Filter Tabs */}
      <Stack direction="row" spacing={1} className="filter-chips-row">
        {filterOptions.map((filter) => (
          <Chip
            key={filter}
            label={filter}
            size="small"
            clickable
            onClick={() => setActiveFilter(filter)}
            className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
          />
        ))}
      </Stack>

      {/* Table */}
      <TableContainer className="table-wrapper">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="table-head-cell">Order ID</TableCell>
              <TableCell className="table-head-cell">Customer</TableCell>
              <TableCell className="table-head-cell">Service</TableCell>
              <TableCell className="table-head-cell">Saree Fabric</TableCell>
              <TableCell className="table-head-cell">Date</TableCell>
              <TableCell className="table-head-cell">Amount</TableCell>
              <TableCell className="table-head-cell">Status</TableCell>
              <TableCell className="table-head-cell" align="right">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="empty-cell">
                  No bookings found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="table-row-item">
                  <TableCell className="table-body-cell order-id">
                    {order.id}
                  </TableCell>
                  <TableCell className="table-body-cell customer-name">
                    {order.customer}
                  </TableCell>
                  <TableCell className="table-body-cell">
                    {order.service}
                  </TableCell>
                  <TableCell className="table-body-cell saree-fabric">
                    {order.sareeType}
                  </TableCell>
                  <TableCell className="table-body-cell date-cell">
                    {order.date}
                  </TableCell>
                  <TableCell className="table-body-cell amount-cell">
                    {order.amount}
                  </TableCell>
                  <TableCell className="table-body-cell">
                    <span className={`status-pill ${order.status}`}>
                      <span className="dot" />
                      {order.status.replace("-", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="table-body-cell" align="right">
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon className="action-icon" />}
                      className="details-btn"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Details Popup Modal */}
      <OrderDetailsModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </Paper>
  );
};

export default OrdersTable;
