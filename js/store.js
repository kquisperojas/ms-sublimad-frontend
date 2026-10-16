const SUBLIMAD_STORAGE_KEY = 'sublimad-catalog';

function sublimadClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sublimadIsCatalog(value) {
  return Boolean(
    value &&
    Array.isArray(value.garments) &&
    value.garments.length > 0 &&
    Array.isArray(value.categories)
  );
}

function sublimadSlug(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function sublimadFillRow(row, fallback) {
  const sale = Number(row.salePrice ?? row.price ?? fallback.salePrice ?? 0);
  row.salePrice = Number.isFinite(sale) ? sale : 0;
  row.price = row.salePrice;
  const purchase = Number(row.purchasePrice ?? fallback.purchasePrice);
  row.purchasePrice = Number.isFinite(purchase) ? purchase : Number((row.salePrice * 0.6).toFixed(2));
  const stock = Number(row.stock ?? fallback.stock);
  row.stock = Number.isFinite(stock) ? stock : 0;
  const discount = Number(row.discount ?? fallback.discount);
  row.discount = Number.isFinite(discount) ? discount : 0;
  row.description = row.description ?? fallback.description ?? '';
  row.productName = row.productName ?? fallback.productName ?? row.name ?? '';
  row.img = row.img || fallback.img || '';
}

function normalizeCatalog(catalog) {
  catalog.garments.forEach((garment) => {
    const registered = (SUBLIMAD_DEFAULT_CATALOG.garments || []).find((item) => item.id === garment.id);
    const defaultSizes = registered && Array.isArray(registered.sizes) ? registered.sizes : [];
    if (registered && defaultSizes.length === 0) garment.sizes = [];
    else if (!Array.isArray(garment.sizes) || garment.sizes.length === 0) garment.sizes = defaultSizes.slice();
    if (registered) {
      if (!garment.group && registered.group) garment.group = registered.group;
      if (!garment.audience && registered.audience) garment.audience = registered.audience;
    }
    garment.colors = garment.colors || [];
    if (garment.id === 'mug' && registered && Array.isArray(registered.colors)) {
      const allowed = new Set(registered.colors.map((color) => color.name));
      const kept = garment.colors.filter((color) => allowed.has(color.name));
      garment.colors = kept.length ? kept : sublimadClone(registered.colors);
    }
    if (registered && (registered.group === 'gorra' || registered.group === 'polo') && Array.isArray(registered.colors)) {
      garment.colors = sublimadClone(registered.colors);
      garment.img = registered.img || garment.img;
    }
    garment.colors.forEach((color) => {
      if (!color.id) color.id = `${garment.id}-${sublimadSlug(color.name || 'item')}`;
      sublimadFillRow(color, {
        salePrice: garment.price,
        purchasePrice: Number((Number(garment.price) * 0.6).toFixed(2)),
        stock: 10,
        discount: 0,
        description: garment.description,
        productName: `${garment.name} ${color.name || ''}`.trim(),
        img: color.img || garment.img
      });
    });
    if (garment.colors[0]) {
      garment.price = garment.colors[0].salePrice;
      garment.img = garment.colors[0].img || garment.img;
    }
  });

  if (!Array.isArray(catalog.banners)) {
    catalog.banners = sublimadClone(SUBLIMAD_DEFAULT_CATALOG.banners || []);
  }
  const previousBannerMarkers = [
    'photo-1523380677598',
    'photo-1592367630397',
    'photo-1521369909029',
    'photo-1616241673111',
    'photo-1521572267360',
    'photo-1618354691373',
    'photo-1588850561407',
    'photo-1514432324607'
  ];
  catalog.banners.forEach((banner) => {
    if (!banner.id) banner.id = `banner-${sublimadSlug(banner.name || 'item')}`;
    banner.name = banner.name || '';
    banner.productName = banner.name;
    banner.description = banner.description || '';
    const registered = (SUBLIMAD_DEFAULT_CATALOG.banners || []).find((item) => item.id === banner.id);
    const currentImg = String(banner.img || '');
    if (registered && previousBannerMarkers.some((marker) => currentImg.includes(marker))) {
      banner.img = registered.img;
    }
    banner.img = banner.img || (registered ? registered.img : '');
    const discount = Number(banner.discount);
    banner.discount = Number.isFinite(discount) ? discount : 0;
  });

  catalog.categories.forEach((category) => {
    category.products = category.products || [];
    category.products.forEach((product) => {
      sublimadFillRow(product, {
        salePrice: product.price,
        purchasePrice: Number((Number(product.price || 0) * 0.6).toFixed(2)),
        stock: 8,
        discount: 0,
        description: product.description || category.title,
        productName: product.name,
        img: product.img
      });
      product.name = product.productName;
    });
  });

  return catalog;
}

const ADMIN_SECTIONS = {
  tintas: { label: 'Tintas', kind: 'category', sourceId: 'tintas' },
  impresoras: { label: 'Impresoras', kind: 'category', sourceId: 'impresoras' },
  polos: { label: 'Polos', kind: 'garment', sourceId: 'polo' },
  tazas: { label: 'Tazas', kind: 'garment', sourceId: 'mug' },
  gorros: { label: 'Gorros', kind: 'garment', sourceId: 'gorra' },
  banner: { label: 'Banner', kind: 'banner' }
};

function sectionRows(catalog, sectionKey) {
  const section = ADMIN_SECTIONS[sectionKey];
  if (!section) return [];
  if (section.kind === 'banner') return catalog.banners || [];
  if (section.kind === 'garment') {
    const garment = catalog.garments.find((item) => item.id === section.sourceId);
    return garment ? garment.colors : [];
  }
  const category = catalog.categories.find((item) => item.id === section.sourceId);
  return category ? category.products : [];
}

function mergeDefaultGarments(catalog) {
  const ids = new Set((catalog.garments || []).map((item) => item.id));
  (SUBLIMAD_DEFAULT_CATALOG.garments || []).forEach((garment) => {
    if (!ids.has(garment.id)) catalog.garments.push(sublimadClone(garment));
  });
}

function loadCatalog() {
  const defaults = normalizeCatalog(sublimadClone(SUBLIMAD_DEFAULT_CATALOG));
  try {
    const raw = localStorage.getItem(SUBLIMAD_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!sublimadIsCatalog(parsed)) return defaults;
    mergeDefaultGarments(parsed);
    const catalog = normalizeCatalog(parsed);
    const storedImages = (parsed.banners || []).map((banner) => banner && banner.img).join('|');
    const nextImages = (catalog.banners || []).map((banner) => banner.img).join('|');
    if (storedImages !== nextImages) saveCatalog(catalog);
    return catalog;
  } catch (error) {
    return defaults;
  }
}

function saveCatalog(catalog) {
  localStorage.setItem(SUBLIMAD_STORAGE_KEY, JSON.stringify(catalog));
}

function updateGarment(id, patch) {
  const catalog = loadCatalog();
  const garment = catalog.garments.find((item) => item.id === id);
  if (!garment) return null;

  garment.name = patch.name;
  garment.description = patch.description;
  garment.price = patch.price;
  garment.img = patch.img;
  if (garment.colors && garment.colors[0]) {
    garment.colors[0].img = patch.img;
  }

  saveCatalog(catalog);
  return garment;
}

function addArticle(categoryId, article) {
  const catalog = loadCatalog();
  const category = catalog.categories.find((item) => item.id === categoryId);
  if (!category) return null;

  category.products.push(article);
  saveCatalog(catalog);
  return article;
}

function updateArticle(categoryId, articleId, patch) {
  const catalog = loadCatalog();
  const category = catalog.categories.find((item) => item.id === categoryId);
  if (!category) return null;

  const article = category.products.find((item) => item.id === articleId);
  if (!article) return null;

  article.name = patch.name;
  article.price = patch.price;
  article.img = patch.img;
  saveCatalog(catalog);
  return article;
}

function listSection(sectionKey) {
  const catalog = loadCatalog();
  return {
    label: ADMIN_SECTIONS[sectionKey] ? ADMIN_SECTIONS[sectionKey].label : '',
    rows: sectionRows(catalog, sectionKey).map((row) => ({
      id: row.id,
      name: row.productName || row.name,
      description: row.description,
      purchasePrice: row.purchasePrice,
      salePrice: row.salePrice,
      stock: row.stock,
      discount: row.discount,
      img: row.img
    }))
  };
}

function updateSectionItem(sectionKey, itemId, patch) {
  const catalog = loadCatalog();
  const row = sectionRows(catalog, sectionKey).find((item) => item.id === itemId);
  if (!row) return null;

  const section = ADMIN_SECTIONS[sectionKey];
  row.productName = patch.name;
  if (section && section.kind === 'banner') {
    row.name = patch.name;
    row.description = patch.description;
    row.discount = patch.discount;
    row.img = patch.img;
    saveCatalog(catalog);
    syncWarehouseFromCatalog(sectionKey, itemId, patch);
    return row;
  }
  if (section && section.kind === 'category') row.name = patch.name;
  row.description = patch.description;
  row.purchasePrice = patch.purchasePrice;
  row.salePrice = patch.salePrice;
  row.price = patch.salePrice;
  row.stock = patch.stock;
  row.discount = patch.discount;
  row.img = patch.img;

  if (section.kind === 'garment') {
    const garment = catalog.garments.find((item) => item.id === section.sourceId);
    if (garment) {
      garment.price = patch.salePrice;
      garment.description = patch.description;
      if (garment.colors[0] && garment.colors[0].id === itemId) garment.img = patch.img;
    }
  }

  saveCatalog(catalog);
  syncWarehouseFromCatalog(sectionKey, itemId, patch);
  return row;
}

function deleteSectionItem(sectionKey, itemId) {
  const catalog = loadCatalog();
  const section = ADMIN_SECTIONS[sectionKey];
  if (!section) return false;

  if (section.kind === 'banner') {
    const next = (catalog.banners || []).filter((item) => item.id !== itemId);
    if (next.length === (catalog.banners || []).length) return false;
    catalog.banners = next;
    saveCatalog(catalog);
    return true;
  }

  if (section.kind === 'garment') {
    const garment = catalog.garments.find((item) => item.id === section.sourceId);
    if (!garment) return false;
    const next = garment.colors.filter((item) => item.id !== itemId);
    if (next.length === garment.colors.length) return false;
    garment.colors = next;
    if (garment.colors[0]) {
      garment.price = garment.colors[0].salePrice;
      garment.img = garment.colors[0].img;
    }
  } else {
    const category = catalog.categories.find((item) => item.id === section.sourceId);
    if (!category) return false;
    const next = category.products.filter((item) => item.id !== itemId);
    if (next.length === category.products.length) return false;
    category.products = next;
  }

  saveCatalog(catalog);
  return true;
}

const WAREHOUSE_KEY = 'sublimad-warehouse';

function emptyGuide() {
  return {
    entryDate: '',
    guideNumber: '',
    supplier: '',
    supplierRuc: '',
    documentType: 'Factura',
    documentNumber: '',
    quantity: 1,
    unit: 'UND',
    lot: '',
    warehouse: 'Almacén principal',
    receivedBy: '',
    status: 'Pendiente',
    notes: ''
  };
}

function warehouseRowFromCatalog(row) {
  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    purchasePrice: row.purchasePrice,
    salePrice: row.salePrice,
    stock: row.stock,
    discount: row.discount,
    ...emptyGuide(),
    quantity: Number(row.stock) > 0 ? Number(row.stock) : 1
  };
}

