import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, LocateFixed, MapPin, Search } from "lucide-react";
import "./AddressMapPicker.css";

const DEFAULT_CENTER = [10.7769, 106.7009];
const DEFAULT_ZOOM = 13;
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const NOMINATIM_MIN_INTERVAL_MS = 1100;
const MAX_SEARCH_CANDIDATES = 5;
const geocodeCache = new Map();
let nominatimQueue = Promise.resolve();
let lastNominatimRequestAt = 0;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const fetchNominatimJson = (path, params) => {
  const url = `${NOMINATIM_BASE_URL}${path}?${params.toString()}`;
  if (geocodeCache.has(url)) {
    return Promise.resolve(geocodeCache.get(url));
  }

  const task = nominatimQueue.then(async () => {
    if (geocodeCache.has(url)) {
      return geocodeCache.get(url);
    }

    const elapsed = Date.now() - lastNominatimRequestAt;
    if (elapsed < NOMINATIM_MIN_INTERVAL_MS) {
      await sleep(NOMINATIM_MIN_INTERVAL_MS - elapsed);
    }

    lastNominatimRequestAt = Date.now();
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Không thể kết nối dịch vụ tìm địa chỉ.");
    }

    const data = await response.json();
    geocodeCache.set(url, data);
    return data;
  });

  nominatimQueue = task.catch(() => {});
  return task;
};

