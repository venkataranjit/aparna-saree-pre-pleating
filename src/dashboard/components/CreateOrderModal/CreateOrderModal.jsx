import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";

// Material UI Icons
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {
  AppModal,
  AppButton,
  AppInput,
  AppSelect,
  AppDatePicker,
  AppSpinner,
} from "../../../components/common";
import {
  getAllUsers,
  getAllServices,
  getAllMeasurements,
  getMeasurementsByUserId,
  createOrder,
  createUser,
} from "../../../firebase/dbService";
import { USER_ROLES, SUPERADMIN_EMAIL } from "../../../firebase/schema";
import { useAuth } from "../../../auth/context/AuthContext";
import { auth } from "../../../firebase/config";
import "./CreateOrderModal.scss";

const OCCASIONS = [
  "Party",
  "Wedding / Muhurtham",
  "Reception",
  "Engagement",
  "Sangeet / Mehendi",
  "Temple / Puja Ceremony",
  "Festival",
  "Party / Anniversary",
  "College Farewell",
  "Office / Corporate Event",
  "Other Occasion",
];

const SAREE_FABRICS = [
  "Pattu Saree",
  "Work Saree",
  "Cotton Saree",
  "Tissue Saree",
  "Net Saree",
  "Silk Saree",
  "Other Fabric",
];

export const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Custom"];

// Strict numeric validator for custom measurements (numbers only, no characters or symbols)
const numericMeasurementValidator = (label, isInteger = false) =>
  Yup.string()
    .trim()
    .required(`${label} is required`)
    .test("is-number", `${label} must be numbers only`, (val) => {
      if (!val) return false;
      const regex = isInteger ? /^\d+$/ : /^\d+(\.\d+)?$/;
      return regex.test(val);
    })
    .test("is-positive", `${label} must be greater than 0`, (val) => {
      if (!val) return false;
      const num = parseFloat(val);
      return !Number.isNaN(num) && num > 0;
    });

// Reusable Custom Measurement Formik / Yup Validation Schema
export const customMeasurementValidationSchema = Yup.object({
  pallu: numericMeasurementValidator("Pallu length"),
  shoulderToRightTight: numericMeasurementValidator(
    "Shoulder to tight measurement",
  ),
  chest: numericMeasurementValidator("Chest size"),
  hip: numericMeasurementValidator("Hip size"),
  firstPleatSize: numericMeasurementValidator("First pleat width"),
  noOfChestPleats: numericMeasurementValidator("Number of chest pleats", true),
  height: numericMeasurementValidator("Client height"),
  dressSize: Yup.string()
    .trim()
    .required("Dress size is required")
    .oneOf(DRESS_SIZES, "Please select a valid dress size"),
});

// Yup Validation Schema for Orders
const orderValidationSchema = Yup.object({
  client: Yup.object({
    username: Yup.string()
      .trim()
      .required("Client name is required")
      .min(2, "Client name must be at least 2 characters")
      .max(80, "Client name cannot exceed 80 characters"),
    userMobile: Yup.string()
      .trim()
      .required("Mobile number is required")
      .matches(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),
    email: Yup.string()
      .trim()
      .test("is-valid-email", "Please enter a valid email address", (val) => {
        if (!val || val.length === 0) return true;
        return Yup.string().email().isValidSync(val);
      })
      .nullable(),
    userAddress: Yup.string().trim().nullable(),
  }),
  items: Yup.array()
    .of(
      Yup.object({
        serviceId: Yup.string()
          .trim()
          .required("Service selection is required"),
        serviceName: Yup.string().trim().required("Service name is required"),
        sareeType: Yup.string().trim(),
        servicePrice: Yup.number()
          .typeError("Service price must be a valid number")
          .required("Service price is required")
          .min(1, "Service price must be greater than ₹0"),
        includeMeasurements: Yup.boolean(),
        selectedMeasurementId: Yup.string(),
        measurementProfile: Yup.mixed().when(
          ["includeMeasurements", "selectedMeasurementId"],
          ([includeMeasurements, selectedMeasurementId]) => {
            if (includeMeasurements === false) {
              return Yup.mixed().nullable().notRequired();
            }
            // If client has selected a saved profile, do not enforce strict 8-parameter requirement, allow as-is
            if (
              selectedMeasurementId &&
              selectedMeasurementId !== "custom" &&
              !String(selectedMeasurementId).startsWith("custom_")
            ) {
              return Yup.mixed().nullable().notRequired();
            }
            // Only if custom sizing is chosen, require full custom measurements
            return customMeasurementValidationSchema.required(
              "Measurement profile is required",
            );
          },
        ),
      }),
    )
    .min(1, "At least one service is required in the order"),
  orderDate: Yup.string().trim().required("Order date is required"),
  deliveryDate: Yup.string()
    .trim()
    .required("Target delivery date is required"),
  orderStatus: Yup.string().trim().required("Order status is required"),
  paymentStatus: Yup.string().trim().required("Payment status is required"),
  paymentMethod: Yup.string().trim().required("Payment method is required"),
  paidAmount: Yup.number()
    .typeError("Paid amount must be a number")
    .min(0, "Paid amount cannot be negative")
    .test(
      "max-paid-amount",
      "Paid amount cannot exceed total amount (Service price + Delivery + Other charges - Discount)",
      function (value) {
        const { totalAmount } = this.parent;
        if (value === undefined || value === null || isNaN(value)) return true;
        if (
          totalAmount === undefined ||
          totalAmount === null ||
          isNaN(totalAmount)
        )
          return true;
        return Number(value) <= Number(totalAmount);
      },
    ),
});

const createEmptyItem = (idx = 1) => ({
  itemId: `item_${Date.now()}_${idx}`,
  serviceId: "",
  serviceName: "",
  serviceType: "Pleating Service",
  servicePrice: 0,
  serviceDiscountedPrice: 0,
  finalPrice: 0,
  sareeType: "Kanjeevaram Silk (Pure Zari)",
  customSareeType: "",
  includeMeasurements: true,
  selectedMeasurementId: "custom",
  customMeasurement: {
    title: "Custom Sizing",
    pallu: "",
    shoulderToRightTight: "",
    chest: "",
    hip: "",
    firstPleatSize: "",
    noOfChestPleats: "",
    height: "",
    dressSize: "",
    notes: "",
  },
  itemNotes: "",
});