function saveWarehouse(data) {
  localStorage.setItem(WAREHOUSE_KEY, JSON.stringify(data));
}

function loadWarehouse() {
  try {
    const raw = localStorage.getItem(WAREHOUSE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return ensureWarehouseSections(parsed);
    }
  } catch (error) {
    /* Si el guardado está dañado, se vuelve a armar desde el catálogo. */
  }

  const created = {};
  Object.keys(ADMIN_SECTIONS).forEach((key) => {
    created[key] = listSection(key).rows.map(warehouseRowFromCatalog);
  });
  saveWarehouse(created);
  return created;
}

function ensureWarehouseSections(data) {
  let changed = false;
  Object.keys(ADMIN_SECTIONS).forEach((key) => {
    if (!Array.isArray(data[key])) {
      data[key] = listSection(key).rows.map(warehouseRowFromCatalog);
      changed = true;
    }
  });
  if (changed) saveWarehouse(data);
  return data;
}

function guideFromPatch(patch) {
  return {
    entryDate: patch.entryDate,
    guideNumber: patch.guideNumber,
    supplier: patch.supplier,
    supplierRuc: patch.supplierRuc,
    documentType: patch.documentType,
    documentNumber: patch.documentNumber,
    quantity: patch.quantity,
    unit: patch.unit,
    lot: patch.lot,
    warehouse: patch.warehouse,
    receivedBy: patch.receivedBy,
    status: patch.status,
    notes: patch.notes
  };
}

