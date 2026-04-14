const STORAGE_KEY = "uniqtee-admin-activity-log";
export const ADMIN_ACTIVITY_EVENT = "uniqtee-admin-activity-changed";

const MAX_ITEMS = 30;
const NOTIFICATION_TTL_HOURS = 24;
const DEFAULT_ICON = "ℹ️";

const ICON_MAP = {
  product: "🛍️",
  order: "📦",
  review: "⭐",
  user: "👤",
  system: "ℹ️",
};

const safeWindow = () => (typeof window === "undefined" ? null : window);

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isWithinHours = (value, hours) => {
  const date = parseDate(value);
  if (!date) return false;

  const diff = Date.now() - date.getTime();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
};

const normalizeNotification = (entry = {}, fallbackSource = "activity") => {
  const type = String(entry.type || "system").toLowerCase();

  return {
    id: entry.id ? String(entry.id) : createId(),
    type,
    icon: entry.icon || ICON_MAP[type] || DEFAULT_ICON,
    text: String(entry.text || entry.title || entry.message || "Hoạt động mới"),
    createdAt: entry.createdAt || new Date().toISOString(),
    unread: entry.unread !== false,
    source: entry.source || fallbackSource,
  };
};

const readStorage = () => {
  const win = safeWindow();
  if (!win) return [];

  try {
    const parsed = JSON.parse(win.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map((item) => normalizeNotification(item)) : [];
  } catch {
    return [];
  }
};

const writeStorage = (items) => {
  const win = safeWindow();
  if (!win) return;

  win.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const emitChange = () => {
  const win = safeWindow();
  if (!win) return;

  win.dispatchEvent(new CustomEvent(ADMIN_ACTIVITY_EVENT));
};

const sortByNewest = (items) => [...items].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

const filterByAge = (items, hours = NOTIFICATION_TTL_HOURS) =>
  sortByNewest((items || []).filter((item) => isWithinHours(item?.createdAt, hours)));

const readAndPruneStorage = () => {
  const items = readStorage();
  const pruned = filterByAge(items);

  if (pruned.length !== items.length) {
    writeStorage(pruned);
  }

  return pruned;
};

export const formatRelativeTime = (value) => {
  const date = parseDate(value);
  if (!date) return "Vừa xong";

  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "Vừa xong";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString("vi-VN");
};

export const readAdminActivityLog = () => readAndPruneStorage();

export const filterNotificationsWithinHours = (items = [], hours = NOTIFICATION_TTL_HOURS) => filterByAge(items, hours);

export const recordAdminActivity = (entry) => {
  const normalized = normalizeNotification({ ...entry, source: "activity", unread: entry?.unread ?? true });
  const next = sortByNewest([
    normalized,
    ...readAdminActivityLog().filter((item) => item.id !== normalized.id),
  ]).slice(0, MAX_ITEMS);

  writeStorage(next);
  emitChange();

  return normalized;
};

export const markAdminActivitiesRead = (ids) => {
  const idSet = Array.isArray(ids) && ids.length > 0 ? new Set(ids.map(String)) : null;
  const next = readAdminActivityLog().map((item) => {
    if (idSet && !idSet.has(String(item.id))) {
      return item;
    }

    return { ...item, unread: false };
  });

  writeStorage(next);
  emitChange();

  return next;
};

const hasRecentDate = (value, days) => {
  const date = parseDate(value);
  if (!date) return false;

  const diff = Date.now() - date.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
};

const normalizeStatus = (status) => String(status || "").toLowerCase();

export const buildDashboardNotifications = ({ products = [], orders = [] } = {}) => {
  const notifications = [];
  const pendingOrders = orders.filter((order) => normalizeStatus(order?.status) === "pending");
  const processingOrders = orders.filter((order) => normalizeStatus(order?.status) === "processing");
  const recentProducts = products.filter((product) => hasRecentDate(product?.createdAt || product?.updatedAt, 7));
  const bestSeller = [...products].sort((left, right) => Number(right?.sold || 0) - Number(left?.sold || 0))[0];

  if (pendingOrders.length > 0) {
    notifications.push({
      id: "summary-pending-orders",
      type: "order",
      icon: "🧾",
      text: `${pendingOrders.length} đơn hàng đang chờ xác nhận`,
      createdAt: pendingOrders[0].createdAt || new Date().toISOString(),
      unread: true,
      source: "summary",
    });
  }

  if (processingOrders.length > 0) {
    notifications.push({
      id: "summary-processing-orders",
      type: "order",
      icon: "🚚",
      text: `${processingOrders.length} đơn hàng đang xử lý`,
      createdAt: processingOrders[0].createdAt || new Date().toISOString(),
      unread: true,
      source: "summary",
    });
  }

  if (recentProducts.length > 0) {
    notifications.push({
      id: "summary-recent-products",
      type: "product",
      icon: "✨",
      text: `${recentProducts.length} sản phẩm mới trong 7 ngày gần đây`,
      createdAt: recentProducts[0].createdAt || recentProducts[0].updatedAt || new Date().toISOString(),
      unread: true,
      source: "summary",
    });
  }

  if (bestSeller && Number(bestSeller.sold || 0) > 0) {
    notifications.push({
      id: "summary-top-product",
      type: "product",
      icon: "🏆",
      text: `Bán chạy nhất: ${bestSeller.name}`,
      createdAt: bestSeller.updatedAt || bestSeller.createdAt || new Date().toISOString(),
      unread: false,
      source: "summary",
    });
  }

  return sortByNewest(notifications);
};

export const mergeNotifications = (...lists) => {
  const map = new Map();

  lists.flat().filter(Boolean).forEach((item) => {
    const normalized = normalizeNotification(item, item?.source || "summary");
    const current = map.get(normalized.id);

    if (!current) {
      map.set(normalized.id, normalized);
      return;
    }

    map.set(normalized.id, {
      ...current,
      ...normalized,
      unread: current.unread !== false || normalized.unread !== false,
      source: current.source === "summary" || normalized.source === "summary" ? "summary" : current.source,
    });
  });

  return sortByNewest([...map.values()]);
};