export const uniqueValues = (values) => [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];

export const normalizeAdministrativeName = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[\u0111\u0110]/g, "d")
  .replace(/\b(ho chi minh city|hcm city|tphcm|tp hcm|sai gon)\b/g, "ho chi minh")
  .replace(/\b(thanh pho|tp|tinh|quan|huyen|thi xa|thi tran|phuong|xa|province|city|district|ward|commune|town)\b/g, " ")
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export const isSameAdministrativeName = (left, right) => {
  const normalizedLeft = normalizeAdministrativeName(left);
  const normalizedRight = normalizeAdministrativeName(right);

  return Boolean(
    normalizedLeft &&
    normalizedRight &&
    (normalizedLeft === normalizedRight ||
      normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft))
  );
};

export const findAdministrativeOption = (options, candidates, labelKey) => {
  const normalizedCandidates = uniqueValues(candidates)
    .map((candidate) => normalizeAdministrativeName(candidate))
    .filter(Boolean);

  if (normalizedCandidates.length === 0) {
    return null;
  }

  const scoredOptions = options
    .map((option) => {
      const normalizedOption = normalizeAdministrativeName(option?.[labelKey]);
      const score = normalizedCandidates.reduce((bestScore, candidate) => {
        if (!normalizedOption) return bestScore;
        if (normalizedOption === candidate) return Math.max(bestScore, 3);
        if (normalizedOption.includes(candidate) || candidate.includes(normalizedOption)) {
          return Math.max(bestScore, 2);
        }

        const optionTokens = normalizedOption.split(" ");
        const candidateTokens = candidate.split(" ");
        const sharedTokens = candidateTokens.filter((token) => optionTokens.includes(token));
        return Math.max(bestScore, sharedTokens.length >= Math.min(2, candidateTokens.length) ? 1 : 0);
      }, 0);

      return { option, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return scoredOptions[0]?.option || null;
};

export const pickFirst = (values) => values.find((value) => String(value || "").trim()) || "";

export const getDisplayAddressParts = (displayName) => String(displayName || "")
  .split(",")
  .map((part) => part.trim())
  .filter(Boolean);

export const parseMapLocationAddress = (location) => {
  const address = location?.addressDetails || {};
  const displayParts = getDisplayAddressParts(location?.displayName);
  const cityFromMap = pickFirst([address.state, address.province, address.city, address.region]);
  const districtFromMap = pickFirst([
    address.city_district,
    address.district,
    address.county,
    address.municipality,
    cityFromMap && !isSameAdministrativeName(address.city, cityFromMap) ? address.city : "",
    address.town,
  ]);
  const wardFromMap = pickFirst([
    address.suburb,
    address.quarter,
    address.city_block,
    address.neighbourhood,
    address.village,
    address.hamlet,
    address.commune,
  ]);
  const road = pickFirst([address.road, address.pedestrian, address.footway, address.path]);
  const houseLine = [address.house_number, road].filter(Boolean).join(" ").trim();
  const placeName = pickFirst([address.amenity, address.shop, address.building, address.house_name, address.tourism, address.office, address.leisure]);
  const detailParts = uniqueValues([placeName, houseLine]).filter((part) => (
    !isSameAdministrativeName(part, wardFromMap) &&
    !isSameAdministrativeName(part, districtFromMap) &&
    !isSameAdministrativeName(part, cityFromMap)
  ));
  const displayDetail = displayParts.find((part) => (
    !["Vi\u1ec7t Nam", "Vietnam"].some((country) => isSameAdministrativeName(part, country)) &&
    !isSameAdministrativeName(part, wardFromMap) &&
    !isSameAdministrativeName(part, districtFromMap) &&
    !isSameAdministrativeName(part, cityFromMap)
  ));

  return {
    detailAddress: detailParts.join(", ") || displayDetail || location?.displayName || "",
    provinceName: cityFromMap,
    districtName: districtFromMap,
    wardName: wardFromMap,
    provinceCandidates: uniqueValues([cityFromMap, address.state, address.province, address.city, address.region, ...displayParts.slice(-4)]),
    districtCandidates: uniqueValues([districtFromMap, address.city_district, address.district, address.county, address.municipality, address.town, ...displayParts]),
    wardCandidates: uniqueValues([wardFromMap, address.suburb, address.quarter, address.city_block, address.neighbourhood, address.village, address.hamlet, address.commune, ...displayParts]),
  };
};
