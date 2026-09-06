import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AppModal, AppButton, AppInput } from "../../../components/common";
import "./MeasurementModal.scss";

export const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];

// Shared numeric validator — error is always "Enter a valid measurement"
const numericField = (key) =>
  Yup.string()
    .trim()
    .test(`is-valid-${key}`, "Enter a valid measurement", (val) => {
      if (!val) return true; // optional
      const num = Number(val);
      return !Number.isNaN(num) && num > 0 && num <= 500;
    });

export const measurementValidationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, "Measurement title must be at least 2 characters")
    .max(60, "Title cannot exceed 60 characters")
    .required("Measurement title is required (e.g. Bridal Silk Saree)"),
  pallu: numericField("pallu"),
  shoulderToRightTight: numericField("shoulder"),
  chest: numericField("chest"),
  hip: numericField("hip"),
  firstPleatSize: numericField("pleat"),
  noOfChestPleats: numericField("chestPleats"),
  height: numericField("height"),
  dressSize: Yup.string()
    .trim()
    .oneOf(DRESS_SIZES, "Please select a valid dress size"),
  notes: Yup.string().trim().max(300, "Notes cannot exceed 300 characters"),
});

const DEFAULT_VALUES = {
  title: "",
  pallu: "",
  shoulderToRightTight: "",
  chest: "",
  hip: "",
  firstPleatSize: "",
  noOfChestPleats: "",
  height: "",
  dressSize: "M",
  notes: "",
};

/**
 * MeasurementModal – reusable "Add Measurement" popup.
 *
 * Props
 *  open          – boolean
 *  onClose       – () => void
 *  onSave        – async (values) => void  (caller handles API + state; throw to show error)
 *  subtitle      – string  (e.g. "Recording for Jane")
 *  initialValues – optional partial override for form defaults
 */
export const MeasurementModal = ({
  open,
  onClose,
  onSave,
  subtitle = "",
  initialValues = {},
}) => {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { ...DEFAULT_VALUES, ...initialValues },
    validationSchema: measurementValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSave(values);
        resetForm();
        onClose();
      } catch (err) {
        console.error("MeasurementModal onSave error:", err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    if (formik.isSubmitting) return;
    formik.resetForm();
    onClose();
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title="Add Saree Measurement Profile"
      subtitle={subtitle}
      maxWidth="md"
      actions={
        <>
          <AppButton
            variant="secondary"
            onClick={handleClose}
            disabled={formik.isSubmitting}
          >
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            onClick={formik.handleSubmit}
            loading={formik.isSubmitting}
          >
            Save Measurements
          </AppButton>
        </>
      }
    >
      <form
        onSubmit={formik.handleSubmit}
        className="measurement-modal-form"
      >
        {/* Profile Title */}
        <AppInput
          label="Measurement Profile Title"
          required
          id="mm-title"
          name="title"
          placeholder="e.g. Kanjeevaram Saree / Reception Saree"
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.title && formik.errors.title}
          disabled={formik.isSubmitting}
        />

        {/* Measurements Grid */}
        <div className="measurement-modal-grid">
          <AppInput
            label="Pallu Length (inches)"
            id="mm-pallu"
            name="pallu"
            placeholder="e.g. 38"
            value={formik.values.pallu}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.pallu && formik.errors.pallu}
            disabled={formik.isSubmitting}
          />
          <AppInput
            label="Shoulder to Tight (in)"
            id="mm-shoulder"
            name="shoulderToRightTight"
            placeholder="e.g. 14"
            value={formik.values.shoulderToRightTight}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.shoulderToRightTight &&
              formik.errors.shoulderToRightTight
            }
            disabled={formik.isSubmitting}
          />
          <AppInput
            label="Chest (inches)"
            id="mm-chest"
            name="chest"
            placeholder="e.g. 36"
            value={formik.values.chest}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.chest && formik.errors.chest}
            disabled={formik.isSubmitting}
          />
          <AppInput
            label="Hip (inches)"
            id="mm-hip"
            name="hip"
            placeholder="e.g. 40"
            value={formik.values.hip}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.hip && formik.errors.hip}
            disabled={formik.isSubmitting}
          />
          <AppInput
            label="First Pleat Size (in)"
            id="mm-firstPleat"
            name="firstPleatSize"
            placeholder="e.g. 5.5"
            value={formik.values.firstPleatSize}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.firstPleatSize && formik.errors.firstPleatSize
            }
            disabled={formik.isSubmitting}
          />
          <AppInput
            label="Chest Pleats (count)"
            id="mm-chestPleats"
            name="noOfChestPleats"
            placeholder="e.g. 5"
            value={formik.values.noOfChestPleats}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.noOfChestPleats && formik.errors.noOfChestPleats
            }
            disabled={formik.isSubmitting}
          />
          <AppInput
            label="Height (cm / ft)"
            id="mm-height"
            name="height"
            placeholder="e.g. 160"
            value={formik.values.height}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.height && formik.errors.height}
            disabled={formik.isSubmitting}
          />
          <AppInput
            select
            label="Dress Size"
            id="mm-dressSize"
            name="dressSize"
            value={formik.values.dressSize}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.dressSize && formik.errors.dressSize}
            disabled={formik.isSubmitting}
          >
            {DRESS_SIZES.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </AppInput>
        </div>

        {/* Notes */}
        <AppInput
          multiline
          rows={2}
          label="Special Pleating Notes (Optional)"
          id="mm-notes"
          name="notes"
          placeholder="e.g. Extra pins for heavy silk border, left-side drape..."
          value={formik.values.notes}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.notes && formik.errors.notes}
          disabled={formik.isSubmitting}
        />
      </form>
    </AppModal>
  );
};

export default MeasurementModal;
