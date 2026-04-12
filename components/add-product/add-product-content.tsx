"use client";

import { useMemo, useState } from "react";
import { BookText, ClipboardList, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FieldLabel } from "@/components/ui/field-label";
import { BorderedInput } from "@/components/ui/bordered-input";
import { BorderedSelect } from "@/components/ui/bordered-select";
import { BottomToast } from "@/components/ui/bottom-toast";
import { useCategories } from "@/hooks/useCategories";
import { useAutoDismissToast } from "@/hooks/useAutoDismissToast";
import { useStorageZones } from "@/hooks/useStorageZones";
import { useAddProduct } from "@/hooks/useAddProduct";
import { useFamilies } from "@/hooks/useFamilies";
import { addMonthsToDateString, getTodayDateString } from "@/lib/date-utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { sanitizeInput, sanitizeInputOnChange, validateNotes, validateProductName } from "@/lib/input-validation";

export function AddProductContent() {
  const { t } = useI18n();
  const { categories, loading: categoriesLoading } = useCategories();
  const { zones, loading: zonesLoading } = useStorageZones();
  const { families, loading: familiesLoading } = useFamilies();
  const { toastMessage, showToast } = useAutoDismissToast();
  const { submit: submitProduct, loading: submitting, error: formError } = useAddProduct();

  const [productName, setProductName] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [zoneDetailId, setZoneDetailId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [creationDate, setCreationDate] = useState(getTodayDateString());
  const [note, setNote] = useState("");

  const productNameError = useMemo(() => validateProductName(productName), [productName]);
  const noteError = useMemo(() => validateNotes(note), [note]);

  const requiredMissing = !sanitizeInput(productName) || !familyId || !categoryId || !sanitizeInput(quantity);
  const hasInputErrors = Boolean(productNameError || noteError || requiredMissing);

  const selectedZone = zones.find((zone) => String(zone.id) === zoneId);
  const zoneDetails = selectedZone?.details ?? [];

  function onCategoryChange(categoryValue: string) {
    setCategoryId(categoryValue);

    if (!categoryValue) {
      return;
    }

    const selectedCategory = categories.find((category) => String(category.id) === categoryValue);
    const categoryNotificationsEnabled = selectedCategory?.notify_on_expiry !== false;
    const defaultExpiryMonths = selectedCategory?.default_expiry_months ?? 0;

    if (!categoryNotificationsEnabled || defaultExpiryMonths <= 0) {
      return;
    }

    const nextExpiry = addMonthsToDateString(getTodayDateString(), defaultExpiryMonths);
    setExpiryDate(nextExpiry);
  }

  async function onRegisterProduct() {
    if (hasInputErrors) {
      return;
    }

    const parsedCategoryId = categoryId ? Number.parseInt(categoryId, 10) : null;
    const parsedZoneId = zoneId ? Number.parseInt(zoneId, 10) : null;
    const parsedZoneDetailId = zoneDetailId ? Number.parseInt(zoneDetailId, 10) : null;
    const parsedFamilyId = Number.parseInt(familyId, 10);

    const created = await submitProduct({
      name: sanitizeInput(productName),
      familyId: parsedFamilyId,
      stock: quantity,
      expiryDate,
      creationDate,
      note: sanitizeInput(note),
      categoryId: Number.isNaN(parsedCategoryId ?? NaN) ? null : parsedCategoryId,
      zoneId: Number.isNaN(parsedZoneId ?? NaN) ? null : parsedZoneId,
      zoneDetailId: Number.isNaN(parsedZoneDetailId ?? NaN) ? null : parsedZoneDetailId,
    });

    if (created) {
      setProductName("");
      setCreationDate(getTodayDateString());
      setFamilyId("");
      setCategoryId("");
      setZoneId("");
      setZoneDetailId("");
      setQuantity("");
      setExpiryDate("");
      setNote("");
      showToast(t("addProduct.createdToast"));
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
      {/* ── Left column ── */}
      <div className="space-y-4">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3345b8]">
            {t("addProduct.pageLabel")}
          </p>
          <h1 className="mt-1 text-[42px] font-bold leading-tight text-[#1e2028]">{t("addProduct.title")}</h1>
        </div>

        {/* General Information */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <BookText size={16} className="text-[#3345b8]" />
              <h2 className="text-xl font-semibold text-[#22252d]">{t("addProduct.generalInformation")}</h2>
            </div>

            <div className="mb-6">
              <FieldLabel required>{t("addProduct.productName")}</FieldLabel>
              <BorderedInput
                value={productName}
                onChange={(e) => setProductName(sanitizeInputOnChange(e.target.value))}
                placeholder={t("addProduct.productExample")}
                maxLength={150}
              />
              {productNameError ? <p className="mt-1 text-xs font-semibold text-[#b13535]">{productNameError}</p> : null}
            </div>

            <div className="mb-6">
              <FieldLabel required>{t("addProduct.family")}</FieldLabel>
              <div className="relative">
                <BorderedSelect value={familyId} onChange={(event) => setFamilyId(event.target.value)}>
                  <option value="">{t("addProduct.selectFamily")}</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </BorderedSelect>
                <span className="pointer-events-none absolute right-3 top-2.5 text-[#8a8fa0]">▾</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>{t("addProduct.category")}</FieldLabel>
                <div className="relative">
                  <BorderedSelect value={categoryId} onChange={(event) => onCategoryChange(event.target.value)}>
                    <option value="">{t("addProduct.selectCategory")}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </BorderedSelect>
                  <span className="pointer-events-none absolute right-3 top-2.5 text-[#8a8fa0]">▾</span>
                </div>
              </div>
              <div>
                <FieldLabel>{t("addProduct.storageZone")}</FieldLabel>
                <div className="relative">
                  <BorderedSelect
                    value={zoneId}
                    onChange={(event) => {
                      setZoneId(event.target.value);
                      setZoneDetailId("");
                    }}
                  >
                    <option value="">{t("addProduct.selectZone")}</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </BorderedSelect>
                  <span className="pointer-events-none absolute right-3 top-2.5 text-[#8a8fa0]">▾</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>{t("addProduct.zoneDetail")}</FieldLabel>
                <div className="relative">
                  <BorderedSelect
                    value={zoneDetailId}
                    onChange={(event) => setZoneDetailId(event.target.value)}
                    disabled={!zoneId}
                  >
                    <option value="">{t("addProduct.noDetail")}</option>
                    {zoneDetails.map((detail) => (
                      <option key={detail.id} value={detail.id}>
                        {detail.label}
                      </option>
                    ))}
                  </BorderedSelect>
                  <span className="pointer-events-none absolute right-3 top-2.5 text-[#8a8fa0]">▾</span>
                </div>
              </div>
            </div>

            {categoriesLoading || zonesLoading || familiesLoading ? (
              <p className="mt-3 text-xs text-[#7f8698]">{t("addProduct.loadingOptions")}</p>
            ) : null}
          </CardContent>
        </Card>

        {/* Logistics & Value */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <ClipboardList size={16} className="text-[#3345b8]" />
              <h2 className="text-xl font-semibold text-[#22252d]">{t("addProduct.logisticsValue")}</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel required>{t("addProduct.quantity")}</FieldLabel>
                <BorderedInput
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder={t("addProduct.quantityExample")}
                />
              </div>
              <div>
                <FieldLabel>{t("addProduct.expiryDate")}</FieldLabel>
                <BorderedInput
                  type="date"
                  value={expiryDate}
                  onChange={(event) => setExpiryDate(event.target.value)}
                />
                <p className="mt-2 text-xs text-[#5a5f72]">
                  {t("addProduct.expiryNote")}
                </p>
              </div>
              <div>
                <FieldLabel>{t("addProduct.creationDate")}</FieldLabel>
                <BorderedInput
                  type="date"
                  value={creationDate}
                  onChange={(event) => setCreationDate(event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>{t("addProduct.note")}</FieldLabel>
                <BorderedInput
                  value={note}
                  onChange={(event) => setNote(sanitizeInputOnChange(event.target.value))}
                  placeholder={t("addProduct.notePlaceholder")}
                  maxLength={1000}
                />
                {noteError ? <p className="mt-1 text-xs font-semibold text-[#b13535]">{noteError}</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col gap-4">
        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onRegisterProduct}
            disabled={submitting || hasInputErrors}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3345b8] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Save size={15} />
            {submitting ? t("addProduct.registering") : t("addProduct.registerProduct")}
          </button>
          {formError ? <p className="px-1 text-center text-xs font-semibold text-[#b13535]">{formError}</p> : null}
          <p className="px-1 text-center text-xs leading-5 text-[#9095a8]">
            {t("addProduct.trackingNote")}
          </p>
        </div>

        {/* Shelf Life Tip */}
        <Card className="bg-[#ebedf9]">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3345b8]" />
              <p className="text-sm font-semibold text-[#22252d]">{t("addProduct.shelfLifeTipTitle")}</p>
            </div>
            <p className="text-xs leading-5 text-[#5a5f72]">
              {t("addProduct.shelfLifeTipDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomToast message={toastMessage} />
    </div>
  );
}
