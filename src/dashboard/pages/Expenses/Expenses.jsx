import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Navigate } from "react-router-dom";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TodayOutlinedIcon from "@mui/icons-material/TodayOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  getAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  formatDateSafe,
  getTimestampMillis,
  getModifiedDateTime,
} from "../../../firebase/dbService";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
} from "../../../firebase/schema";
import { DateTimeCell } from "../../components/DateTimeCell/DateTimeCell";
import StatCard from "../../components/StatCard/StatCard";
import {
  AppButton,
  AppInput,
  AppSelect,
  AppModal,
  AppBadge,
  AppTabs,
  AppSpinner,
  AppTable,
  AppTableHead,
  AppTableBody,
  AppTableRow,
  AppTableCell,
  AppTableSortLabel,
  AppTablePagination,
  AppViewToggle,
} from "../../../components/common";
import "./Expenses.scss";

/**
 * Category styling & icon helper
 */
const getCategoryBadgeVariant = (category) => {
  switch (category) {
    case EXPENSE_CATEGORIES.STORE_ITEMS:
      return "success";
    case EXPENSE_CATEGORIES.TRAVELLING:
      return "staff";
    case EXPENSE_CATEGORIES.PAID_REVIEWS:
      return "client";
    case EXPENSE_CATEGORIES.OTHERS:
    default:
      return "active";
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case EXPENSE_CATEGORIES.STORE_ITEMS:
      return <StoreOutlinedIcon style={{ fontSize: 14 }} />;
    case EXPENSE_CATEGORIES.TRAVELLING:
      return <DirectionsCarOutlinedIcon style={{ fontSize: 14 }} />;
    case EXPENSE_CATEGORIES.PAID_REVIEWS:
      return <RateReviewOutlinedIcon style={{ fontSize: 14 }} />;
    case EXPENSE_CATEGORIES.OTHERS:
    default:
      return <MoreHorizOutlinedIcon style={{ fontSize: 14 }} />;
  }
};

/**
 * Payment method styling & icon helper
 */
const getPaymentBadgeVariant = (method) => {
  switch (method) {
    case EXPENSE_PAYMENT_METHODS.UPI:
      return "success";
    case EXPENSE_PAYMENT_METHODS.CASH:
      return "active";
    case EXPENSE_PAYMENT_METHODS.BANK_TRANSFER:
      return "staff";
    case EXPENSE_PAYMENT_METHODS.CARD:
      return "client";
    default:
      return "neutral";
  }
};

/**
 * Currency formatter (INR ₹)
 */
