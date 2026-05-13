const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SETTINGS_PATH = path.join(ROOT, "patent_globe", "settings.json");
const DEFAULT_SETTINGS = {
  data: {
    sourceDir: "patent_globe/raw_data",
    outputDir: "patent_globe/data",
    worldFile: "patent_globe/data/world.json",
    anchorsFile: "patent_globe/data/anchors.js",
    populationDensityLogBase: Math.E,
    patentUnit: 100,
    files: {
      categoryExplanation: "category_explanation(1).csv",
      classExplanation: "class_explanation(1).csv",
      patentCounts: "dv_patent_count(1).csv",
      patentCitations: "dv_patent_citation.csv",
      countryTransfers: "专利申请国_受让人国计数_Sheet1.csv"
    },
    classAliases: {},
    classNameOverrides: {}
  }
};
const settings = mergeSettings(DEFAULT_SETTINGS, readSettings());
const DATA_DIR = path.resolve(ROOT, settings.data.sourceDir);
const OUTPUT_DIR = path.resolve(ROOT, settings.data.outputDir);
const WORLD_PATH = path.resolve(ROOT, settings.data.worldFile);
const ANCHORS_PATH = path.resolve(ROOT, settings.data.anchorsFile || "patent_globe/data/anchors.js");
const PATENT_UNIT = Number(settings.data.patentUnit) || 100;
const POP_DENSITY_LOG_BASE = normalizeLogBase(settings.data.populationDensityLogBase);
const FILES = settings.data.files;
const CLASS_ALIASES = settings.data.classAliases || {};
const CLASS_NAME_OVERRIDES = settings.data.classNameOverrides || {};
const COUNTRY_NAME_OVERRIDES = {
  HK: "Hong Kong China",
  MO: "Macau China"
};

const ISO3_TO_ISO2 = {
  AFG: "AF", ALA: "AX", ALB: "AL", DZA: "DZ", ASM: "AS", AND: "AD", AGO: "AO", AIA: "AI",
  ATA: "AQ", ATG: "AG", ARG: "AR", ARM: "AM", ABW: "AW", AUS: "AU", AUT: "AT", AZE: "AZ",
  BHS: "BS", BHR: "BH", BGD: "BD", BRB: "BB", BLR: "BY", BEL: "BE", BLZ: "BZ", BEN: "BJ",
  BMU: "BM", BTN: "BT", BOL: "BO", BIH: "BA", BWA: "BW", BRA: "BR", VGB: "VG", IOT: "IO",
  BRN: "BN", BGR: "BG", BFA: "BF", BDI: "BI", KHM: "KH", CMR: "CM", CAN: "CA", CPV: "CV",
  CYM: "KY", CAF: "CF", TCD: "TD", CHL: "CL", CHN: "CN", HKG: "HK", MAC: "MO", COL: "CO",
  COM: "KM", COG: "CG", COD: "CD", COK: "CK", CRI: "CR", CIV: "CI", HRV: "HR", CUB: "CU",
  CYP: "CY", CZE: "CZ", DNK: "DK", DJI: "DJ", DMA: "DM", DOM: "DO", ECU: "EC", EGY: "EG",
  SLV: "SV", GNQ: "GQ", ERI: "ER", EST: "EE", ETH: "ET", FLK: "FK", FRO: "FO", FJI: "FJ",
  FIN: "FI", FRA: "FR", GAB: "GA", GMB: "GM", GEO: "GE", DEU: "DE", GHA: "GH", GIB: "GI",
  GRC: "GR", GRL: "GL", GRD: "GD", GTM: "GT", GIN: "GN", GNB: "GW", GUY: "GY", HTI: "HT",
  HND: "HN", HUN: "HU", ISL: "IS", IND: "IN", IDN: "ID", IRN: "IR", IRQ: "IQ", IRL: "IE",
  ISR: "IL", ITA: "IT", JAM: "JM", JPN: "JP", JOR: "JO", KAZ: "KZ", KEN: "KE", KIR: "KI",
  PRK: "KP", KOR: "KR", KWT: "KW", KGZ: "KG", LAO: "LA", LVA: "LV", LBN: "LB", LSO: "LS",
  LBR: "LR", LBY: "LY", LIE: "LI", LTU: "LT", LUX: "LU", MKD: "MK", MDG: "MG", MWI: "MW",
  MYS: "MY", MDV: "MV", MLI: "ML", MLT: "MT", MRT: "MR", MUS: "MU", MEX: "MX", MDA: "MD",
  MCO: "MC", MNG: "MN", MNE: "ME", MAR: "MA", MOZ: "MZ", MMR: "MM", NAM: "NA", NPL: "NP",
  NLD: "NL", NZL: "NZ", NIC: "NI", NER: "NE", NGA: "NG", NOR: "NO", OMN: "OM", PAK: "PK",
  PSE: "PS", PAN: "PA", PNG: "PG", PRY: "PY", PER: "PE", PHL: "PH", POL: "PL", PRT: "PT",
  PRI: "PR", QAT: "QA", ROU: "RO", RUS: "RU", RWA: "RW", SAU: "SA", SEN: "SN", SRB: "RS",
  SYC: "SC", SLE: "SL", SGP: "SG", SVK: "SK", SVN: "SI", SOM: "SO", ZAF: "ZA", ESP: "ES",
  LKA: "LK", SDN: "SD", SUR: "SR", SWZ: "SZ", SWE: "SE", CHE: "CH", SYR: "SY", TWN: "TW",
  TJK: "TJ", TZA: "TZ", THA: "TH", TLS: "TL", TGO: "TG", TTO: "TT", TUN: "TN", TUR: "TR",
  TKM: "TM", UGA: "UG", UKR: "UA", ARE: "AE", GBR: "GB", USA: "US", URY: "UY", UZB: "UZ",
  VEN: "VE", VNM: "VN", YEM: "YE", ZMB: "ZM", ZWE: "ZW"
};

