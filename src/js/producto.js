import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://tksyyueiqhvwzvvxswsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrc3l5dWVpcWh2d3p2dnhzd3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTk2NjcsImV4cCI6MjA5NjA5NTY2N30.ZyCKeRs0Ak0xybHP0x2zTVtGyM4qP8WSWNspdp027es';
const supabase = createClient(supabaseUrl, supabaseKey);

window.catalogoGrivenza = [];

let currentImg = 0;
let galleryImages = [];

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) { mostrarError(); return; }

    try {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('valor', { ascending: true });
        if (error) throw error;

        window.catalogoGrivenza = data || [];
        const prod = data.find(p => p.referencia === ref);
        if (!prod) { mostrarError(); return; }

        renderizarProducto(prod, data);
    } catch (err) {
        console.error('Error Supabase:', err);
        mostrarError();
    }
});

// ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────
function renderizarProducto(prod, todos) {
    // SEO dinámico
    document.title = `${prod.nombre_comercial_web} — Grivenza`;
    document.getElementById('page-title').textContent = `${prod.nombre_comercial_web} — Grivenza`;
    document.getElementById('page-description').setAttribute('content',
        `Compra ${prod.nombre_comercial_web} (${prod.referencia}). Acabado ${prod.acabado}. ${fmt(prod.valor)}. Grifería premium Grivenza.`
    );

    // Breadcrumb
    document.getElementById('breadcrumb-cat').textContent = prod.categoria;
    document.getElementById('breadcrumb-name').textContent = prod.nombre_comercial_web;

    // Imágenes galería: usa la imagen real + placeholders de ángulos distintos
    galleryImages = buildGallery(prod);

    // Galería principal
    const heroImg = document.getElementById('gallery-hero');
    heroImg.src = galleryImages[0];
    heroImg.alt = prod.nombre_comercial_web;
    document.getElementById('gal-ref-badge').textContent = prod.referencia;

    renderThumbs(galleryImages, prod.nombre_comercial_web);
    bindGallery(galleryImages, prod.nombre_comercial_web);

    // Detalles
    document.getElementById('prod-cat-tag').textContent = prod.categoria;
    document.getElementById('prod-name').textContent = prod.nombre_comercial_web;
    document.getElementById('prod-ref-text').textContent = `Ref. ${prod.referencia}`;
    document.getElementById('prod-price').textContent = fmt(prod.valor);

    // Stock badge
    const stockEl = document.getElementById('prod-stock-info');
    if (prod.stock <= 0) {
        stockEl.innerHTML = `<span class="stock-badge out">Sin stock</span>`;
    } else if (prod.stock <= 10) {
        stockEl.innerHTML = `<span class="stock-badge low"><i class="fa-solid fa-circle-exclamation"></i> ¡Solo ${prod.stock} disponibles!</span>`;
    } else {
        stockEl.innerHTML = `<span class="stock-badge ok"><i class="fa-solid fa-circle-check"></i> ${prod.stock} en stock</span>`;
    }

    // Specs
    const ACABADO_COLOR = {
        'Cromo': '#94a3b8', 'Gun Metal': '#475569', 'Satinado': '#c9a84c',
        'Negro': '#1e293b', 'Cromo/Negro': '#475569', 'Cromo/Rojo': '#dc2626', 'Cromo/Verde': '#16a34a',
    };
    const acColor = ACABADO_COLOR[prod.acabado] || '#64748b';

    document.getElementById('specs-grid').innerHTML = `
        <div class="spec-item"><span class="spec-label">Referencia</span><strong>${prod.referencia}</strong></div>
        <div class="spec-item"><span class="spec-label">Acabado</span>
            <strong><span class="dot-aca" style="background:${acColor}"></span>${prod.acabado}</strong>
        </div>
        <div class="spec-item"><span class="spec-label">Categoría</span><strong>${prod.categoria}</strong></div>
        <div class="spec-item"><span class="spec-label">Precio unitario</span><strong>${fmt(prod.valor)}</strong></div>
        <div class="spec-item"><span class="spec-label">Material</span><strong>Latón / Aleación</strong></div>
        <div class="spec-item"><span class="spec-label">Garantía</span><strong>1 año</strong></div>
    `;

    // Descripción
    document.getElementById('prod-desc').innerHTML = `
        <p>Grifería de alta calidad con acabado en <strong>${prod.acabado}</strong>, 
        diseñada para ofrecer durabilidad, estética y rendimiento superior. 
        Ideal para proyectos residenciales, hotelería, o construcción de alto nivel. 
        Compatible con sistemas de agua fría y caliente estándar de Colombia.</p>
        <ul class="prod-desc-list">
            <li><i class="fa-solid fa-circle-check"></i> Fabricación en latón de alta resistencia</li>
            <li><i class="fa-solid fa-circle-check"></i> Acabado ${prod.acabado} anticorrosivo</li>
            <li><i class="fa-solid fa-circle-check"></i> Instalación estándar, compatible con tuberías ½"</li>
            <li><i class="fa-solid fa-circle-check"></i> Certificada para uso residencial e institucional</li>
        </ul>
    `;

    // Cantidad
    const qtyInput = document.getElementById('qty-input');
    qtyInput.max = prod.stock;
    document.getElementById('qty-minus').addEventListener('click', () => {
        if (+qtyInput.value > 1) qtyInput.value = +qtyInput.value - 1;
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
        if (+qtyInput.value < prod.stock) qtyInput.value = +qtyInput.value + 1;
    });

    // Botón agregar al carrito
    const btnAdd = document.getElementById('btn-add-cart');
    if (prod.stock <= 0) {
        btnAdd.disabled = true;
        btnAdd.textContent = 'Sin stock disponible';
        btnAdd.classList.add('disabled');
    } else {
        btnAdd.addEventListener('click', () => {
            window.agregarAlCarrito?.(prod.referencia, +qtyInput.value);
            mostrarBurbuja(prod);
        });
    }

    // WhatsApp share
    const wa = document.getElementById('share-whatsapp');
    wa.href = `https://wa.me/573001234567?text=Hola! Me interesa el producto ${prod.nombre_comercial_web} (${prod.referencia}) - ${fmt(prod.valor)}. ${window.location.href}`;

    // Lightbox
    document.getElementById('gal-zoom-btn').addEventListener('click', () => abrirLightbox(galleryImages[currentImg]));
    const lb = document.getElementById('lightbox');
    document.getElementById('lightbox-close').addEventListener('click', () => lb.classList.remove('active'));
    lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('active'); });

    // Productos relacionados
    const relacionados = todos
        .filter(p => p.categoria === prod.categoria && p.referencia !== prod.referencia)
        .slice(0, 4);
    renderRelacionados(relacionados);

    // Mostrar todo
    document.getElementById('producto-loading').style.display = 'none';
    document.getElementById('producto-main').style.display = 'block';
}

