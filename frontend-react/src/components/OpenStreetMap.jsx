import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin, Navigation, RefreshCw } from "lucide-react";
import "./OpenStreetMap.css";

const DEFAULT_CENTER = [10.8702, 106.7922];
const DEFAULT_ZOOM = 16;

const createStoreIcon = () => L.divIcon({
  className: "osm-marker-store",
  html: '<span></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

const createUserIcon = () => L.divIcon({
  className: "osm-marker-user",
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

const normalizeCenter = (center) => {
  if (!Array.isArray(center) || center.length !== 2) {
    return DEFAULT_CENTER;
  }

  const [lat, lng] = center.map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : DEFAULT_CENTER;
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const buildDirectionsUrl = (destination, origin) => {
  const [destLat, destLng] = destination;

  if (origin) {
    const [originLat, originLng] = origin;
    return `https://www.openstreetmap.org/directions?from=${originLat}%2C${originLng}&to=${destLat}%2C${destLng}`;
  }

  return `https://www.openstreetmap.org/?mlat=${destLat}&mlon=${destLng}#map=17/${destLat}/${destLng}`;
};

export default function OpenStreetMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  title = "UniqTee Store",
  address = "Khu phố 6, Linh Trung, Thủ Đức, TP. Hồ Chí Minh",
  searchQuery = "",
  className = "",
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const resolvedFallbackCenter = useMemo(() => normalizeCenter(center), [center]);
  const [resolvedCenter, setResolvedCenter] = useState(resolvedFallbackCenter);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    setResolvedCenter(resolvedFallbackCenter);
  }, [resolvedFallbackCenter]);

  useEffect(() => {
    let cancelled = false;

    const geocodeAddress = async () => {
      const query = (searchQuery || address || "").trim();
      if (!query) return;

      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          limit: "1",
          q: query,
          "accept-language": "vi",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
        if (!response.ok) return;

        const results = await response.json();
        const first = Array.isArray(results) ? results[0] : null;
        const lat = Number(first?.lat);
        const lng = Number(first?.lon);

        if (!cancelled && Number.isFinite(lat) && Number.isFinite(lng)) {
          setResolvedCenter([lat, lng]);
        }
      } catch (error) {
        console.warn("OpenStreetMap geocoding failed:", error);
      }
    };

    geocodeAddress();

    return () => {
      cancelled = true;
    };
  }, [address, searchQuery]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: resolvedCenter,
      zoom,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      storeMarkerRef.current = null;
      userMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, [resolvedCenter, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView(resolvedCenter, zoom);

    const popupContent = `
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(address)}</span>
    `;

    if (!storeMarkerRef.current) {
      storeMarkerRef.current = L.marker(resolvedCenter, { icon: createStoreIcon() })
        .addTo(map)
        .bindPopup(popupContent, { className: "osm-popup" });
    } else {
      storeMarkerRef.current.setLatLng(resolvedCenter).setPopupContent(popupContent);
    }

    window.setTimeout(() => map.invalidateSize(), 100);
  }, [address, resolvedCenter, title, zoom]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setNotice("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    setLocating(true);
    setNotice("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = [position.coords.latitude, position.coords.longitude];
        const map = mapRef.current;

        if (map) {
          if (!userMarkerRef.current) {
            userMarkerRef.current = L.marker(origin, { icon: createUserIcon() })
              .addTo(map)
              .bindPopup("Vị trí của bạn", { className: "osm-popup" });
          } else {
            userMarkerRef.current.setLatLng(origin);
          }

          if (routeLineRef.current) {
            routeLineRef.current.remove();
          }

          routeLineRef.current = L.polyline([origin, resolvedCenter], {
            color: "#be185d",
            weight: 3,
            dashArray: "8 8",
          }).addTo(map);

          map.fitBounds(L.latLngBounds([origin, resolvedCenter]).pad(0.28));
        }

        setUserLocation(origin);
        setLocating(false);
      },
      () => {
        setNotice("Không thể lấy vị trí hiện tại. Hãy kiểm tra quyền định vị của trình duyệt.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleReset = () => {
    const map = mapRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    setNotice("");
    setUserLocation(null);
    map.setView(resolvedCenter, zoom);
  };

  const directionsUrl = buildDirectionsUrl(
    resolvedCenter,
    userLocation
  );

  return (
    <section className={`osm-card ${className}`} aria-label="OpenStreetMap">
      <div className="osm-map-shell">
        <div ref={mapContainerRef} className="osm-map" />
        <div className="osm-map-badge">
          <MapPin size={15} />
          <span>OpenStreetMap</span>
        </div>
      </div>

      <div className="osm-panel">
        <div>
          <p className="osm-eyebrow">Vị trí cửa hàng</p>
          <h3>{title}</h3>
          <p>{address}</p>
          {notice && <span className="osm-notice">{notice}</span>}
        </div>

        <div className="osm-actions">
          <button type="button" className="osm-action-btn" onClick={handleLocate} disabled={locating}>
            <LocateFixed size={16} />
            <span>{locating ? "Đang định vị" : "Vị trí của tôi"}</span>
          </button>
          <a className="osm-action-btn primary" href={directionsUrl} target="_blank" rel="noreferrer">
            <Navigation size={16} />
            <span>Chỉ đường</span>
          </a>
          <button type="button" className="osm-icon-btn" onClick={handleReset} aria-label="Đặt lại bản đồ" title="Đặt lại bản đồ">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
