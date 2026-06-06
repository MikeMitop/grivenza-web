import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://tksyyueiqhvwzvvxswsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrc3l5dWVpcWh2d3p2dnhzd3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTk2NjcsImV4cCI6MjA5NjA5NTY2N30.ZyCKeRs0Ak0xybHP0x2zTVtGyM4qP8WSWNspdp027es';
const supabase = createClient(supabaseUrl, supabaseKey);

window.catalogoGrivenza = [];
let categoriaActiva = 'Todos';
let currentImgIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await cargarProductos();
    configurarModal();
    configurarCatCards();
    configurarNavegacion();
});

// ── CARGA DESDE SUPABASE ─────────────────────────────────────────────────────
async function cargarProductos() {
    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('valor', { ascending: true });
        if (error) throw error;
        window.catalogoGrivenza = data || [];
        renderizarTabs();
        filtrarCatalogo('Todos');
    } catch (err) {
        console.error('Error Supabase:', err);
        const grid = document.getElementById('product-grid');
        if (grid) grid.innerHTML = `<p class="grid-empty-msg" style="color:#ef4444;">Error al cargar productos. Revisa la consola.</p>`;
    }
}

// ── TABS DE CATEGORÍA ────────────────────────────────────────────────────────
function renderizarTabs() {
    const section = document.getElementById('catalogo');
    if (!section) return;
    document.querySelector('.catalog-tabs')?.remove();

    const cats = ['Todos', ...new Set(window.catalogoGrivenza.map(p => p.categoria))];
    const tabsEl = document.createElement('div');
    tabsEl.className = 'catalog-tabs';

    cats.forEach(cat => {
        const count = cat === 'Todos'
            ? window.catalogoGrivenza.length
            : window.catalogoGrivenza.filter(p => p.categoria === cat).length;
        const btn = document.createElement('button');
        btn.className = 'catalog-tab' + (cat === 'Todos' ? ' active' : '');
        btn.dataset.cat = cat;
        btn.innerHTML = `${cat} <span class="tab-count">${count}</span>`;
        btn.addEventListener('click', () => filtrarCatalogo(cat));
        tabsEl.appendChild(btn);
    });

    section.querySelector('.section-title')?.after(tabsEl);
}

// ── FILTRAR ──────────────────────────────────────────────────────────────────
window.filtrarCatalogo = function filtrarCatalogo(categoria) {
    categoriaActiva = categoria;
    document.querySelectorAll('.catalog-tab').forEach(b =>
        b.classList.toggle('active', b.dataset.cat === categoria));

    const lista = categoria === 'Todos'
        ? [...window.catalogoGrivenza]
        : window.catalogoGrivenza.filter(p => p.categoria === categoria);

    lista.sort((a, b) => a.valor - b.valor);
    renderizarTarjetas(lista);

    const titulo = document.querySelector('#catalogo .section-title');
    if (titulo) titulo.textContent = categoria === 'Todos' ? 'Nuestro Catálogo Premium' : `Catálogo: ${categoria}`;
};

// ── TARJETAS ─────────────────────────────────────────────────────────────────
const ACABADO_COLOR = {
    'Cromo': '#94a3b8', 'Gun Metal': '#475569', 'Satinado': '#c9a84c',
    'Negro': '#1e293b', 'Cromo/Negro': '#475569', 'Cromo/Rojo': '#dc2626', 'Cromo/Verde': '#16a34a',
};