function readCsv(fileName) {
  const raw = fs.readFileSync(path.join(DATA_DIR, fileName), "utf8").replace(/^\uFEFF/, "");
  const lines = raw.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines.shift());
  return lines.filter(Boolean).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function readSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) return {};
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8").replace(/^\uFEFF/, ""));
}

function mergeSettings(base, override) {
  const merged = Array.isArray(base) ? base.slice() : { ...base };
  Object.entries(override || {}).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object") {
      merged[key] = mergeSettings(base[key], value);
    } else {
      merged[key] = value;
    }
  });
  return merged;
}

function normalizeCpcCode(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim().toUpperCase();
}

function resolveClassCode(value, classExplanations) {
  const raw = normalizeCpcCode(value);
  if (CLASS_ALIASES[raw]) return CLASS_ALIASES[raw];
  if (classExplanations[raw] || CLASS_NAME_OVERRIDES[raw]) return raw;
  const sixDigitCandidate = raw.match(/^(Y02[A-Z]\d)[^0-9]$/);
  if (sixDigitCandidate) {
    const candidate = `${sixDigitCandidate[1]}0`;
    if (classExplanations[candidate] || CLASS_NAME_OVERRIDES[candidate]) return candidate;
  }
  return raw;
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function collectCoordinates(geometry, out = []) {
  if (!geometry) return out;
  if (geometry.type === "Point") {
    out.push(geometry.coordinates);
  } else if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring) => out.push(...ring));
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => out.push(...ring)));
  }
  return out;
}

function buildCountryMeta() {
  const world = JSON.parse(fs.readFileSync(WORLD_PATH, "utf8"));
  const meta = {};
  world.features.forEach((feature) => {
    const code = ISO3_TO_ISO2[feature.id];
    if (!code) return;
    const coords = collectCoordinates(feature.geometry);
    if (!coords.length) return;
    const sum = coords.reduce((acc, coord) => {
      acc.lon += coord[0];
      acc.lat += coord[1];
      return acc;
    }, { lon: 0, lat: 0 });
    meta[code] = {
      name: feature.properties && feature.properties.name ? feature.properties.name : code,
      iso: feature.id,
      lat: Number((sum.lon / coords.length).toFixed(3)),
      lon: Number((sum.lat / coords.length).toFixed(3)),
      area: coords.length,
      continent: continentFor(sum.lat / coords.length, sum.lon / coords.length)
    };
  });
  Object.entries(readAnchors()).forEach(([code, list]) => {
    if (meta[code] || !list.length) return;
    const anchor = list.reduce((best, item) => (
      Number(item.pop || 0) > Number(best.pop || 0) ? item : best
    ), list[0]);
    const latitude = Number(anchor.lat);
    const longitude = Number(anchor.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    meta[code] = {
      name: COUNTRY_NAME_OVERRIDES[code] || code,
      iso: code,
      lat: Number(longitude.toFixed(3)),
      lon: Number(latitude.toFixed(3)),
      area: Math.max(1, list.length),
      continent: continentFor(latitude, longitude)
    };
  });
  return meta;
}

function readAnchors() {
  return readAnchorContext().anchors || {};
}

function readAnchorContext() {
  if (!fs.existsSync(ANCHORS_PATH)) return {};
  const context = {};
  vm.runInNewContext(fs.readFileSync(ANCHORS_PATH, "utf8"), context);
  return context;
}

function normalizeLogBase(value) {
  const base = Number(value);
  return Number.isFinite(base) && base > 1 ? base : Math.E;
}

function recoverAnchorRawPop(value, transform) {
  const pop = Number(value || 0);
  if (!Number.isFinite(pop) || pop <= 0) return 0;
  const scale = Number(transform && transform.scale) || 1000;
  const base = normalizeLogBase(transform && transform.logBase);
  if (transform && transform.formula === "log(raw + base) / log(base)") {
    return Math.max(0, Math.pow(base, pop / scale) - base);
  }
  return Math.max(0, Math.exp(pop / scale) - 1);
}

function compressAnchorPop(rawPop, base) {
  const raw = Math.max(0, Number(rawPop) || 0);
  return Math.max(1, Math.round((Math.log(raw + base) / Math.log(base)) * 1000));
}

function rewriteAnchorsWithDensityBase() {
  if (!fs.existsSync(ANCHORS_PATH)) return;
  const context = readAnchorContext();
  const anchors = context.anchors || {};
  const previousTransform = context.anchorDensityTransform || null;
  Object.values(anchors).forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      item.pop = compressAnchorPop(recoverAnchorRawPop(item.pop, previousTransform), POP_DENSITY_LOG_BASE);
    });
    list.sort((a, b) => Number(b.pop || 0) - Number(a.pop || 0));
  });
  const transform = {
    formula: "log(raw + base) / log(base)",
    logBase: Number(POP_DENSITY_LOG_BASE.toFixed(6)),
    scale: 1000
  };
  fs.writeFileSync(
    ANCHORS_PATH,
    `var anchorDensityTransform=${JSON.stringify(transform)};\nvar anchors=${JSON.stringify(anchors)};`
  );
}