// ── GALERÍA ───────────────────────────────────────────────────────────────────
function buildGallery(prod) {
    // En producción tendrías URLs reales distintas. Por ahora usamos la imagen principal
    // y añadimos variaciones visuales con el mismo URL para simular múltiples ángulos
    const base = prod.imagen;
    return [base, base, base]; // Reemplazar con URLs reales si existen
}

function renderThumbs(imgs, alt) {
    const row = document.getElementById('prod-thumbs');
    row.innerHTML = imgs.map((src, i) => `
        <div class="prod-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}">
            <img src="${src}" alt="${alt} vista ${i + 1}" loading="lazy">
            ${i === 0 ? '' : `<span class="thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></span>`}
        </div>
    `).join('');

    row.querySelectorAll('.prod-thumb').forEach(t => {
        t.addEventListener('click', () => setImg(+t.dataset.idx));
    });
}

function bindGallery(imgs, alt) {
    document.getElementById('gal-prev').addEventListener('click', () => setImg(currentImg - 1));
    document.getElementById('gal-next').addEventListener('click', () => setImg(currentImg + 1));

    const hero = document.getElementById('gallery-hero');
    let tx = 0;
    hero.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', e => {
        const d = tx - e.changedTouches[0].clientX;
        if (Math.abs(d) > 40) setImg(currentImg + (d > 0 ? 1 : -1));
    }, { passive: true });
}

function setImg(idx) {
    currentImg = (idx + galleryImages.length) % galleryImages.length;
    const hero = document.getElementById('gallery-hero');
    hero.style.opacity = '0';
    hero.style.transform = 'scale(0.97)';
    setTimeout(() => {
        hero.src = galleryImages[currentImg];
        hero.style.opacity = '1';
        hero.style.transform = 'scale(1)';
    }, 180);
    document.querySelectorAll('.prod-thumb').forEach((t, i) =>
        t.classList.toggle('active', i === currentImg)
    );
}

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
function abrirLightbox(src) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = src;
    lb.classList.add('active');
}

// ── BURBUJA POST-CARRITO ──────────────────────────────────────────────────────
function mostrarBurbuja(prod) {
    document.getElementById('post-cart-bubble')?.remove();
    const bbl = document.createElement('div');
    bbl.id = 'post-cart-bubble';
    bbl.className = 'post-cart-bubble';
    bbl.innerHTML = `
        <div class="bubble-inner">
            <div class="bubble-icon"><i class="fa-solid fa-circle-check"></i></div>
            <p class="bubble-title">¡Agregado al carrito!</p>
            <p class="bubble-sub">¿Deseas continuar comprando?</p>
            <div class="bubble-btns">
                <a class="bubble-btn-sec" href="../index.html#catalogo"><i class="fa-solid fa-arrow-left"></i> Ver Catálogo</a>
                <button class="bubble-btn-pri" id="bbl-cart"><i class="fa-solid fa-bag-shopping"></i> Ir al Carrito</button>
            </div>
        </div>`;
    document.body.appendChild(bbl);
    requestAnimationFrame(() => bbl.classList.add('visible'));

    document.getElementById('bbl-cart').addEventListener('click', () => {
        bbl.remove();
        document.getElementById('cart-overlay')?.classList.add('active');
        document.getElementById('cart-sidebar')?.classList.add('active');
        window.renderizarCarrito?.();
    });

    setTimeout(() => bbl.classList.contains('visible') && bbl.remove(), 9000);
}

// ── RELACIONADOS ──────────────────────────────────────────────────────────────
function renderRelacionados(arr) {
    const grid = document.getElementById('related-grid');
    if (!arr.length) {
        grid.closest('.related-section').style.display = 'none';
        return;
    }
    const ACABADO_COLOR = {
        'Cromo': '#94a3b8', 'Gun Metal': '#475569', 'Satinado': '#c9a84c',
        'Negro': '#1e293b', 'Cromo/Negro': '#475569', 'Cromo/Rojo': '#dc2626', 'Cromo/Verde': '#16a34a',
    };
    grid.innerHTML = arr.map(p => `
        <a class="rel-card" href="producto.html?ref=${encodeURIComponent(p.referencia)}">
            <div class="rel-card-img">
                <img src="${p.imagen}" alt="${p.nombre_comercial_web}" loading="lazy">
            </div>
            <div class="rel-card-body">
                <span class="rel-card-cat">${p.categoria}</span>
                <h3>${p.nombre_comercial_web}</h3>
                <div class="rel-card-acabado">
                    <span class="dot-aca" style="background:${ACABADO_COLOR[p.acabado] || '#64748b'}"></span>
                    <span>${p.acabado}</span>
                </div>
                <strong class="rel-card-price">${fmt(p.valor)}</strong>
            </div>
        </a>
    `).join('');
}

// ── ERROR ──────────────────────────────────────────────────────────────────────
function mostrarError() {
    document.getElementById('producto-loading').style.display = 'none';
    document.getElementById('producto-error').style.display = 'flex';
}

// ── UTILS ──────────────────────────────────────────────────────────────────────
function fmt(val) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}

// ── COPIAR URL ──────────────────────────────────────────────────────────────────
window.copiarURL = function() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = document.querySelector('.share-btn[onclick]');
        if (!btn) return;
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
    });
};