function renderizarTarjetas(arr) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!arr.length) {
        grid.innerHTML = '<p class="grid-empty-msg">No hay productos en esta categoría.</p>';
        return;
    }

    arr.forEach((prod, i) => {
        const precio = fmt(prod.valor);
        const stockBadge = prod.stock <= 10 ? `<span class="card-stock-low">¡Solo ${prod.stock} disponibles!</span>` : '';
        const acColor = ACABADO_COLOR[prod.acabado] || '#64748b';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${i * 70}ms`;
        const prodUrl = `../productos/producto.html?ref=${encodeURIComponent(prod.referencia)}`;
        card.innerHTML = `
            <div class="product-card-img-wrap">
                <img src="${prod.imagen}" alt="${prod.nombre_comercial_web}" loading="lazy">
                <div class="card-overlay">
                    <a class="card-overlay-btn" href="${prodUrl}"><i class="fa-solid fa-eye"></i> Ver Detalle</a>
                </div>
                <span class="card-ref">${prod.referencia}</span>
            </div>
            <div class="product-card-body">
                <span class="product-category-tag">${prod.categoria}</span>
                <h3 class="product-card-title">${prod.nombre_comercial_web}</h3>
                <div class="card-acabado">
                    <span class="acabado-dot" style="background:${acColor}"></span>
                    <span>${prod.acabado}</span>
                </div>
                ${stockBadge}
                <div class="card-footer-row">
                    <span class="product-card-price">${precio}</span>
                    <a class="card-add-btn" href="${prodUrl}" title="Ver producto"><i class="fa-solid fa-arrow-right"></i></a>
                </div>
            </div>
            <div class="card-shimmer"></div>`;

        card.addEventListener('click', (e) => {
            // Solo navegar si el click no fue en un enlace interno
            if (!e.target.closest('a')) {
                window.location.href = `../productos/producto.html?ref=${encodeURIComponent(prod.referencia)}`;
            }
        });
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = ((e.clientX - r.left) / r.width) * 100;
            const y = ((e.clientY - r.top) / r.height) * 100;
            card.querySelector('.card-shimmer').style.background =
                `radial-gradient(circle at ${x}% ${y}%, rgba(79,140,255,0.13) 0%, transparent 60%)`;
        });
        card.addEventListener('mouseleave', () => {
            card.querySelector('.card-shimmer').style.background = 'transparent';
        });
        grid.appendChild(card);
    });
}

// ── MODAL ────────────────────────────────────────────────────────────────────
window.abrirModal = function abrirModal(ref) {
    const prod = window.catalogoGrivenza.find(p => p.referencia === ref);
    if (!prod) return;

    const modal = document.getElementById('product-modal');
    const container = document.getElementById('modal-details-container');
    const precio = fmt(prod.valor);
    currentImgIndex = 0;

    // Simulate 3 gallery views of same image
    const gallery = [prod.imagen, prod.imagen, prod.imagen];

    container.innerHTML = `
        <button class="modal-back-btn" id="modal-back-btn">
            <i class="fa-solid fa-arrow-left"></i>
            Volver a ${categoriaActiva === 'Todos' ? 'Catálogo' : categoriaActiva}
        </button>
        <div class="modal-grid">
            <div class="modal-gallery">
                <div class="modal-main-img" id="modal-main-img-wrap">
                    <img id="modal-hero-img" src="${prod.imagen}" alt="${prod.nombre_comercial_web}">
                    <button class="gallery-arr gallery-prev" id="gal-prev"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="gallery-arr gallery-next" id="gal-next"><i class="fa-solid fa-chevron-right"></i></button>
                    <span class="gal-counter" id="gal-counter">1 / ${gallery.length}</span>
                </div>
                <div class="modal-thumbs" id="modal-thumbs">
                    ${gallery.map((s, idx) => `<div class="modal-thumb ${idx === 0 ? 'active' : ''}" data-idx="${idx}"><img src="${s}" alt="Vista ${idx + 1}"></div>`).join('')}
                </div>
            </div>
            <div class="modal-details">
                <span class="product-category-tag">${prod.categoria}</span>
                <h2 class="modal-prod-name">${prod.nombre_comercial_web}</h2>
                <div class="modal-price-tag">${precio}</div>

                <div class="modal-specs">
                    <div class="spec-row"><span>Referencia</span><strong>${prod.referencia}</strong></div>
                    <div class="spec-row"><span>Acabado</span><strong>${prod.acabado}</strong></div>
                    <div class="spec-row"><span>Categoría</span><strong>${prod.categoria}</strong></div>
                    <div class="spec-row"><span>Disponibles</span><strong class="${prod.stock <= 10 ? 'spec-warn' : ''}">${prod.stock} un.</strong></div>
                </div>

                <p class="modal-desc">Grifería de alta calidad con acabado en <strong>${prod.acabado}</strong>. Diseñada para ofrecer durabilidad, estética y un rendimiento superior en el hogar o en proyectos de construcción e interiorismo.</p>

                <div class="modal-qty-row">
                    <label>Cantidad</label>
                    <div class="qty-wrap">
                        <button class="qty-btn" id="qty-minus"><i class="fa-solid fa-minus"></i></button>
                        <input type="number" id="cantidad-input" value="1" min="1" max="${prod.stock}" readonly>
                        <button class="qty-btn" id="qty-plus"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <span class="qty-hint">Máx. ${prod.stock}</span>
                </div>

                <button class="modal-btn-add" id="modal-btn-add">
                    <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
                </button>
            </div>
        </div>`;

    // Gallery logic
    const heroImg = document.getElementById('modal-hero-img');
    const counter = document.getElementById('gal-counter');
    const thumbEls = document.querySelectorAll('.modal-thumb');

    function setImg(idx) {
        currentImgIndex = (idx + gallery.length) % gallery.length;
        heroImg.style.opacity = '0';
        setTimeout(() => { heroImg.src = gallery[currentImgIndex]; heroImg.style.opacity = '1'; }, 180);
        counter.textContent = `${currentImgIndex + 1} / ${gallery.length}`;
        thumbEls.forEach((t, i) => t.classList.toggle('active', i === currentImgIndex));
    }

    document.getElementById('gal-prev').addEventListener('click', () => setImg(currentImgIndex - 1));
    document.getElementById('gal-next').addEventListener('click', () => setImg(currentImgIndex + 1));
    thumbEls.forEach(t => t.addEventListener('click', () => setImg(+t.dataset.idx)));

    // Touch swipe
    let tx = 0;
    heroImg.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    heroImg.addEventListener('touchend', e => {
        const d = tx - e.changedTouches[0].clientX;
        if (Math.abs(d) > 40) setImg(currentImgIndex + (d > 0 ? 1 : -1));
    }, { passive: true });

    // Quantity controls
    const qtyIn = document.getElementById('cantidad-input');
    document.getElementById('qty-minus').addEventListener('click', () => {
        if (+qtyIn.value > 1) qtyIn.value = +qtyIn.value - 1;
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
        if (+qtyIn.value < prod.stock) qtyIn.value = +qtyIn.value + 1;
    });

    // Add to cart
    document.getElementById('modal-btn-add').addEventListener('click', () => {
        window.agregarAlCarrito?.(prod.referencia, +qtyIn.value);
        mostrarBurbuja();
    });

    // Back button
    document.getElementById('modal-back-btn').addEventListener('click', () => {
        cerrarModal();
        setTimeout(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// ── BURBUJA POST-CARRITO ─────────────────────────────────────────────────────
function mostrarBurbuja() {
    document.getElementById('post-cart-bubble')?.remove();
    const bbl = document.createElement('div');
    bbl.id = 'post-cart-bubble';
    bbl.className = 'post-cart-bubble';
    bbl.innerHTML = `
        <div class="bubble-inner">
            <div class="bubble-icon"><i class="fa-solid fa-circle-check"></i></div>
            <p class="bubble-title">¡Agregado al carrito!</p>
            <p class="bubble-sub">¿Deseas comprar algo más?</p>
            <div class="bubble-btns">
                <button class="bubble-btn-sec" id="bbl-catalog"><i class="fa-solid fa-arrow-left"></i> Volver al Catálogo</button>
                <button class="bubble-btn-pri" id="bbl-cart"><i class="fa-solid fa-bag-shopping"></i> Ir al Carrito</button>
            </div>
        </div>`;
    document.body.appendChild(bbl);
    requestAnimationFrame(() => bbl.classList.add('visible'));

    document.getElementById('bbl-catalog').addEventListener('click', () => {
        cerrarModal(); bbl.remove();
        setTimeout(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }), 300);
    });
    document.getElementById('bbl-cart').addEventListener('click', () => {
        bbl.remove(); cerrarModal();
        document.getElementById('cart-overlay')?.classList.add('active');
        document.getElementById('cart-sidebar')?.classList.add('active');
        window.renderizarCarrito?.();
    });

    setTimeout(() => bbl.classList.contains('visible') && bbl.remove(), 9000);
}

// ── CERRAR MODAL ─────────────────────────────────────────────────────────────
window.cerrarModal = function() {
    document.getElementById('product-modal')?.classList.remove('active');
    document.getElementById('post-cart-bubble')?.remove();
    document.body.style.overflow = '';
};

function configurarModal() {
    document.getElementById('btn-close-modal')?.addEventListener('click', window.cerrarModal);
    document.getElementById('product-modal')?.addEventListener('click', e => {
        if (e.target.id === 'product-modal') window.cerrarModal();
    });
}

// ── NAVEGACIÓN NAV / MÓVIL ───────────────────────────────────────────────────
function configurarNavegacion() {
    const mapText = txt => {
        if (txt.includes('Lavaplatos') || txt.includes('Monocontrol') || txt.includes('Extensible')) return 'Griferia Lavaplatos';
        if (txt.includes('Lavamanos')) return 'Griferia Lavamanos';
        return null;
    };
    document.querySelectorAll('.dropdown-content a, .submenu-content a, .mobile-nav-sub a').forEach(a => {
        a.addEventListener('click', e => {
            const cat = mapText(e.currentTarget.textContent.trim());
            if (cat) { e.preventDefault(); filtrarCatalogo(cat); setTimeout(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }), 300); }
        });
    });
}

// ── CAT-CARDS ────────────────────────────────────────────────────────────────
function configurarCatCards() {
    const map = { 'Cocina': 'Griferia Lavaplatos', 'Baño': 'Griferia Lavamanos' };
    document.querySelectorAll('.cat-card').forEach(card => {
        const txt = card.querySelector('span')?.textContent?.trim();
        card.addEventListener('click', e => {
            e.preventDefault();
            filtrarCatalogo(map[txt] || 'Todos');
            document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ── UTILS ────────────────────────────────────────────────────────────────────
function fmt(val) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}