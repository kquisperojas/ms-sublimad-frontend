    let cart = [];
    try {
      const savedCart = JSON.parse(localStorage.getItem('sublimad-cart') || '[]');
      if (Array.isArray(savedCart)) {
        cart = savedCart.filter((item) => item && typeof item.key === 'string' && typeof item.name === 'string');
      }
    } catch (error) {
      cart = [];
    }
    let catalog = SublimadStore.loadCatalog();
    const currentGarmentColor = {};
    const currentGarmentSize = {};

    const miniSlidePos = {
      'slide-polos': 0,
      'slide-gorras': 0,
      'slide-tazas': 0,
      'slide-tintas': 0,
      'slide-impresoras': 0,
      'slide-dtf': 0
    };

    function updateSlideAndText(id, index) {
      const el = document.getElementById(id);
      if (!el) return;
      
      miniSlidePos[id] = index;
      el.style.transform = `translateX(-${index * 100}%)`;

      // Actualizar contador para banners de equipos
      const numEl = document.getElementById(`${id}-num`);
      if (numEl) {
        numEl.innerText = index + 1;
      }

      const garment = catalog.garments.find((item) => item.slideId === id);
      if (garment && garment.colors[index]) {
        const colorName = garment.colors[index].name;
        currentGarmentColor[garment.id] = colorName;
        const label = document.getElementById(garment.colorLabelId);
        if (label) label.innerText = colorName;
      }
    }

    function garmentCartName(id) {
      const garment = catalog.garments.find((item) => item.id === id);
      if (!garment) return '';
      const color = currentGarmentColor[id];
      const size = currentGarmentSize[id];
      const details = [color, size ? `Talla ${size}` : ''].filter(Boolean).join(', ');
      return details ? `${garment.name} (${details})` : garment.name;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const AUDIENCE_LABELS = {
      hombres: 'Hombre',
      mujeres: 'Mujer',
      ninos: 'Niño'
    };
    const AUDIENCE_TITLES = {
      hombres: 'Polos Hombres',
      mujeres: 'Polos Mujeres',
      ninos: 'Polos Niños'
    };

    function garmentKind(id) {
      const garment = catalog.garments.find((item) => item.id === id);
      if (garment && garment.group) return garment.group;
      return id;
    }

    function catalogFilters() {
      return Array.from(document.querySelectorAll('.catalog-filter'));
    }

    function selectedAudiences() {
      return catalogFilters().filter((input) => input.checked).map((input) => input.value);
    }

    function selectedSizes() {
      return Array.from(document.querySelectorAll('.catalog-size-filter'))
        .filter((input) => input.checked)
        .map((input) => input.value);
    }

    function preferredSize(sizes) {
      const picked = selectedSizes().find((size) => sizes.includes(size));
      return picked || sizes[0] || '';
    }

    function filterTitle(value) {
      const input = document.querySelector(`.catalog-filter[value="${value}"]`);
      if (input && input.dataset.title) return input.dataset.title;
      return AUDIENCE_TITLES[value] || '';
    }

    function filterBadge(value) {
      const input = document.querySelector(`.catalog-filter[value="${value}"]`);
      if (input && input.dataset.badge) return input.dataset.badge;
      return AUDIENCE_LABELS[value] || '';
    }

    function catalogQuery() {
      const input = document.getElementById('catalog-search');
      return input ? input.value.trim().toLowerCase() : '';
    }

    function garmentsForPage(grid) {
      const only = grid.dataset.garment || '';
      let garments = catalog.garments.filter((item) => !only || item.id === only || item.group === only);
      const audiences = selectedAudiences();
      if (audiences.length) {
        garments = garments.filter((item) => audiences.includes(item.audience));
      }
      const sizes = selectedSizes();
      if (sizes.length) {
        garments = garments.filter((item) => {
          const available = Array.isArray(item.sizes) ? item.sizes : [];
          return sizes.some((size) => available.includes(size));
        });
      }
      const query = catalogQuery();
      if (query) {
        garments = garments.filter((item) => {
          const audience = `${filterTitle(item.audience)} ${filterBadge(item.audience)}`;
          return `${item.name} ${item.description} ${audience}`.toLowerCase().includes(query);
        });
      }
      return garments;
    }

    function renderGarments() {
      const grid = document.getElementById('garment-grid');
      if (!grid) return;

      const garments = garmentsForPage(grid);
      const count = document.getElementById('catalog-result-count');
      const plural = grid.dataset.plural || 'artículos';
      const singular = grid.dataset.singular || 'artículo';
      if (count) {
        const total = garments.length;
        count.textContent = total === 1 ? `1 ${singular}` : `${total} ${plural}`;
      }

      if (!garments.length) {
        const emptyText = catalogFilters().length
          ? `No hay ${plural} con ese filtro.`
          : 'No hay artículos en esta sección.';
        grid.innerHTML = `<p class="col-span-full py-12 text-center text-gray-500">${emptyText}</p>`;
        return;
      }

      const filterOrder = catalogFilters().map((input) => input.value);
      const audiencesInView = filterOrder.filter((key) => garments.some((item) => item.audience === key));
      const grouped = audiencesInView.length > 1;
      const ordered = grouped
        ? audiencesInView.flatMap((key) => garments.filter((item) => item.audience === key))
        : garments;

      grid.innerHTML = ordered.map((garment) => {
        const heading = grouped && garment === garments.find((item) => item.audience === garment.audience)
          ? `<h2 class="col-span-full text-lg font-extrabold text-gray-900">${escapeHtml(filterTitle(garment.audience))}</h2>`
          : '';
        return heading + garmentCard(garment);
      }).join('');
    }

    function garmentCard(garment) {
        const price = Number(garment.price);
        const sizes = Array.isArray(garment.sizes) ? garment.sizes : [];
        currentGarmentColor[garment.id] = garment.colors[0] ? garment.colors[0].name : '';
        currentGarmentSize[garment.id] = preferredSize(sizes);

        const isMug = garment.group === 'mug' || garment.id === 'mug';
        const fit = isMug ? 'object-cover' : 'object-contain';
        const slides = garment.colors.map((color) => {
          const src = color.img || garment.img;
          return `<img src="${escapeHtml(src)}" class="min-w-full h-full ${fit}" alt="${escapeHtml(color.alt || color.name)}">`;
        }).join('');

        const swatches = garment.colors.map((color, index) => {
          return `<button onclick="selectColor('${garment.slideId}', ${index})" title="${escapeHtml(color.name)}" class="w-8 h-8 rounded-full ${color.swatch} focus:ring-2 focus:ring-brand-500"></button>`;
        }).join('');

        const sizeButtons = sizes.map((size) => {
          const selected = size === currentGarmentSize[garment.id];
          const classes = selected
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500';
          return `<button type="button" data-size-for="${garment.id}" data-size="${escapeHtml(size)}" onclick="selectSize('${garment.id}', '${escapeHtml(size)}')" aria-pressed="${selected}" class="min-w-9 h-9 px-2 rounded-lg border text-xs font-bold uppercase transition ${classes}">${escapeHtml(size)}</button>`;
        }).join('');

        const badge = filterBadge(garment.audience);
        const audienceLabel = badge
          ? `<span class="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">${escapeHtml(badge)}</span>`
          : '';

        const sizeBlock = sizes.length ? `
              <div class="mt-4">
                <label class="block text-xs font-bold uppercase text-gray-500 mb-2">Selecciona Talla:</label>
                <div class="flex flex-wrap gap-2">${sizeButtons}</div>
                <p class="text-xs text-gray-500 mt-2">Talla seleccionada: <span id="${garment.id}-size-name" class="font-bold text-gray-800">${escapeHtml(currentGarmentSize[garment.id])}</span></p>
              </div>` : '';

        return `
          <div class="bg-gradient-to-b from-white to-brand-50/30 rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 p-6 flex flex-col justify-between transition-shadow">
            <div>
              <div class="relative h-72 rounded-xl overflow-hidden mb-4 ${isMug ? 'bg-gray-100' : 'bg-white'} group">
                <div id="${garment.slideId}" class="flex transition-transform duration-500 h-full">
                  ${slides}
                </div>
                <button onclick="prevMiniSlide('${garment.slideId}')" class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full text-xs hover:bg-black"><i class="fa-solid fa-chevron-left"></i></button>
                <button onclick="nextMiniSlide('${garment.slideId}')" class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full text-xs hover:bg-black"><i class="fa-solid fa-chevron-right"></i></button>
              </div>
              <h3 class="font-bold text-xl text-gray-900">${escapeHtml(garment.name)}</h3>
              ${audienceLabel}
              <p class="text-gray-500 text-sm mt-1">${escapeHtml(garment.description)}</p>
              <p class="text-brand-600 font-extrabold text-2xl mt-2">S/ ${price.toFixed(2)}</p>

              <div class="mt-4">
                <label class="block text-xs font-bold uppercase text-gray-500 mb-2">${escapeHtml(garment.colorPrompt)}</label>
                <div class="flex flex-wrap gap-3">${swatches}</div>
                <p class="text-xs text-gray-500 mt-2">${escapeHtml(garment.selectedPrompt)} <span id="${garment.colorLabelId}" class="font-bold text-gray-800">${escapeHtml(currentGarmentColor[garment.id])}</span></p>
              </div>
              ${sizeBlock}

              <div class="mt-4">
                <label class="block text-xs font-bold uppercase text-gray-500 mb-2">Cantidad:</label>
                <div class="flex items-center gap-3">
                  <button type="button" onclick="adjustQty('${garment.id}', -1)" aria-label="Reducir cantidad" class="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg font-bold transition">−</button>
                  <input type="number" id="qty-${garment.id}" min="1" max="10" step="1" value="1" inputmode="numeric"
                    oninput="sanitizeQtyInput('${garment.id}')"
                    class="w-16 text-center rounded-lg border border-gray-300 py-1.5 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition">
                  <button type="button" onclick="adjustQty('${garment.id}', 1)" aria-label="Aumentar cantidad" class="w-9 h-9 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg font-bold transition">+</button>
                </div>
                <p id="qty-${garment.id}-error" class="text-xs text-red-600 mt-1.5 hidden"><i class="fa-solid fa-circle-exclamation mr-1"></i><span></span></p>
              </div>
            </div>
            <button onclick="handleAddToCart('${garment.id}', 'garment', '${garment.id}')" class="mt-6 w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
            </button>
            <button type="button" onclick="openDesignRequest('${garment.id}')" class="mt-3 w-full border-2 border-brand-600 text-brand-600 hover:bg-brand-50 font-bold py-3 px-3 rounded-xl transition flex items-center justify-center gap-2 text-center">
              <i class="fa-solid fa-pen-ruler"></i> Solicitar Diseño Personalizado
            </button>
          </div>
        `;
    }

    function selectColor(id, index) {
      updateSlideAndText(id, index);
    }

    function selectSize(id, size) {
      const garment = catalog.garments.find((item) => item.id === id);
      if (!garment || !(garment.sizes || []).includes(size)) return;
      currentGarmentSize[id] = size;
      const label = document.getElementById(`${id}-size-name`);
      if (label) label.innerText = size;
      document.querySelectorAll(`[data-size-for="${id}"]`).forEach((button) => {
        const active = button.dataset.size === size;
        button.setAttribute('aria-pressed', String(active));
        button.className = `min-w-9 h-9 px-2 rounded-lg border text-xs font-bold uppercase transition ${
          active
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500'
        }`;
      });
    }

    function nextMiniSlide(id) {
      const el = document.getElementById(id);
      if (!el) return;
      const totalSlides = el.children.length;
      if (!totalSlides) return;
      const nextIndex = ((miniSlidePos[id] || 0) + 1) % totalSlides;
      updateSlideAndText(id, nextIndex);
    }

    function prevMiniSlide(id) {
      const el = document.getElementById(id);
      if (!el) return;
      const totalSlides = el.children.length;
      if (!totalSlides) return;
      const prevIndex = ((miniSlidePos[id] || 0) - 1 + totalSlides) % totalSlides;
      updateSlideAndText(id, prevIndex);
    }

    function articleById(categoryId, articleId) {
      const category = catalog.categories.find((item) => item.id === categoryId);
      if (!category) return null;
      return category.products.find((item) => item.id === articleId) || null;
    }

    function articleCartName(categoryId, articleId) {
      const article = articleById(categoryId, articleId);
      return article ? article.name : '';
    }

    function articlePrice(categoryId, articleId) {
      const article = articleById(categoryId, articleId);
      return article ? Number(article.price) : 0;
    }

    function openCatalog(key) {
      const fresh = SublimadStore.loadCatalog();
      const data = fresh.categories.find((item) => item.id === key);
      if (!data) return;
      catalog = fresh;

      document.getElementById('catalog-title').innerText = data.title;

      const grid = document.getElementById('catalog-products');
      if (!data.products.length) {
        grid.innerHTML = '<p class="text-gray-500 text-center py-8 sm:col-span-2">No hay artículos en esta sección.</p>';
      } else {
      grid.innerHTML = data.products.map((p, idx) => {
        const qtyId = `${key}-${idx}`;
        const price = Number(p.price);
        return `
          <div class="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col">
            <div class="h-44 rounded-lg overflow-hidden mb-3 bg-gray-200">
              <img src="${escapeHtml(p.img)}" class="w-full h-full object-cover" alt="${escapeHtml(p.name)}">
            </div>
            <h4 class="font-bold text-gray-900 text-sm leading-snug">${escapeHtml(p.name)}</h4>
            <p class="text-brand-600 font-extrabold text-lg mt-1">S/ ${price.toFixed(2)}</p>

            <div class="mt-3">
              <label class="block text-xs font-bold uppercase text-gray-500 mb-1.5">Cantidad:</label>
              <div class="flex items-center gap-2">
                <button type="button" onclick="adjustQty('${qtyId}', -1)" aria-label="Reducir cantidad" class="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-base font-bold transition">−</button>
                <input type="number" id="qty-${qtyId}" min="1" max="10" step="1" value="1" inputmode="numeric"
                  oninput="sanitizeQtyInput('${qtyId}')"
                  class="w-14 text-center rounded-lg border border-gray-300 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition">
                <button type="button" onclick="adjustQty('${qtyId}', 1)" aria-label="Aumentar cantidad" class="w-8 h-8 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-base font-bold transition">+</button>
              </div>
              <p id="qty-${qtyId}-error" class="text-xs text-red-600 mt-1.5 hidden"><i class="fa-solid fa-circle-exclamation mr-1"></i><span></span></p>
            </div>

            <div class="mt-3 flex flex-col gap-2">
              <button onclick="handleAddToCart('${qtyId}', 'article', '${p.id}', '${key}')" class="w-full bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold py-2 rounded-lg transition flex items-center justify-center gap-2">
                <i class="fa-solid fa-cart-plus"></i> Agregar al carrito
              </button>
              <button onclick="quoteProduct(articleCartName('${key}', '${p.id}'), articlePrice('${key}', '${p.id}'))" class="w-full border border-brand-600 text-brand-600 hover:bg-brand-50 text-sm font-bold py-2 rounded-lg transition flex items-center justify-center gap-2">
                <i class="fa-brands fa-whatsapp"></i> Solicitar cotización
              </button>
            </div>
          </div>
        `;
      }).join('');
      }

      document.getElementById('catalog-modal').classList.remove('hidden');
      document.getElementById('catalog-modal').classList.add('flex');
    }

    function closeCatalog() {
      const modal = document.getElementById('catalog-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function quoteProduct(name, price) {
      const text = `Hola Sublimad, quisiera solicitar una cotización para: ${name} (Precio referencial S/ ${price.toFixed(2)}).`;
      window.open(`https://wa.me/51900000000?text=${encodeURIComponent(text)}`, '_blank');
    }

    const DESIGN_COLORS = [
      { name: 'Negro', hex: '#111827' },
      { name: 'Blanco', hex: '#f8fafc' },
      { name: 'Gris', hex: '#9ca3af' },
      { name: 'Azul', hex: '#1d4ed8' },
      { name: 'Celeste', hex: '#38bdf8' },
      { name: 'Verde', hex: '#047857' },
      { name: 'Rojo', hex: '#dc2626' },
      { name: 'Amarillo', hex: '#eab308' },
      { name: 'Naranja', hex: '#ea580c' },
      { name: 'Morado', hex: '#7c3aed' },
      { name: 'Rosado', hex: '#ec4899' }
    ];
    const CAP_DESIGN_COLORS = [
      { name: 'Blanco', hex: '#f8fafc' },
      { name: 'Negro', hex: '#111827' },
      { name: 'Azul', hex: '#1d4ed8' },
      { name: 'Celeste', hex: '#38bdf8' },
      { name: 'Verde', hex: '#16a34a' }
    ];
    const DESIGN_PREVIEW = {
      polo: 'Polo liso, sin diseño',
      gorra: 'Gorra lisa, sin diseño',
      mug: 'Taza lisa, sin diseño'
    };
    let designGarmentId = 'polo';
    let designColor = DESIGN_COLORS[0];
    let designSize = 'S';

    function designGarment() {
      return catalog.garments.find((item) => item.id === designGarmentId) || null;
    }

    function garmentDesignSizes() {
      const garment = designGarment();
      return garment && Array.isArray(garment.sizes) ? garment.sizes : [];
    }

    function showDesignShape(id) {
      ['polo', 'gorra', 'mug'].forEach((shapeId) => {
        const shape = document.getElementById(`design-shape-${shapeId}`);
        if (shape) shape.classList.toggle('hidden', shapeId !== id);
      });
      const poloPhoto = document.getElementById('design-shape-polo-photo');
      if (poloPhoto && id !== 'polo') poloPhoto.classList.add('hidden');
      const label = document.getElementById('design-preview-label');
      if (label) label.innerText = DESIGN_PREVIEW[id] || 'Producto liso, sin diseño';
    }

    function openDesignRequest(id) {
      designGarmentId = id;
      const garment = designGarment();
      if (!garment) return;
      const modal = document.getElementById('design-modal');
      document.getElementById('design-product-name').innerText = garment.name;
      document.getElementById('design-note').value = '';
      document.getElementById('design-file').value = '';
      document.getElementById('design-file-name').innerText = 'Ningún archivo seleccionado';
      document.getElementById('design-file-preview').classList.add('hidden');
      document.getElementById('design-error').classList.add('hidden');
      hideQtyError('design');
      showDesignShape(garmentKind(id));

      const cardQty = parseInt(document.getElementById(`qty-${id}`).value, 10);
      document.getElementById('qty-design').value = cardQty >= 1 && cardQty <= 10 ? cardQty : 1;

      const sizes = garmentDesignSizes();
      const sizeBlock = document.getElementById('design-size-block');
      const note = document.getElementById('design-whatsapp-note');
      if (sizes.length) {
        sizeBlock.classList.remove('hidden');
        designSize = sizes.includes(currentGarmentSize[id]) ? currentGarmentSize[id] : sizes[0];
        renderDesignSizes();
        note.innerText = 'Se abre WhatsApp con color, talla, cantidad y precio. Adjunta la foto del diseño en ese chat.';
      } else {
        sizeBlock.classList.add('hidden');
        designSize = '';
        note.innerText = 'Se abre WhatsApp con color, cantidad y precio. Adjunta la foto del diseño en ese chat.';
      }

      const palette = designPalette();
      const cardColor = palette.find((item) => item.name === currentGarmentColor[id]) || palette[0];
      const kind = garmentKind(id);
      document.getElementById('design-custom-color-row').classList.toggle('hidden', kind === 'mug' || kind === 'gorra');
      renderDesignPalette();
      selectDesignColor(cardColor.hex, cardColor.name);
      updateDesignTotal();

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeDesignRequest() {
      const modal = document.getElementById('design-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function designGarmentPhoto(name) {
      const garment = designGarment();
      const color = garment && Array.isArray(garment.colors)
        ? garment.colors.find((item) => item.name === name)
        : null;
      return color && color.img ? color.img : '';
    }

    function designPalette() {
      const kind = garmentKind(designGarmentId);
      const garment = designGarment();
      if (kind === 'mug') return [{ name: 'Blanco', hex: '#f8fafc' }];
      if (garment && Array.isArray(garment.colors) && garment.colors.length && garment.colors.every((color) => color.hex)) {
        return garment.colors.map((color) => ({ name: color.name, hex: color.hex }));
      }
      if (kind === 'gorra') return CAP_DESIGN_COLORS;
      return DESIGN_COLORS;
    }

    function renderDesignPalette() {
      const root = document.getElementById('design-palette');
      root.innerHTML = designPalette().map((color) => {
        const border = color.hex.toLowerCase() === '#f8fafc' ? 'border-gray-400' : 'border-gray-300';
        return `<button type="button" data-design-color="${color.hex}" data-design-name="${color.name}" onclick="selectDesignColor('${color.hex}', '${color.name}')" title="${color.name}" aria-label="${color.name}" class="h-8 w-8 rounded-full border-2 ${border}" style="background:${color.hex}"></button>`;
      }).join('');
    }

    function renderDesignSizes() {
      const root = document.getElementById('design-sizes');
      root.innerHTML = garmentDesignSizes().map((size) => {
        return `<button type="button" data-design-size="${size}" onclick="selectDesignSize('${size}')" class="min-w-9 h-9 px-2 rounded-lg border text-xs font-bold uppercase transition">${size}</button>`;
      }).join('');
      paintDesignSizes();
    }

    function paintDesignSizes() {
      document.querySelectorAll('[data-design-size]').forEach((button) => {
        const active = button.dataset.designSize === designSize;
        button.setAttribute('aria-pressed', String(active));
        button.className = `min-w-9 h-9 px-2 rounded-lg border text-xs font-bold uppercase transition ${
          active
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500'
        }`;
      });
      const label = document.getElementById('design-size-name');
      if (label) label.innerText = designSize;
    }

    function selectDesignSize(size) {
      if (!garmentDesignSizes().includes(size)) return;
      designSize = size;
      paintDesignSizes();
    }

    function selectDesignColor(hex, name) {
      designColor = { hex, name: name || hex.toUpperCase() };
      document.querySelectorAll('.design-fill').forEach((shape) => shape.setAttribute('fill', hex));
      const src = designGarmentPhoto(designColor.name);
      const capPhoto = document.getElementById('design-shape-gorra');
      if (capPhoto && garmentKind(designGarmentId) === 'gorra' && src) {
        capPhoto.src = src;
        capPhoto.alt = `Gorra ${designColor.name} sin diseño`;
      }
      const poloPhoto = document.getElementById('design-shape-polo-photo');
      const poloShape = document.getElementById('design-shape-polo');
      if (poloPhoto && poloShape && garmentKind(designGarmentId) === 'polo') {
        if (src) {
          poloPhoto.src = src;
          poloPhoto.alt = `Polo ${designColor.name} sin diseño`;
          poloPhoto.classList.remove('hidden');
          poloShape.classList.add('hidden');
        } else {
          poloPhoto.classList.add('hidden');
          poloShape.classList.remove('hidden');
        }
      }
      const label = document.getElementById('design-color-name');
      if (label) label.innerText = designColor.name;
      const picker = document.getElementById('design-custom-color');
      if (picker) picker.value = hex;
      document.querySelectorAll('[data-design-color]').forEach((button) => {
        const active = button.dataset.designColor.toLowerCase() === hex.toLowerCase() && button.dataset.designName === designColor.name;
        button.classList.toggle('ring-2', active);
        button.classList.toggle('ring-offset-2', active);
        button.classList.toggle('ring-brand-600', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    function selectCustomDesignColor(hex) {
      const known = designPalette().find((item) => item.hex.toLowerCase() === hex.toLowerCase());
      selectDesignColor(hex, known ? known.name : hex.toUpperCase());
    }

    function adjustDesignQty(delta) {
      adjustQty('design', delta);
      updateDesignTotal();
    }

    function updateDesignTotal() {
      const garment = designGarment();
      const qty = parseInt(document.getElementById('qty-design').value, 10);
      const unit = garment ? Number(garment.price) || 0 : 0;
      const safeQty = Number.isInteger(qty) && qty > 0 ? qty : 0;
      document.getElementById('design-unit-price').innerText = money(unit);
      document.getElementById('design-total').innerText = money(unit * safeQty);
    }

    function previewDesignFile(input) {
      const preview = document.getElementById('design-file-preview');
      const name = document.getElementById('design-file-name');
      const error = document.getElementById('design-error');
      const file = input.files && input.files[0];
      if (!file) {
        preview.classList.add('hidden');
        name.innerText = 'Ningún archivo seleccionado';
        return;
      }
      if (!file.type.startsWith('image/')) {
        input.value = '';
        preview.classList.add('hidden');
        name.innerText = 'Ningún archivo seleccionado';
        error.innerText = 'La foto del diseño debe ser una imagen.';
        error.classList.remove('hidden');
        return;
      }
      error.classList.add('hidden');
      name.innerText = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        preview.src = reader.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }

    function designRequestText(quantity, unit) {
      const garment = designGarment();
      const note = document.getElementById('design-note').value.trim();
      const lines = [
        'Hola Sublimad, quiero solicitar un diseño personalizado.',
        `Producto: ${garment ? garment.name : 'Producto'}`,
        `Color: ${designColor.name}`,
        ...(designSize ? [`Talla: ${designSize}`] : []),
        `Cantidad: ${quantity}`,
        `Precio unitario: ${money(unit)}`,
        `Precio total: ${money(unit * quantity)}`
      ];
      if (note) lines.push(`Descripción: ${note}`);
      return lines.join('\n');
    }

    function submitDesignRequest() {
      const input = document.getElementById('qty-design');
      const error = document.getElementById('design-error');
      const raw = input.value.toString().trim();
      let qty = parseInt(raw, 10);
      const file = document.getElementById('design-file').files[0];

      if (raw === '' || isNaN(qty) || qty <= 0) {
        showQtyError('design', 'Debe ingresar una cantidad mayor a 0');
        return;
      }
      if (qty > 10) {
        qty = 10;
        input.value = 10;
      }
      hideQtyError('design');
      updateDesignTotal();

      if (!file) {
        error.innerText = 'Adjunta la foto del diseño.';
        error.classList.remove('hidden');
        return;
      }
      if (!file.type.startsWith('image/')) {
        error.innerText = 'La foto del diseño debe ser una imagen.';
        error.classList.remove('hidden');
        return;
      }
      error.classList.add('hidden');

      const garment = designGarment();
      const unit = garment ? Number(garment.price) || 0 : 0;
      const message = `${designRequestText(qty, unit)}\nFoto del diseño: ${file.name}\nAdjunta esa foto en este chat.`;
      window.open(`https://wa.me/51900000000?text=${encodeURIComponent(message)}`, '_blank');
      closeDesignRequest();
    }

    // SELECTOR DE CANTIDAD: incrementar / decrementar (min 1, max 10)
    function adjustQty(prefix, delta) {
      const input = document.getElementById(`qty-${prefix}`);
      let val = parseInt(input.value, 10);
      if (isNaN(val)) val = 0;
      val += delta;
      if (val > 10) val = 10;
      if (val < 1) val = 1;
      input.value = val;
      hideQtyError(prefix);
    }

    // Sanitiza lo que el usuario escribe: solo enteros positivos, máximo 10
    function sanitizeQtyInput(prefix) {
      const input = document.getElementById(`qty-${prefix}`);
      let raw = input.value.replace(/[^0-9]/g, ''); // sin negativos ni decimales
      raw = raw.replace(/^0+(?=\d)/, ''); // sin ceros a la izquierda
      let val = raw === '' ? '' : parseInt(raw, 10);

      if (val !== '' && val > 10) {
        val = 10; // se limita automáticamente al máximo permitido
      }

      input.value = val;

      if (val === '' || val === 0) {
        showQtyError(prefix, 'Debe ingresar una cantidad mayor a 0');
      } else {
        hideQtyError(prefix);
      }
    }

    function showQtyError(prefix, message) {
      const input = document.getElementById(`qty-${prefix}`);
      const errorEl = document.getElementById(`qty-${prefix}-error`);
      input.classList.add('border-red-500', 'ring-2', 'ring-red-200');
      input.classList.remove('border-gray-300');
      errorEl.querySelector('span').innerText = message;
      errorEl.classList.remove('hidden');
    }

    function hideQtyError(prefix) {
      const input = document.getElementById(`qty-${prefix}`);
      const errorEl = document.getElementById(`qty-${prefix}-error`);
      input.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
      input.classList.add('border-gray-300');
      errorEl.classList.add('hidden');
    }

    const IGV_RATE = 0.18;

    function money(value) {
      return `S/ ${Number(value).toFixed(2)}`;
    }

    function lineGross(item) {
      const discount = Math.min(100, Math.max(0, Number(item.discount) || 0));
      const unit = Number(item.unitPrice) * (1 - discount / 100);
      return unit * Number(item.quantity);
    }

    function orderTotals() {
      const gross = cart.reduce((sum, item) => sum + lineGross(item), 0);
      const base = gross / (1 + IGV_RATE);
      return { base, igv: gross - base, total: gross };
    }

    function buildGarmentLine(id, quantity) {
      const garment = catalog.garments.find((item) => item.id === id);
      if (!garment) return null;
      const colorName = currentGarmentColor[id];
      const size = currentGarmentSize[id] || '';
      const color = (garment.colors || []).find((item) => item.name === colorName) || garment.colors[0] || {};
      const details = [colorName, size ? `Talla ${size}` : ''].filter(Boolean).join(', ');
      return {
        key: `garment:${id}:${colorName || ''}:${size}`,
        name: details ? `${garment.name} (${details})` : garment.name,
        description: color.description || garment.description || '',
        quantity,
        unitPrice: Number(color.salePrice ?? garment.price) || 0,
        discount: Number(color.discount) || 0
      };
    }

    function buildArticleLine(categoryId, articleId, quantity) {
      const article = articleById(categoryId, articleId);
      if (!article) return null;
      return {
        key: `article:${categoryId}:${articleId}`,
        name: article.name,
        description: article.description || '',
        quantity,
        unitPrice: Number(article.salePrice ?? article.price) || 0,
        discount: Number(article.discount) || 0
      };
    }

    function handleAddToCart(prefix, kind, sourceId, categoryId) {
      const input = document.getElementById(`qty-${prefix}`);
      const raw = input.value.toString().trim();
      let qty = parseInt(raw, 10);

      if (raw === '' || isNaN(qty) || qty <= 0) {
        showQtyError(prefix, 'Debe ingresar una cantidad mayor a 0');
        return;
      }

      if (qty > 10) {
        qty = 10;
        input.value = 10;
      }

      hideQtyError(prefix);
      const line = kind === 'garment'
        ? buildGarmentLine(sourceId, qty)
        : buildArticleLine(categoryId, sourceId, qty);
      if (!line) return;
      addToCart(line);
      showToast('Producto agregado al carrito');
    }

    function addToCart(line) {
      const existing = cart.find((item) => item.key === line.key);
      if (existing) existing.quantity += line.quantity;
      else cart.push(line);
      updateCartUI();
    }

    function removeFromCart(index) {
      cart.splice(index, 1);
      updateCartUI();
      if (document.getElementById('order-modal').classList.contains('flex')) renderOrder();
    }

    function changeOrderQty(index, delta) {
      const item = cart[index];
      if (!item) return;
      item.quantity += delta;
      if (item.quantity < 1) cart.splice(index, 1);
      updateCartUI();
      renderOrder();
    }

    function updateCartUI() {
      localStorage.setItem('sublimad-cart', JSON.stringify(cart));
      const cartCount = document.getElementById('cart-count');
      const cartItems = document.getElementById('cart-items');
      const cartTotal = document.getElementById('cart-total');
      const units = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

      cartCount.innerText = units;

      if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-gray-500 text-center py-8">El carrito está vacío.</p>';
        cartTotal.innerText = 'S/ 0.00';
        return;
      }

      cartItems.innerHTML = cart.map((item, index) => `
          <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
            <div>
              <p class="font-bold text-sm text-gray-900">${escapeHtml(item.name)}</p>
              <p class="text-xs text-gray-500">${item.quantity} x ${money(item.unitPrice)}</p>
              <p class="text-xs text-brand-600 font-semibold">${money(lineGross(item))}</p>
            </div>
            <button onclick="removeFromCart(${index})" class="text-red-500 text-sm hover:text-red-700">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `).join('');

      cartTotal.innerText = money(orderTotals().total);
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

    function closeOrderModal() {
      closeModal('order-modal');
    }

    function renderOrder() {
      const root = document.getElementById('order-lines');
      if (!cart.length) {
        root.innerHTML = '<p class="py-8 text-center text-sm text-gray-500">No hay productos en el pedido.</p>';
        document.getElementById('order-base').innerText = money(0);
        document.getElementById('order-igv').innerText = money(0);
        document.getElementById('order-total').innerText = money(0);
        return;
      }

      root.innerHTML = cart.map((item, index) => `
        <article class="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-bold text-gray-900">${escapeHtml(item.name)}</h3>
              <p class="mt-1 text-xs text-gray-500">${escapeHtml(item.description || 'Sin descripción')}</p>
            </div>
            <button type="button" onclick="removeFromCart(${index})" class="shrink-0 text-xs font-bold text-red-600 hover:text-red-500">Quitar</button>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
            <p><span class="block font-bold uppercase text-gray-400">Precio</span>${money(item.unitPrice)}</p>
            <p><span class="block font-bold uppercase text-gray-400">Descuento</span>${Number(item.discount) || 0}%</p>
            <p><span class="block font-bold uppercase text-gray-400">Importe</span>${money(lineGross(item))}</p>
            <div>
              <span class="block font-bold uppercase text-gray-400">Cantidad</span>
              <div class="mt-1 flex items-center gap-2">
                <button type="button" onclick="changeOrderQty(${index}, -1)" class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 font-bold" aria-label="Reducir">−</button>
                <span class="w-6 text-center font-bold text-gray-900">${item.quantity}</span>
                <button type="button" onclick="changeOrderQty(${index}, 1)" class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-300 font-bold" aria-label="Aumentar">+</button>
              </div>
            </div>
          </div>
        </article>
      `).join('');

      const totals = orderTotals();
      document.getElementById('order-base').innerText = money(totals.base);
      document.getElementById('order-igv').innerText = money(totals.igv);
      document.getElementById('order-total').innerText = money(totals.total);
    }

    function openOrderModal() {
      if (!cart.length) {
        showToast('Tu carrito está vacío');
        return;
      }
      renderOrder();
      openModal('order-modal');
    }

    function openPaymentModal() {
      if (!cart.length) {
        showToast('Tu carrito está vacío');
        return;
      }
      document.getElementById('payment-amount').innerText = `Total a pagar: ${money(orderTotals().total)}`;
      document.getElementById('payment-error').classList.add('hidden');
      openModal('payment-modal');
    }

    function cardDigits(value) {
      return String(value).replace(/\D/g, '');
    }

    function luhnOk(number) {
      let sum = 0;
      let alt = false;
      for (let i = number.length - 1; i >= 0; i -= 1) {
        let digit = Number(number[i]);
        if (alt) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        alt = !alt;
      }
      return sum % 10 === 0;
    }

    function readPayment() {
      const name = document.getElementById('card-name').value.trim();
      const number = cardDigits(document.getElementById('card-number').value);
      const expiry = document.getElementById('card-expiry').value.trim();
      const cvv = cardDigits(document.getElementById('card-cvv').value);
      const email = document.getElementById('card-email').value.trim();
      const expiryMatch = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

      if (name.length < 3) return { error: 'Ingresa el nombre del titular.' };
      if (number.length < 13 || number.length > 19 || !luhnOk(number)) return { error: 'El número de tarjeta no es válido.' };
      if (!expiryMatch) return { error: 'El vencimiento debe tener el formato MM/AA.' };
      const expMonth = Number(expiryMatch[1]);
      const expYear = 2000 + Number(expiryMatch[2]);
      const now = new Date();
      const expired = expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1);
      if (expired) return { error: 'La tarjeta está vencida.' };
      if (cvv.length < 3 || cvv.length > 4) return { error: 'El CVV debe tener 3 o 4 dígitos.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Ingresa un correo válido.' };
      return { email };
    }

    // TOAST DE CONFIRMACIÓN
    let toastTimeout;
    function showToast(message) {
      const toast = document.getElementById('toast');
      const msgEl = document.getElementById('toast-message');
      msgEl.innerText = message;
      toast.classList.remove('opacity-0', 'pointer-events-none');
      toast.classList.add('opacity-100');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
      }, 2500);
    }

    // BANNER HERO: carrusel automático de productos y servicios (cambia cada 5s)
    const heroCarousel = document.getElementById('hero-carousel');
    const heroDotsContainer = document.getElementById('hero-carousel-dots');
    let heroDots = [];
    let heroSlideIndex = 0;

    let totalHeroSlides = 0;

    function showHeroSlide(index) {
      if (!heroCarousel || totalHeroSlides === 0) return;
      heroSlideIndex = ((index % totalHeroSlides) + totalHeroSlides) % totalHeroSlides;
      heroCarousel.style.transform = `translateX(-${heroSlideIndex * 100}%)`;
      heroDots.forEach((dot, i) => {
        dot.classList.toggle('bg-white', i === heroSlideIndex);
        dot.classList.toggle('bg-white/40', i !== heroSlideIndex);
      });
    }

    function nextHeroSlide() {
      showHeroSlide(heroSlideIndex + 1);
    }

    function prevHeroSlide() {
      showHeroSlide(heroSlideIndex - 1);
    }

    function bannerOffer(banner) {
      const discount = Number(banner.discount) || 0;
      if (discount <= 0) return '';
      const percent = Number.isInteger(discount) ? String(discount) : String(discount);
      return `<p class="banner-offer mt-1.5 text-sm sm:text-base font-extrabold leading-snug">Aprovecha el <span class="banner-offer-badge">${escapeHtml(percent)}%</span> en ${escapeHtml(banner.name)}</p>`;
    }

    function renderHeroBanners() {
      const banners = catalog.banners || [];
      if (!heroCarousel || !banners.length) return;
      heroCarousel.innerHTML = banners.map((banner) => `
        <div class="relative min-w-full h-full">
          <img src="${escapeHtml(banner.img)}" class="w-full h-full object-cover" alt="${escapeHtml(banner.name)}">
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pt-12 pb-4">
            <p class="font-bold text-white text-sm sm:text-base">${escapeHtml(banner.name)}</p>
            ${banner.description ? `<p class="mt-0.5 text-xs sm:text-sm leading-snug text-white/90">${escapeHtml(banner.description)}</p>` : ''}
            ${bannerOffer(banner)}
          </div>
        </div>
      `).join('');
    }

    if (heroCarousel && heroDotsContainer) {
      renderHeroBanners();
      totalHeroSlides = heroCarousel.children.length;
      heroDotsContainer.innerHTML = Array.from({ length: totalHeroSlides })
        .map((_, i) => `<span class="hero-dot w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'} transition cursor-pointer" onclick="showHeroSlide(${i})"></span>`)
        .join('');
      heroDots = Array.from(document.querySelectorAll('.hero-dot'));

      setInterval(() => {
        nextHeroSlide();
      }, 30000);
    }

    document.querySelectorAll('.catalog-filter, .catalog-size-filter').forEach((input) => {
      input.addEventListener('change', renderGarments);
    });
    const catalogSearch = document.getElementById('catalog-search');
    if (catalogSearch) catalogSearch.addEventListener('input', renderGarments);

    renderGarments();
    updateCartUI();

    const cartBtn = document.getElementById('cart-btn');
    const closeCart = document.getElementById('close-cart');
    const cartDrawer = document.getElementById('cart-drawer');
    const checkoutBtn = document.getElementById('checkout-btn');

    cartBtn.addEventListener('click', () => cartDrawer.classList.remove('hidden'));
    closeCart.addEventListener('click', () => cartDrawer.classList.add('hidden'));

    // Botón "Procesar Pedido por WhatsApp": arma el detalle del carrito y abre WhatsApp
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Tu carrito está vacío');
        return;
      }

      const lines = cart
        .map((item, index) => `${index + 1}. ${item.name} x${item.quantity} - ${money(lineGross(item))}`)
        .join('\n');

      const message =
        `Hola Sublimad, quiero hacer el siguiente pedido:\n\n` +
        `${lines}\n\n` +
        `Total: ${money(orderTotals().total)}`;

      window.open(`https://wa.me/51900000000?text=${encodeURIComponent(message)}`, '_blank');
    });

    document.getElementById('checkout-online-btn').addEventListener('click', openOrderModal);
    document.getElementById('pay-btn').addEventListener('click', openPaymentModal);
    document.getElementById('payment-close').addEventListener('click', () => closeModal('payment-modal'));
    document.getElementById('payment-success-close').addEventListener('click', () => closeModal('payment-success'));

    document.getElementById('card-number').addEventListener('input', (event) => {
      const digits = cardDigits(event.target.value).slice(0, 16);
      event.target.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    });

    document.getElementById('card-expiry').addEventListener('input', (event) => {
      const digits = cardDigits(event.target.value).slice(0, 4);
      event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    });

    document.getElementById('payment-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const errorEl = document.getElementById('payment-error');
      const payment = readPayment();
      if (payment.error) {
        errorEl.textContent = payment.error;
        errorEl.classList.remove('hidden');
        return;
      }

      const total = money(orderTotals().total);
      document.getElementById('payment-form').reset();
      errorEl.classList.add('hidden');
      cart = [];
      updateCartUI();
      closeModal('payment-modal');
      closeOrderModal();
      document.getElementById('cart-drawer').classList.add('hidden');
      document.getElementById('payment-success-text').textContent =
        `El pedido por ${total} quedó registrado. El comprobante se enviaría a ${payment.email}. Los datos de la tarjeta no se guardaron.`;
      openModal('payment-success');
    });

    // Botón menú móvil
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    menuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('hidden') === false;
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });

    const mobileCatalogBtn = document.getElementById('mobile-catalog-btn');
    const mobileCatalogMenu = document.getElementById('mobile-catalog-menu');
    if (mobileCatalogBtn && mobileCatalogMenu) {
      mobileCatalogBtn.addEventListener('click', () => {
        const isOpen = mobileCatalogMenu.classList.toggle('hidden') === false;
        mobileCatalogBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    document.querySelectorAll('[data-catalog-trigger]').forEach((trigger) => {
      const menu = trigger.closest('.catalog-menu');
      if (!menu) return;
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !menu.classList.contains('is-open');
        document.querySelectorAll('.catalog-menu.is-open').forEach((openMenu) => {
          openMenu.classList.remove('is-open');
          const openTrigger = openMenu.querySelector('[data-catalog-trigger]');
          if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
        });
        menu.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', String(willOpen));
      });
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.catalog-menu.is-open').forEach((menu) => {
        menu.classList.remove('is-open');
        const trigger = menu.querySelector('[data-catalog-trigger]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    });

    // FORMULARIO DE CONTACTO -> envía el mensaje pre-armado por WhatsApp
    const contactForm = document.getElementById('contact-form');
    const contactFormNote = document.getElementById('contact-form-note');

    if (contactForm) contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('contact-name').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value;
      const message = document.getElementById('contact-message').value.trim();

      let text = `Hola Sublimad, soy ${name}.%0A`;
      text += `Motivo: ${subject}%0A`;
      if (email) text += `Correo: ${email}%0A`;
      text += `Teléfono: ${phone}%0A`;
      text += `Mensaje: ${message}`;

      const whatsappUrl = `https://wa.me/51900000000?text=${text}`;

      contactFormNote.classList.remove('hidden');
      window.open(whatsappUrl, '_blank');

      contactForm.reset();
    });
