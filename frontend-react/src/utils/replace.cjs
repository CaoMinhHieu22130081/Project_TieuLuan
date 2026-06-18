const fs = require('fs');
let file = fs.readFileSync('src/pages/Profilepage.jsx', 'utf8');

const target1 = /<p style={{\s*margin: 0,\s*fontSize: "0\.78rem",\s*fontWeight: 700,\s*color: "var\(--text-muted\)",\s*textTransform: "uppercase",\s*letterSpacing: "0\.06em",\s*}}>\s*Sản phẩm trong đơn\s*<\/p>/g;

const replacement1 = `
{/* Order Info Cards */}
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
  {/* Shipping Address */}
  <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border-2)' }}>
    <p style={{ margin: '0 0 12px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center' }}>
      <svg width='14' height='14' fill='none' viewBox='0 0 24 24' style={{ marginRight: 6 }}>
        <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
        <circle cx='12' cy='9' r='2.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
      </svg>
      Địa chỉ nhận hàng
    </p>
    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.95rem' }}>{order.customerName || profile.fullName || 'Khách hàng'}</p>
    <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.customerPhone || profile.phone || 'Không có SĐT'}</p>
    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{order.address || 'Chưa cập nhật địa chỉ'}</p>
  </div>
  
  {/* Payment summary */}
  <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border-2)' }}>
    <p style={{ margin: '0 0 12px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center' }}>
      <svg width='14' height='14' fill='none' viewBox='0 0 24 24' style={{ marginRight: 6 }}>
        <path d='M3 10h18M7 15h.01M11 15h2M3 6.2a2.2 2.2 0 012.2-2.2h13.6A2.2 2.2 0 0121 6.2v11.6a2.2 2.2 0 01-2.2 2.2H5.2A2.2 2.2 0 013 17.8V6.2z' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
      </svg>
      Chi tiết thanh toán
    </p>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
      <span>Phương thức</span>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{String(order.paymentMethod).toUpperCase() === 'COD' || order.paymentMethod === 'Thanh toán khi nhận hàng' ? 'Thanh toán khi nhận (COD)' : (order.paymentMethod || '—')}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
      <span>{\`Tổng tiền hàng (\${itemCount} sản phẩm)\`}</span>
      <span>{formatPrice(order.subtotal)}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
      <span>Phí vận chuyển</span>
      <span>{Number(order.shippingFee || 0) === 0 ? 'Miễn phí' : formatPrice(order.shippingFee)}</span>
    </div>
    {order.subtotal + order.shippingFee > order.total && (
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#10b981', marginBottom: 12 }}>
        <span>Giảm giá</span>
        <span>-{formatPrice((order.subtotal + order.shippingFee) - order.total)}</span>
      </div>
    )}
    <div style={{ height: 1, background: 'var(--border-2)', margin: '0 -16px 12px' }}></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, alignItems: 'center' }}>
      <span>Thành tiền</span>
      <span style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{formatPrice(order.total)}</span>
    </div>
  </div>
</div>
<div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }}></div>
<p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
  Sản phẩm trong đơn
</p>`;

const target2 = /<div style={{ display: "flex", justifyContent: "space-between", fontSize: "0\.85rem", color: "var\(--text-secondary\)" }}>\s*<span>Phí vận chuyển<\/span>\s*<span>{Number\(order\.shippingFee \|\| 0\) === 0 \? "Miễn phí" : formatPrice\(order\.shippingFee\)}<\/span>\s*<\/div>\s*<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>\s*<span>Tổng cộng<\/span>\s*<span style={{ color: "var\(--accent\)" }}>{formatPrice\(order\.total\)}<\/span>\s*<\/div>/g;

let count1 = (file.match(target1) || []).length;
let count2 = (file.match(target2) || []).length;
console.log("Found matches for target1:", count1);
console.log("Found matches for target2:", count2);

file = file.replace(target1, replacement1);
file = file.replace(target2, '');

fs.writeFileSync('src/pages/Profilepage.jsx', file);
console.log("Replacement completed successfully.");
