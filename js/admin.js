const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = '123456';
const ADMIN_SESSION_KEY = 'sublimad-admin-session';

let currentSection = '';
let currentSource = 'catalog';
let pendingDeleteId = '';
let editingNew = false;

const GUIDE_FIELDS = [
  'edit-entry-date',
  'edit-guide-number',
  'edit-supplier',
  'edit-ruc',
  'edit-document-type',
  'edit-document-number',
  'edit-quantity',
  'edit-unit',
  'edit-warehouse',
  'edit-received-by',
  'edit-status'
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(value) {
  return `S/ ${Number(value).toFixed(2)}`;
}

function isLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function showLogin() {
  document.getElementById('login-view').classList.remove('hidden');
  document.getElementById('panel-view').classList.add('hidden');
}

function showPanel() {
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('panel-view').classList.remove('hidden');
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function toggleMenu(buttonId, submenuId) {
  const button = document.getElementById(buttonId);
  const submenu = document.getElementById(submenuId);
  const open = submenu.classList.contains('hidden');
  submenu.classList.toggle('hidden', !open);
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  button.querySelector('i').classList.toggle('rotate-180', open);
}

function isBannerSection() {
  return currentSection === 'banner';
}

function isWarehouse() {
  return currentSource === 'warehouse';
}

function todayISO() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function blank(value) {
  const text = String(value ?? '').trim();
  return text ? escapeHtml(text) : '—';
}

function formatDate(value) {
  if (!value) return '—';
  const parts = String(value).split('-');
  if (parts.length !== 3) return escapeHtml(value);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function imageCell(row) {
  if (isWarehouse()) {
    return '<span class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-700"><i class="fa-solid fa-box text-xs"></i></span>';
  }
  return `<img src="${escapeHtml(row.img)}" alt="" class="h-7 w-7 rounded-md object-cover bg-gray-100">`;
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function rowMatchesQuery(row, query) {
  if (!query) return true;
  return [row.name, row.description, row.supplier, row.supplierRuc]
    .some((value) => normalizeSearch(value).includes(query));
}

function guideHead() {
  if (!isWarehouse()) return '';
  return `
          <th>Fecha</th>
          <th>N° guía</th>
          <th>Proveedor</th>
          <th>RUC</th>
          <th>Documento</th>
          <th>Cantidad</th>
          <th>Unidad</th>
          <th>Lote</th>
          <th>Almacén</th>
          <th>Recibido por</th>
          <th>Estado</th>
          <th>Observación</th>`;
}

function guideCells(row) {
  if (!isWarehouse()) return '';
  const hasGuide = Boolean(String(row.guideNumber || '').trim());
  const documentLabel = row.documentNumber ? [row.documentType, row.documentNumber].filter(Boolean).join(' ') : '';
  const statusClass = row.status === 'Recepcionado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';
  const statusCell = hasGuide
    ? `<span class="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusClass}">${escapeHtml(row.status || 'Pendiente')}</span>`
    : '—';
  return `
            <td>${formatDate(row.entryDate)}</td>
            <td class="font-semibold">${blank(row.guideNumber)}</td>
            <td>${blank(row.supplier)}</td>
            <td>${blank(row.supplierRuc)}</td>
            <td>${blank(documentLabel)}</td>
            <td>${hasGuide && Number(row.quantity) > 0 ? Number(row.quantity) : '—'}</td>
            <td>${hasGuide ? blank(row.unit) : '—'}</td>
            <td>${blank(row.lot)}</td>
            <td>${hasGuide ? blank(row.warehouse) : '—'}</td>
            <td>${blank(row.receivedBy)}</td>
            <td>${statusCell}</td>
            <td class="max-w-[160px] overflow-hidden text-ellipsis text-gray-600">${blank(row.notes)}</td>`;
}

function setBannerForm(active) {
  ['edit-stock-wrap', 'edit-purchase-wrap', 'edit-sale-wrap'].forEach((id) => {
    document.getElementById(id).classList.toggle('hidden', active);
  });
  ['edit-stock', 'edit-purchase', 'edit-sale'].forEach((id) => {
    document.getElementById(id).required = !active;
  });
  document.querySelector('#edit-form h3').textContent = active ? 'Modificar banner' : 'Modificar producto';
}

function setGuideForm(active) {
  const hideCatalogOnly = active || isBannerSection();
  document.getElementById('edit-guide').classList.toggle('hidden', !active);
  document.getElementById('edit-img-wrap').classList.toggle('hidden', active);
  document.getElementById('edit-icon-wrap').classList.add('hidden');
  document.getElementById('edit-sale-wrap').classList.toggle('hidden', hideCatalogOnly);
  document.getElementById('edit-stock-wrap').classList.toggle('hidden', hideCatalogOnly);
  document.getElementById('edit-discount-wrap').classList.toggle('hidden', active);
  document.getElementById('edit-img').required = !active;
  document.getElementById('edit-sale').required = !hideCatalogOnly;
  document.getElementById('edit-stock').required = !hideCatalogOnly;
  document.getElementById('edit-discount').required = !active;
  GUIDE_FIELDS.forEach((id) => {
    document.getElementById(id).required = active;
  });
  document.getElementById('edit-submit').textContent = active && editingNew ? 'Registrar entrada' : 'Actualizar';
  if (!active) return;
  document.querySelector('#edit-form h3').textContent = editingNew ? 'Nueva guía de entrada' : 'Modificar guía de entrada';
}

function fillGuideFields(row) {
  document.getElementById('edit-entry-date').value = row.entryDate || todayISO();
  document.getElementById('edit-guide-number').value = row.guideNumber || SublimadStore.nextGuideNumber();
  document.getElementById('edit-supplier').value = row.supplier || '';
  document.getElementById('edit-ruc').value = row.supplierRuc || '';
  document.getElementById('edit-document-type').value = row.documentType || 'Factura';
  document.getElementById('edit-document-number').value = row.documentNumber || '';
  document.getElementById('edit-quantity').value = Number(row.quantity) > 0 ? row.quantity : 1;
  document.getElementById('edit-unit').value = row.unit || 'UND';
  document.getElementById('edit-lot').value = row.lot || '';
  document.getElementById('edit-warehouse').value = row.warehouse || 'Almacén principal';
  document.getElementById('edit-received-by').value = row.receivedBy || '';
  document.getElementById('edit-status').value = row.status || 'Pendiente';
  document.getElementById('edit-notes').value = row.notes || '';
}

function isStoreCatalog() {
  return !isWarehouse() && ['polos', 'tazas', 'gorros', 'banner'].includes(currentSection);
}

function catalogTotals(rows) {
  if (!isStoreCatalog() || !rows.length) return '';
  const discount = rows.reduce((sum, row) => sum + Number(row.discount || 0), 0);
  if (isBannerSection()) {
    return `
      <tfoot>
        <tr class="admin-total">
          <td colspan="3">Total</td>
          <td>${discount}%</td>
          <td></td>
          <td></td>
        </tr>
      </tfoot>`;
  }
  const purchase = rows.reduce((sum, row) => sum + Number(row.purchasePrice || 0), 0);
  const sale = rows.reduce((sum, row) => sum + Number(row.salePrice || 0), 0);
  const stock = rows.reduce((sum, row) => sum + Number(row.stock || 0), 0);
  return `
      <tfoot>
        <tr class="admin-total">
          <td colspan="3">Total</td>
          <td>${money(purchase)}</td>
          <td class="text-brand-700">${money(sale)}</td>
          <td>${stock}</td>
          <td>${discount}%</td>
          <td></td>
          <td></td>
        </tr>
      </tfoot>`;
}

function renderTable() {
  const title = document.getElementById('table-title');
  const root = document.getElementById('product-table');
  const addBtn = document.getElementById('add-entry-btn');
  const note = document.getElementById('table-note');
  const searchWrap = document.getElementById('table-search-wrap');
  const searchInput = document.getElementById('table-search');
  const showAdd = isWarehouse() && Boolean(currentSection);
  addBtn.classList.toggle('hidden', !showAdd);
  searchWrap.classList.toggle('hidden', !currentSection);

  if (!currentSection) {
    title.textContent = 'Elige una opción del menú';
    note.textContent = 'Los cambios se guardan en este navegador y se ven en la tienda.';
    root.innerHTML = '<p class="p-8 text-center text-xs text-gray-500">Abre Productos, Catálogo o Almacén y elige una sección.</p>';
    return;
  }

  const data = isWarehouse()
    ? SublimadStore.listWarehouse(currentSection)
    : SublimadStore.listSection(currentSection);
  const query = normalizeSearch(searchInput.value.trim());
  const visible = data.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => rowMatchesQuery(row, query));
  title.textContent = data.label;
  note.textContent = isWarehouse()
    ? 'Nombre, descripción, precio de compra y cantidad se actualizan también en Productos y Catálogo.'
    : 'Nombre, descripción, precio de compra y stock se actualizan también en Almacén.';

  if (!data.rows.length) {
    const emptyLabel = isWarehouse() ? 'entradas' : (isBannerSection() ? 'banners' : 'productos');
    root.innerHTML = `<p class="p-8 text-center text-xs text-gray-500">No hay ${emptyLabel} en esta sección.</p>`;
    return;
  }

  if (!visible.length) {
    root.innerHTML = `<p class="p-8 text-center text-xs text-gray-500">Ningún producto coincide con «${escapeHtml(searchInput.value.trim())}».</p>`;
    return;
  }

  const priceColumns = isWarehouse()
    ? (isBannerSection() ? '' : '<th>Precio compra</th>')
    : (isBannerSection() ? '' : `
          <th>Precio compra</th>
          <th>Precio venta</th>
          <th>Stock</th>`);
  const catalogColumns = isWarehouse() ? '' : `
          <th>Descuento</th>
          <th>Imagen</th>`;

  root.innerHTML = `
    <table class="admin-table text-left">
      <thead class="bg-brand-50 text-[10px] uppercase tracking-wide text-brand-900">
        <tr>
          <th>Item</th>
          <th>Nombre</th>
          <th>Descripción</th>
          ${priceColumns}
          ${catalogColumns}
          ${guideHead()}
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${visible.map(({ row, index }) => `
          <tr class="border-t border-gray-100">
            <td class="font-semibold text-gray-400">${index + 1}</td>
            <td class="font-bold text-gray-900">${escapeHtml(row.name)}</td>
            <td class="text-gray-600">${escapeHtml(row.description)}</td>
            ${isBannerSection() ? '' : (isWarehouse()
              ? `<td>${money(row.purchasePrice)}</td>`
              : `<td>${money(row.purchasePrice)}</td>
            <td class="font-semibold text-brand-700">${money(row.salePrice)}</td>
            <td>${Number(row.stock)}</td>`)}
            ${isWarehouse() ? '' : `<td>${Number(row.discount)}%</td><td>${imageCell(row)}</td>`}
            ${guideCells(row)}
            <td>
              <div class="flex gap-1.5">
                <button type="button" data-edit="${escapeHtml(row.id)}" data-item="${index + 1}" class="rounded-md border border-brand-600 px-2 py-1 text-[10px] font-bold text-brand-700">Modificar</button>
                <button type="button" data-delete="${escapeHtml(row.id)}" class="rounded-md border border-red-200 px-2 py-1 text-[10px] font-bold text-red-600">Eliminar</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
      ${catalogTotals(visible.map(({ row }) => row))}
    </table>
  `;

  root.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => openEdit(button.getAttribute('data-edit'), button.getAttribute('data-item')));
  });
  root.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      pendingDeleteId = button.getAttribute('data-delete');
      document.getElementById('delete-title').textContent = isWarehouse()
        ? 'Eliminar entrada'
        : (isBannerSection() ? 'Eliminar banner' : 'Eliminar producto');
      document.getElementById('delete-message').textContent = isWarehouse()
        ? '¿Seguro que quieres eliminar esta entrada de almacén?'
        : (isBannerSection()
          ? '¿Seguro que quieres eliminar el banner?'
          : '¿Seguro que quieres eliminar el producto?');
      openModal('delete-modal');
    });
  });
}

function fillProductFields(row, itemNumber) {
  document.getElementById('edit-id').value = row.id || '';
  document.getElementById('edit-item').value = itemNumber;
  document.getElementById('edit-name').value = row.name || '';
  document.getElementById('edit-description').value = row.description || '';
  setBannerForm(isBannerSection());
  if (!isBannerSection()) {
    document.getElementById('edit-purchase').value = row.purchasePrice ?? '';
    document.getElementById('edit-sale').value = row.salePrice ?? '';
    document.getElementById('edit-stock').value = row.stock ?? 0;
  }
  document.getElementById('edit-discount').value = row.discount ?? 0;
  document.getElementById('edit-img').value = row.img || '';
  setGuideForm(isWarehouse());
  if (isWarehouse()) fillGuideFields(row);
  document.getElementById('edit-error').classList.add('hidden');
}

function openEdit(id, itemNumber) {
  const data = isWarehouse()
    ? SublimadStore.listWarehouse(currentSection)
    : SublimadStore.listSection(currentSection);
  const row = data.rows.find((item) => item.id === id);
  if (!row) return;
  editingNew = false;
  fillProductFields(row, itemNumber);
  openModal('edit-modal');
}

function openCreate() {
  editingNew = true;
  fillProductFields({ discount: 0, stock: 0, quantity: 1 }, 'Nuevo');
  openModal('edit-modal');
}

function readGuideFields() {
  const entryDate = document.getElementById('edit-entry-date').value;
  const guideNumber = document.getElementById('edit-guide-number').value.trim();
  const supplier = document.getElementById('edit-supplier').value.trim();
  const supplierRuc = document.getElementById('edit-ruc').value.trim();
  const documentType = document.getElementById('edit-document-type').value;
  const documentNumber = document.getElementById('edit-document-number').value.trim();
  const quantity = Number(document.getElementById('edit-quantity').value);
  const unit = document.getElementById('edit-unit').value;
  const lot = document.getElementById('edit-lot').value.trim();
  const warehouse = document.getElementById('edit-warehouse').value;
  const receivedBy = document.getElementById('edit-received-by').value.trim();
  const status = document.getElementById('edit-status').value;
  const notes = document.getElementById('edit-notes').value.trim();

  if (!entryDate) return { error: 'La fecha de ingreso es obligatoria.' };
  if (!guideNumber) return { error: 'El número de guía es obligatorio.' };
  if (!supplier) return { error: 'El proveedor es obligatorio.' };
  if (!/^\d{11}$/.test(supplierRuc)) return { error: 'El RUC debe tener 11 dígitos.' };
  if (!documentNumber) return { error: 'El número de documento es obligatorio.' };
  if (!Number.isInteger(quantity) || quantity < 1) return { error: 'La cantidad ingresada debe ser un entero mayor a 0.' };
  if (!receivedBy) return { error: 'Indica quién recibió la mercadería.' };

  return {
    entryDate,
    guideNumber,
    supplier,
    supplierRuc,
    documentType,
    documentNumber,
    quantity,
    unit,
    lot,
    warehouse,
    receivedBy,
    status,
    notes
  };
}

function readEditForm() {
  const name = document.getElementById('edit-name').value.trim();
  const description = document.getElementById('edit-description').value.trim();
  const purchasePrice = Number(document.getElementById('edit-purchase').value);
  const salePrice = Number(document.getElementById('edit-sale').value);
  const stock = Number(document.getElementById('edit-stock').value);
  const discount = Number(document.getElementById('edit-discount').value);
  const img = document.getElementById('edit-img').value.trim();

  if (!name) return { error: 'El nombre es obligatorio.' };
  if (!description) return { error: 'La descripción es obligatoria.' };

  if (isWarehouse()) {
    const fields = { name, description };
    if (!isBannerSection()) {
      if (!Number.isFinite(purchasePrice) || purchasePrice < 0) return { error: 'El precio de compra no es válido.' };
      fields.purchasePrice = purchasePrice;
    }
    const guide = readGuideFields();
    if (guide.error) return guide;
    fields.stock = guide.quantity;
    return { ...fields, ...guide };
  }

  if (!isBannerSection()) {
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) return { error: 'El precio de compra no es válido.' };
    if (!Number.isFinite(salePrice) || salePrice <= 0) return { error: 'El precio de venta debe ser mayor a 0.' };
    if (!Number.isInteger(stock) || stock < 0) return { error: 'El stock debe ser un número entero mayor o igual a 0.' };
  }
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) return { error: 'El descuento debe estar entre 0 y 100.' };

  const fields = isBannerSection()
    ? { name, description, discount }
    : { name, description, purchasePrice, salePrice, stock, discount };

  if (!img) return { error: 'La imagen es obligatoria.' };
  fields.img = img;
  return fields;
}

document.getElementById('menu-productos').addEventListener('click', () => {
  toggleMenu('menu-productos', 'submenu-productos');
});

document.getElementById('menu-catalogo').addEventListener('click', () => {
  toggleMenu('menu-catalogo', 'submenu-catalogo');
});

document.getElementById('menu-almacen').addEventListener('click', () => {
  toggleMenu('menu-almacen', 'submenu-almacen');
});

document.getElementById('add-entry-btn').addEventListener('click', openCreate);

document.getElementById('table-search').addEventListener('input', () => {
  renderTable();
});

document.querySelectorAll('.section-link').forEach((button) => {
  button.addEventListener('click', () => {
    currentSection = button.getAttribute('data-section');
    currentSource = button.getAttribute('data-source') || 'catalog';
    document.querySelectorAll('.section-link').forEach((link) => {
      link.classList.remove('is-active');
    });
    button.classList.add('is-active');
    document.getElementById('table-search').value = '';
    renderTable();
  });
});

document.getElementById('edit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const errorEl = document.getElementById('edit-error');
  const fields = readEditForm();
  if (fields.error) {
    errorEl.textContent = fields.error;
    errorEl.classList.remove('hidden');
    return;
  }
  const itemId = document.getElementById('edit-id').value;
  let updated;
  if (isWarehouse()) {
    updated = itemId
      ? SublimadStore.updateWarehouseItem(currentSection, itemId, fields)
      : SublimadStore.createWarehouseItem(currentSection, fields);
  } else {
    updated = SublimadStore.updateSectionItem(currentSection, itemId, fields);
  }
  if (!updated) {
    errorEl.textContent = 'No se encontró el producto.';
    errorEl.classList.remove('hidden');
    return;
  }
  const wasNew = editingNew;
  closeModal('edit-modal');
  renderTable();
  document.getElementById('success-message').textContent = isWarehouse()
    ? (wasNew ? 'La guía de entrada ha sido registrada correctamente.' : 'La guía de entrada ha sido actualizada correctamente.')
    : (isBannerSection()
      ? 'Banner ha sido actualizado correctamente.'
      : 'Producto ha sido actualizado correctamente.');
  openModal('success-modal');
});

document.getElementById('edit-cancel').addEventListener('click', () => closeModal('edit-modal'));
document.getElementById('edit-close').addEventListener('click', () => closeModal('edit-modal'));
document.getElementById('success-close').addEventListener('click', () => closeModal('success-modal'));

document.getElementById('delete-cancel').addEventListener('click', () => {
  pendingDeleteId = '';
  closeModal('delete-modal');
});

document.getElementById('delete-confirm').addEventListener('click', () => {
  if (pendingDeleteId) {
    if (isWarehouse()) SublimadStore.deleteWarehouseItem(currentSection, pendingDeleteId);
    else SublimadStore.deleteSectionItem(currentSection, pendingDeleteId);
  }
  pendingDeleteId = '';
  closeModal('delete-modal');
  renderTable();
});

document.getElementById('login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-password').value;
  const error = document.getElementById('login-error');

  if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    error.classList.add('hidden');
    showPanel();
    return;
  }

  error.classList.remove('hidden');
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  document.getElementById('login-password').value = '';
  closeModal('edit-modal');
  closeModal('delete-modal');
  closeModal('success-modal');
  showLogin();
});

if (isLoggedIn()) showPanel();
else showLogin();
