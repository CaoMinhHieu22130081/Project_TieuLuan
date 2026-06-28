import React, { useState, useEffect, useCallback, useRef } from "react";
import { userAddressAPI, shippingAPI } from "../services/api";
import { useLanguage } from "../i18n/LanguageContext";
import AddressMapPicker from "./AddressMapPicker";
import {
  findAdministrativeOption,
  parseMapLocationAddress,
} from "../utils/addressParsing";

const buildAddressText = (data) => [
  data.detailAddress,
  data.wardName,
  data.districtName,
  data.provinceName,
  "Việt Nam",
].filter(Boolean).join(", ");

export default function AddressBook({ userId }) {
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ghnConfig, setGhnConfig] = useState({ configured: false, masterDataConfigured: false });
  const [ghnProvinces, setGhnProvinces] = useState([]);
  const [ghnDistricts, setGhnDistricts] = useState([]);
  const [ghnWards, setGhnWards] = useState([]);
  const [dataLoading, setDataLoading] = useState({ provinces: false, districts: false, wards: false });

  const [formData, setFormData] = useState({
    receiverName: "",
    receiverPhone: "",
    provinceId: "",
    provinceName: "",
    districtId: "",
    districtName: "",
    wardCode: "",
    wardName: "",
    detailAddress: "",
    note: "",
    isDefault: false,
    latitude: null,
    longitude: null
  });

  const mapAddressResolveIdRef = useRef(0);
  const currentMapLocationRef = useRef(null);

  const handleMapLocationChange = async (mapLocation, explicitAddress) => {
    const parsedAddress = parseMapLocationAddress(mapLocation);
    const resolveId = mapAddressResolveIdRef.current + 1;
    mapAddressResolveIdRef.current = resolveId;

    const baseFormUpdate = {
      latitude: mapLocation.latitude,
      longitude: mapLocation.longitude,
      ...(explicitAddress ? { detailAddress: explicitAddress } : {}),
    };
    const resolvedDetailAddress = explicitAddress || parsedAddress.detailAddress || "";

    if (!ghnConfig.masterDataConfigured) {
      setFormData((current) => ({
        ...current,
        ...baseFormUpdate,
        detailAddress: resolvedDetailAddress || current.detailAddress,
        provinceName: parsedAddress.provinceName || current.provinceName,
        districtName: parsedAddress.districtName || current.districtName,
        wardName: parsedAddress.wardName || current.wardName,
      }));
      return;
    }

    const matchedProvince = findAdministrativeOption(ghnProvinces, parsedAddress.provinceCandidates, "provinceName");
    let nextDistricts = [];
    let nextWards = [];
    let matchedDistrict = null;
    let matchedWard = null;

    try {
      if (matchedProvince) {
        nextDistricts = await shippingAPI.getGhnDistricts(matchedProvince.provinceId);
        if (mapAddressResolveIdRef.current !== resolveId) return;
        nextDistricts = Array.isArray(nextDistricts) ? nextDistricts : [];
        matchedDistrict = findAdministrativeOption(nextDistricts, parsedAddress.districtCandidates, "districtName");

        if (matchedDistrict) {
          nextWards = await shippingAPI.getGhnWards(matchedDistrict.districtId);
          if (mapAddressResolveIdRef.current !== resolveId) return;
          nextWards = Array.isArray(nextWards) ? nextWards : [];
          matchedWard = findAdministrativeOption(nextWards, parsedAddress.wardCandidates, "wardName");
        }
      }

      setGhnDistricts(nextDistricts);
      setGhnWards(nextWards);
      setFormData((current) => ({
        ...current,
        ...baseFormUpdate,
        detailAddress: resolvedDetailAddress || current.detailAddress,
        provinceId: matchedProvince?.provinceId || "",
        provinceName: matchedProvince?.provinceName || parsedAddress.provinceName || current.provinceName,
        districtId: matchedDistrict?.districtId || "",
        districtName: matchedDistrict?.districtName || parsedAddress.districtName || current.districtName,
        wardCode: matchedWard?.wardCode || "",
        wardName: matchedWard?.wardName || parsedAddress.wardName || current.wardName,
      }));
    } catch (mapAddressError) {
      if (mapAddressResolveIdRef.current !== resolveId) return;
      console.warn("Unable to resolve map address against GHN master data:", mapAddressError);
      setFormData((current) => ({
        ...current,
        ...baseFormUpdate,
        detailAddress: resolvedDetailAddress || current.detailAddress,
        provinceName: parsedAddress.provinceName || current.provinceName,
        districtName: parsedAddress.districtName || current.districtName,
        wardName: parsedAddress.wardName || current.wardName,
      }));
    }
  };

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userAddressAPI.getAddresses(userId);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load addresses:", err);
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadGhnConfiguration = useCallback(async () => {
    try {
      setDataLoading(prev => ({ ...prev, provinces: true }));
      const config = await shippingAPI.getGhnConfiguration();
      const normalizedConfig = {
        configured: Boolean(config?.configured),
        masterDataConfigured: Boolean(config?.masterDataConfigured)
      };
      setGhnConfig(normalizedConfig);

      if (normalizedConfig.masterDataConfigured) {
        const provinceData = await shippingAPI.getGhnProvinces();
        setGhnProvinces(Array.isArray(provinceData) ? provinceData : []);
      }
    } catch (err) {
      console.error("Failed to load GHN config:", err);
    } finally {
      setDataLoading(prev => ({ ...prev, provinces: false }));
    }
  }, []);

  // Load Addresses
  useEffect(() => {
    loadAddresses();
    loadGhnConfiguration();
  }, [loadAddresses, loadGhnConfiguration]);

  // Load districts when provinceId changes
  useEffect(() => {
    if (!formData.provinceId || !ghnConfig.masterDataConfigured) {
      setGhnDistricts([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        setDataLoading(prev => ({ ...prev, districts: true }));
        const districtData = await shippingAPI.getGhnDistricts(formData.provinceId);
        setGhnDistricts(Array.isArray(districtData) ? districtData : []);
      } catch (err) {
        console.error("Failed to load districts:", err);
      } finally {
        setDataLoading(prev => ({ ...prev, districts: false }));
      }
    };
    loadDistricts();
  }, [formData.provinceId, ghnConfig.masterDataConfigured]);

  // Load wards when districtId changes
  useEffect(() => {
    if (!formData.districtId || !ghnConfig.masterDataConfigured) {
      setGhnWards([]);
      return;
    }
    const loadWards = async () => {
      try {
        setDataLoading(prev => ({ ...prev, wards: true }));
        const wardData = await shippingAPI.getGhnWards(formData.districtId);
        setGhnWards(Array.isArray(wardData) ? wardData : []);
      } catch (err) {
        console.error("Failed to load wards:", err);
      } finally {
        setDataLoading(prev => ({ ...prev, wards: false }));
      }
    };
    loadWards();
  }, [formData.districtId, ghnConfig.masterDataConfigured]);

  const handleOpenModal = (address = null) => {
    setError("");
    if (address) {
      setEditingAddress(address);
      setFormData({
        receiverName: address.receiverName || "",
        receiverPhone: address.receiverPhone || "",
        provinceId: address.provinceId || "",
        provinceName: address.provinceName || "",
        districtId: address.districtId || "",
        districtName: address.districtName || "",
        wardCode: address.wardCode || "",
        wardName: address.wardName || "",
        detailAddress: address.detailAddress || "",
        note: address.note || "",
        isDefault: address.isDefault || false,
        latitude: address.latitude ?? null,
        longitude: address.longitude ?? null
      });
    } else {
      setEditingAddress(null);
      setFormData({
        receiverName: "",
        receiverPhone: "",
        provinceId: "",
        provinceName: "",
        districtId: "",
        districtName: "",
        wardCode: "",
        wardName: "",
        detailAddress: "",
        note: "",
        isDefault: false,
        latitude: null,
        longitude: null
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (editingAddress) {
        await userAddressAPI.updateAddress(userId, editingAddress.id, formData);
      } else {
        await userAddressAPI.createAddress(userId, formData);
      }
      setShowModal(false);
      loadAddresses();
    } catch (err) {
      setError(err.message || t({ vi: "Đã xảy ra lỗi", en: "Something went wrong" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm(t({ vi: "Bạn có chắc chắn muốn xóa địa chỉ này?", en: "Are you sure you want to delete this address?" }))) return;
    try {
      await userAddressAPI.deleteAddress(userId, addressId);
      loadAddresses();
    } catch (err) {
      alert(err.message || t({ vi: "Xóa thất bại", en: "Delete failed" }));
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await userAddressAPI.setDefaultAddress(userId, addressId);
      loadAddresses();
    } catch (err) {
      alert(err.message || t({ vi: "Đặt mặc định thất bại", en: "Set default failed" }));
    }
  };

  if (loading) {
    return <div className="profile-section"><p>{t({ vi: "Đang tải địa chỉ...", en: "Loading addresses..." })}</p></div>;
  }

  return (
    <div className="profile-section">
      <p className="profile-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>
          <span className="section-title-dot" /> {t({ vi: "Địa chỉ giao hàng", en: "Shipping addresses" })}
        </span>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
          + {t({ vi: "Thêm địa chỉ mới", en: "Add new address" })}
        </button>
      </p>

      {addresses.length === 0 ? (
        <div className="profile-empty-state">
          <p className="profile-empty-state-icon">📍</p>
          <p className="profile-empty-state-title">{t({ vi: "Chưa có địa chỉ nào", en: "No addresses yet" })}</p>
          <p className="profile-empty-state-subtitle">{t({ vi: "Thêm địa chỉ giao hàng để thanh toán nhanh chóng hơn.", en: "Add a shipping address to check out faster." })}</p>
        </div>
      ) : (
        <div className="address-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {addresses.map((address) => (
            <div key={address.id} style={{
              padding: "16px",
              border: address.isDefault ? "2px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: "8px",
              background: "var(--bg-2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px"
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{address.receiverName}</h4>
                  <span style={{ color: "var(--text-secondary)" }}>|</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>{address.receiverPhone}</span>
                  {address.isDefault && (
                    <span style={{ fontSize: "0.75rem", background: "var(--accent)", color: "#fff", padding: "2px 8px", borderRadius: "4px" }}>
                      {t({ vi: "Mặc định", en: "Default" })}
                    </span>
                  )}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                  <p style={{ margin: 0 }}>{address.detailAddress}</p>
                  <p style={{ margin: 0 }}>{address.wardName}, {address.districtName}, {address.provinceName}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="link-btn" onClick={() => handleOpenModal(address)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: 0, whiteSpace: "nowrap", lineHeight: 1 }}>{t({ vi: "Cập nhật", en: "Edit" })}</button>
                  {!address.isDefault && (
                    <button className="link-btn" onClick={() => handleDelete(address.id)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 0, whiteSpace: "nowrap", lineHeight: 1 }}>{t({ vi: "Xóa", en: "Delete" })}</button>
                  )}
                </div>
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    style={{ background: "none", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-primary)" }}
                  >
                    {t({ vi: "Thiết lập mặc định", en: "Set as default" })}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15, 23, 42, 0.38)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div className="modal-content" style={{
            background: "var(--surface)", width: "100%", maxWidth: "860px", borderRadius: "8px",
            padding: "24px", maxHeight: "85vh", overflowY: "auto", position: "relative"
          }}>
            <h3 style={{ marginTop: 0 }}>{editingAddress ? t({ vi: "Cập nhật địa chỉ", en: "Edit address" }) : t({ vi: "Thêm địa chỉ mới", en: "Add new address" })}</h3>
            {error && <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group" style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "6px" }}>{t({ vi: "Họ và tên", en: "Full name" })}</label>
                  <input type="text" required value={formData.receiverName}
                    onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-primary)" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "6px" }}>{t({ vi: "Số điện thoại", en: "Phone number" })}</label>
                  <input type="tel" required value={formData.receiverPhone}
                    onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {ghnConfig.masterDataConfigured && (
                <>
                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "6px" }}>{t({ vi: "Tỉnh / Thành phố", en: "Province / City" })} {dataLoading.provinces && "..."}</label>
                    <select required value={formData.provinceId}
                      onChange={(e) => {
                        const sel = e.target.options[e.target.selectedIndex];
                        setFormData({ ...formData, provinceId: e.target.value, provinceName: sel.text, districtId: "", districtName: "", wardCode: "", wardName: "" });
                      }}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-primary)" }}
                    >
                      <option value="" style={{ background: "var(--bg-2)", color: "var(--text-primary)" }}>{t({ vi: "Chọn Tỉnh / Thành phố", en: "Select province / city" })}</option>
                      {ghnProvinces.map((p) => (
                        <option key={p.provinceId} value={p.provinceId} style={{ background: "var(--bg-2)", color: "var(--text-primary)" }}>{p.provinceName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "6px" }}>{t({ vi: "Quận / Huyện", en: "District" })} {dataLoading.districts && "..."}</label>
                    <select required value={formData.districtId} disabled={!formData.provinceId}
                      onChange={(e) => {
                        const sel = e.target.options[e.target.selectedIndex];
                        setFormData({ ...formData, districtId: e.target.value, districtName: sel.text, wardCode: "", wardName: "" });
                      }}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-primary)" }}
                    >
                      <option value="" style={{ background: "var(--bg-2)", color: "var(--text-primary)" }}>{t({ vi: "Chọn Quận / Huyện", en: "Select district" })}</option>
                      {ghnDistricts.map((d) => (
                        <option key={d.districtId} value={d.districtId} style={{ background: "var(--bg-2)", color: "var(--text-primary)" }}>{d.districtName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: "block", marginBottom: "6px" }}>{t({ vi: "Phường / Xã", en: "Ward" })} {dataLoading.wards && "..."}</label>
                    <select required value={formData.wardCode} disabled={!formData.districtId}
                      onChange={(e) => {
                        const sel = e.target.options[e.target.selectedIndex];
                        setFormData({ ...formData, wardCode: e.target.value, wardName: sel.text });
                      }}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-primary)" }}
                    >
                      <option value="" style={{ background: "var(--bg-2)", color: "var(--text-primary)" }}>{t({ vi: "Chọn Phường / Xã", en: "Select ward" })}</option>
                      {ghnWards.map((w) => (
                        <option key={w.wardCode} value={w.wardCode} style={{ background: "var(--bg-2)", color: "var(--text-primary)" }}>{w.wardName}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label style={{ display: "block", marginBottom: "6px" }}>{t({ vi: "Địa chỉ cụ thể", en: "Detailed address" })}</label>
                <textarea required value={formData.detailAddress}
                  onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                  rows="3" placeholder={t({ vi: "Số nhà, tên đường...", en: "House number, street name..." })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--text-primary)", resize: "vertical" }}
                />
              </div>

              <AddressMapPicker
                compact
                title={t({ vi: "Chọn vị trí giao hàng", en: "Choose shipping location" })}
                fullAddress={buildAddressText(formData)}
                value={{ latitude: formData.latitude, longitude: formData.longitude }}
                onLocationChange={(location) => {
                  currentMapLocationRef.current = location;
                  void handleMapLocationChange(location);
                }}
                onUseSuggestedAddress={(suggestedAddress) => {
                  if (currentMapLocationRef.current) {
                    handleMapLocationChange(currentMapLocationRef.current, suggestedAddress);
                  } else {
                    setFormData((current) => ({
                      ...current,
                      detailAddress: suggestedAddress
                    }));
                  }
                }}
              />

              {!editingAddress?.isDefault && (
                <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" id="isDefault" checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <label htmlFor="isDefault">{t({ vi: "Đặt làm địa chỉ mặc định", en: "Set as default address" })}</label>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>{t({ vi: "Trở lại", en: "Back" })}</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? t({ vi: "Đang lưu...", en: "Saving..." }) : t({ vi: "Hoàn thành", en: "Done" })}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