const createPinIcon = () => L.divIcon({
  className: "address-map-pin",
  html: '<span></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

const toPoint = (value) => {
  const lat = Number(value?.latitude ?? value?.lat);
  const lng = Number(value?.longitude ?? value?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

const normalizeSearchResult = (item, sourceQuery = "") => {
  const lat = Number(item?.lat);
  const lng = Number(item?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    id: item?.osm_type && item?.osm_id ? `${item.osm_type}-${item.osm_id}` : item?.place_id || item?.display_name || `${lat},${lng}`,
    latitude: lat,
    longitude: lng,
    displayName: item?.display_name || "",
    addressDetails: item?.address || null,
    category: item?.category || item?.class || "",
    type: item?.type || "",
    importance: Number(item?.importance || 0),
    sourceQuery,
  };
};

const normalizeForMatch = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const tokenizeAddress = (value) => {
  const ignored = new Set([
    "so", "duong", "pho", "phuong", "quan", "huyen", "thanh", "thanh pho",
    "tp", "tinh", "viet", "nam", "khu", "ap", "xa", "thi", "tran",
  ]);

  return normalizeForMatch(value)
    .split(" ")
    .filter((token) => token.length > 1 && !ignored.has(token));
};

const scoreSearchResult = (result, query) => {
  const display = normalizeForMatch(result.displayName);
  const tokens = tokenizeAddress(query);
  const matched = tokens.filter((token) => display.includes(token)).length;
  const tokenScore = tokens.length > 0 ? matched / tokens.length : 0;
  const sourceBonus = result.sourceQuery && normalizeForMatch(result.sourceQuery) !== normalizeForMatch(query) ? 0.08 : 0;
  const importanceScore = Math.min(Number(result.importance || 0), 1) * 0.18;
  const typeBonus = ["house", "building", "residential", "dormitory", "university", "school", "road"].includes(result.type) ? 0.12 : 0;

  return tokenScore + importanceScore + typeBonus + sourceBonus;
};

const rankSearchResults = (results, query) => {
  const map = new Map();
  results.forEach((result) => {
    if (!result) return;
    const current = map.get(result.id);
    if (!current || scoreSearchResult(result, query) > scoreSearchResult(current, query)) {
      map.set(result.id, result);
    }
  });

  return [...map.values()]
    .map((result) => ({ ...result, score: scoreSearchResult(result, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SEARCH_CANDIDATES);
};

const normalizeVietnameseAddress = (value) => String(value || "")
  .trim()
  .replace(/\s+/g, " ")
  .replace(/\bTP\.?\s*/gi, "Thành phố ")
  .replace(/\bTp\.?\s*/g, "Thành phố ");

const removeHouseNumber = (value) => String(value || "")
  .replace(/^\s*(số|so)\s*\d+[a-zA-Z/-]*\s*/i, "")
  .replace(/^\s*\d+[a-zA-Z/-]*\s+/, "")
  .trim();

const pushUnique = (list, value) => {
  const normalized = normalizeVietnameseAddress(value);
  if (normalized && !list.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
    list.push(normalized);
  }
};

const buildSearchQueries = (query) => {
  const normalized = normalizeVietnameseAddress(query);
  const queries = [];
  pushUnique(queries, normalized);

  const lower = normalized.toLowerCase();
  const likelyVnuDormB = (
    (lower.includes("ktx") || lower.includes("ký túc xá") || lower.includes("ky tuc xa")) &&
    lower.includes("khu b")
  ) || (
    lower.includes("khu b") &&
    (lower.includes("đhqg") || lower.includes("dhqg") || lower.includes("đại học quốc gia") || lower.includes("dai hoc quoc gia"))
  );

  if (likelyVnuDormB) {
    pushUnique(queries, "KTX khu B ĐHQG TP.HCM");
    pushUnique(queries, "Ký túc xá khu B Đại học Quốc gia Thành phố Hồ Chí Minh");
    pushUnique(queries, "Đường KTX, Khu đô thị Đại học Quốc gia Thành phố Hồ Chí Minh, Phường Đông Hòa, Thành phố Dĩ An");
    pushUnique(queries, "Khu đô thị Đại học Quốc gia Thành phố Hồ Chí Minh, Phường Đông Hòa, Thành phố Dĩ An");
  }

  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length > 0) {
    const firstWithoutNumber = removeHouseNumber(parts[0]);
    if (firstWithoutNumber && firstWithoutNumber !== parts[0]) {
      pushUnique(queries, [firstWithoutNumber, ...parts.slice(1)].join(", "));
    }

    for (let start = 1; start < Math.min(parts.length, 4); start += 1) {
      pushUnique(queries, parts.slice(start).join(", "));
    }

    const street = removeHouseNumber(parts[0]);
    const broaderParts = parts.filter((part) => !/^khu phố\b/i.test(part));
    if (broaderParts.length !== parts.length) {
      pushUnique(queries, broaderParts.join(", "));
    }

    if (street && parts.length >= 3) {
      pushUnique(queries, [street, ...parts.slice(-3)].join(", "));
    }
  }

  return queries.slice(0, 6);
};

export default function AddressMapPicker({
  value,
  fullAddress = "",
  title = "Ghim vị trí giao hàng",
  helperText = "Tìm địa chỉ hoặc bấm trực tiếp trên bản đồ để đặt ghim giao hàng.",
  onLocationChange,
  onUseSuggestedAddress,
  className = "",
  compact = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const pinIconRef = useRef(null);
  const initialPoint = useMemo(() => toPoint(value), [value]);
  const initialPointRef = useRef(initialPoint);
  const reverseGeocodeRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(initialPoint);
  const [searchTerm, setSearchTerm] = useState(fullAddress);
  const [suggestedAddress, setSuggestedAddress] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSearchTerm(fullAddress || "");
  }, [fullAddress]);

  useEffect(() => {
    const point = toPoint(value);
    setSelectedPoint(point);
  }, [value]);

  const notifyLocationChange = useCallback((location) => {
    onLocationChange?.({
      latitude: location.latitude,
      longitude: location.longitude,
      displayName: location.displayName || "",
      addressDetails: location.addressDetails || null,
    });
  }, [onLocationChange]);

  const setLocation = useCallback((location, nextStatus = "") => {
    const point = [location.latitude, location.longitude];
    setSelectedPoint(point);
    setSuggestedAddress(location.displayName || "");
    setStatus(nextStatus);
    notifyLocationChange(location);

    const map = mapRef.current;
    if (map) {
      map.setView(point, Math.max(map.getZoom(), 16));
    }
  }, [notifyLocationChange]);

  const geocode = useCallback(async (query) => {
    const normalizedQuery = String(query || "").trim();
    if (!normalizedQuery) {
      setStatus("Nhập địa chỉ để tìm trên bản đồ.");
      return;
    }

    try {
      setBusy(true);
      setSearchResults([]);
      setStatus("Đang tìm địa chỉ trên OpenStreetMap...");
      const queries = buildSearchQueries(normalizedQuery);
      let rankedResults = [];
      let matchedQuery = queries[0] || normalizedQuery;

      for (const nextQuery of queries) {
        const params = new URLSearchParams({
          format: "jsonv2",
          limit: String(MAX_SEARCH_CANDIDATES),
          q: nextQuery,
          countrycodes: "vn",
          addressdetails: "1",
          namedetails: "1",
          extratags: "1",
          dedupe: "1",
          "accept-language": "vi",
        });

        const data = await fetchNominatimJson("/search", params);
        const results = Array.isArray(data)
          ? data.map((item) => normalizeSearchResult(item, nextQuery)).filter(Boolean)
          : [];

        rankedResults = rankSearchResults(results, normalizedQuery);
        if (rankedResults.length > 0) {
          matchedQuery = nextQuery;
          break;
        }
      }

      if (rankedResults.length === 0) {
        setStatus("Không tìm thấy địa chỉ phù hợp. Hãy thử tên địa điểm ngắn hơn hoặc bấm trực tiếp trên bản đồ để đặt ghim.");
        return;
      }

      setSearchResults(rankedResults);
      const usedFallback = matchedQuery.toLowerCase() !== normalizedQuery.toLowerCase();
      const bestResult = rankedResults[0];
      setLocation(
        bestResult,
        usedFallback
          ? `Đã tìm theo biến thể gần nhất: ${matchedQuery}. Hãy kiểm tra danh sách kết quả bên dưới.`
          : rankedResults.length > 1
            ? "Đã ghim kết quả phù hợp nhất. Bạn có thể chọn kết quả khác bên dưới."
            : "Đã ghim vị trí theo địa chỉ tìm kiếm."
      );
    } catch (error) {
      setStatus(error.message || "Không thể tìm địa chỉ trên bản đồ.");
    } finally {
      setBusy(false);
    }
  }, [setLocation]);

  const reverseGeocode = useCallback(async (point) => {
    try {
      setBusy(true);
      setSearchResults([]);
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(point[0]),
        lon: String(point[1]),
        addressdetails: "1",
        "accept-language": "vi",
      });
      const data = await fetchNominatimJson("/reverse", params);
      const displayName = data?.display_name || "";
      setLocation({
        latitude: point[0],
        longitude: point[1],
        displayName,
        addressDetails: data?.address || null,
      }, displayName ? "Đã đặt ghim tại vị trí bạn chọn." : "Đã đặt ghim trên bản đồ.");
    } catch {
      setLocation({
        latitude: point[0],
        longitude: point[1],
        displayName: "",
      }, "Đã đặt ghim, nhưng chưa lấy được tên địa chỉ.");
    } finally {
      setBusy(false);
    }
  }, [setLocation]);

  useEffect(() => {
    reverseGeocodeRef.current = reverseGeocode;
  }, [reverseGeocode]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    pinIconRef.current = createPinIcon();
    const startPoint = initialPointRef.current;
    const map = L.map(containerRef.current, {
      center: startPoint || DEFAULT_CENTER,
      zoom: startPoint ? 16 : DEFAULT_ZOOM,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.on("click", (event) => {
      reverseGeocodeRef.current?.([event.latlng.lat, event.latlng.lng]);
    });

    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 120);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPoint) return;

    if (!markerRef.current) {
      markerRef.current = L.marker(selectedPoint, { icon: pinIconRef.current || createPinIcon() }).addTo(map);
    } else {
      markerRef.current.setLatLng(selectedPoint);
    }

    map.setView(selectedPoint, Math.max(map.getZoom(), 16));
    window.setTimeout(() => map.invalidateSize(), 80);
  }, [selectedPoint]);

  const handleSearch = () => geocode(searchTerm || fullAddress);

  const handleChooseResult = (result) => {
    setLocation(result, "Đã chọn vị trí từ danh sách kết quả.");
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setStatus("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    setBusy(true);
    setStatus("Đang lấy vị trí hiện tại...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        reverseGeocode([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        setBusy(false);
        setStatus("Không thể lấy vị trí hiện tại. Hãy kiểm tra quyền định vị của trình duyệt.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <section className={`address-map-card ${compact ? "compact" : ""} ${className}`}>
      <div className="address-map-head">
        <div>
          <p className="address-map-kicker"><MapPin size={14} /> Bản đồ giao hàng</p>
          <h4>{title}</h4>
          <p>{helperText}</p>
        </div>
        {selectedPoint && (
          <span className="address-map-coordinates">
            {selectedPoint[0].toFixed(5)}, {selectedPoint[1].toFixed(5)}
          </span>
        )}
      </div>

      <div className="address-map-search">
        <div className="address-map-search-input">
          <Search size={16} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Tìm số nhà, tên đường, phường/xã..."
          />
        </div>
        <button type="button" onClick={handleSearch} disabled={busy}>
          <Crosshair size={16} />
          <span>Tìm</span>
        </button>
        <button type="button" onClick={handleLocate} disabled={busy}>
          <LocateFixed size={16} />
          <span>Định vị</span>
        </button>
      </div>

      <div className="address-map-shell">
        <div ref={containerRef} className="address-map-canvas" />
      </div>

      {(status || suggestedAddress) && (
        <div className="address-map-footer">
          <div>
            {status && <p className="address-map-status">{status}</p>}
            {suggestedAddress && <p className="address-map-suggestion">{suggestedAddress}</p>}
          </div>
          {suggestedAddress && onUseSuggestedAddress && (
            <button type="button" onClick={() => onUseSuggestedAddress(suggestedAddress)}>
              Dùng địa chỉ này
            </button>
          )}
        </div>
      )}

      {searchResults.length > 1 && (
        <div className="address-map-results">
          <p className="address-map-results-title">Kết quả gợi ý</p>
          {searchResults.map((result, index) => {
            const isSelected = selectedPoint
              && Math.abs(selectedPoint[0] - result.latitude) < 0.000001
              && Math.abs(selectedPoint[1] - result.longitude) < 0.000001;

            return (
              <button
                key={result.id}
                type="button"
                className={`address-map-result ${isSelected ? "selected" : ""}`}
                onClick={() => handleChooseResult(result)}
              >
                <span className="address-map-result-rank">{index + 1}</span>
                <span className="address-map-result-text">
                  <strong>{result.type || result.category || "Địa chỉ"}</strong>
                  <small>{result.displayName}</small>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