const formatINR = (val) => {
  const num = Number(val) || 0;
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formik Validation Schema (without purpose)
 */
const expenseValidationSchema = Yup.object({
  categoryType: Yup.string()
    .oneOf(Object.values(EXPENSE_CATEGORIES), "Select a valid category")
    .required("Category is required"),
  paymentMethod: Yup.string()
    .oneOf(Object.values(EXPENSE_PAYMENT_METHODS), "Select a payment method")
    .required("Payment method is required"),
  name: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .required("Expense name / recipient is required"),
  amount: Yup.number()
    .typeError("Amount must be a valid number")
    .positive("Amount must be greater than 0")
    .required("Amount is required"),
  description: Yup.string()
    .trim()
    .max(600, "Description cannot exceed 600 characters"),
});

const Expenses = () => {
  const { currentUser, userProfile, isSuperAdmin, role } = useAuth();

  // Role Access Guard: Exclusively Admin and SuperAdmin
  const userRoleLower = (role || "").toLowerCase();
  const hasAccess =
    isSuperAdmin || userRoleLower === "superadmin" || userRoleLower === "admin";

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Current authenticated user display name
  const currentAuthorName =
    userProfile?.username ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Admin";

  // Data State
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [showFilterAccordion, setShowFilterAccordion] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  // Expanded Table Rows (Set of expanded IDs for accordion view)
  const [expandedRowIds, setExpandedRowIds] = useState(new Set());

  // Sorting & Pagination
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals State
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [expenseForView, setExpenseForView] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle Table Row Accordion
  const toggleRowExpand = (id) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch Expenses
  const loadExpenses = async (isManualRefresh = false) => {
    setLoading(true);
    if (isManualRefresh) setRefreshing(true);

    try {
      const data = await getAllExpenses();
      setExpenses(data || []);
      if (isManualRefresh) {
        toast.success("Expenses refreshed successfully");
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Formik: Add Expense
  const addFormik = useFormik({
    initialValues: {
      categoryType: EXPENSE_CATEGORIES.STORE_ITEMS,
      paymentMethod: EXPENSE_PAYMENT_METHODS.UPI,
      name: "",
      amount: "",
      description: "",
    },
    validationSchema: expenseValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const created = await createExpense({
          ...values,
          amount: Number(values.amount),
          createdBy: currentAuthorName,
        });
        toast.success("Expense recorded successfully!");
        setExpenses((prev) => [
          created,
          ...prev.filter((e) => e.id !== created.id),
        ]);
        resetForm();
        setOpenAddModal(false);
      } catch (err) {
        console.error("Create expense error:", err);
        toast.error("Failed to record expense");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Formik: Edit Expense
  const editFormik = useFormik({
    initialValues: {
      categoryType: EXPENSE_CATEGORIES.STORE_ITEMS,
      paymentMethod: EXPENSE_PAYMENT_METHODS.UPI,
      name: "",
      amount: "",
      description: "",
    },
    validationSchema: expenseValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!expenseToEdit) return;
      try {
        await updateExpense(expenseToEdit.id, {
          ...values,
          amount: Number(values.amount),
          updatedBy: currentAuthorName,
        });
        toast.success("Expense updated successfully!");
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === expenseToEdit.id
              ? {
                  ...e,
                  ...values,
                  amount: Number(values.amount),
                  updatedBy: currentAuthorName,
                  updatedAt: new Date().toISOString(),
                }
              : e,
          ),
        );
        setOpenEditModal(false);
        setExpenseToEdit(null);
      } catch (err) {
        console.error("Update expense error:", err);
        toast.error("Failed to update expense");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Delete Expense Handler
  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      toast.success("Expense deleted successfully");
      setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id));
      setOpenDeleteModal(false);
      setExpenseToDelete(null);
    } catch (err) {
      console.error("Delete expense error:", err);
      toast.error("Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Edit Modal with Prepopulated Values
  const handleOpenEdit = (exp) => {
    setExpenseToEdit(exp);
    editFormik.setValues({
      categoryType: exp.categoryType || EXPENSE_CATEGORIES.STORE_ITEMS,
      paymentMethod: exp.paymentMethod || EXPENSE_PAYMENT_METHODS.UPI,
      name: exp.name || "",
      amount: exp.amount !== undefined ? String(exp.amount) : "",
      description: exp.description || exp.purpose || "",
    });
    setOpenEditModal(true);
  };

  // Calculations for Overview StatCards
  const { totalExpenseAmount, thisMonthAmount, todayAmount, topCategoryData } =
    useMemo(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();

      let total = 0;
      let thisMonth = 0;
      let today = 0;
      const categorySums = {};

      expenses.forEach((e) => {
        const amt = Number(e.amount) || 0;
        total += amt;

        // Category breakdown
        const cat = e.categoryType || "Others";
        categorySums[cat] = (categorySums[cat] || 0) + amt;

        // Date breakdown
        const millis = getTimestampMillis(e.createdAt || e.expenseDate);
        if (millis > 0) {
          const d = new Date(millis);
          if (
            d.getFullYear() === currentYear &&
            d.getMonth() === currentMonth
          ) {
            thisMonth += amt;
            if (d.getDate() === currentDay) {
              today += amt;
            }
          }
        }
      });

      // Find top category
      let topCat = "None";
      let topVal = 0;
      Object.entries(categorySums).forEach(([cat, sum]) => {
        if (sum > topVal) {
          topVal = sum;
          topCat = cat;
        }
      });

      return {
        totalExpenseAmount: total,
        thisMonthAmount: thisMonth,
        todayAmount: today,
        topCategoryData: { name: topCat, amount: topVal },
      };
    }, [expenses]);

  // Tab count calculations
  const tabCounts = useMemo(() => {
    const counts = {
      ALL: expenses.length,
      [EXPENSE_CATEGORIES.STORE_ITEMS]: 0,
      [EXPENSE_CATEGORIES.TRAVELLING]: 0,
      [EXPENSE_CATEGORIES.PAID_REVIEWS]: 0,
      [EXPENSE_CATEGORIES.OTHERS]: 0,
    };

    expenses.forEach((e) => {
      if (counts[e.categoryType] !== undefined) {
        counts[e.categoryType] += 1;
      } else {
        counts[EXPENSE_CATEGORIES.OTHERS] += 1;
      }
    });

    return counts;
  }, [expenses]);

  const expenseTabs = useMemo(
    () => [
      {
        value: "ALL",
        label: `All Expenses (${tabCounts.ALL || 0})`,
      },
      {
        value: EXPENSE_CATEGORIES.STORE_ITEMS,
        label: `Store Items (${tabCounts[EXPENSE_CATEGORIES.STORE_ITEMS] || 0})`,
      },
      {
        value: EXPENSE_CATEGORIES.TRAVELLING,
        label: `Travelling (${tabCounts[EXPENSE_CATEGORIES.TRAVELLING] || 0})`,
      },
      {
        value: EXPENSE_CATEGORIES.PAID_REVIEWS,
        label: `Paid Reviews (${tabCounts[EXPENSE_CATEGORIES.PAID_REVIEWS] || 0})`,
      },
      {
        value: EXPENSE_CATEGORIES.OTHERS,
        label: `Others (${tabCounts[EXPENSE_CATEGORIES.OTHERS] || 0})`,
      },
    ],
    [tabCounts],
  );

  // Active filter count for badge indicator (payment method and time filters)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (paymentFilter !== "ALL") count++;
    if (timeFilter !== "ALL") count++;
    return count;
  }, [paymentFilter, timeFilter]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setActiveTab("ALL");
    setPaymentFilter("ALL");
    setTimeFilter("ALL");
    setSearchTerm("");
    setPage(0);
  };

  // Filtering Logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    return expenses.filter((item) => {
      // 1. Category Tab Filter
      if (activeTab !== "ALL" && item.categoryType !== activeTab) {
        return false;
      }

      // 2. Payment Method Filter
      if (paymentFilter !== "ALL" && item.paymentMethod !== paymentFilter) {
        return false;
      }

      // 3. Time Filter
      if (timeFilter !== "ALL") {
        const millis = getTimestampMillis(item.createdAt || item.expenseDate);
        if (millis > 0) {
          const d = new Date(millis);
          if (timeFilter === "TODAY") {
            if (
              d.getFullYear() !== currentYear ||
              d.getMonth() !== currentMonth ||
              d.getDate() !== currentDay
            ) {
              return false;
            }
          } else if (timeFilter === "THIS_WEEK") {
            const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const diffToMonday = (dayOfWeek + 6) % 7; // days since Monday
            const startOfWeek = new Date(currentYear, currentMonth, currentDay - diffToMonday, 0, 0, 0, 0).getTime();
            const endOfWeek = new Date(currentYear, currentMonth, currentDay - diffToMonday + 7, 0, 0, 0, 0).getTime() - 1;
            if (millis < startOfWeek || millis > endOfWeek) {
              return false;
            }
          } else if (timeFilter === "THIS_MONTH") {
            if (
              d.getFullYear() !== currentYear ||
              d.getMonth() !== currentMonth
            ) {
              return false;
            }
          } else if (timeFilter === "CURRENT_FY") {
            const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
            const fyStartMillis = new Date(fyStartYear, 3, 1, 0, 0, 0, 0).getTime();
            const fyEndMillis = new Date(fyStartYear + 1, 2, 31, 23, 59, 59, 999).getTime();
            if (millis < fyStartMillis || millis > fyEndMillis) {
              return false;
            }
          }
        }
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = (item.name || "").toLowerCase().includes(query);
        const matchDesc = (item.description || item.purpose || "")
          .toLowerCase()
          .includes(query);
        const matchCategory = (item.categoryType || "")
          .toLowerCase()
          .includes(query);
        const matchPayment = (item.paymentMethod || "")
          .toLowerCase()
          .includes(query);
        const matchCreator = (item.createdBy || "")
          .toLowerCase()
          .includes(query);
        const matchModifier = (item.updatedBy || "")
          .toLowerCase()
          .includes(query);
        const matchAmount = String(item.amount || "").includes(query);

        if (
          !matchName &&
          !matchDesc &&
          !matchCategory &&
          !matchPayment &&
          !matchCreator &&
          !matchModifier &&
          !matchAmount
        ) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, activeTab, paymentFilter, timeFilter, searchTerm]);

  // Sorting Logic
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "createdAt" || sortField === "expenseDate") {
        valA = getTimestampMillis(a.createdAt || a.expenseDate);
        valB = getTimestampMillis(b.createdAt || b.expenseDate);
      } else if (sortField === "amount") {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredExpenses, sortField, sortDirection]);

  // Paginated Slicing
  const paginatedExpenses = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedExpenses.slice(start, start + rowsPerPage);
  }, [sortedExpenses, page, rowsPerPage]);

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.warning("No expense data available to export");
      return;
    }

    const headers = [
      "Date",
      "Expense Name",
      "Category",
      "Description",
      "Payment Method",
      "Amount (INR)",
      "Recorded By",
      "Last Modified By",
    ];

    const rows = filteredExpenses.map((exp) => [
      `"${formatDateSafe(exp.createdAt || exp.expenseDate)}"`,
      `"${(exp.name || "").replace(/"/g, '""')}"`,
      `"${exp.categoryType || ""}"`,
      `"${(exp.description || exp.purpose || "").replace(/"/g, '""')}"`,
      `"${exp.paymentMethod || ""}"`,
      Number(exp.amount) || 0,
      `"${exp.createdBy || ""}"`,
      `"${exp.updatedBy || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expenses exported successfully!");
  };

  // Category & Payment Select Options
  const categoryOptions = useMemo(
    () => [
      {
        value: EXPENSE_CATEGORIES.STORE_ITEMS,
        label: "Store Items",
        icon: <StoreOutlinedIcon style={{ fontSize: 16 }} />,
      },
      {
        value: EXPENSE_CATEGORIES.TRAVELLING,
        label: "Travelling",
        icon: <DirectionsCarOutlinedIcon style={{ fontSize: 16 }} />,
      },
      {
        value: EXPENSE_CATEGORIES.PAID_REVIEWS,
        label: "Paid Reviews",
        icon: <RateReviewOutlinedIcon style={{ fontSize: 16 }} />,
      },
      {
        value: EXPENSE_CATEGORIES.OTHERS,
        label: "Others",
        icon: <MoreHorizOutlinedIcon style={{ fontSize: 16 }} />,
      },
    ],
    [],
  );

  const paymentOptions = useMemo(
    () => [
      { value: EXPENSE_PAYMENT_METHODS.UPI, label: "UPI" },
      { value: EXPENSE_PAYMENT_METHODS.CASH, label: "Cash" },
      { value: EXPENSE_PAYMENT_METHODS.BANK_TRANSFER, label: "Bank Transfer" },
      { value: EXPENSE_PAYMENT_METHODS.CARD, label: "Card" },
    ],
    [],
  );

  const paymentFilterOptions = useMemo(
    () => [{ value: "ALL", label: "All Payment Methods" }, ...paymentOptions],
    [paymentOptions],
  );

  const timeFilterOptions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const fyEndShort = String(fyStartYear + 1).slice(-2);

    return [
      { value: "ALL", label: "All Timeframes" },
      { value: "TODAY", label: "Today" },
      { value: "THIS_WEEK", label: "This Week" },
      { value: "THIS_MONTH", label: "This Month" },
      { value: "CURRENT_FY", label: `Current FY (${fyStartYear}-${fyEndShort})` },
    ];
  }, []);

  return (
    <div className="expenses-page">
      {/* Top Header */}
      <div className="expenses-page__header">
        <div className="header-title-wrap">
          <h1 className="page-title">Expense Management</h1>
          <p className="page-subtitle">
            Track, record and analyze business expenditures and operational
            costs
          </p>
        </div>
        <div className="header-actions">
          <AppButton
            variant="secondary"
            size="md"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExportCSV}
            title="Export Expenses as CSV"
          >
            Export
          </AppButton>
          <AppButton
            variant="secondary"
            size="md"
            startIcon={
              <RefreshOutlinedIcon
                className={loading || refreshing ? "spin-icon" : ""}
              />
            }
            onClick={() => loadExpenses(true)}
            disabled={loading || refreshing}
            className="refresh-btn"
            title="Refresh list"
          >
            {loading || refreshing ? "Refreshing..." : "Refresh"}
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setOpenAddModal(true)}
            className="create-expense-btn"
          >
            Add Expense
          </AppButton>
        </div>
      </div>

      {/* 4 StatCards Overview Grid */}
      <div className="expenses-page__stats-grid">
        <StatCard
          title="Total Expenses"
          value={formatINR(totalExpenseAmount)}
          change={`${expenses.length} Records Logged`}
          trendType="completed"
          icon={<AccountBalanceWalletOutlinedIcon />}
        />
        <StatCard
          title="This Month"
          value={formatINR(thisMonthAmount)}
          change="Current calendar month"
          trendType="completed"
          icon={<CalendarTodayOutlinedIcon />}
        />
        <StatCard
          title="Today's Spending"
          value={formatINR(todayAmount)}
          change="Recorded today"
          trendType="pending"
          icon={<TodayOutlinedIcon />}
        />
        <StatCard
          title="Top Category"
          value={topCategoryData.name}
          change={
            topCategoryData.amount > 0
              ? formatINR(topCategoryData.amount)
              : "No expenses"
          }
          trendType="completed"
          icon={<TrendingUpOutlinedIcon />}
        />
      </div>

      {/* 1. Filter Tabs Row */}
      <div className="expenses-page__tabs-row">
        <AppTabs
          tabs={expenseTabs}
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setPage(0);
          }}
        />
      </div>

      {/* 2. Toolbar: View Switcher, Filter Toggle & Search */}
      <div className="expenses-page__toolbar">
        <div className="toolbar-left">
          <AppViewToggle value={viewMode} onChange={setViewMode} />

          <button
            type="button"
            className={`filter-accordion-toggle-btn ${showFilterAccordion ? "is-active" : ""}`}
            onClick={() => setShowFilterAccordion((prev) => !prev)}
            aria-expanded={showFilterAccordion}
          >
            <FilterListOutlinedIcon className="filter-icon" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="filter-badge-count">{activeFilterCount}</span>
            )}
            <KeyboardArrowDownIcon
              className={`chevron-icon ${showFilterAccordion ? "is-rotated" : ""}`}
            />
          </button>
        </div>

        <div className="expenses-search-field">
          <AppInput
            placeholder="Search expenses by name, description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            startAdornment={<SearchOutlinedIcon />}
          />
        </div>
      </div>

      {/* Accordion Style Filter Section */}
      {showFilterAccordion && (
        <div className="expenses-filter-accordion">
          {/* Payment Method & Timeframe Dropdowns */}
          <div className="filter-dropdowns-row">
            <AppSelect
              label="Payment Method"
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(0);
              }}
              options={paymentFilterOptions}
              size="sm"
            />

            <AppSelect
              label="Time Range"
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setPage(0);
              }}
              options={timeFilterOptions}
              size="sm"
            />
          </div>

          {/* Bottom Filter Summary & Clear Action */}
          <div className="filter-bottom-actions">
            <span className="active-filter-summary">
              Showing <strong>{filteredExpenses.length}</strong> of{" "}
              <strong>{expenses.length}</strong> total expenses
            </span>
            {activeFilterCount > 0 && (
              <AppButton
                variant="ghost"
                size="sm"
                startIcon={<ClearAllOutlinedIcon />}
                onClick={() => {
                  setPaymentFilter("ALL");
                  setTimeFilter("ALL");
                  setPage(0);
                }}
              >
                Clear Filters
              </AppButton>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "64px 0",
          }}
        >
          <AppSpinner size="lg" color="gold" />
        </div>
      )}

      {/* Content Area: Table vs Grid */}
      {!loading && (
        <>
          {viewMode === "table" ? (
            <div className="expenses-table-card">
              <div className="table-responsive">
                <AppTable className="expenses-table">
                  <AppTableHead>
                    <AppTableRow>
                      <AppTableCell>
                        <AppTableSortLabel
                          active={sortField === "createdAt"}
                          direction={
                            sortField === "createdAt" ? sortDirection : "asc"
                          }
                          onClick={() => handleRequestSort("createdAt")}
                        >
                          Date & Time
                        </AppTableSortLabel>
                      </AppTableCell>
                      <AppTableCell>
                        <AppTableSortLabel
                          active={sortField === "name"}
                          direction={
                            sortField === "name" ? sortDirection : "asc"
                          }
                          onClick={() => handleRequestSort("name")}
                        >
                          Name
                        </AppTableSortLabel>
                      </AppTableCell>
                      <AppTableCell>
                        <AppTableSortLabel
                          active={sortField === "categoryType"}
                          direction={
                            sortField === "categoryType" ? sortDirection : "asc"
                          }
                          onClick={() => handleRequestSort("categoryType")}
                        >
                          Category
                        </AppTableSortLabel>
                      </AppTableCell>
                      <AppTableCell>
                        <AppTableSortLabel
                          active={sortField === "paymentMethod"}
                          direction={
                            sortField === "paymentMethod"
                              ? sortDirection
                              : "asc"
                          }
                          onClick={() => handleRequestSort("paymentMethod")}
                        >
                          Payment Method
                        </AppTableSortLabel>
                      </AppTableCell>
                      <AppTableCell>
                        <AppTableSortLabel
                          active={sortField === "amount"}
                          direction={
                            sortField === "amount" ? sortDirection : "asc"
                          }
                          onClick={() => handleRequestSort("amount")}
                        >
                          Amount
                        </AppTableSortLabel>
                      </AppTableCell>
                      <AppTableCell className="th-actions">
                        Actions
                      </AppTableCell>
                    </AppTableRow>
                  </AppTableHead>
                  <AppTableBody>
                    {paginatedExpenses.length === 0 ? (
                      <AppTableRow>
                        <AppTableCell
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            padding: "48px 16px",
                            color: "rgba(230, 216, 163, 0.6)",
                          }}
                        >
                          {searchTerm ||
                          activeTab !== "ALL" ||
                          paymentFilter !== "ALL" ||
                          timeFilter !== "ALL"
                            ? "No expenses match your search or filter criteria."
                            : "No expenses recorded yet. Click 'Add Expense' to create your first record."}
                        </AppTableCell>
                      </AppTableRow>
                    ) : (
                      paginatedExpenses.map((exp) => {
                        const isExpanded = expandedRowIds.has(exp.id);
                        const descText = exp.description || exp.purpose || "";
                        const modInfo = getModifiedDateTime(
                          exp.updatedAt,
                          exp.createdAt || exp.expenseDate,
                        );

                        return (
                          <React.Fragment key={exp.id}>
                            <AppTableRow
                              className={`expense-table-row ${isExpanded ? "is-row-expanded" : ""}`}
                              onClick={() => toggleRowExpand(exp.id)}
                            >
                              <AppTableCell>
                                <DateTimeCell
                                  value={exp.createdAt || exp.expenseDate}
                                />
                              </AppTableCell>

                              <AppTableCell>
                                <div className="expense-name-cell">
                                  <span className="expense-name">
                                    {exp.name || "—"}
                                  </span>
                                </div>
                              </AppTableCell>

                              <AppTableCell>
                                <AppBadge
                                  variant={getCategoryBadgeVariant(
                                    exp.categoryType,
                                  )}
                                  icon={getCategoryIcon(exp.categoryType)}
                                >
                                  {exp.categoryType ||
                                    EXPENSE_CATEGORIES.STORE_ITEMS}
                                </AppBadge>
                              </AppTableCell>

                              <AppTableCell>
                                <AppBadge
                                  variant={getPaymentBadgeVariant(
                                    exp.paymentMethod,
                                  )}
                                  icon={
                                    <PaymentOutlinedIcon
                                      style={{ fontSize: 13 }}
                                    />
                                  }
                                >
                                  {exp.paymentMethod || "UPI"}
                                </AppBadge>
                              </AppTableCell>

                              <AppTableCell>
                                <span className="expense-amount-cell">
                                  {formatINR(exp.amount)}
                                </span>
                              </AppTableCell>

                              <AppTableCell>
                                <div
                                  className="action-btns"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <AppButton
                                    variant="secondary"
                                    size="sm"
                                    square
                                    className="action-btn--view"
                                    title="View Expense Details"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpenseForView(exp);
                                      setOpenViewModal(true);
                                    }}
                                  >
                                    <VisibilityOutlinedIcon
                                      style={{ fontSize: 16 }}
                                    />
                                  </AppButton>
                                  <AppButton
                                    variant="secondary"
                                    size="sm"
                                    square
                                    className="action-btn--edit"
                                    title="Edit Expense"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEdit(exp);
                                    }}
                                  >
                                    <EditOutlinedIcon
                                      style={{ fontSize: 16 }}
                                    />
                                  </AppButton>
                                  <AppButton
                                    variant="secondary"
                                    size="sm"
                                    square
                                    className="action-btn--delete"
                                    title="Delete Expense"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpenseToDelete(exp);
                                      setOpenDeleteModal(true);
                                    }}
                                  >
                                    <DeleteOutlineIcon
                                      style={{ fontSize: 16 }}
                                    />
                                  </AppButton>

                                  {/* View More Button (Accordion Expand) */}
                                  <AppButton
                                    variant="secondary"
                                    size="sm"
                                    square
                                    className={`action-btn--more ${isExpanded ? "is-active" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpand(exp.id);
                                    }}
                                    aria-expanded={isExpanded}
                                    title={
                                      isExpanded
                                        ? "Hide Details"
                                        : "View More Details"
                                    }
                                  >
                                    <KeyboardArrowDownIcon
                                      style={{
                                        fontSize: 18,
                                        transform: isExpanded
                                          ? "rotate(180deg)"
                                          : "rotate(0deg)",
                                        transition: "transform 0.25s ease",
                                      }}
                                    />
                                  </AppButton>
                                </div>
                              </AppTableCell>
                            </AppTableRow>

                            {/* Expandable View More Accordion Row */}
                            {isExpanded && (
                              <AppTableRow className="table-expanded-row">
                                <AppTableCell
                                  colSpan={7}
                                  className="table-expanded-cell"
                                >
                                  <div className="table-expanded-container">
                                    {/* Description Tile */}
                                    <div className="expanded-tile expanded-tile--description">
                                      <div className="tile-header">
                                        <DescriptionOutlinedIcon className="tile-icon" />
                                        <span>Full Description / Notes</span>
                                      </div>
                                      <div className="tile-content">
                                        {descText ? (
                                          <span>{descText}</span>
                                        ) : (
                                          <span className="empty-hint">
                                            No additional description provided.
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Created By & Created At */}
                                    <div className="expanded-tile">
                                      <div className="tile-header">
                                        <PersonOutlineIcon className="tile-icon" />
                                        <span>Created By & Date</span>
                                      </div>
                                      <div className="tile-content">
                                        <div style={{ marginBottom: 4 }}>
                                          <span className="editor-name">
                                            {exp.createdBy || "Admin"}
                                          </span>
                                        </div>
                                        <DateTimeCell
                                          value={
                                            exp.createdAt || exp.expenseDate
                                          }
                                        />
                                      </div>
                                    </div>

                                    {/* Last Modified Tile */}
                                    <div className="expanded-tile">
                                      <div className="tile-header">
                                        <ScheduleOutlinedIcon className="tile-icon" />
                                        <span>Last Modified</span>
                                      </div>
                                      <div className="tile-content">
                                        {modInfo && exp.updatedBy ? (
                                          <>
                                            <div style={{ marginBottom: 4 }}>
                                              <span className="editor-name">
                                                {exp.updatedBy}
                                              </span>
                                            </div>
                                            <div className="table-date-time-cell">
                                              <span className="table-date-text">
                                                {modInfo.date}
                                              </span>
                                              {modInfo.time && (
                                                <span className="table-time-text">
                                                  {modInfo.time}
                                                </span>
                                              )}
                                            </div>
                                          </>
                                        ) : (
                                          <span className="empty-hint">-</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </AppTableCell>
                              </AppTableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </AppTableBody>
                </AppTable>
              </div>

              <AppTablePagination
                count={sortedExpenses.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </div>
          ) : (
            <div className="expenses-grid-wrapper">
              <div className="expenses-grid">
                {paginatedExpenses.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "48px 16px",
                      color: "var(--text-muted)",
                      background: "var(--bg-card)",
                      borderRadius: "12px",
                      border: "1px solid var(--surface-border)",
                    }}
                  >
                    {searchTerm ||
                    activeTab !== "ALL" ||
                    paymentFilter !== "ALL" ||
                    timeFilter !== "ALL"
                      ? "No expenses match your search or filter criteria."
                      : "No expenses recorded yet. Click 'Add Expense' to create your first record."}
                  </div>
                ) : (
                  paginatedExpenses.map((exp) => {
                    const desc = exp.description || exp.purpose || "";

                    return (
                      <div key={exp.id} className="expense-grid-card">
                        <div className="card-top">
                          <div className="card-header-row">
                            <AppBadge
                              variant={getCategoryBadgeVariant(
                                exp.categoryType,
                              )}
                              icon={getCategoryIcon(exp.categoryType)}
                            >
                              {exp.categoryType}
                            </AppBadge>
                            <AppBadge
                              variant={getPaymentBadgeVariant(
                                exp.paymentMethod,
                              )}
                              icon={
                                <PaymentOutlinedIcon style={{ fontSize: 12 }} />
                              }
                            >
                              {exp.paymentMethod}
                            </AppBadge>
                          </div>

                          <div className="card-amount">
                            {formatINR(exp.amount)}
                          </div>

                          <div className="card-name-row">
                            <span className="card-name">{exp.name || "—"}</span>
                            {desc && <p className="card-purpose">{desc}</p>}
                          </div>

                          <div className="card-meta-row">
                            <div className="meta-item">
                              <PersonOutlineIcon />
                              <span>{exp.createdBy || "Admin"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="card-footer">
                          <div className="card-date">
                            <CalendarTodayOutlinedIcon
                              style={{ fontSize: 13 }}
                            />
                            <DateTimeCell
                              value={exp.createdAt || exp.expenseDate}
                            />
                          </div>

                          <div className="action-btns">
                            <AppButton
                              variant="secondary"
                              size="sm"
                              square
                              className="action-btn--view"
                              title="View Expense Details"
                              onClick={() => {
                                setExpenseForView(exp);
                                setOpenViewModal(true);
                              }}
                            >
                              <VisibilityOutlinedIcon
                                style={{ fontSize: 16 }}
                              />
                            </AppButton>
                            <AppButton
                              variant="secondary"
                              size="sm"
                              square
                              className="action-btn--edit"
                              title="Edit Expense"
                              onClick={() => handleOpenEdit(exp)}
                            >
                              <EditOutlinedIcon style={{ fontSize: 16 }} />
                            </AppButton>
                            <AppButton
                              variant="secondary"
                              size="sm"
                              square
                              className="action-btn--delete"
                              title="Delete Expense"
                              onClick={() => {
                                setExpenseToDelete(exp);
                                setOpenDeleteModal(true);
                              }}
                            >
                              <DeleteOutlineIcon style={{ fontSize: 16 }} />
                            </AppButton>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ marginTop: "16px" }}>
                <AppTablePagination
                  count={sortedExpenses.length}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 1. Modal: Add Expense                                          */}
      {/* ============================================================== */}
      <AppModal
        open={openAddModal}
        onClose={() => !addFormik.isSubmitting && setOpenAddModal(false)}
        title="Record New Expense"
        subtitle="Log a business purchase, operational payment, or vendor cost"
        maxWidth="md"
        actions={
          <>
            <AppButton
              variant="ghost"
              onClick={() => {
                addFormik.resetForm();
                setOpenAddModal(false);
              }}
              disabled={addFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={() => addFormik.handleSubmit()}
              loading={addFormik.isSubmitting}
            >
              Record Expense
            </AppButton>
          </>
        }
      >
        <div className="expense-form-grid">
          {/* Row 1: Category Type & Payment Method */}
          <div className="form-row-2col">
            <AppSelect
              label="Category Type"
              name="categoryType"
              value={addFormik.values.categoryType}
              onChange={addFormik.handleChange}
              options={categoryOptions}
              required
              disabled={addFormik.isSubmitting}
            />
            <AppSelect
              label="Payment Method"
              name="paymentMethod"
              value={addFormik.values.paymentMethod}
              onChange={addFormik.handleChange}
              options={paymentOptions}
              required
              disabled={addFormik.isSubmitting}
            />
          </div>

          {/* Row 2: Name & Amount */}
          <div className="form-row-2col">
            <AppInput
              label="Name"
              name="name"
              placeholder="Enter Name of Expense"
              value={addFormik.values.name}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              error={addFormik.touched.name && Boolean(addFormik.errors.name)}
              helperText={addFormik.touched.name && addFormik.errors.name}
              startAdornment={<StorefrontOutlinedIcon />}
              required
              disabled={addFormik.isSubmitting}
            />

            <AppInput
              label="Amount (INR)"
              name="amount"
              type="number"
              placeholder="0.00"
              value={addFormik.values.amount}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              error={
                addFormik.touched.amount && Boolean(addFormik.errors.amount)
              }
              helperText={addFormik.touched.amount && addFormik.errors.amount}
              startAdornment={<CurrencyRupeeIcon />}
              required
              disabled={addFormik.isSubmitting}
            />
          </div>

          {/* Row 3: Description */}
          <AppInput
            label="Description"
            name="description"
            placeholder="Short Description"
            value={addFormik.values.description}
            onChange={addFormik.handleChange}
            onBlur={addFormik.handleBlur}
            error={
              addFormik.touched.description &&
              Boolean(addFormik.errors.description)
            }
            helperText={
              addFormik.touched.description && addFormik.errors.description
            }
            startAdornment={<DescriptionOutlinedIcon />}
            multiline={true}
            rows={3}
            disabled={addFormik.isSubmitting}
          />
        </div>
      </AppModal>

      {/* ============================================================== */}
      {/* 2. Modal: Edit Expense                                         */}
      {/* ============================================================== */}
      <AppModal
        open={openEditModal}
        onClose={() => !editFormik.isSubmitting && setOpenEditModal(false)}
        title="Edit Expense Record"
        subtitle={`Updating expense for ${expenseToEdit?.name || ""}`}
        maxWidth="md"
        actions={
          <>
            <AppButton
              variant="ghost"
              onClick={() => {
                editFormik.resetForm();
                setOpenEditModal(false);
                setExpenseToEdit(null);
              }}
              disabled={editFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={() => editFormik.handleSubmit()}
              loading={editFormik.isSubmitting}
            >
              Save Changes
            </AppButton>
          </>
        }
      >
        <div className="expense-form-grid">
          {/* Row 1: Category Type & Payment Method */}
          <div className="form-row-2col">
            <AppSelect
              label="Category Type"
              name="categoryType"
              value={editFormik.values.categoryType}
              onChange={editFormik.handleChange}
              options={categoryOptions}
              required
              disabled={editFormik.isSubmitting}
            />
            <AppSelect
              label="Payment Method"
              name="paymentMethod"
              value={editFormik.values.paymentMethod}
              onChange={editFormik.handleChange}
              options={paymentOptions}
              required
              disabled={editFormik.isSubmitting}
            />
          </div>

          {/* Row 2: Name & Amount */}
          <div className="form-row-2col">
            <AppInput
              label="Name"
              name="name"
              placeholder="Enter Name of Expense"
              value={editFormik.values.name}
              onChange={editFormik.handleChange}
              onBlur={editFormik.handleBlur}
              error={editFormik.touched.name && Boolean(editFormik.errors.name)}
              helperText={editFormik.touched.name && editFormik.errors.name}
              startAdornment={<StorefrontOutlinedIcon />}
              required
              disabled={editFormik.isSubmitting}
            />

            <AppInput
              label="Amount (INR)"
              name="amount"
              type="number"
              placeholder="0.00"
              value={editFormik.values.amount}
              onChange={editFormik.handleChange}
              onBlur={editFormik.handleBlur}
              error={
                editFormik.touched.amount && Boolean(editFormik.errors.amount)
              }
              helperText={editFormik.touched.amount && editFormik.errors.amount}
              startAdornment={<CurrencyRupeeIcon />}
              required
              disabled={editFormik.isSubmitting}
            />
          </div>

          {/* Row 3: Description */}
          <AppInput
            label="Description"
            name="description"
            placeholder="Short Description"
            value={editFormik.values.description}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={
              editFormik.touched.description &&
              Boolean(editFormik.errors.description)
            }
            helperText={
              editFormik.touched.description && editFormik.errors.description
            }
            startAdornment={<DescriptionOutlinedIcon />}
            multiline={true}
            rows={3}
            disabled={editFormik.isSubmitting}
          />
        </div>
      </AppModal>

      {/* ============================================================== */}
      {/* 3. Modal: View Expense Dossier Details                         */}
      {/* ============================================================== */}
      <AppModal
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        title="Expense Details & History"
        subtitle={expenseForView?.name || "Expense Dossier"}
        maxWidth="md"
        actions={
          <AppButton variant="ghost" onClick={() => setOpenViewModal(false)}>
            Close
          </AppButton>
        }
      >
        {expenseForView && (
          <div className="expense-view-dossier">
            {/* Amount & Badges Hero Banner */}
            <div className="dossier-hero">
              <div>
                <div className="hero-amount-label">Total Expense Amount</div>
                <div className="hero-amount-val">
                  {formatINR(expenseForView.amount)}
                </div>
              </div>
              <div className="hero-badges">
                <AppBadge
                  variant={getCategoryBadgeVariant(expenseForView.categoryType)}
                  icon={getCategoryIcon(expenseForView.categoryType)}
                >
                  {expenseForView.categoryType}
                </AppBadge>
                <AppBadge
                  variant={getPaymentBadgeVariant(expenseForView.paymentMethod)}
                  icon={<PaymentOutlinedIcon style={{ fontSize: 13 }} />}
                >
                  {expenseForView.paymentMethod}
                </AppBadge>
              </div>
            </div>

            {/* Key Metadata Grid */}
            <div className="dossier-grid">
              <div className="dossier-item">
                <StorefrontOutlinedIcon className="dossier-icon" />
                <div className="dossier-content">
                  <span className="dossier-label">Expense Name</span>
                  <span className="dossier-val">
                    {expenseForView.name || "—"}
                  </span>
                </div>
              </div>

              <div className="dossier-item">
                <CalendarTodayOutlinedIcon className="dossier-icon" />
                <div className="dossier-content">
                  <span className="dossier-label">Recorded Date & Time</span>
                  <span className="dossier-val">
                    <DateTimeCell
                      value={
                        expenseForView.createdAt || expenseForView.expenseDate
                      }
                    />
                  </span>
                </div>
              </div>

              <div className="dossier-item">
                <PersonOutlineIcon className="dossier-icon" />
                <div className="dossier-content">
                  <span className="dossier-label">Recorded By</span>
                  <span className="dossier-val">
                    {expenseForView.createdBy || "Admin"}
                  </span>
                </div>
              </div>

              <div className="dossier-item">
                <ScheduleOutlinedIcon className="dossier-icon" />
                <div className="dossier-content">
                  <span className="dossier-label">Last Modified</span>
                  <span className="dossier-val">
                    {(() => {
                      const viewMod = getModifiedDateTime(
                        expenseForView.updatedAt,
                        expenseForView.createdAt || expenseForView.expenseDate,
                      );
                      if (viewMod && expenseForView.updatedBy) {
                        return (
                          <span>
                            <strong>{expenseForView.updatedBy}</strong> (
                            {viewMod.date}
                            {viewMod.time ? `, ${viewMod.time}` : ""})
                          </span>
                        );
                      }
                      return "Not modified yet";
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Full Description & Notes */}
            {(expenseForView.description || expenseForView.purpose) && (
              <div className="dossier-text-card">
                <span className="box-label">
                  <DescriptionOutlinedIcon />
                  <span>Description & Notes</span>
                </span>
                <p className="box-text">
                  {expenseForView.description || expenseForView.purpose}
                </p>
              </div>
            )}
          </div>
        )}
      </AppModal>

      {/* ============================================================== */}
      {/* 4. Modal: Delete Confirmation                                  */}
      {/* ============================================================== */}
      <AppModal
        open={openDeleteModal}
        onClose={() => !isDeleting && setOpenDeleteModal(false)}
        title="Delete Expense Record"
        subtitle="This action cannot be undone."
        maxWidth="xs"
        actions={
          <>
            <AppButton
              variant="ghost"
              onClick={() => setOpenDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
            >
              Delete Permanently
            </AppButton>
          </>
        }
      >
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem" }}>
          Are you sure you want to delete this expense record?
        </p>
        {expenseToDelete && (
          <div className="delete-confirm-box">
            <span className="delete-item-title">{expenseToDelete.name}</span>
            <div className="delete-item-meta">
              <span>{expenseToDelete.categoryType}</span>
              <span>•</span>
              <span className="delete-amount">
                {formatINR(expenseToDelete.amount)}
              </span>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
};

export default Expenses;