export default function CreateOrderModal({
  open,
  onClose,
  onOrderCreated,
  clientMode = false,
  initialClient = null,
  initialMeasurements = null,
}) {
  const { currentUser, userProfile, role } = useAuth();
  const isClientMode = Boolean(clientMode || role === USER_ROLES.CLIENT);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Reference catalog data loaded dynamically from database
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [measurementsMap, setMeasurementsMap] = useState({});

  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientForm, setClientForm] = useState({
    username: "",
    userMobile: "",
    email: "",
    userAddress: "",
  });

  // Multi-service items
  const [items, setItems] = useState([createEmptyItem(1)]);

  // Order timeline & parameters
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultDeliveryStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 0);
    return d.toISOString().split("T")[0];
  }, []);
  const [orderDate, setOrderDate] = useState(todayStr);
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryStr);
  const [occasion, setOccasion] = useState("Party");
  const [customOccasion, setCustomOccasion] = useState("");
  const [orderStatus, setOrderStatus] = useState("delivered");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [pickupDeliveryCharges, setPickupDeliveryCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [orderNotes, setOrderNotes] = useState("");

  // Yup validation errors map
  const [validationErrors, setValidationErrors] = useState({});

  // Load clients, services, and measurements when modal opens
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setLoadingInitial(true);
      try {
        if (isClientMode) {
          // Strictly ONLY fetch services in client mode!
          // NEVER fetch other clients, orders, or other users' measurements!
          const servicesData = await getAllServices(false).catch(() => []);
          setServices(servicesData || []);

          const currentClientObj = initialClient || {
            id: currentUser?.uid || userProfile?.id || "client_me",
            username:
              userProfile?.username || currentUser?.displayName || "Client",
            userMobile:
              userProfile?.userMobile || currentUser?.phoneNumber || "",
            email: userProfile?.email || currentUser?.email || "",
            userAddress: userProfile?.userAddress || "",
            role: USER_ROLES.CLIENT,
          };

          setClients([currentClientObj]);
          setSelectedClientId(currentClientObj.id);
          setClientForm({
            username: currentClientObj.username || "",
            userMobile: (currentClientObj.userMobile || "")
              .replace(/\D/g, "")
              .slice(-10),
            email: currentClientObj.email || "",
            userAddress: currentClientObj.userAddress || "",
          });

          // Fetch or use ONLY this client's measurements
          let myMeasures = initialMeasurements;
          if (!myMeasures || myMeasures.length === 0) {
            if (currentClientObj.id) {
              myMeasures = await getMeasurementsByUserId(
                currentClientObj.id,
              ).catch(() => []);
            }
          }
          const safeMeasures = Array.isArray(myMeasures) ? myMeasures : [];

          // Deduplicate by ID and unique dimensions signature
          const seenIds = new Set();
          const seenSigs = new Set();
          const uniqueMeasures = [];

          safeMeasures.forEach((m) => {
            if (!m || !m.id) return;
            if (String(m.id).startsWith("ord_")) return;
            const sig = `${(m.title || "").trim().toLowerCase()}|${m.pallu || ""}|${m.shoulderToRightTight || ""}|${m.chest || ""}|${m.hip || ""}|${m.firstPleatSize || ""}|${m.noOfChestPleats || ""}|${m.height || ""}|${m.dressSize || ""}`;
            if (!seenIds.has(m.id) && !seenSigs.has(sig)) {
              seenIds.add(m.id);
              seenSigs.add(sig);
              uniqueMeasures.push(m);
            }
          });

          const clientMap = {
            [currentClientObj.id]: uniqueMeasures,
            [String(currentClientObj.id).toLowerCase()]: uniqueMeasures,
          };
          if (currentClientObj.email) {
            clientMap[currentClientObj.email.toLowerCase().trim()] =
              uniqueMeasures;
          }
          setMeasurementsMap(clientMap);

          // If client has saved measurement profiles, select the first one by default on item 0
          if (uniqueMeasures.length > 0) {
            const first = uniqueMeasures[0];
            setItems([
              {
                ...createEmptyItem(1),
                selectedMeasurementId: first.id,
                customMeasurement: {
                  title: first.title || "Saved Profile",
                  pallu: first.pallu || "",
                  shoulderToRightTight: first.shoulderToRightTight || "",
                  chest: first.chest || "",
                  hip: first.hip || "",
                  firstPleatSize: first.firstPleatSize || "",
                  noOfChestPleats:
                    first.noOfChestPleats || first.chestPleats || "",
                  height: first.height || "",
                  dressSize: first.dressSize || "",
                  notes: first.notes || "",
                },
              },
            ]);
          } else {
            setItems([
              {
                ...createEmptyItem(1),
                selectedMeasurementId: "custom",
                customMeasurement: {
                  title: "Custom Sizing",
                  pallu: "",
                  shoulderToRightTight: "",
                  chest: "",
                  hip: "",
                  firstPleatSize: "",
                  noOfChestPleats: "",
                  height: "",
                  dressSize: "",
                  notes: "",
                },
              },
            ]);
          }

          setOrderStatus("pending");
          setPaymentStatus("pending");
          setLoadingInitial(false);
          return;
        }

        // Standard Admin / Staff Loader - Single source of truth (Users collection)
        const [usersData, servicesData, measurementsData] = await Promise.all([
          getAllUsers().catch(() => []),
          getAllServices(false).catch(() => []),
          getAllMeasurements().catch(() => []),
        ]);

        // Filter client accounts (same as Clients page)
        const validClients = (usersData || [])
          .filter((u) => {
            const email = (u.email || "").toLowerCase().trim();
            if (email === SUPERADMIN_EMAIL.toLowerCase()) return false;
            const r = (u.role || "").toLowerCase();
            return (
              r !== USER_ROLES.SUPERADMIN &&
              r !== USER_ROLES.ADMIN &&
              r !== USER_ROLES.STAFF &&
              Boolean(u.username) &&
              u.username !== "-" &&
              u.username !== "Client"
            );
          })
          .map((u) => ({
            id: u.id,
            username: u.username || u.clientName || "",
            userMobile: u.userMobile || u.clientMobile || "",
            email: u.email || "",
            userAddress: u.userAddress || "",
            role: USER_ROLES.CLIENT,
          }))
          .sort((a, b) => (a.username || "").localeCompare(b.username || ""));

        setClients(validClients);

        // Active services
        const validServices = (servicesData || []).filter(
          (s) => s.active !== false,
        );
        setServices(validServices);

        // Group authentic measurements by clientId / userId
        const map = {};
        const allMeasures = (measurementsData || []).filter(
          (m) => m && m.id && !String(m.id).startsWith("ord_"),
        );

        allMeasures.forEach((m) => {
          const uids = new Set();
          if (m.userId) uids.add(String(m.userId).trim());
          if (m.clientId) uids.add(String(m.clientId).trim());
          if (m.userEmail && m.userEmail.includes("@"))
            uids.add(String(m.userEmail).trim().toLowerCase());
          if (m.email && m.email.includes("@"))
            uids.add(String(m.email).trim().toLowerCase());
          if (
            m.username &&
            m.username.trim().toLowerCase() !== "client" &&
            m.username.trim() !== "-"
          ) {
            uids.add(String(m.username).trim().toLowerCase());
          }
          if (m.userMobile || m.clientMobile || m.phone) {
            const cleanMobile = String(
              m.userMobile || m.clientMobile || m.phone,
            )
              .replace(/\D/g, "")
              .slice(-10);
            if (cleanMobile) uids.add(cleanMobile);
          }

          uids.forEach((uid) => {
            if (!map[uid]) map[uid] = [];
            const sig = `${(m.title || "").trim().toLowerCase()}|${m.pallu || ""}|${m.shoulderToRightTight || ""}|${m.chest || ""}|${m.hip || ""}|${m.firstPleatSize || ""}|${m.noOfChestPleats || ""}|${m.height || ""}|${m.dressSize || ""}`;
            if (
              !map[uid].some(
                (existing) =>
                  existing.id === m.id ||
                  `${(existing.title || "").trim().toLowerCase()}|${existing.pallu || ""}|${existing.shoulderToRightTight || ""}|${existing.chest || ""}|${existing.hip || ""}|${existing.firstPleatSize || ""}|${existing.noOfChestPleats || ""}|${existing.height || ""}|${existing.dressSize || ""}` ===
                    sig,
              )
            ) {
              map[uid].push(m);
            }
          });
        });
        setMeasurementsMap(map);
      } catch (err) {
        console.warn("Could not load data for order modal:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [open, isClientMode, initialClient, initialMeasurements]);

  // Auto-select initialClient once BOTH clients list AND measurementsMap have loaded (admin/staff mode)
  useEffect(() => {
    if (!open || isClientMode || !initialClient || clients.length === 0) return;
    const clientId = initialClient.id;
    if (!clientId) return;
    const found = clients.find((c) => c.id === clientId);
    if (!found) return;

    // 1. Set selected client id & populate contact form
    setSelectedClientId(clientId);
    setClientForm({
      username: found.username || "",
      userMobile: (found.userMobile || "").replace(/\D/g, "").slice(-10),
      email: found.email || "",
      userAddress: found.userAddress || "",
    });
    setValidationErrors((prev) => ({
      ...prev,
      "client.username": undefined,
      "client.userMobile": undefined,
      "client.email": undefined,
    }));

    // 2. Auto-populate measurement profiles for this client in every item
    // Build client lookup keys (id, email, username)
    const clientKeys = new Set();
    if (found.id) clientKeys.add(String(found.id).toLowerCase().trim());
    if (found.email && found.email.includes("@"))
      clientKeys.add(found.email.toLowerCase().trim());
    if (found.username && found.username.trim().toLowerCase() !== "client") {
      clientKeys.add(found.username.toLowerCase().trim());
    }

    // Collect all measurements that belong to this client from measurementsMap
    const seenIds = new Set();
    const seenSigs = new Set();
    const clientMeasures = [];

    const addUnique = (m) => {
      if (!m || !m.id || String(m.id).startsWith("ord_")) return;
      const sig = `${(m.title || "").trim().toLowerCase()}|${m.pallu || ""}|${m.shoulderToRightTight || ""}|${m.chest || ""}|${m.hip || ""}|${m.firstPleatSize || ""}|${m.noOfChestPleats || ""}|${m.height || ""}|${m.dressSize || ""}`;
      if (!seenIds.has(m.id) && !seenSigs.has(sig)) {
        seenIds.add(m.id);
        seenSigs.add(sig);
        clientMeasures.push(m);
      }
    };

    Object.entries(measurementsMap || {}).forEach(([k, list]) => {
      if (
        clientKeys.has(String(k).toLowerCase().trim()) &&
        Array.isArray(list)
      ) {
        list.forEach(addUnique);
      }
    });
    // Also scan all values for any measurement carrying this client's ids
    Object.values(measurementsMap || {})
      .flat()
      .forEach((m) => {
        if (!m) return;
        const mUserId = (m.userId || m.clientId || "")
          .toString()
          .toLowerCase()
          .trim();
        const mEmail = (m.userEmail || m.email || "")
          .toString()
          .toLowerCase()
          .trim();
        const mUsername = (m.username || "").toString().toLowerCase().trim();
        if (
          (mUserId && clientKeys.has(mUserId)) ||
          (found.email &&
            mEmail &&
            mEmail.includes("@") &&
            mEmail === found.email.toLowerCase().trim()) ||
          (found.username &&
            found.username.trim().toLowerCase() !== "client" &&
            mUsername &&
            mUsername === found.username.toLowerCase().trim())
        ) {
          addUnique(m);
        }
      });

    const validMeasureIds = new Set(clientMeasures.map((m) => m.id));

    setItems((prev) =>
      prev.map((it) => {
        if (
          it.selectedMeasurementId &&
          it.selectedMeasurementId !== "custom" &&
          validMeasureIds.has(it.selectedMeasurementId)
        ) {
          return it; // keep existing valid selection
        }
        if (clientMeasures.length > 0) {
          const first = clientMeasures[0];
          return {
            ...it,
            selectedMeasurementId: first.id,
            customMeasurement: {
              title: first.title || "Custom Sizing",
              pallu: first.pallu || first.palluLength || "",
              shoulderToRightTight:
                first.shoulderToRightTight || first.shoulder || "",
              chest: first.chest || first.chestSize || "",
              hip: first.hip || first.hipSize || "",
              firstPleatSize: first.firstPleatSize || first.firstPleat || "",
              noOfChestPleats: first.noOfChestPleats || first.chestPleats || "",
              height: first.height || "",
              dressSize: first.dressSize || "",
              notes: first.notes || "",
            },
          };
        }
        return {
          ...it,
          selectedMeasurementId: "custom",
          customMeasurement: {
            title: "Custom Sizing",
            pallu: "",
            shoulderToRightTight: "",
            chest: "",
            hip: "",
            firstPleatSize: "",
            noOfChestPleats: "",
            height: "",
            dressSize: "",
            notes: "",
          },
        };
      }),
    );
  }, [clients, measurementsMap, open, isClientMode, initialClient]);

  // Dedicated helper to retrieve ONLY the measurement profiles belonging to the specified client
  const getMeasuresForClient = useCallback(
    (targetClientId, targetClient, mMap = measurementsMap) => {
      if (!targetClientId || targetClientId === "new") return [];

      const foundClient =
        targetClient || clients.find((c) => c.id === targetClientId);
      const clientKeys = new Set();
      const rawTargetId = String(targetClientId).toLowerCase().trim();
      clientKeys.add(rawTargetId);

      if (foundClient) {
        if (foundClient.id)
          clientKeys.add(String(foundClient.id).toLowerCase().trim());
        if (foundClient.uid)
          clientKeys.add(String(foundClient.uid).toLowerCase().trim());
        if (foundClient.authUid)
          clientKeys.add(String(foundClient.authUid).toLowerCase().trim());
        if (foundClient.email && foundClient.email.includes("@"))
          clientKeys.add(foundClient.email.toLowerCase().trim());
        if (
          foundClient.userMobile ||
          foundClient.clientMobile ||
          foundClient.phone
        ) {
          const cleanMobile = String(
            foundClient.userMobile ||
              foundClient.clientMobile ||
              foundClient.phone,
          )
            .replace(/\D/g, "")
            .slice(-10);
          if (cleanMobile) clientKeys.add(cleanMobile);
        }
        if (
          foundClient.username &&
          foundClient.username.trim().toLowerCase() !== "client" &&
          foundClient.username.trim() !== "-"
        ) {
          clientKeys.add(foundClient.username.toLowerCase().trim());
        }
      }

      const matched = [];
      const seenIds = new Set();
      const seenSigs = new Set();

      const addMeasureIfUnique = (m) => {
        if (!m || !m.id) return;
        if (String(m.id).startsWith("ord_")) return;
        const sig = `${(m.title || "").trim().toLowerCase()}|${m.pallu || ""}|${m.shoulderToRightTight || ""}|${m.chest || ""}|${m.hip || ""}|${m.firstPleatSize || ""}|${m.noOfChestPleats || ""}|${m.height || ""}|${m.dressSize || ""}`;

        if (!seenIds.has(m.id) && !seenSigs.has(sig)) {
          seenIds.add(m.id);
          seenSigs.add(sig);
          matched.push(m);
        }
      };

      // 1. Direct keys in mMap
      Object.entries(mMap || {}).forEach(([k, list]) => {
        const normalizedKey = String(k).toLowerCase().trim();
        if (clientKeys.has(normalizedKey) && Array.isArray(list)) {
          list.forEach(addMeasureIfUnique);
        }
      });

      // 2. Scan all measurements to ensure any that carry this client's identifier match
      const all = Object.values(mMap || {}).flat();
      all.forEach((m) => {
        if (!m || !m.id) return;
        const mUserId = (m.userId || m.clientId || "")
          .toString()
          .toLowerCase()
          .trim();
        const mEmail = (m.userEmail || m.email || "")
          .toString()
          .toLowerCase()
          .trim();
        const mUsername = (m.username || "").toString().toLowerCase().trim();
        const mMobile = String(m.userMobile || m.clientMobile || m.phone || "")
          .replace(/\D/g, "")
          .slice(-10);
        const clientMobile = String(
          foundClient?.userMobile ||
            foundClient?.clientMobile ||
            foundClient?.phone ||
            "",
        )
          .replace(/\D/g, "")
          .slice(-10);

        const belongs =
          (mUserId && clientKeys.has(mUserId)) ||
          (clientMobile &&
            mMobile &&
            mMobile.length === 10 &&
            mMobile === clientMobile) ||
          (foundClient?.email &&
            mEmail &&
            mEmail.includes("@") &&
            mEmail === foundClient.email.toLowerCase().trim()) ||
          (foundClient?.username &&
            foundClient.username.trim().toLowerCase() !== "client" &&
            foundClient.username.trim() !== "-" &&
            mUsername &&
            mUsername === foundClient.username.toLowerCase().trim());

        if (belongs) {
          addMeasureIfUnique(m);
        }
      });

      // STRICT: Return ONLY profiles belonging to this client.
      return matched;
    },
    [clients, measurementsMap],
  );

  // Active client's saved measurements (strictly only this client's profiles, or empty array)
  const clientSavedMeasures = useMemo(() => {
    return getMeasuresForClient(selectedClientId, null, measurementsMap);
  }, [selectedClientId, measurementsMap, getMeasuresForClient]);

  // Handle Client Selection & Auto-populate
  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (!clientId || clientId === "new") {
      setClientForm({
        username: "",
        userMobile: "",
        email: "",
        userAddress: "",
      });
      // Clear any previously selected measurement IDs from other clients and clear custom values
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          selectedMeasurementId: "custom",
          customMeasurement: {
            title: "Custom Sizing",
            pallu: "",
            shoulderToRightTight: "",
            chest: "",
            hip: "",
            firstPleatSize: "",
            noOfChestPleats: "",
            height: "",
            dressSize: "",
            notes: "",
          },
        })),
      );
      return;
    }

    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setClientForm({
        username: found.username || "",
        userMobile: (found.userMobile || "").replace(/\D/g, "").slice(-10),
        email: found.email || "",
        userAddress: found.userAddress || "",
      });

      // Clear client errors
      setValidationErrors((prev) => ({
        ...prev,
        "client.username": undefined,
        "client.userMobile": undefined,
        "client.email": undefined,
      }));

      // Find measurements for THIS client only
      const clientMeasures = getMeasuresForClient(
        clientId,
        found,
        measurementsMap,
      );
      const validMeasureIds = new Set(clientMeasures.map((m) => m.id));

      setItems((prev) =>
        prev.map((it) => {
          // If the item has a measurement selected that belongs to THIS client, keep it
          if (
            it.selectedMeasurementId &&
            it.selectedMeasurementId !== "custom" &&
            validMeasureIds.has(it.selectedMeasurementId)
          ) {
            return it;
          }
          // If this client has saved profiles, default to their first profile
          if (clientMeasures.length > 0) {
            const first = clientMeasures[0];
            return {
              ...it,
              selectedMeasurementId: first.id,
              customMeasurement: {
                title: first.title || "Custom Sizing",
                pallu: first.pallu || first.palluLength || "",
                shoulderToRightTight:
                  first.shoulderToRightTight || first.shoulder || "",
                chest: first.chest || first.chestSize || "",
                hip: first.hip || first.hipSize || "",
                firstPleatSize: first.firstPleatSize || first.firstPleat || "",
                noOfChestPleats:
                  first.noOfChestPleats || first.chestPleats || "",
                height: first.height || "",
                dressSize: first.dressSize || "",
                notes: first.notes || "",
              },
            };
          }
          // If client has NO saved profiles, set to "custom" with blank fields so user can enter own values
          return {
            ...it,
            selectedMeasurementId: "custom",
            customMeasurement: {
              title: "Custom Sizing",
              pallu: "",
              shoulderToRightTight: "",
              chest: "",
              hip: "",
              firstPleatSize: "",
              noOfChestPleats: "",
              height: "",
              dressSize: "",
              notes: "",
            },
          };
        }),
      );
    }
  };

  // Service item management
  const handleServiceSelect = (index, serviceId) => {
    const foundSvc = services.find((s) => s.id === serviceId);
    setItems((prev) => {
      const next = [...prev];
      if (foundSvc) {
        const regPrice =
          Number(
            foundSvc.servicePrice !== undefined &&
              foundSvc.servicePrice !== null
              ? foundSvc.servicePrice
              : foundSvc.price !== undefined && foundSvc.price !== null
                ? foundSvc.price
                : foundSvc.amount || 0,
          ) || 0;
        const offerPrice =
          Number(
            foundSvc.serviceDiscountedPrice !== undefined &&
              foundSvc.serviceDiscountedPrice !== null &&
              Number(foundSvc.serviceDiscountedPrice) > 0
              ? foundSvc.serviceDiscountedPrice
              : regPrice,
          ) || regPrice;

        next[index] = {
          ...next[index],
          serviceId: foundSvc.id,
          serviceName:
            foundSvc.serviceName || foundSvc.name || foundSvc.title || "",
          serviceType: foundSvc.serviceType || "Pleating Service",
          servicePrice: regPrice,
          serviceDiscountedPrice: offerPrice,
          serviceDescription: foundSvc.description || "",
          finalPrice: offerPrice,
        };
      } else {
        next[index] = {
          ...next[index],
          serviceId: "",
          serviceName: "",
          serviceType: "Pleating Service",
          servicePrice: "",
          serviceDiscountedPrice: "",
          serviceDescription: "",
          finalPrice: 0,
        };
      }
      return next;
    });

    setValidationErrors((prev) => ({
      ...prev,
      [`items[${index}].serviceId`]: undefined,
      [`items[${index}].servicePrice`]: undefined,
      [`items[${index}].finalPrice`]: undefined,
    }));
  };

  const handlePriceChange = (index, newPrice) => {
    // Service price is strictly read-only and locked to catalog pricing
    return;
  };

  const handleItemFieldChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      let customMeasUpdate = next[index].customMeasurement;
      if (field === "selectedMeasurementId") {
        if (value === "custom") {
          customMeasUpdate = {
            title: "Custom Sizing",
            pallu: "",
            shoulderToRightTight: "",
            chest: "",
            hip: "",
            firstPleatSize: "",
            noOfChestPleats: "",
            height: "",
            dressSize: "",
            notes: "",
          };
        } else if (value) {
          const foundM = clientSavedMeasures.find((m) => m.id === value);
          if (foundM) {
            customMeasUpdate = {
              title: foundM.title || "Custom Sizing",
              pallu: foundM.pallu || foundM.palluLength || "",
              shoulderToRightTight:
                foundM.shoulderToRightTight || foundM.shoulder || "",
              chest: foundM.chest || foundM.chestSize || "",
              hip: foundM.hip || foundM.hipSize || "",
              firstPleatSize: foundM.firstPleatSize || foundM.firstPleat || "",
              noOfChestPleats:
                foundM.noOfChestPleats || foundM.chestPleats || "",
              height: foundM.height || "",
              dressSize: foundM.dressSize || "",
              notes: foundM.notes || "",
            };
          }
        }
      }
      next[index] = {
        ...next[index],
        [field]: value,
        customMeasurement: customMeasUpdate,
      };
      return next;
    });

    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy[`items[${index}].${field}`];
      if (
        field === "selectedMeasurementId" ||
        field === "includeMeasurements"
      ) {
        Object.keys(copy).forEach((k) => {
          if (
            k.startsWith(`items[${index}].measurementProfile`) ||
            k.startsWith(`items[${index}].pallu`) ||
            k.startsWith(`items[${index}].shoulderToRightTight`) ||
            k.startsWith(`items[${index}].chest`) ||
            k.startsWith(`items[${index}].hip`) ||
            k.startsWith(`items[${index}].firstPleatSize`) ||
            k.startsWith(`items[${index}].noOfChestPleats`) ||
            k.startsWith(`items[${index}].height`) ||
            k.startsWith(`items[${index}].dressSize`)
          ) {
            delete copy[k];
          }
        });
      }
      return copy;
    });
  };

  // Restrict key events to numbers only (digits and optional single decimal point)
  const handleNumericKeyDown = (e, allowDecimal = true) => {
    const allowedControlKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (allowedControlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    if (allowDecimal && e.key === "." && !e.currentTarget.value.includes(".")) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleCustomMeasurementChange = (index, field, value) => {
    let sanitizedValue = value;
    if (field !== "dressSize" && field !== "notes" && field !== "title") {
      if (field === "noOfChestPleats") {
        sanitizedValue = value.replace(/\D/g, "");
      } else {
        const cleanVal = value.replace(/[^0-9.]/g, "");
        const parts = cleanVal.split(".");
        sanitizedValue =
          parts.length > 2
            ? parts[0] + "." + parts.slice(1).join("")
            : cleanVal;
      }
    }

    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        customMeasurement: {
          ...next[index].customMeasurement,
          [field]: sanitizedValue,
        },
      };
      return next;
    });

    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy[`items[${index}].measurementProfile.${field}`];
      delete copy[`items[${index}].${field}`];
      return copy;
    });
  };

  const handleAddItem = () => {
    const newItemIndex = items.length + 1;
    const defaultMeasureId =
      clientSavedMeasures.length > 0 ? clientSavedMeasures[0].id : "custom";
    setItems((prev) => [
      ...prev,
      {
        ...createEmptyItem(newItemIndex),
        selectedMeasurementId: defaultMeasureId,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    // Clear removed item errors
    setValidationErrors((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        if (k.startsWith(`items[${index}]`)) {
          delete copy[k];
        }
      });
      return copy;
    });
  };

  // Real-time calculated subtotal and final total
  const subtotalAmount = useMemo(() => {
    return items.reduce((acc, it) => {
      const price =
        it.finalPrice !== "" &&
        it.finalPrice !== undefined &&
        it.finalPrice !== null
          ? Number(it.finalPrice)
          : Number(it.serviceDiscountedPrice) || Number(it.servicePrice) || 0;
      return acc + (Number.isNaN(price) ? 0 : price);
    }, 0);
  }, [items]);

  const calculatedTotal = useMemo(() => {
    const pickupDelivery = Number(pickupDeliveryCharges) || 0;
    const other = Number(otherCharges) || 0;
    const disc = Number(discount) || 0;
    return Math.max(0, subtotalAmount + pickupDelivery + other - disc);
  }, [subtotalAmount, pickupDeliveryCharges, otherCharges, discount]);

  const balanceDue = useMemo(() => {
    const advance = Number(advancePayment) || 0;
    return Math.max(0, calculatedTotal - advance);
  }, [calculatedTotal, advancePayment]);

  const handleResetForm = () => {
    isSubmittingRef.current = false;
    if (isClientMode) {
      const cObj = clients[0] || initialClient;
      if (cObj) {
        setSelectedClientId(cObj.id);
        setClientForm({
          username: cObj.username || "",
          userMobile: cObj.userMobile || "",
          email: cObj.email || "",
          userAddress: cObj.userAddress || "",
        });
      }
    } else {
      setSelectedClientId("");
      setClientForm({
        username: "",
        userMobile: "",
        email: "",
        userAddress: "",
      });
    }
    setItems([createEmptyItem(1)]);
    setOrderDate(todayStr);
    setDeliveryDate(defaultDeliveryStr);
    setOccasion("Party");
    setCustomOccasion("");
    setOrderStatus(isClientMode ? "pending" : "in-progress");
    setPaymentStatus(isClientMode ? "pending" : "paid");
    setPaymentMethod("UPI");
    setPickupDeliveryCharges(0);
    setOtherCharges(0);
    setAdvancePayment(0);
    setDiscount(0);
    setOrderNotes("");
    setValidationErrors({});
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    // Synchronously block duplicate calls / double clicks
    if (isSubmittingRef.current || submitting) {
      return;
    }
    isSubmittingRef.current = true;
    setSubmitting(true);

    const cleanName = (clientForm.username || "").trim();
    const cleanMobile = (clientForm.userMobile || "").trim();

    // Pre-process items and extract all 8 measurement parameters before validation
    const processedItems = items.map((it, idx) => {
      const includeMeasurements = it.includeMeasurements !== false;
      let measurementProfile = null;

      if (includeMeasurements) {
        if (it.selectedMeasurementId && it.selectedMeasurementId !== "custom") {
          const foundM = clientSavedMeasures.find(
            (m) => m.id === it.selectedMeasurementId,
          );
          if (foundM) {
            measurementProfile = {
              measurementId: foundM.id,
              title: foundM.title || "Standard Sizing",
              pallu: String(foundM.pallu || foundM.palluLength || "").trim(),
              shoulderToRightTight: String(
                foundM.shoulderToRightTight || foundM.shoulder || "",
              ).trim(),
              chest: String(foundM.chest || foundM.chestSize || "").trim(),
              hip: String(foundM.hip || foundM.hipSize || "").trim(),
              firstPleatSize: String(
                foundM.firstPleatSize || foundM.firstPleat || "",
              ).trim(),
              noOfChestPleats: String(
                foundM.noOfChestPleats || foundM.chestPleats || "",
              ).trim(),
              height: String(foundM.height || "").trim(),
              dressSize: String(foundM.dressSize || "").trim(),
              notes: foundM.notes || "",
            };
          }
        }

        // Fallback if measurementProfile is still null (e.g. custom or unlinked)
        if (!measurementProfile) {
          measurementProfile = {
            measurementId: `custom_${idx + 1}`,
            title: it.customMeasurement?.title || "Custom Sizing",
            pallu: String(it.customMeasurement?.pallu || "").trim(),
            shoulderToRightTight: String(
              it.customMeasurement?.shoulderToRightTight || "",
            ).trim(),
            chest: String(it.customMeasurement?.chest || "").trim(),
            hip: String(it.customMeasurement?.hip || "").trim(),
            firstPleatSize: String(
              it.customMeasurement?.firstPleatSize || "",
            ).trim(),
            noOfChestPleats: String(
              it.customMeasurement?.noOfChestPleats || "",
            ).trim(),
            height: String(it.customMeasurement?.height || "").trim(),
            dressSize: String(it.customMeasurement?.dressSize || "").trim(),
            notes: String(it.customMeasurement?.notes || "").trim(),
          };
        }
      } else {
        measurementProfile = {
          measurementId: `no_meas_${idx + 1}`,
          title: "Standard (No Measurements)",
          pallu: "",
          shoulderToRightTight: "",
          chest: "",
          hip: "",
          firstPleatSize: "",
          noOfChestPleats: "",
          height: "",
          dressSize: "",
          notes: String(it.itemNotes || "").trim(),
        };
      }

      const matchingService = services.find((s) => s.id === it.serviceId);
      const resolvedServiceType =
        it.serviceType || matchingService?.serviceType || "Pleating Service";

      return {
        itemId: it.id || `item_${idx + 1}`,
        serviceId: it.serviceId || "",
        serviceName: it.serviceName || "Saree Pre-Pleating Service",
        serviceType: resolvedServiceType,
        servicePrice: Number(it.servicePrice) || Number(it.finalPrice) || 0,
        serviceDiscountedPrice:
          Number(it.serviceDiscountedPrice) || Number(it.finalPrice) || 0,
        serviceDescription: it.serviceDescription || "",
        finalPrice:
          it.finalPrice !== "" && it.finalPrice !== null
            ? Number(it.finalPrice)
            : NaN,
        sareeType: it.sareeType || "Kanjeevaram Silk (Pure Zari)",
        includeMeasurements,
        selectedMeasurementId: it.selectedMeasurementId || "custom",
        measurementProfile,
        itemNotes: it.itemNotes || "",
      };
    });

    const numPaid = Number(advancePayment) || 0;
    if (numPaid > calculatedTotal) {
      isSubmittingRef.current = false;
      setSubmitting(false);
      const errMsg = `Paid amount (₹${numPaid.toLocaleString("en-IN")}) cannot exceed the total payable amount (₹${calculatedTotal.toLocaleString("en-IN")}).`;
      setValidationErrors((prev) => ({
        ...prev,
        advancePayment: errMsg,
        paidAmount: errMsg,
      }));
      toast.error(errMsg);
      setTimeout(() => {
        const paidInput = document.querySelector(
          "input[name='advancePayment'], .advance-payment-field input, #order-advance-payment, [aria-label*='Paid Amount']",
        );
        if (paidInput) {
          paidInput.scrollIntoView({ behavior: "smooth", block: "center" });
          paidInput.focus();
        }
      }, 80);
      return;
    }

    const resolvedPaymentStatus =
      numPaid >= calculatedTotal && calculatedTotal > 0
        ? "paid"
        : numPaid > 0
          ? "partial"
          : "pending";
    const resolvedPaid =
      resolvedPaymentStatus === "paid"
        ? numPaid > 0
          ? numPaid
          : calculatedTotal
        : numPaid;
    const resolvedAdvance = numPaid;
    const resolvedBalanceDue =
      resolvedPaymentStatus === "paid"
        ? 0
        : Math.max(0, calculatedTotal - numPaid);
    const resolvedBalancePaid =
      resolvedPaymentStatus === "paid"
        ? numPaid > 0
          ? Math.max(0, calculatedTotal - numPaid)
          : calculatedTotal
        : 0;

    // Yup Validation Execution on full order including all 8 measurement parameters
    setValidationErrors({});
    try {
      await orderValidationSchema.validate(
        {
          client: {
            ...clientForm,
            username: cleanName,
            userMobile: cleanMobile,
          },
          items: processedItems,
          orderDate,
          deliveryDate,
          orderStatus,
          paymentStatus: resolvedPaymentStatus,
          paymentMethod,
          totalAmount: calculatedTotal,
          paidAmount: numPaid,
        },
        { abortEarly: false },
      );
    } catch (yupErr) {
      isSubmittingRef.current = false;
      setSubmitting(false);
      if (yupErr.inner && yupErr.inner.length > 0) {
        const errMap = {};
        yupErr.inner.forEach((err) => {
          if (!errMap[err.path]) {
            errMap[err.path] = err.message;
          }
        });
        setValidationErrors(errMap);

        // Smoothly scroll to the first invalid input element
        setTimeout(() => {
          const firstErrEl = document.querySelector(
            ".app-input-group--error, .app-select-group--error, .app-datepicker-group--error, .is-error, [aria-invalid='true']",
          );
          if (firstErrEl) {
            firstErrEl.scrollIntoView({ behavior: "smooth", block: "center" });
            const input = firstErrEl.querySelector("input, select, textarea");
            if (input) input.focus();
          }
        }, 80);
      }
      return;
    }

    try {
      const finalOccasion =
        occasion === "Other Occasion" && customOccasion.trim()
          ? customOccasion.trim()
          : occasion;

      const orderPayload = {
        clientId:
          selectedClientId && selectedClientId !== "new"
            ? selectedClientId
            : `client_${Date.now()}`,
        username: cleanName,
        userMobile: cleanMobile,
        email: (clientForm.email || "").trim().toLowerCase(),
        userAddress: (clientForm.userAddress || "").trim(),
        client: {
          clientId:
            selectedClientId && selectedClientId !== "new"
              ? selectedClientId
              : `client_${Date.now()}`,
          username: cleanName,
          userMobile: cleanMobile,
          email: (clientForm.email || "").trim().toLowerCase(),
          userAddress: (clientForm.userAddress || "").trim(),
        },
        serviceType: processedItems[0]?.serviceType || "Pleating Service",
        items: processedItems,
        totalItems: processedItems.length,
        subtotal: subtotalAmount,
        pickupDeliveryCharges: Number(pickupDeliveryCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        advancePayment: resolvedAdvance,
        paidAmount: resolvedPaid,
        discount: Number(discount) || 0,
        totalAmount: calculatedTotal,
        balanceDue: resolvedBalanceDue,
        balancePaid: resolvedBalancePaid,
        paymentStatus: resolvedPaymentStatus,
        paymentMethod,
        orderStatus,
        status: orderStatus,
        occasion: finalOccasion,
        orderDate,
        deliveryDate,
        notes: orderNotes.trim(),
        createdBy:
          currentUser?.uid || userProfile?.id || auth?.currentUser?.uid || "",
      };

      const created = await createOrder(orderPayload);

      // Auto-register new client so they appear in existing clients lists immediately
      if (!selectedClientId || selectedClientId === "new") {
        try {
          await createUser({
            id: orderPayload.clientId,
            username: cleanName,
            userMobile: cleanMobile,
            email: (clientForm.email || "").trim().toLowerCase(),
            userAddress: (clientForm.userAddress || "").trim(),
            role: USER_ROLES.CLIENT,
          });
        } catch (clientErr) {
          console.warn("Auto-register client note:", clientErr);
        }
      }

      toast.success(
        `Order ${created.id || "A-NEW-SPP"} booked successfully for ${cleanName}!`,
      );

      if (onOrderCreated) {
        onOrderCreated(created);
      }
      handleResetForm();
      onClose();
    } catch (err) {
      console.error("Order creation failed:", err);
      toast.error(
        "Failed to create order: " +
          (err.message || "Please check details and retry."),
      );
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }, 500);
    }
  };

  // Options for Client Select
  const clientSelectOptions = useMemo(() => {
    return [
      {
        value: "new",
        label: "+ Enter New Client",
        subtitle: "Manually fill client contact details",
      },
      ...clients.map((c) => ({
        value: c.id,
        label: c.username || "Unnamed",
        subtitle: `${c.userMobile || "No Mobile"}${c.email ? " • " + c.email : ""}`,
      })),
    ];
  }, [clients]);

  // Options for Service Select
  const serviceSelectOptions = useMemo(() => {
    const sorted = [...services].sort((a, b) => {
      const orderA =
        a.displayOrder && a.displayOrder > 0 ? Number(a.displayOrder) : 999999;
      const orderB =
        b.displayOrder && b.displayOrder > 0 ? Number(b.displayOrder) : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.serviceName || "").localeCompare(b.serviceName || "");
    });

    return sorted.map((s) => {
      const p = Number(
        s.servicePrice !== undefined && s.servicePrice !== null
          ? s.servicePrice
          : s.price || 0,
      );
      const dp = Number(
        s.serviceDiscountedPrice !== undefined &&
          s.serviceDiscountedPrice !== null
          ? s.serviceDiscountedPrice
          : p,
      );
      return {
        value: s.id,
        label:
          s.displayOrder && s.displayOrder > 0
            ? `#${s.displayOrder} - ${s.serviceName}`
            : s.serviceName,
        subtitle:
          dp > 0 && dp < p ? `Offer: ₹${dp} (Reg: ₹${p})` : `Price: ₹${p}`,
      };
    });
  }, [services]);

  return (
    <AppModal
      open={open}
      onClose={() => !submitting && onClose()}
      title={
        isClientMode
          ? "Book Saree Pre-Pleating Order"
          : "Create New Saree Pre-Pleating Order"
      }
      subtitle={
        isClientMode
          ? "Select services, choose your measurement profile, and schedule delivery"
          : "Register client details, select services & measurement profiles, and schedule delivery"
      }
      maxWidth="lg"
      actions={
        <div className="create-order-actions-bar">
          <div className="order-summary-pill">
            <span className="summary-label">Total Amount:</span>
            <span className="summary-val">
              ₹{calculatedTotal.toLocaleString("en-IN")}
            </span>
            <span className="summary-count">
              ({items.length} {items.length === 1 ? "Service" : "Services"})
            </span>
          </div>

          <div className="actions-right">
            <AppButton
              variant="secondary"
              className="order-modal-cancel-btn"
              onClick={() => {
                handleResetForm();
                onClose();
              }}
              disabled={submitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
              startIcon={<CheckCircleOutlineIcon />}
              className="book-now-btn"
            >
              Book Now
            </AppButton>
          </div>
        </div>
      }
    >
      {loadingInitial ? (
        <div className="modal-loading-state">
          <AppSpinner size="lg" color="gold" />
          <p>
            {isClientMode
              ? "Loading services catalog..."
              : "Loading clients & services catalog..."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="create-order-form">
          {/* ========================================================= */}
          {/* 1. Client Information Section                            */}
          {/* ========================================================= */}
          <div className="form-section-card">
            <div className="section-header">
              <div className="section-title-wrap">
                <PersonOutlineIcon className="section-icon" />
                <div>
                  <h3 className="section-title">Client Information</h3>
                  <p className="section-subtitle">
                    {isClientMode
                      ? "Your contact details and delivery location"
                      : initialClient
                        ? "Client pre-selected - contact details loaded automatically"
                        : "Select an existing registered client or enter new client details"}
                  </p>
                </div>
              </div>

              {!isClientMode && (
                <div className="client-picker-wrap">
                  <AppSelect
                    placeholder="-- Choose Existing Client --"
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    options={clientSelectOptions}
                    startAdornment={<PersonOutlineIcon />}
                    disabled={submitting || Boolean(initialClient)}
                    searchable
                    allowClear={!initialClient}
                    className="client-select-box"
                  />
                </div>
              )}
            </div>

            <div className="form-grid form-grid--2col">
              <div className="form-field-wrap">
                <AppInput
                  label="Client Name"
                  placeholder="e.g. Aparna"
                  value={clientForm.username}
                  onChange={(e) => {
                    if (initialClient) return;
                    setClientForm((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }));
                    setValidationErrors((prev) => ({
                      ...prev,
                      "client.username": undefined,
                    }));
                  }}
                  disabled={submitting}
                  readOnly={Boolean(initialClient)}
                  startAdornment={<PersonOutlineIcon />}
                  required
                  error={Boolean(validationErrors["client.username"])}
                  helperText={validationErrors["client.username"]}
                />
              </div>

              <div className="form-field-wrap">
                <AppInput
                  label="Mobile Number"
                  placeholder="e.g. 9849012345"
                  inputMode="numeric"
                  maxLength={10}
                  onKeyDown={(e) => {
                    if (initialClient) return;
                    if (
                      !/^\d$/.test(e.key) &&
                      ![
                        "Backspace",
                        "Delete",
                        "ArrowLeft",
                        "ArrowRight",
                        "Tab",
                      ].includes(e.key) &&
                      !(e.ctrlKey || e.metaKey)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  value={clientForm.userMobile}
                  onChange={(e) => {
                    if (initialClient) return;
                    const sanitized = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setClientForm((prev) => ({
                      ...prev,
                      userMobile: sanitized,
                    }));
                    setValidationErrors((prev) => ({
                      ...prev,
                      "client.userMobile": undefined,
                    }));
                  }}
                  disabled={submitting}
                  readOnly={Boolean(initialClient)}
                  startAdornment={<PhoneIphoneOutlinedIcon />}
                  required
                  error={Boolean(validationErrors["client.userMobile"])}
                  helperText={validationErrors["client.userMobile"]}
                />
              </div>

              <div className="form-field-wrap">
                <AppInput
                  label="Email Address (optional)"
                  placeholder="e.g. priya.sharma@gmail.com"
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => {
                    if (initialClient) return;
                    setClientForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }));
                    setValidationErrors((prev) => ({
                      ...prev,
                      "client.email": undefined,
                    }));
                  }}
                  disabled={submitting}
                  readOnly={Boolean(initialClient)}
                  startAdornment={<EmailOutlinedIcon />}
                  error={Boolean(validationErrors["client.email"])}
                  helperText={validationErrors["client.email"]}
                />
              </div>

              <div className="form-field-wrap">
                <AppInput
                  label={
                    isClientMode
                      ? "Delivery / Pickup Address"
                      : "Address / Location (optional)"
                  }
                  placeholder={
                    isClientMode
                      ? "e.g. Flat 301, Sri Sai Heights, Madhapur, Hyderabad"
                      : "e.g. Flat 302, Green Meadows, Jubilee Hills"
                  }
                  value={clientForm.userAddress}
                  onChange={(e) => {
                    if (initialClient) return;
                    setClientForm((prev) => ({
                      ...prev,
                      userAddress: e.target.value,
                    }));
                    setValidationErrors((prev) => ({
                      ...prev,
                      "client.userAddress": undefined,
                    }));
                  }}
                  disabled={submitting}
                  readOnly={Boolean(initialClient)}
                  startAdornment={<LocationOnOutlinedIcon />}
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. Services & Individual Measurement Profiles             */}
          {/* ========================================================= */}
          <div className="form-section-card">
            <div className="section-header">
              <div className="section-title-wrap">
                <DryCleaningOutlinedIcon className="section-icon" />
                <div>
                  <h3 className="section-title">
                    Ordered Services & Measurements
                  </h3>
                  <p className="section-subtitle">
                    Add 1 or more saree services, each with its custom pleating
                    & measurement specs
                  </p>
                </div>
              </div>

              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddItem}
                disabled={submitting}
              >
                Add Another Service
              </AppButton>
            </div>

            <div className="service-items-list">
              {items.map((item, idx) => (
                <div key={item.id} className="service-item-card">
                  <div className="item-card-header">
                    <div className="item-badge-wrap">
                      <span className="item-number-badge">
                        Service #{idx + 1}
                      </span>
                      {item.serviceName && (
                        <span className="item-service-title">
                          {item.serviceName}
                        </span>
                      )}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        className="remove-item-btn"
                        title="Remove this service"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={submitting}
                      >
                        <DeleteOutlineIcon style={{ fontSize: 16 }} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Service Selection & Pricing Row */}
                  <div className="item-fields-grid">
                    <div className="form-field-wrap">
                      <AppSelect
                        label="Select Service"
                        placeholder="-- Choose from Catalog --"
                        value={item.serviceId}
                        onChange={(e) =>
                          handleServiceSelect(idx, e.target.value)
                        }
                        options={serviceSelectOptions}
                        startAdornment={<DryCleaningOutlinedIcon />}
                        disabled={submitting}
                        searchable
                        required
                        error={Boolean(
                          validationErrors[`items[${idx}].serviceId`],
                        )}
                        helperText={validationErrors[`items[${idx}].serviceId`]}
                      />
                    </div>

                    <div className="form-field-wrap">
                      <AppSelect
                        label="Saree Fabric / Type"
                        value={item.sareeType}
                        onChange={(e) =>
                          handleItemFieldChange(
                            idx,
                            "sareeType",
                            e.target.value,
                          )
                        }
                        options={SAREE_FABRICS.map((f) => ({
                          value: f,
                          label: f,
                        }))}
                        startAdornment={<LayersOutlinedIcon />}
                        disabled={submitting}
                        error={Boolean(
                          validationErrors[`items[${idx}].sareeType`],
                        )}
                        helperText={validationErrors[`items[${idx}].sareeType`]}
                      />
                    </div>

                    <div className="form-field-wrap">
                      <AppInput
                        label="Service Price (₹) [Fixed]"
                        type="text"
                        placeholder="Select service..."
                        value={
                          item.finalPrice !== "" &&
                          item.finalPrice !== undefined &&
                          item.finalPrice !== null
                            ? String(item.finalPrice)
                            : item.servicePrice
                              ? String(item.servicePrice)
                              : ""
                        }
                        disabled={true}
                        startAdornment={<CurrencyRupeeIcon />}
                        required
                        error={Boolean(
                          validationErrors[`items[${idx}].servicePrice`] ||
                          validationErrors[`items[${idx}].finalPrice`],
                        )}
                        helperText={
                          validationErrors[`items[${idx}].servicePrice`] ||
                          validationErrors[`items[${idx}].finalPrice`] ||
                          (Number(item.servicePrice) > 0 &&
                          Number(item.serviceDiscountedPrice) > 0 &&
                          Number(item.serviceDiscountedPrice) <
                            Number(item.servicePrice)
                            ? `Catalog Price: ₹${item.servicePrice} (Offer: ₹${item.finalPrice})`
                            : Number(item.servicePrice) > 0
                              ? `Catalog Price: ₹${item.servicePrice} (Protected)`
                              : "Auto-set from service catalog")
                        }
                      />
                    </div>
                  </div>

                  {item.serviceDescription && (
                    <div className="service-desc-box">
                      <InfoOutlinedIcon style={{ fontSize: 14 }} />
                      <span>{item.serviceDescription}</span>
                    </div>
                  )}

                  {/* Measurement Profile Linking */}
                  <div className="item-measurement-section">
                    <div className="measurement-header-row">
                      <div className="sub-title-with-toggle">
                        <div className="sub-title">
                          <StraightenOutlinedIcon style={{ fontSize: 16 }} />
                          <span>Measurement Profile:</span>
                        </div>

                        <div className="meas-switch-wrapper">
                          <label
                            className="meas-toggle-switch"
                            title={
                              item.includeMeasurements !== false
                                ? "Turn Off Measurements for this Service"
                                : "Turn On Measurements for this Service"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={item.includeMeasurements !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                handleItemFieldChange(
                                  idx,
                                  "includeMeasurements",
                                  checked,
                                );
                              }}
                              disabled={submitting}
                            />
                            <span className="switch-slider" />
                          </label>
                          <span
                            className={`meas-switch-label ${
                              item.includeMeasurements !== false ? "on" : "off"
                            }`}
                          ></span>
                        </div>
                      </div>

                      {item.includeMeasurements !== false && (
                        <div className="measure-picker-inline">
                          <AppSelect
                            size="sm"
                            placeholder={
                              !selectedClientId || selectedClientId === "new"
                                ? "-- Enter Custom Pleat Sizing --"
                                : clientSavedMeasures.length > 0
                                  ? "-- Choose Profile --"
                                  : "-- Custom Sizing (No Saved Profiles) --"
                            }
                            value={item.selectedMeasurementId || "custom"}
                            onChange={(e) =>
                              handleItemFieldChange(
                                idx,
                                "selectedMeasurementId",
                                e.target.value,
                              )
                            }
                            options={[
                              {
                                value: "custom",
                                label: "Custom Sizing for this Order",
                                subtitle:
                                  selectedClientId &&
                                  selectedClientId !== "new" &&
                                  clientSavedMeasures.length === 0
                                    ? "No saved profiles for this client • Enter custom pleat dimensions below"
                                    : "Enter custom pleat dimensions below",
                              },
                              ...clientSavedMeasures.map((m) => ({
                                value: m.id,
                                label: m.title || "Saved Profile",
                                subtitle: `Pallu: ${m.pallu || "-"} | Pleats: ${m.noOfChestPleats || "-"}`,
                              })),
                            ]}
                            startAdornment={<StraightenOutlinedIcon />}
                            disabled={submitting}
                            className="inline-measure-select"
                          />
                        </div>
                      )}
                    </div>

                    {item.includeMeasurements === false ? (
                      <div className="measure-skipped-banner">
                        <InfoOutlinedIcon style={{ fontSize: 16 }} />
                        <span>
                          No measurements required for this service (e.g.
                          Ironing, Standard Fold, or Dry Cleaning). You can
                          still enter custom notes below if needed.
                        </span>
                      </div>
                    ) : item.selectedMeasurementId &&
                      item.selectedMeasurementId !== "custom" ? (
                      (() => {
                        const m = clientSavedMeasures.find(
                          (x) => x.id === item.selectedMeasurementId,
                        );
                        if (!m) return null;
                        return (
                          <div className="measure-summary-chips">
                            <span className="measure-chip">
                              <strong>Profile:</strong>{" "}
                              {m.title || "Saved Profile"}
                            </span>
                            <span className="measure-chip">
                              <strong>Pallu:</strong>{" "}
                              {m.pallu ? `${m.pallu}"` : "-"}
                            </span>
                            <span className="measure-chip">
                              <strong>Shoulder to Tight:</strong>{" "}
                              {m.shoulderToRightTight
                                ? `${m.shoulderToRightTight}"`
                                : "-"}
                            </span>
                            <span className="measure-chip">
                              <strong>Chest:</strong>{" "}
                              {m.chest ? `${m.chest}"` : "-"}
                            </span>
                            <span className="measure-chip">
                              <strong>Hip:</strong> {m.hip ? `${m.hip}"` : "-"}
                            </span>
                            <span className="measure-chip">
                              <strong>1st Pleat:</strong>{" "}
                              {m.firstPleatSize ? `${m.firstPleatSize}"` : "-"}
                            </span>
                            <span className="measure-chip">
                              <strong>Chest Pleats:</strong>{" "}
                              {m.noOfChestPleats || "-"}
                            </span>
                            <span className="measure-chip">
                              <strong>Height:</strong> {m.height || "-"}
                            </span>
                            <span className="measure-chip">
                              <strong>Dress Size:</strong> {m.dressSize || "-"}
                            </span>
                            {m.notes && (
                              <span className="measure-chip measure-chip--note">
                                <strong>Note:</strong> {m.notes}
                              </span>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="custom-measure-grid">
                        <AppInput
                          label="Pallu Length (in)"
                          placeholder="e.g. 42"
                          inputMode="decimal"
                          onKeyDown={(e) => handleNumericKeyDown(e, true)}
                          value={item.customMeasurement.pallu}
                          onChange={(e) =>
                            handleCustomMeasurementChange(
                              idx,
                              "pallu",
                              e.target.value,
                            )
                          }
                          disabled={submitting}
                          required
                          error={Boolean(
                            validationErrors[
                              `items[${idx}].measurementProfile.pallu`
                            ] || validationErrors[`items[${idx}].pallu`],
                          )}
                          helperText={
                            validationErrors[
                              `items[${idx}].measurementProfile.pallu`
                            ] || validationErrors[`items[${idx}].pallu`]
                          }
                        />
                        <AppInput
                          label="Shoulder to Thigh (in)"
                          placeholder="e.g. 52"
                          inputMode="decimal"
                          onKeyDown={(e) => handleNumericKeyDown(e, true)}
                          value={item.customMeasurement.shoulderToRightTight}
                          onChange={(e) =>
                            handleCustomMeasurementChange(
                              idx,
                              "shoulderToRightTight",
                              e.target.value,
                            )
                          }
                          disabled={submitting}
                          required
                          error={Boolean(
                            validationErrors[
                              `items[${idx}].measurementProfile.shoulderToRightTight`
                            ] ||
                            validationErrors[
                              `items[${idx}].shoulderToRightTight`
                            ],
                          )}
                          helperText={
                            validationErrors[
                              `items[${idx}].measurementProfile.shoulderToRightTight`
                            ] ||
                            validationErrors[
                              `items[${idx}].shoulderToRightTight`
                            ]
                          }
                        />
                        <AppInput
                          label="Chest Size (in)"
                          placeholder="e.g. 14"
                          inputMode="decimal"
                          onKeyDown={(e) => handleNumericKeyDown(e, true)}
                          value={item.customMeasurement.chest}
                          onChange={(e) =>
                            handleCustomMeasurementChange(
                              idx,
                              "chest",
                              e.target.value,
                            )
                          }
                          disabled={submitting}
                          required
                          error={Boolean(
                            validationErrors[
                              `items[${idx}].measurementProfile.chest`
                            ] || validationErrors[`items[${idx}].chest`],
                          )}
                          helperText={
                            validationErrors[
                              `items[${idx}].measurementProfile.chest`
                            ] || validationErrors[`items[${idx}].chest`]
                          }
                        />
                        <AppInput
                          label="Hip Size (in)"
                          placeholder="e.g. 52"
                          inputMode="decimal"
                          onKeyDown={(e) => handleNumericKeyDown(e, true)}
                          value={item.customMeasurement.hip}
                          onChange={(e) =>
                            handleCustomMeasurementChange(
                              idx,
                              "hip",
                              e.target.value,
                            )
                          }
                          disabled={submitting}
                          required
                          error={Boolean(
                            validationErrors[
                              `items[${idx}].measurementProfile.hip`
                            ] || validationErrors[`items[${idx}].hip`],
                          )}
                          helperText={
                            validationErrors[
                              `items[${idx}].measurementProfile.hip`
                            ] || validationErrors[`items[${idx}].hip`]
                          }
                        />
                        <AppInput
                          label="First Pleat Width (in)"
                          placeholder="e.g. 4"
                          inputMode="decimal"
                          onKeyDown={(e) => handleNumericKeyDown(e, true)}
                          value={item.customMeasurement.firstPleatSize}
                          onChange={(e) =>
                            handleCustomMeasurementChange(
                              idx,
                              "firstPleatSize",
                              e.target.value,
                            )
                          }
                          disabled={submitting}
                          required
                          error={Boolean(
                            validationErrors[
                              `items[${idx}].measurementProfile.firstPleatSize`
                            ] ||
                            validationErrors[`items[${idx}].firstPleatSize`],
                          )}
                          helperText={
                            validationErrors[
                              `items[${idx}].measurementProfile.firstPleatSize`
                            ] ||
                            validationErrors[`items[${idx}].firstPleatSize`]
                          }
                        />
                        <AppInput
                          label="Chest Pleats (count)"
                          placeholder="e.g. 7"
                          inputMode="numeric"
                          onKeyDown={(e) => handleNumericKeyDown(e, false)}
                          value={item.customMeasurement.noOfChestPleats}
                          onChange={(e) =>
                            handleCustomMeasurementChange(
                              idx,
                              "noOfChestPleats",
                              e.target.value,
                            )
                          }
                          disabled={submitting}
                          required
                          error={Boolean(
                            validationErrors[
                              `items[${idx}].measurementProfile.noOfChestPleats`
                            ] ||
                            validationErrors[`items[${idx}].noOfChestPleats`],
                          )}
                          helperText={
                            validationErrors[
                              `items[${idx}].measurementProfile.noOfChestPleats`
                            ] ||
                            validationErrors[`items[${idx}].noOfChestPleats`]
                          }
                        />
                        <AppInput
                          label="Client Height (ft)"
                          placeholder="e.g. 5.2"
                          inputMode="decimal"
                          onKeyDown={(e) => handleNumericKeyDown(e, true)}
                          value={item.customMeasurement.height}
                          onChange={(e) =>
                            handleCustomMeasurementChange(
                              idx,
                              "height",
                              e.target.value,
                            )
                          }
                          disabled={submitting}
                          required
                          error={Boolean(
                            validationErrors[
                              `items[${idx}].measurementProfile.height`
                            ] || validationErrors[`items[${idx}].height`],
                          )}
                          helperText={
                            validationErrors[
                              `items[${idx}].measurementProfile.height`
                            ] || validationErrors[`items[${idx}].height`]
                          }
                        />
                        <div className="form-field-wrap">
                          <AppSelect
                            label="Dress Size"
                            placeholder="Select Dress Size"
                            value={item.customMeasurement.dressSize || ""}
                            onChange={(e) =>
                              handleCustomMeasurementChange(
                                idx,
                                "dressSize",
                                e.target.value,
                              )
                            }
                            options={DRESS_SIZES.map((sz) => ({
                              value: sz,
                              label: sz,
                            }))}
                            disabled={submitting}
                            required
                            error={Boolean(
                              validationErrors[
                                `items[${idx}].measurementProfile.dressSize`
                              ] || validationErrors[`items[${idx}].dressSize`],
                            )}
                            helperText={
                              validationErrors[
                                `items[${idx}].measurementProfile.dressSize`
                              ] || validationErrors[`items[${idx}].dressSize`]
                            }
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 8 }}>
                      <AppInput
                        label="Measurement Notes (optional)"
                        placeholder="e.g. Handle antique zari border with extra care, add pins at 30 in waist"
                        value={item.itemNotes}
                        onChange={(e) =>
                          handleItemFieldChange(
                            idx,
                            "itemNotes",
                            e.target.value,
                          )
                        }
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. Timeline, Occasion & Payment Details                   */}
          {/* ========================================================= */}
          <div className="form-section-card">
            <div className="section-header">
              <div className="section-title-wrap">
                <CalendarTodayOutlinedIcon className="section-icon" />
                <div>
                  <h3 className="section-title">
                    Timeline, Occasion & Billing
                  </h3>
                  <p className="section-subtitle">
                    Schedule delivery target, record event occasion, and manage
                    payment status
                  </p>
                </div>
              </div>
            </div>

            <div className="form-grid form-grid--3col">
              <div className="form-field-wrap">
                <AppDatePicker
                  label="Order Creation Date"
                  name="orderDate"
                  value={orderDate}
                  onChange={(e) => {
                    setOrderDate(e.target.value);
                    setValidationErrors((prev) => ({
                      ...prev,
                      orderDate: undefined,
                    }));
                  }}
                  disabled={submitting}
                  required
                  error={Boolean(validationErrors.orderDate)}
                  helperText={validationErrors.orderDate}
                />
              </div>

              <div className="form-field-wrap">
                <AppDatePicker
                  label="Target Delivery Date"
                  name="deliveryDate"
                  placeholder="Select delivery target date..."
                  value={deliveryDate}
                  onChange={(e) => {
                    setDeliveryDate(e.target.value);
                    setValidationErrors((prev) => ({
                      ...prev,
                      deliveryDate: undefined,
                    }));
                  }}
                  disabled={submitting}
                  minDate={orderDate}
                  required
                  showPresets
                  error={Boolean(validationErrors.deliveryDate)}
                  helperText={validationErrors.deliveryDate}
                />
              </div>

              <div className="form-field-wrap">
                <AppSelect
                  label="Occasion / Event (optional)"
                  placeholder="-- Select Occasion (optional) --"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  options={OCCASIONS.map((occ) => ({ value: occ, label: occ }))}
                  startAdornment={<CelebrationOutlinedIcon />}
                  disabled={submitting}
                  allowClear
                />
              </div>
            </div>

            {occasion === "Other Occasion" && (
              <div style={{ marginTop: 12 }}>
                <AppInput
                  label="Specify Custom Occasion"
                  placeholder="e.g. Cousin's Wedding Reception"
                  value={customOccasion}
                  onChange={(e) => setCustomOccasion(e.target.value)}
                  disabled={submitting}
                />
              </div>
            )}

            <div
              className={`form-grid ${!isClientMode ? "form-grid--2col" : ""}`}
              style={{ marginTop: 14 }}
            >
              {!isClientMode && (
                <div className="form-field-wrap">
                  <AppSelect
                    label="Order Status"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    options={[
                      { value: "requested", label: "Requested" },
                      { value: "accepted", label: "Accepted" },
                      { value: "pending", label: "Pending" },
                      { value: "in-progress", label: "In Progress" },
                      { value: "completed", label: "Completed" },
                      { value: "delivered", label: "Delivered" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                    startAdornment={<CheckCircleOutlineIcon />}
                    disabled={submitting}
                  />
                </div>
              )}

              <div className="form-field-wrap">
                <AppSelect
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={[
                    { value: "UPI", label: "UPI (GPay / PhonePe / Paytm)" },
                    { value: "Cash", label: "Cash" },
                    { value: "Card", label: "Credit / Debit Card" },
                    { value: "NetBanking", label: "Net Banking" },
                  ]}
                  startAdornment={<PaymentOutlinedIcon />}
                  disabled={submitting}
                />
              </div>
            </div>

            <div
              className="form-grid form-grid--2col"
              style={{ marginTop: 14 }}
            >
              <div className="form-field-wrap">
                <AppInput
                  label="Pickup & Delivery Charges (₹)"
                  placeholder="0"
                  value={
                    pickupDeliveryCharges === 0 ? "" : pickupDeliveryCharges
                  }
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                    setPickupDeliveryCharges(
                      cleanVal === "" ? 0 : Number(cleanVal),
                    );
                  }}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  startAdornment={<CurrencyRupeeIcon />}
                  disabled={submitting}
                  helperText="Optional pickup/delivery fee added to total"
                />
              </div>

              <div className="form-field-wrap">
                <AppInput
                  label="Other Charges (₹)"
                  placeholder="0"
                  value={otherCharges === 0 ? "" : otherCharges}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                    setOtherCharges(cleanVal === "" ? 0 : Number(cleanVal));
                  }}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  startAdornment={<CurrencyRupeeIcon />}
                  disabled={submitting}
                  helperText="Optional extra or handling fee added to total"
                />
              </div>

              <div className="form-field-wrap">
                <AppInput
                  label="Discount (₹)"
                  placeholder="0"
                  value={discount === 0 ? "" : discount}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                    setDiscount(cleanVal === "" ? 0 : Number(cleanVal));
                  }}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  startAdornment={<CurrencyRupeeIcon />}
                  disabled={submitting}
                  helperText="Optional discount deducted from total"
                />
              </div>

              <div className="form-field-wrap advance-payment-field">
                <AppInput
                  label="Paid Amount (₹)"
                  name="advancePayment"
                  id="order-advance-payment"
                  placeholder="0"
                  value={advancePayment === 0 ? "" : advancePayment}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                    const numVal = cleanVal === "" ? 0 : Number(cleanVal);
                    setAdvancePayment(numVal);
                    if (numVal <= calculatedTotal) {
                      setValidationErrors((prev) => ({
                        ...prev,
                        advancePayment: undefined,
                        paidAmount: undefined,
                      }));
                    } else {
                      setValidationErrors((prev) => ({
                        ...prev,
                        advancePayment: `Paid amount (₹${numVal.toLocaleString("en-IN")}) cannot exceed total payable amount (₹${calculatedTotal.toLocaleString("en-IN")}).`,
                      }));
                    }
                  }}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  startAdornment={<CurrencyRupeeIcon />}
                  disabled={submitting}
                  error={Boolean(
                    validationErrors.advancePayment ||
                    validationErrors.paidAmount ||
                    (Number(advancePayment) > 0 &&
                      Number(advancePayment) > calculatedTotal),
                  )}
                  helperText={
                    validationErrors.advancePayment ||
                    validationErrors.paidAmount ||
                    (Number(advancePayment) > calculatedTotal
                      ? `⚠️ Paid amount (₹${Number(advancePayment).toLocaleString("en-IN")}) cannot exceed total payable amount (₹${calculatedTotal.toLocaleString("en-IN")}).`
                      : Number(advancePayment) > 0
                        ? Number(advancePayment) >= calculatedTotal &&
                          calculatedTotal > 0
                          ? `Paid in Full (₹${Number(advancePayment).toLocaleString("en-IN")})`
                          : `Partial (Advance: ₹${Number(advancePayment).toLocaleString("en-IN")}, Balance Due: ₹${Math.max(0, calculatedTotal - Number(advancePayment)).toLocaleString("en-IN")})`
                        : "Amount paid by client (0 = Pending, Partial = Advance, Full = Paid)")
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <AppInput
                label="Overall Order Notes / Special Instructions (optional)"
                placeholder="e.g. Client will collect both sarees together before Friday evening."
                multiline
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                disabled={submitting}
                startAdornment={<NotesOutlinedIcon />}
              />
            </div>
          </div>
        </form>
      )}
    </AppModal>
  );
}
