import React, { useState, useMemo } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import OrderDetailsModal from "../OrderDetailsModal/OrderDetailsModal";
import {
  AppButton,
  AppTable,
  AppTableContainer,
  AppTableHead,
  AppTableBody,
  AppTableRow,
  AppTableCell,
  AppTableSortLabel,
  AppTablePagination,
} from "../../../components/common";
import { formatDateSafe } from "../../../firebase/dbService";
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
    date: "04-Sep-2026",
    eventDate: "08-Sep-2026 (Muhurtham Ceremony)",
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
    date: "04-Sep-2026",
    eventDate: "06-Sep-2026 (Sangeet Night)",
    deliveryType: "Doorstep Delivery",
    address: "Flat 302, Green Meadows, Jubilee Hills, Hyderabad",
    status: "in-progress",
    paymentStatus: "Pending Cash on Delivery",
    baseAmount: "₹650",
    addonAmount: "₹150 (Urgent Delivery)",
    amount: "₹800",
    notes:
      "Delicate antique thread work. Avoid high direct heat on pallu tassels.",
  },
  {
    id: "ORD-103",
    customer: "Kavitha Raman",
    phone: "+91 97001 11223",
    email: "kavitha.raman@tcs.com",
    service: "Draping Assistance (On-site)",
    sareeType: "Soft Silk",
    pleatCount: '5 Front Pleats (6" width)',
    palluStyle: "Single Pleat Pinned",
    packaging: "Breathable Non-woven Bag",
    date: "03-Sep-2026",
    eventDate: "05-Sep-2026 (Housewarming)",
    deliveryType: "Staff Draping at Venue",
    address: "House 18, Phase 2, Gachibowli, Hyderabad",
    status: "completed",
    paymentStatus: "Paid Online",
    baseAmount: "₹1,500",
    addonAmount: "₹0",
    amount: "₹1,500",
    notes: "Draper needs to arrive by 6:30 AM sharp at venue.",
  },
  {
    id: "ORD-104",
    customer: "Sneha Varma",
    phone: "+91 98480 99887",
    email: "sneha.v@gmail.com",
    service: "Standard Saree Pre-Pleating",
    sareeType: "Chiffon Designer Saree",
    pleatCount: '8 Sleek Pleats (4" width)',
    palluStyle: "Narrow Accordion Fold (32\")",
    packaging: "Standard Poly Wrap",
    date: "02-Sep-2026",
    eventDate: "07-Sep-2026 (Reception)",
    deliveryType: "Store Pickup",
    address: "Villa 12, Palm Springs, Madhapur, Hyderabad",
    status: "pending",
    paymentStatus: "Advance Paid (₹200 / ₹450 Balance)",
    baseAmount: "₹450",
    addonAmount: "₹0",
    amount: "₹450",
    notes: "Fabric tends to slip, reinforced invisible pins recommended.",
  },
  {
    id: "ORD-105",
    customer: "Divya Teja",
    phone: "+91 91234 56789",
    email: "divya.teja@yahoo.co.in",
    service: "Bridal Saree Pre-Pleating + Box Fold",
    sareeType: "Gadwal Pattu",
    pleatCount: '6 Front Pleats (5" width)',
    palluStyle: 'Royal Fan Pleats (40" length)',
    packaging: "Rigid Hardboard Box + Butter Paper Wrap",
    date: "01-Sep-2026",
    eventDate: "09-Sep-2026 (Engagement)",
    deliveryType: "Doorstep Delivery",
    address: "Apt 501, Lake Breeze, Kondapur, Hyderabad",
    status: "completed",
    paymentStatus: "Paid via GPay",
    baseAmount: "₹1,000",
    addonAmount: "₹200 (Box Pack)",
    amount: "₹1,200",
    notes:
      "Contrasting blouse delivered along with saree. Pin at exact waist measurement 30\".",
  },
  {
    id: "ORD-106",
    customer: "Meenakshi Sundaram",
    phone: "+91 90000 33445",
    email: "meena.sundaram@gmail.com",
    service: "Pre-Pleating & Ironing",
    sareeType: "Organza Floral",
    pleatCount: '6 Wide Pleats (6" width)',
    palluStyle: "Floating Pallu with Shoulder Pleats",
    packaging: "Standard Hanger Garment Bag",
    date: "30-Aug-2026",
    eventDate: "04-Sep-2026 (College Farewell)",
    deliveryType: "Store Pickup",
    address: "H.No 3-4-102, Barkatpura, Hyderabad",
    status: "cancelled",
    paymentStatus: "Refunded to Source",
    baseAmount: "₹650",
    addonAmount: "₹0",
    amount: "₹650",
    notes: "Order cancelled by customer due to event postponement.",
  },
];

const filterOptions = ["All", "completed", "in-progress", "pending", "cancelled"];