function continentFor(latitude, longitude) {
  if (latitude < -10 && longitude > 110) return 3;
  if (latitude < 5 && longitude < -30) return 5;
  if (latitude > 5 && longitude < -30) return 6;
  if (latitude > 35 && longitude > -25 && longitude < 45) return 4;
  if (longitude > 45 && longitude < 180) return 2;
  return 1;
}

function buildProductspace(products) {
  const ids = Object.keys(products).sort();
  const radius = 1500;
  const pspace = {};
  ids.forEach((id, index) => {
    const categoryId = products[id].categoryId;
    const angle = (categoryId / 8) * Math.PI * 2 + (index % 7 - 3) * 0.08;
    const ring = radius + (index % 6) * 80;
    pspace[id] = [{
      x: Number((Math.cos(angle) * ring).toFixed(3)),
      y: Number((Math.sin(angle) * ring).toFixed(3)),
      z: Number(((index % 9 - 4) * 120).toFixed(3))
    }];
    products[id].x = Number((Math.cos(angle) * 120).toFixed(3));
    products[id].y = Number((Math.sin(angle) * 120).toFixed(3));
    products[id].z = 0;
  });
  return pspace;
}

function buildNetwork(products, classExplanations) {
  const ids = Object.keys(products).sort();
  const indexById = Object.fromEntries(ids.map((id, index) => [id, index]));
  const citations = new Map();
  if (FILES.patentCitations) {
    readCsv(FILES.patentCitations).forEach((row) => {
      const source = resolveClassCode(normalizeCpcCode(row.class), classExplanations);
      const target = resolveClassCode(normalizeCpcCode(row.cited_class), classExplanations);
      const count = Number(row.citation_count);
      if (!products[source] || !products[target] || source === target || !Number.isFinite(count) || count <= 0) return;
      const pair = [source, target].sort();
      const key = `${pair[0]}|${pair[1]}`;
      citations.set(key, (citations.get(key) || 0) + count);
    });
  }
  const edges = Array.from(citations.entries())
    .map(([key, weight]) => {
      const [source, target] = key.split("|");
      return { source: indexById[source], target: indexById[target], value: weight };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 180);
  return {
    nodes: ids.map((id) => ({ id })),
    edges,
    metric: "patent_citation",
    description: "Undirected Y02 class links weighted by summed cross-citation counts."
  };
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  rewriteAnchorsWithDensityBase();
  const countryMeta = buildCountryMeta();
  const categories = {};
  const categoryByPrefix = {};
  readCsv(FILES.categoryExplanation).forEach((row) => {
    categories[row.color] = {
      id: Number(row.id),
      name: row.name,
      category: row.category,
      total: 0,
      patentTotal: 0,
      active: true,
      probabilities: [0, 0, 0, 0, 0, 0, 0, 0]
    };
    categoryByPrefix[row.category] = categories[row.color];
  });

  const classExplanations = {};
  readCsv(FILES.classExplanation).forEach((row) => {
    classExplanations[normalizeCpcCode(row.class)] = row.explanation;
  });

  const countries = {};
  const products = {};
  let countryId = 0;
  let minYear = Infinity;
  let maxYear = -Infinity;
  let totalPatents = 0;

  function ensureCountry(code) {
    if (!countryMeta[code]) return null;
    if (!countries[code]) {
      const meta = countryMeta[code];
      countries[code] = {
        id: countryId++,
        products: {},
        productYears: {},
        years: {},
        particles: 0,
        exports: 0,
        name: meta.name,
        area: meta.area,
        sub: 1,
        iso: meta.iso,
        lat: meta.lat,
        lon: meta.lon,
        continent: meta.continent
      };
    }
    return countries[code];
  }

  const classCorrections = {};
  readCsv(FILES.patentCounts).forEach((row) => {
    const code = row.country;
    const year = Number(row.year);
    const rawClassCode = normalizeCpcCode(row.class);
    const classCode = resolveClassCode(rawClassCode, classExplanations);
    const count = Number(row.invention_count);
    const prefix = classCode.slice(0, 4);
    const category = categoryByPrefix[prefix];
    if (!category || !countryMeta[code] || !Number.isFinite(count) || count <= 0) return;
    if (rawClassCode !== classCode) classCorrections[rawClassCode] = classCode;

    minYear = Math.min(minYear, year);
    maxYear = Math.max(maxYear, year);
    totalPatents += count;

    if (!products[classCode]) {
      products[classCode] = {
        atlasid: classCode,
        name: classExplanations[classCode] || CLASS_NAME_OVERRIDES[classCode] || `${classCode}（${category.name}）`,
        cpc: classCode,
        color: Object.keys(categories).find((color) => categories[color] === category),
        category: prefix,
        categoryId: category.id,
        sales: 0
      };
    }
    products[classCode].sales += count;
    category.patentTotal += count;

    const country = ensureCountry(code);
    if (!country) return;
    country.products[classCode] = (country.products[classCode] || 0) + count;
    if (!country.productYears[classCode]) country.productYears[classCode] = {};
    country.productYears[classCode][year] = (country.productYears[classCode][year] || 0) + count;
    country.exports += count;
    country.years[year] = (country.years[year] || 0) + count;
  });

  Object.values(countries).forEach((country) => {
    country.particles = Object.values(country.products).reduce(
      (sum, count) => sum + Math.round(count / PATENT_UNIT),
      0
    );
    Object.entries(country.products).forEach(([classCode, count]) => {
      categories[products[classCode].color].total += Math.round(count / PATENT_UNIT);
    });
  });

  const trade = {};
  const tradeByYear = {};
  readCsv(FILES.countryTransfers).forEach((row) => {
    const source = row.apply_country;
    const target = row.assignee_country;
    const year = Number(row.filing_year);
    const count = Number(row.cnt);
    ensureCountry(source);
    ensureCountry(target);
    if (!countries[source] || !countries[target] || source === target || !Number.isFinite(count)) return;
    if (!trade[source]) trade[source] = {};
    trade[source][target] = (trade[source][target] || 0) + count;
    if (Number.isFinite(year)) {
      if (!tradeByYear[year]) tradeByYear[year] = {};
      if (!tradeByYear[year][source]) tradeByYear[year][source] = {};
      tradeByYear[year][source][target] = (tradeByYear[year][source][target] || 0) + count;
    }
  });
  const normalizedTrade = {};
  Object.entries(trade).forEach(([source, targets]) => {
    normalizedTrade[source] = Object.entries(targets)
      .map(([target, count]) => ({ c: target, e: count }))
      .sort((a, b) => b.e - a.e)
      .slice(0, 10);
  });
  const normalizedTradeByYear = {};
  Object.entries(tradeByYear).forEach(([year, sources]) => {
    normalizedTradeByYear[year] = {};
    Object.entries(sources).forEach(([source, targets]) => {
      normalizedTradeByYear[year][source] = Object.entries(targets)
        .map(([target, count]) => ({ c: target, e: count }))
        .sort((a, b) => b.e - a.e)
        .slice(0, 10);
    });
  });

  const productspace = buildProductspace(products);
  const network = buildNetwork(products, classExplanations);
  const payload = {
    countries,
    products,
    categories,
    trade: normalizedTrade,
    tradeByYear: normalizedTradeByYear,
    meta: {
      patentUnit: PATENT_UNIT,
      minYear,
      maxYear,
      totalPatents,
      totalParticles: Object.values(countries).reduce((sum, country) => sum + country.particles, 0),
      classCorrections,
      settingsSource: "patent_globe/settings.json"
    }
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, "countries.json"), JSON.stringify(payload));
  fs.writeFileSync(path.join(OUTPUT_DIR, "productspace.json"), JSON.stringify(productspace));
  fs.writeFileSync(path.join(OUTPUT_DIR, "network_hs.json"), JSON.stringify(network));
  fs.writeFileSync(path.join(OUTPUT_DIR, "core_patents.json"), JSON.stringify(payload, null, 2));

  console.log(`Generated ${Object.keys(countries).length} countries, ${Object.keys(products).length} classes, ${payload.meta.totalParticles} particles.`);
}

main();