function listWarehouse(sectionKey) {
  const data = loadWarehouse();
  const rows = data[sectionKey] || [];
  return {
    label: ADMIN_SECTIONS[sectionKey] ? ADMIN_SECTIONS[sectionKey].label : '',
    rows: rows.map((row) => ({ ...emptyGuide(), ...row }))
  };
}

function nextGuideNumber() {
  const data = loadWarehouse();
  const year = new Date().getFullYear();
  const prefix = `GE-${year}-`;
  let max = 0;
  Object.keys(ADMIN_SECTIONS).forEach((key) => {
    (data[key] || []).forEach((row) => {
      const value = String(row.guideNumber || '');
      if (!value.startsWith(prefix)) return;
      const num = Number(value.slice(prefix.length));
      if (Number.isFinite(num) && num > max) max = num;
    });
  });
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

function syncWarehouseFromCatalog(sectionKey, itemId, patch) {
  const data = loadWarehouse();
  if (!Array.isArray(data[sectionKey])) data[sectionKey] = [];
  let row = data[sectionKey].find((item) => item.id === itemId);
  if (!row) {
    const stock = Number(patch.stock);
    row = {
      id: itemId,
      name: patch.name || '',
      description: patch.description || '',
      purchasePrice: patch.purchasePrice,
      ...emptyGuide(),
      quantity: Number.isInteger(stock) && stock > 0 ? stock : 1
    };
    data[sectionKey].push(row);
    saveWarehouse(data);
    return row;
  }

  if (patch.name != null) row.name = patch.name;
  if (patch.description != null) row.description = patch.description;
  if (patch.purchasePrice != null && Number.isFinite(Number(patch.purchasePrice))) {
    row.purchasePrice = Number(patch.purchasePrice);
  }
  if (patch.stock != null && Number.isInteger(Number(patch.stock))) {
    row.quantity = Number(patch.stock);
  }
  saveWarehouse(data);
  return row;
}

function syncCatalogFromGuide(sectionKey, itemId, patch) {
  const catalog = loadCatalog();
  const section = ADMIN_SECTIONS[sectionKey];
  if (!section) return null;

  const quantity = Number(patch.quantity);
  const purchasePrice = Number(patch.purchasePrice);
  let row = sectionRows(catalog, sectionKey).find((item) => item.id === itemId);

  if (section.kind === 'banner') {
    if (!row) {
      row = {
        id: itemId,
        name: patch.name,
        productName: patch.name,
        description: patch.description || '',
        discount: 0,
        img: ''
      };
      catalog.banners.push(row);
    } else {
      row.name = patch.name;
      row.productName = patch.name;
      row.description = patch.description || '';
    }
    saveCatalog(catalog);
    return row;
  }

  if (!row) {
    const salePrice = Number.isFinite(purchasePrice) && purchasePrice > 0 ? purchasePrice : 1;
    row = {
      id: itemId,
      name: patch.name,
      productName: patch.name,
      description: patch.description || '',
      purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : 0,
      salePrice,
      price: salePrice,
      stock: Number.isInteger(quantity) ? quantity : 0,
      discount: 0,
      img: ''
    };
    if (section.kind === 'category') {
      const category = catalog.categories.find((item) => item.id === section.sourceId);
      if (!category) return null;
      category.products.push(row);
    } else {
      const garment = catalog.garments.find((item) => item.id === section.sourceId);
      if (!garment) return null;
      row.swatch = 'bg-gray-400 border-2 border-gray-300';
      row.alt = patch.name;
      row.img = garment.img || '';
      garment.colors.push(row);
    }
  } else {
    row.productName = patch.name;
    row.description = patch.description || '';
    row.purchasePrice = Number.isFinite(purchasePrice) ? purchasePrice : row.purchasePrice;
    row.stock = Number.isInteger(quantity) ? quantity : row.stock;
    if (section.kind === 'category') row.name = patch.name;
  }

  saveCatalog(catalog);
  return row;
}

function createWarehouseItem(sectionKey, patch) {
  if (!ADMIN_SECTIONS[sectionKey]) return null;
  const data = loadWarehouse();
  const row = {
    id: `wh-${sectionKey}-${Date.now()}`,
    name: patch.name,
    description: patch.description,
    purchasePrice: patch.purchasePrice,
    ...guideFromPatch(patch)
  };
  data[sectionKey].push(row);
  saveWarehouse(data);
  syncCatalogFromGuide(sectionKey, row.id, patch);
  return row;
}

function updateWarehouseItem(sectionKey, itemId, patch) {
  const data = loadWarehouse();
  const row = (data[sectionKey] || []).find((item) => item.id === itemId);
  if (!row) return null;
  row.name = patch.name;
  row.description = patch.description;
  row.purchasePrice = patch.purchasePrice;
  Object.assign(row, guideFromPatch(patch));
  saveWarehouse(data);
  syncCatalogFromGuide(sectionKey, itemId, patch);
  return row;
}

function deleteWarehouseItem(sectionKey, itemId) {
  const data = loadWarehouse();
  if (!Array.isArray(data[sectionKey])) return false;
  const next = data[sectionKey].filter((item) => item.id !== itemId);
  if (next.length === data[sectionKey].length) return false;
  data[sectionKey] = next;
  saveWarehouse(data);
  return true;
}

function deleteArticle(categoryId, articleId) {
  const catalog = loadCatalog();
  const category = catalog.categories.find((item) => item.id === categoryId);
  if (!category) return false;

  const nextProducts = category.products.filter((item) => item.id !== articleId);
  if (nextProducts.length === category.products.length) return false;

  category.products = nextProducts;
  saveCatalog(catalog);
  return true;
}

const SublimadStore = {
  loadCatalog,
  saveCatalog,
  updateGarment,
  addArticle,
  updateArticle,
  deleteArticle,
  listSection,
  updateSectionItem,
  deleteSectionItem,
  listWarehouse,
  nextGuideNumber,
  createWarehouseItem,
  updateWarehouseItem,
  deleteWarehouseItem
};