const OrdersTable = () => {
  const [orders] = useState(initialOrders);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Sorting and Pagination states
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
    setPage(0);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter =
        activeFilter === "All" || order.status === activeFilter;
      const matchesSearch =
        order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.sareeType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [orders, activeFilter, searchQuery]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";
      if (sortField === "amount") {
        aVal = parseInt(String(aVal).replace(/[^0-9]/g, ""), 10) || 0;
        bVal = parseInt(String(bVal).replace(/[^0-9]/g, ""), 10) || 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredOrders, sortField, sortDirection]);

  const paginatedOrders = useMemo(() => {
    return sortedOrders.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedOrders, page, rowsPerPage]);

  return (
    <div className="orders-table-card">
      {/* Table Header & Controls */}
      <div className="orders-table-card__top">
        <div>
          <h3 className="title">
            Recent Orders
          </h3>
          <p className="subtitle">
            Manage your recent orders
          </p>
        </div>

        {/* Search Bar & Action */}
        <div className="controls-row">
          <div className="search-field">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search booking or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <AppButton
            variant="secondary"
            size="sm"
            className="view-all-btn"
          >
            View All
          </AppButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-chips-row">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Table */}
      <AppTableContainer className="table-wrapper">
        <AppTable>
          <AppTableHead>
            <AppTableRow>
              <AppTableCell head className="table-head-cell">
                <AppTableSortLabel
                  active={sortField === "id"}
                  direction={sortField === "id" ? sortDirection : "asc"}
                  onClick={() => handleRequestSort("id")}
                >
                  Order ID
                </AppTableSortLabel>
              </AppTableCell>
              <AppTableCell head className="table-head-cell">
                <AppTableSortLabel
                  active={sortField === "customer"}
                  direction={sortField === "customer" ? sortDirection : "asc"}
                  onClick={() => handleRequestSort("customer")}
                >
                  Customer
                </AppTableSortLabel>
              </AppTableCell>
              <AppTableCell head className="table-head-cell">
                <AppTableSortLabel
                  active={sortField === "service"}
                  direction={sortField === "service" ? sortDirection : "asc"}
                  onClick={() => handleRequestSort("service")}
                >
                  Service
                </AppTableSortLabel>
              </AppTableCell>
              <AppTableCell head className="table-head-cell">
                <AppTableSortLabel
                  active={sortField === "sareeType"}
                  direction={sortField === "sareeType" ? sortDirection : "asc"}
                  onClick={() => handleRequestSort("sareeType")}
                >
                  Saree Fabric
                </AppTableSortLabel>
              </AppTableCell>
              <AppTableCell head className="table-head-cell">
                <AppTableSortLabel
                  active={sortField === "date"}
                  direction={sortField === "date" ? sortDirection : "asc"}
                  onClick={() => handleRequestSort("date")}
                >
                  Date
                </AppTableSortLabel>
              </AppTableCell>
              <AppTableCell head className="table-head-cell">
                <AppTableSortLabel
                  active={sortField === "amount"}
                  direction={sortField === "amount" ? sortDirection : "asc"}
                  onClick={() => handleRequestSort("amount")}
                >
                  Amount
                </AppTableSortLabel>
              </AppTableCell>
              <AppTableCell head className="table-head-cell">
                <AppTableSortLabel
                  active={sortField === "status"}
                  direction={sortField === "status" ? sortDirection : "asc"}
                  onClick={() => handleRequestSort("status")}
                >
                  Status
                </AppTableSortLabel>
              </AppTableCell>
              <AppTableCell
                head
                className="table-head-cell"
                style={{ textAlign: 'right' }}
              >
                Action
              </AppTableCell>
            </AppTableRow>
          </AppTableHead>
          <AppTableBody>
            {filteredOrders.length === 0 ? (
              <AppTableRow>
                <AppTableCell colSpan={8} className="empty-cell">
                  No bookings found matching criteria.
                </AppTableCell>
              </AppTableRow>
            ) : (
              paginatedOrders.map((order) => (
                <AppTableRow key={order.id} className="table-row-item">
                  <AppTableCell className="table-body-cell order-id">
                    {order.id}
                  </AppTableCell>
                  <AppTableCell className="table-body-cell customer-name">
                    {order.customer}
                  </AppTableCell>
                  <AppTableCell className="table-body-cell">
                    {order.service}
                  </AppTableCell>
                  <AppTableCell className="table-body-cell saree-fabric">
                    {order.sareeType}
                  </AppTableCell>
                  <AppTableCell className="table-body-cell date-cell">
                    {formatDateSafe(order.date)}
                  </AppTableCell>
                  <AppTableCell className="table-body-cell amount-cell">
                    {order.amount}
                  </AppTableCell>
                  <AppTableCell className="table-body-cell">
                    <span className={`status-pill ${order.status}`}>
                      <span className="dot" />
                      {order.status.replace("-", " ")}
                    </span>
                  </AppTableCell>
                  <AppTableCell
                    className="table-body-cell"
                    style={{ textAlign: 'right' }}
                  >
                    <AppButton
                      size="sm"
                      variant="secondary"
                      startIcon={<VisibilityIcon className="action-icon" />}
                      className="details-btn"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Details
                    </AppButton>
                  </AppTableCell>
                </AppTableRow>
              ))
            )}
          </AppTableBody>
        </AppTable>
        <AppTablePagination
          count={filteredOrders.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </AppTableContainer>

      {/* Order Details Popup Modal */}
      <OrderDetailsModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrdersTable;
