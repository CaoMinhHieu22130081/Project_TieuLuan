import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { orderAPI, paymentAPI } from "../services/api";
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
  const [orderResult, setOrderResult] = useState(null);
  const [paymentResultType, setPaymentResultType] = useState("");

  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    ward: "",
    district: "",
    city: "",
    note: "",
  });

  useEffect(() => {
    if (!user) return;

    setShippingForm((current) => ({
      ...current,
      fullName: current.fullName || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
      address: current.address || user.address || "",
    }));
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

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  );
  const shipping = subtotal >= 299000 ? 0 : 30000;
  const total = subtotal + shipping;

  const handleShipChange = (event) => {
    setShippingForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
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

    const missingFields = [];
    if (!fullName) missingFields.push("họ tên");
    if (!phone) missingFields.push("số điện thoại");
    if (!address) missingFields.push("địa chỉ");
    if (!ward) missingFields.push("phường/xã");
    if (!district) missingFields.push("quận/huyện");
    if (!city) missingFields.push("tỉnh/thành phố");

    if (missingFields.length > 0) {
      setError(`Vui lòng nhập đầy đủ ${missingFields.join(", ")}.`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const selectedPaymentMethod = (payMethod || "cod").trim().toLowerCase();

      const orderPayload = {
        orderCode: buildOrderCode(),
        ...(user?.id ? { user: { id: Number(user.id) } } : {}),
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email || user?.email || "",
        address,
        ward,
        district,
        city,
        note: shippingForm.note.trim(),
        status: "pending",
        paymentMethod: selectedPaymentMethod,
        shippingFee: shipping,
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
                        Nhập địa chỉ rõ ràng để đơn COD được giao nhanh và chính xác hơn.
                      </p>
                    </div>
                    <span className="address-status-pill">COD · Giao tận nơi</span>
                  </div>

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
                <span className="label">Phí vận chuyển</span>
                <span className="value">
                  {shipping === 0 ? "Miễn phí 🎉" : formatPrice(shipping)}
                </span>
              </div>
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
    </div>
  );
}
