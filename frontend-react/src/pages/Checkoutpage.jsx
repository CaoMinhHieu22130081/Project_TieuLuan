import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { orderAPI, paymentAPI, shippingAPI, userAddressAPI } from "../services/api";
import { FREE_SHIPPING_THRESHOLD, formatShippingThreshold, isFreeShippingEligible } from "../utils/shipping";
import "./css/Checkoutpage.css";

const STEPS = ["Thông tin", "Thanh toán", "Xác nhận"];

const formatPrice = (value) => Number(value || 0).toLocaleString("vi-VN") + "đ";

const PAYMENT_METHOD_LABELS = {
  cod: "Thanh toán khi nhận hàng (COD)",
  vnpay: "VNPAY",
  momo: "MoMo",
  card: "Thẻ thanh toán",
};

const formatPaymentMethod = (method) => {
  if (!method) {
    return "—";
  }

  const normalizedMethod = String(method).trim().toLowerCase();
  return PAYMENT_METHOD_LABELS[normalizedMethod] || String(method).toUpperCase();
};

const buildOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UNQ-${timestamp}-${suffix}`;
};

const getItemImage = (item) => item?.image || "https://via.placeholder.com/100x125?text=UniqTee";

const getSelectedOptionLabel = (options, key, value, labelKey) => {
  const match = options.find((option) => String(option[key]) === String(value));
  return match?.[labelKey] || "";
};

export default function CheckoutPage() {
  const location = useLocation();
  const { user } = useAuth();
  const { cart, removeFromCart, loading: cartLoading } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedItemIds = Array.isArray(location.state?.selectedItems)
    ? location.state.selectedItems
    : [];
  const selectedItemSet = new Set(selectedItemIds);
  const checkoutItems = selectedItemSet.size > 0
    ? cart.filter((item) => selectedItemSet.has(item.cartItemId))
    : cart;
  const hasSelectionMismatch = selectedItemSet.size > 0 && checkoutItems.length === 0;

  const [step, setStep] = useState(0);
  const [payMethod, setPayMethod] = useState("cod");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shippingError, setShippingError] = useState("");
  const [orderResult, setOrderResult] = useState(null);
  const [paymentResultType, setPaymentResultType] = useState("");
  const [ghnConfig, setGhnConfig] = useState({
    configured: false,
    masterDataConfigured: false,
    missingFields: [],
  });
  const [ghnProvinces, setGhnProvinces] = useState([]);
  const [ghnDistricts, setGhnDistricts] = useState([]);
  const [ghnWards, setGhnWards] = useState([]);
  const [ghnLoading, setGhnLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [shippingQuote, setShippingQuote] = useState(null);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    provinceId: "",
    ward: "",
    districtId: "",
    district: "",
    wardCode: "",
    city: "",
    note: "",
  });

  useEffect(() => {
    if (!user) return;

    const fetchAddresses = async () => {
      try {
        const addresses = await userAddressAPI.getAddresses(user.id);
        const addressList = Array.isArray(addresses) ? addresses : [];
        setSavedAddresses(addressList);
        
        const defaultAddr = addressList.find(a => a.isDefault) || addressList[0];
        
        if (defaultAddr) {
          setShippingForm((current) => ({
            ...current,
            fullName: defaultAddr.receiverName || user.name || "",
            phone: defaultAddr.receiverPhone || user.phone || "",
            email: current.email || user.email || "",
            address: defaultAddr.detailAddress || "",
            provinceId: defaultAddr.provinceId || "",
            city: defaultAddr.provinceName || "",
            districtId: defaultAddr.districtId || "",
            district: defaultAddr.districtName || "",
            wardCode: defaultAddr.wardCode || "",
            ward: defaultAddr.wardName || "",
          }));
        } else {
          setShippingForm((current) => ({
            ...current,
            fullName: current.fullName || user.name || "",
            phone: current.phone || user.phone || "",
            email: current.email || user.email || "",
            address: current.address || user.address || "",
          }));
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
        setShippingForm((current) => ({
          ...current,
          fullName: current.fullName || user.name || "",
          phone: current.phone || user.phone || "",
          email: current.email || user.email || "",
          address: current.address || user.address || "",
        }));
      }
    };
    fetchAddresses();
  }, [user]);

  useEffect(() => {
    if (cartLoading) {
      return;
    }

    const paymentResult = searchParams.get("paymentResult");
    const orderCode = searchParams.get("orderCode");

    if (!paymentResult || !orderCode) {
      return;
    }

    const clearPendingVnpayCheckout = (pendingIds = []) => {
      pendingIds.forEach((cartItemId) => removeFromCart(cartItemId));
      sessionStorage.removeItem("pendingVnpayCheckout");
    };

    const handleVnpayResult = async () => {
      try {
        const storedPendingCheckoutRaw = sessionStorage.getItem("pendingVnpayCheckout");
        const storedPendingCheckout = storedPendingCheckoutRaw ? JSON.parse(storedPendingCheckoutRaw) : null;
        const pendingIds = Array.isArray(storedPendingCheckout?.cartItemIds) ? storedPendingCheckout.cartItemIds : [];

        if (paymentResult === "success" || paymentResult === "waiting") {
          const paidOrder = await orderAPI.getOrderByCode(orderCode);
          clearPendingVnpayCheckout(pendingIds);
          setOrderResult(paidOrder || { orderCode, paymentMethod: "vnpay" });
          setPaymentResultType(paymentResult === "waiting" ? "vnpay-waiting" : "vnpay");
          setSuccess(true);
          setStep(2);
          setError("");
        } else {
          sessionStorage.removeItem("pendingVnpayCheckout");
          setPaymentResultType("vnpay");
          setSuccess(false);
          setStep(1);
          setError("Thanh toán VNPAY không thành công hoặc đã bị hủy. Bạn có thể thử lại.");
        }
      } catch (callbackError) {
        console.error("Error handling VNPay return:", callbackError);
        setError(callbackError.message || "Không thể xác nhận kết quả thanh toán VNPay.");
        setSuccess(false);
        setStep(1);
      } finally {
        setSearchParams({}, { replace: true });
      }
    };

    handleVnpayResult();
  }, [cartLoading, removeFromCart, searchParams, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadGhnConfiguration = async () => {
      try {
        setGhnLoading(true);
        setShippingError("");

        const configuration = await shippingAPI.getGhnConfiguration();
        if (cancelled) {
          return;
        }

        const normalizedConfiguration = {
          configured: Boolean(configuration?.configured),
          masterDataConfigured: Boolean(configuration?.masterDataConfigured),
          missingFields: Array.isArray(configuration?.missingFields) ? configuration.missingFields : [],
        };

        setGhnConfig(normalizedConfiguration);

        if (normalizedConfiguration.masterDataConfigured) {
          const provinceData = await shippingAPI.getGhnProvinces();
          if (cancelled) {
            return;
          }

          setGhnProvinces(Array.isArray(provinceData) ? provinceData : []);
        } else {
          setGhnProvinces([]);
        }
      } catch (configurationError) {
        if (!cancelled) {
          setShippingError(configurationError.message || "Không thể tải cấu hình GHN");
          setGhnConfig({ configured: false, masterDataConfigured: false, missingFields: [] });
          setGhnProvinces([]);
        }
      } finally {
        if (!cancelled) {
          setGhnLoading(false);
        }
      }
    };

    loadGhnConfiguration();

    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  );
  const checkoutSignature = checkoutItems.map((item) => `${item.cartItemId}:${item.qty}`).join("|");
  const freeShippingEligible = isFreeShippingEligible(subtotal);
  const ghnReady = Boolean(ghnConfig.configured && ghnConfig.masterDataConfigured);

  useEffect(() => {
    let cancelled = false;

    const loadDistricts = async () => {
      if (!ghnReady || !shippingForm.provinceId) {
        setGhnDistricts([]);
        return;
      }

      try {
        setDistrictsLoading(true);
        const districtData = await shippingAPI.getGhnDistricts(shippingForm.provinceId);
        if (!cancelled) {
          setGhnDistricts(Array.isArray(districtData) ? districtData : []);
        }
      } catch (districtError) {
        if (!cancelled) {
          setShippingError(districtError.message || "Không thể tải quận/huyện GHN");
          setGhnDistricts([]);
          setGhnWards([]);
        }
      } finally {
        if (!cancelled) {
          setDistrictsLoading(false);
        }
      }
    };

    loadDistricts();

    return () => {
      cancelled = true;
    };
  }, [ghnReady, shippingForm.provinceId]);

  useEffect(() => {
    let cancelled = false;

    const loadWards = async () => {
      if (!ghnReady || !shippingForm.districtId) {
        setGhnWards([]);
        return;
      }

      try {
        setWardsLoading(true);
        const wardData = await shippingAPI.getGhnWards(shippingForm.districtId);
        if (!cancelled) {
          setGhnWards(Array.isArray(wardData) ? wardData : []);
        }
      } catch (wardError) {
        if (!cancelled) {
          setShippingError(wardError.message || "Không thể tải phường/xã GHN");
          setGhnWards([]);
        }
      } finally {
        if (!cancelled) {
          setWardsLoading(false);
        }
      }
    };

    loadWards();

    return () => {
      cancelled = true;
    };
  }, [ghnReady, shippingForm.districtId]);

  useEffect(() => {
    let cancelled = false;

    const quoteShipping = async () => {
      if (!ghnReady || freeShippingEligible) {
        setShippingQuote(null);
        setQuoteLoading(false);
        return;
      }

      if (!shippingForm.provinceId || !shippingForm.districtId || !shippingForm.wardCode) {
        setShippingQuote(null);
        setQuoteLoading(false);
        return;
      }

      try {
        setQuoteLoading(true);
        setShippingError("");

        const itemCount = checkoutItems.reduce((sum, item) => sum + Number(item.qty || 1), 0);
        const quote = await shippingAPI.quoteGhnFee({
          districtId: Number(shippingForm.districtId),
          wardCode: shippingForm.wardCode,
          itemCount,
          insuranceValue: subtotal,
        });

        if (!cancelled) {
          setShippingQuote(quote || null);
        }
      } catch (quoteError) {
        if (!cancelled) {
          setShippingQuote({
            configured: ghnConfig.configured,
            source: "fallback",
            shippingFee: 0,
            serviceName: "Phí tạm tính",
            message: quoteError.message || "Không thể tính phí GHN",
          });
          setShippingError(quoteError.message || "Không thể tính phí GHN");
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    };

    quoteShipping();

    return () => {
      cancelled = true;
    };
  }, [ghnReady, freeShippingEligible, shippingForm.provinceId, shippingForm.districtId, shippingForm.wardCode, checkoutSignature, subtotal, ghnConfig.configured]);

  const shippingFee = freeShippingEligible ? 0 : Number(shippingQuote?.shippingFee ?? 0);
  const shippingServiceName = freeShippingEligible ? "Miễn phí" : (shippingQuote?.serviceName || "GHN");
  const shippingLineValue = freeShippingEligible
    ? "Miễn phí 🎉"
    : ghnReady
      ? quoteLoading
        ? "Đang tính phí GHN..."
        : shippingQuote?.source === "ghn"
          ? formatPrice(shippingFee)
          : shippingQuote?.message || "GHN chưa trả được phí ship"
      : "GHN hiện chưa sẵn sàng";
  const shippingNote = freeShippingEligible
    ? `Đơn từ ${formatShippingThreshold()} được miễn phí ship.`
    : ghnReady
      ? quoteLoading
        ? "GHN đang tính phí ship theo địa chỉ đã chọn..."
        : shippingQuote?.message || `Phí ship cho đơn dưới ${formatShippingThreshold()} sẽ được GHN tính theo địa chỉ đã chọn.`
      : `GHN hiện chưa sẵn sàng, phí ship sẽ được tính theo địa chỉ khi GHN trả kết quả.`;
  const total = subtotal + shippingFee;

  const handleShipChange = (event) => {
    setShippingForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleProvinceChange = (event) => {
    const provinceId = event.target.value;
    const provinceName = getSelectedOptionLabel(ghnProvinces, "provinceId", provinceId, "provinceName");

    setShippingForm((current) => ({
      ...current,
      provinceId,
      city: provinceName,
      districtId: "",
      district: "",
      wardCode: "",
      ward: "",
    }));
    setGhnDistricts([]);
    setGhnWards([]);
    setShippingQuote(null);
    setShippingError("");
  };

  const handleDistrictChange = (event) => {
    const districtId = event.target.value;
    const districtName = getSelectedOptionLabel(ghnDistricts, "districtId", districtId, "districtName");

    setShippingForm((current) => ({
      ...current,
      districtId,
      district: districtName,
      wardCode: "",
      ward: "",
    }));
    setGhnWards([]);
    setShippingQuote(null);
    setShippingError("");
  };

  const handleWardChange = (event) => {
    const wardCode = event.target.value;
    const wardName = getSelectedOptionLabel(ghnWards, "wardCode", wardCode, "wardName");

    setShippingForm((current) => ({
      ...current,
      wardCode,
      ward: wardName,
    }));
    setShippingError("");
  };

  const handlePlaceOrder = async () => {
    if (!checkoutItems.length) {
      setError("Không có sản phẩm nào để thanh toán.");
      return;
    }

    const fullName = shippingForm.fullName.trim() || user?.name?.trim() || "";
    const phone = shippingForm.phone.trim();
    const email = shippingForm.email.trim();
    const address = shippingForm.address.trim();
    const ward = shippingForm.ward.trim();
    const district = shippingForm.district.trim();
    const city = shippingForm.city.trim();

    if (ghnReady && (!shippingForm.provinceId || !shippingForm.districtId || !shippingForm.wardCode)) {
      setError("Vui lòng chọn đầy đủ tỉnh/thành phố, quận/huyện và phường/xã GHN.");
      return;
    }

    const missingFields = [];
    if (!fullName) missingFields.push("họ tên");
    if (!phone) missingFields.push("số điện thoại");
    if (!address) missingFields.push("địa chỉ");
    if (ghnReady) {
      if (!shippingForm.wardCode) missingFields.push("phường/xã GHN");
      if (!shippingForm.districtId) missingFields.push("quận/huyện GHN");
      if (!shippingForm.provinceId) missingFields.push("tỉnh/thành phố GHN");
    } else {
      if (!ward) missingFields.push("phường/xã");
      if (!district) missingFields.push("quận/huyện");
      if (!city) missingFields.push("tỉnh/thành phố");
    }

    if (missingFields.length > 0) {
      setError(`Vui lòng nhập đầy đủ ${missingFields.join(", ")}.`);
      return;
    }

    if (ghnReady && !freeShippingEligible) {
      if (quoteLoading) {
        setError("Vui lòng chờ GHN tính phí ship trước khi đặt hàng.");
        return;
      }

      if (!shippingQuote || shippingQuote.source !== "ghn") {
        setError("GHN chưa trả được phí ship, vui lòng thử lại.");
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const selectedPaymentMethod = (payMethod || "cod").trim().toLowerCase();
      const selectedProvince = ghnReady
        ? ghnProvinces.find((province) => String(province.provinceId) === String(shippingForm.provinceId))
        : null;
      const selectedDistrict = ghnReady
        ? ghnDistricts.find((districtItem) => String(districtItem.districtId) === String(shippingForm.districtId))
        : null;
      const selectedWard = ghnReady
        ? ghnWards.find((wardItem) => String(wardItem.wardCode) === String(shippingForm.wardCode))
        : null;

      const resolvedCity = ghnReady ? selectedProvince?.provinceName || city : city;
      const resolvedDistrict = ghnReady ? selectedDistrict?.districtName || district : district;
      const resolvedWard = ghnReady ? selectedWard?.wardName || ward : ward;

      const orderPayload = {
        orderCode: buildOrderCode(),
        ...(user?.id ? { user: { id: Number(user.id) } } : {}),
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email || user?.email || "",
        address,
        ward: resolvedWard,
        district: resolvedDistrict,
        city: resolvedCity,
        note: shippingForm.note.trim(),
        status: "pending",
        paymentMethod: selectedPaymentMethod,
        shippingFee: freeShippingEligible ? 0 : shippingFee,
        items: checkoutItems.map((item) => {
          const qty = Number(item.qty || 1);
          const price = Number(item.price || 0);

          return {
            productId: item.productId,
            productName: item.name,
            productSku: item.sku || "",
            color: item.color || "",
            size: item.size || "",
            qty,
            unitPrice: price,
            subtotal: price * qty,
          };
        }),
      };

      const createdOrder = await orderAPI.createOrder(orderPayload);

      if (selectedPaymentMethod === "vnpay") {
        const paymentResponse = await paymentAPI.createVnpayPayment(createdOrder?.orderCode || orderPayload.orderCode);
        const paymentUrl = paymentResponse?.paymentUrl;

        if (!paymentUrl) {
          throw new Error("Không thể khởi tạo thanh toán VNPay. Vui lòng thử lại.");
        }

        sessionStorage.setItem(
          "pendingVnpayCheckout",
          JSON.stringify({
            orderCode: createdOrder?.orderCode || orderPayload.orderCode,
            cartItemIds: checkoutItems.map((item) => item.cartItemId),
          })
        );

        window.location.assign(paymentUrl);
        return;
      }

      checkoutItems.forEach((item) => removeFromCart(item.cartItemId));

      setOrderResult(createdOrder || { orderCode: orderPayload.orderCode, paymentMethod: selectedPaymentMethod });
      setPaymentResultType("cod");
      setSuccess(true);
      setStep(2);
    } catch (submitError) {
      setError(submitError.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!success && !cartLoading && cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-inner">
          <div className="checkout-success">
            <div className="success-animation">🛒</div>
            <h2>Giỏ hàng đang trống</h2>
            <p>Bạn chưa có sản phẩm nào để thanh toán.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link to="/products" className="btn-primary">Mua sắm ngay</Link>
              <Link to="/cart" className="btn-secondary">Về giỏ hàng</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!success && hasSelectionMismatch) {
    return (
      <div className="checkout-page">
        <div className="checkout-inner">
          <div className="checkout-success">
            <div className="success-animation">⚠️</div>
            <h2>Không tìm thấy sản phẩm đã chọn</h2>
            <p>Các sản phẩm được chọn trước đó không còn trong giỏ hàng nữa.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link to="/cart" className="btn-primary">Quay lại giỏ hàng</Link>
              <Link to="/products" className="btn-secondary">Tiếp tục mua sắm</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    const isVnpayWaiting = paymentResultType === "vnpay-waiting";
    return (
      <div className="checkout-page">
        <div className="checkout-inner">
          <div className="checkout-success">
            <div className="success-animation">🌸</div>
            <h2>{isVnpayWaiting ? "Thanh toán VNPAY đã được ghi nhận" : paymentResultType === "vnpay" ? "Thanh toán VNPAY thành công!" : "Đặt hàng thành công!"}</h2>
            <p>Cảm ơn bạn đã mua sắm tại <strong>UniqTee</strong></p>
            <p>
              {isVnpayWaiting
                ? "Đơn hàng đang chờ VNPay xác nhận. Khi xác nhận hoàn tất, trạng thái sẽ chuyển sang đang xử lý."
                : paymentResultType === "vnpay"
                  ? "Thanh toán đã được xác nhận, đơn hàng sẽ được xử lý trong thời gian sớm nhất."
                  : "Đơn hàng sẽ được xử lý trong thời gian sớm nhất."}
            </p>
            <div className="order-code">
              Mã đơn hàng: #{orderResult?.orderCode || orderResult?.id || "UNQ"}
            </div>
            <p>
              Phương thức thanh toán: <strong>{formatPaymentMethod(orderResult?.paymentMethod || payMethod)}</strong>
            </p>
            {isVnpayWaiting && (
              <p>Trạng thái hiện tại: đang chờ xác nhận thanh toán từ VNPay.</p>
            )}
            {(orderResult?.paymentMethod || payMethod || "").toLowerCase() === "cod" && (
              <p>Bạn thanh toán bằng tiền mặt khi nhận hàng.</p>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link to="/profile" className="btn-primary">Xem đơn hàng</Link>
              <Link to="/" className="btn-secondary">Về trang chủ</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-inner">
        <div className="checkout-header">
          <h1 className="checkout-title">
            Thanh toán <span className="accent">đơn hàng</span>
          </h1>

          <div className="checkout-steps">
            {STEPS.map((label, index) => (
              <div key={label} style={{ display: "contents" }}>
                <div className={`step-item ${step === index ? "active" : ""} ${step > index ? "done" : ""}`}>
                  <div className="step-circle">{step > index ? "✓" : index + 1}</div>
                  <span className="step-label">{label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`step-line ${step > index ? "done" : ""}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-form-col">
            {step === 0 && (
              <>
                <div className="form-section address-section">
                  <div className="address-section-header">
                    <div>
                      <p className="form-section-title">
                        <span className="form-section-icon">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </span>
                        Thông tin giao hàng
                      </p>
                      <p className="address-section-note">
                        {ghnReady
                          ? `Đơn từ ${formatShippingThreshold()} được miễn phí ship. Đơn dưới mức này sẽ tính phí theo GHN.`
                          : "Nhập địa chỉ rõ ràng để đơn COD được giao nhanh và chính xác hơn."}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
                      <span className="address-status-pill">
                        {ghnReady ? "GHN · Miễn phí từ 500.000đ" : "COD · Giao tận nơi"}
                      </span>
                      {savedAddresses.length > 0 && (
                        <button 
                          type="button"
                          className="btn-secondary" 
                          style={{ padding: "6px 12px", fontSize: "0.85rem", height: "auto", display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px" }}
                          onClick={() => setShowAddressPicker(true)}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          Sổ địa chỉ
                        </button>
                      )}
                    </div>
                  </div>

                  {shippingError && (
                    <div
                      style={{
                        padding: "12px 14px",
                        marginBottom: 16,
                        borderRadius: 12,
                        background: "rgba(255, 107, 107, 0.12)",
                        border: "1px solid rgba(255, 107, 107, 0.25)",
                        color: "#ffb3b3",
                        fontSize: "0.9rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {shippingError}
                    </div>
                  )}

                  <div className="form-grid address-grid">
                    <div className="form-group">
                      <label className="form-label">Họ và tên</label>
                      <input
                        className="form-input"
                        name="fullName"
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        value={shippingForm.fullName}
                        onChange={handleShipChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        className="form-input"
                        type="tel"
                        name="phone"
                        placeholder="0901 234 567"
                        autoComplete="tel"
                        inputMode="tel"
                        value={shippingForm.phone}
                        onChange={handleShipChange}
                      />
                    </div>
                    <div className="form-group span-2">
                      <label className="form-label">Email</label>
                      <input
                        className="form-input"
                        type="email"
                        name="email"
                        placeholder="example@email.com"
                        autoComplete="email"
                        value={shippingForm.email}
                        onChange={handleShipChange}
                      />
                    </div>
                    <div className="form-group span-2">
                      <label className="form-label">Địa chỉ</label>
                      <input
                        className="form-input"
                        name="address"
                        placeholder="Số nhà, tên đường..."
                        autoComplete="street-address"
                        value={shippingForm.address}
                        onChange={handleShipChange}
                      />
                    </div>
                    {ghnReady ? (
                      <>
                        <div className="form-group">
                          <label className="form-label">Tỉnh/Thành phố</label>
                          <select
                            className="form-select"
                            name="provinceId"
                            value={shippingForm.provinceId}
                            onChange={handleProvinceChange}
                            disabled={ghnLoading || ghnProvinces.length === 0}
                          >
                            <option value="">
                              {ghnLoading ? "Đang tải tỉnh/thành phố..." : "Chọn tỉnh/thành phố"}
                            </option>
                            {ghnProvinces.map((province) => (
                              <option key={province.provinceId} value={province.provinceId}>
                                {province.provinceName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Quận/Huyện</label>
                          <select
                            className="form-select"
                            name="districtId"
                            value={shippingForm.districtId}
                            onChange={handleDistrictChange}
                            disabled={!shippingForm.provinceId || districtsLoading}
                          >
                            <option value="">
                              {districtsLoading ? "Đang tải quận/huyện..." : "Chọn quận/huyện"}
                            </option>
                            {ghnDistricts.map((districtItem) => (
                              <option key={districtItem.districtId} value={districtItem.districtId}>
                                {districtItem.districtName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group span-2">
                          <label className="form-label">Phường/Xã</label>
                          <select
                            className="form-select"
                            name="wardCode"
                            value={shippingForm.wardCode}
                            onChange={handleWardChange}
                            disabled={!shippingForm.districtId || wardsLoading}
                          >
                            <option value="">
                              {wardsLoading ? "Đang tải phường/xã..." : "Chọn phường/xã"}
                            </option>
                            {ghnWards.map((wardItem) => (
                              <option key={wardItem.wardCode} value={wardItem.wardCode}>
                                {wardItem.wardName}
                              </option>
                            ))}
                          </select>
                          <p className="field-hint">
                            {quoteLoading
                              ? "GHN đang tính phí ship theo địa chỉ đã chọn..."
                              : "Phí ship sẽ được cập nhật tự động khi chọn xong phường/xã."}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label className="form-label">Phường/Xã (tự nhập)</label>
                          <input
                            className="form-input"
                            name="ward"
                            placeholder="Nhập phường/xã bất kỳ"
                            autoComplete="off"
                            value={shippingForm.ward}
                            onChange={handleShipChange}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Quận/Huyện (tự nhập)</label>
                          <input
                            className="form-input"
                            name="district"
                            placeholder="Nhập quận/huyện bất kỳ"
                            autoComplete="off"
                            value={shippingForm.district}
                            onChange={handleShipChange}
                          />
                        </div>
                        <div className="form-group span-2">
                          <label className="form-label">Tỉnh/Thành phố</label>
                          <input
                            className="form-input"
                            name="city"
                            placeholder="Nhập tự do tỉnh/thành phố"
                            autoComplete="address-level1"
                            value={shippingForm.city}
                            onChange={handleShipChange}
                          />
                          <p className="field-hint">Không giới hạn danh sách, bạn có thể nhập tự do tỉnh/thành phố, phường/xã và quận/huyện.</p>
                        </div>
                      </>
                    )}
                    <div className="form-group span-2">
                      <label className="form-label">Ghi chú giao hàng (tùy chọn)</label>
                      <textarea
                        className="form-input form-textarea"
                        name="note"
                        placeholder="Giao giờ hành chính, gọi trước khi giao, để hàng trước cửa..."
                        rows={3}
                        value={shippingForm.note}
                        onChange={handleShipChange}
                      />
                    </div>
                  </div>

                  <div className="address-guidance">
                    <strong>Gợi ý:</strong> Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố. Tất cả đều có thể nhập tự do theo địa chỉ thực tế của bạn.
                  </div>
                </div>

                <button className="btn-place-order" onClick={() => setStep(1)}>
                  Tiếp theo: Thanh toán →
                </button>
              </>
            )}

            {step === 1 && (
              <>
                <div className="form-section">
                  <p className="form-section-title">
                    <span className="form-section-icon">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M1 10h22" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </span>
                    Phương thức thanh toán
                  </p>

                  <div className="payment-methods">
                    {[
                      {
                        id: "vnpay",
                        icon: "🔵",
                        name: "VNPAY",
                        sub: "Thanh toán nhanh qua QR hoặc thẻ nội địa",
                        recommended: true,
                      },
                      {
                        id: "cod",
                        icon: "💵",
                        name: "Thanh toán khi nhận hàng (COD)",
                        sub: "Trả tiền mặt khi nhận hàng",
                      },
                    ].map((method) => (
                      <div
                        key={method.id}
                        className={`payment-option ${payMethod === method.id ? "selected" : ""}`}
                        onClick={() => setPayMethod(method.id)}
                      >
                        <div className="payment-radio">
                          <div className="payment-radio-dot" />
                        </div>
                        <span className="payment-icon">{method.icon}</span>
                        <div className="payment-info">
                          <p className="payment-name">{method.name}</p>
                          <p className="payment-sub">{method.sub}</p>
                        </div>
                        {method.recommended && <span className="payment-recommended">Phổ biến</span>}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "rgba(255, 107, 107, 0.1)",
                        border: "1px solid rgba(255, 107, 107, 0.2)",
                        color: "#ff9a9a",
                        fontSize: "0.9rem",
                      }}
                    >
                      {error}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: "0 0 auto" }}
                    onClick={() => setStep(0)}
                  >
                    ← Quay lại
                  </button>
                  <button
                    className={`btn-place-order ${loading ? "loading" : ""}`}
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? "Đang xử lý…" : "Đặt hàng ngay"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="checkout-summary">
            <p className="checkout-summary-title">Đơn hàng của bạn</p>

            <div className="checkout-items">
              {checkoutItems.map((item) => (
                <div key={`${item.cartItemId}`} className="checkout-item">
                  <div className="checkout-item-img">
                    <img src={getItemImage(item)} alt={item.name} />
                    <span className="checkout-item-qty-badge">{item.qty}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="checkout-item-name">{item.name}</p>
                    <p className="checkout-item-meta">
                      {item.color || "Mặc định"} · Size {item.size || "—"}
                    </p>
                  </div>
                  <span className="checkout-item-price">
                    {formatPrice(Number(item.price || 0) * Number(item.qty || 1))}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-lines">
              <div className="summary-line">
                <span className="label">Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-line green">
                <span className="label">Phí vận chuyển {ghnReady ? `(${shippingServiceName})` : ""}</span>
                <span className="value">
                  {shippingLineValue}
                </span>
              </div>
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
              {shippingNote}
            </div>

            <div className="summary-divider" />

            <div className="summary-total-row">
              <span className="summary-total-label">Tổng cộng</span>
              <span className="summary-total-amount">{formatPrice(total)}</span>
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", marginTop: 12 }}>
              🔒 Thông tin thanh toán được mã hóa SSL
            </div>
          </div>
        </div>
      </div>

      {showAddressPicker && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div className="modal-content" style={{
            background: "var(--bg-1)", width: "100%", maxWidth: "500px", borderRadius: "8px",
            padding: "24px", maxHeight: "90vh", overflowY: "auto", position: "relative"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Chọn địa chỉ giao hàng</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {savedAddresses.map((address) => (
                <div 
                  key={address.id} 
                  style={{
                    padding: "16px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "var(--bg-2)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onClick={() => {
                    setShippingForm(current => ({
                      ...current,
                      fullName: address.receiverName || user?.name || "",
                      phone: address.receiverPhone || user?.phone || "",
                      address: address.detailAddress || "",
                      provinceId: address.provinceId || "",
                      city: address.provinceName || "",
                      districtId: address.districtId || "",
                      district: address.districtName || "",
                      wardCode: address.wardCode || "",
                      ward: address.wardName || ""
                    }));
                    setShowAddressPicker(false);
                    setGhnDistricts([]);
                    setGhnWards([]);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <h4 style={{ margin: 0, fontSize: "1rem" }}>{address.receiverName}</h4>
                    <span style={{ color: "var(--text-secondary)" }}>|</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{address.receiverPhone}</span>
                    {address.isDefault && (
                      <span style={{ fontSize: "0.7rem", background: "var(--accent)", color: "white", padding: "2px 8px", borderRadius: "4px" }}>
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                    <p style={{ margin: 0 }}>{address.detailAddress}</p>
                    <p style={{ margin: 0 }}>{address.wardName}, {address.districtName}, {address.provinceName}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowAddressPicker(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
