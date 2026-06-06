// ── ESTADO ───────────────────────────────────────────────────────────────────
let carrito = JSON.parse(localStorage.getItem('grivenza_carrito')) || [];

// ── PERSISTENCIA ─────────────────────────────────────────────────────────────
function guardarCarrito() {
    localStorage.setItem('grivenza_carrito', JSON.stringify(carrito));
    actualizarContadorUI();
    // Si el sidebar está abierto, actualizarlo en vivo
    if (document.getElementById('cart-sidebar')?.classList.contains('active')) {
        window.renderizarCarrito();
    }
}

// ── AGREGAR ──────────────────────────────────────────────────────────────────
window.agregarAlCarrito = function(referencia, cantidadDeseada = 1) {
    const producto = (window.catalogoGrivenza || []).find(p => p.referencia === referencia);
    if (!producto) { console.error('Producto no encontrado:', referencia); return; }

    const item = carrito.find(i => i.referencia === referencia);
    if (item) {
        if (item.cantidad + cantidadDeseada <= producto.stock) {
            item.cantidad += cantidadDeseada;
        } else {
            alert(`Solo hay ${producto.stock} unidades disponibles de este producto.`);
            return;
        }
    } else {
        carrito.push({ referencia, cantidad: cantidadDeseada });
    }
    guardarCarrito();
};

// ── QUITAR ────────────────────────────────────────────────────────────────────
window.quitarDelCarrito = function(referencia) {
    carrito = carrito.filter(i => i.referencia !== referencia);
    guardarCarrito();
    window.renderizarCarrito();
};

// ── RENDER SIDEBAR ────────────────────────────────────────────────────────────
window.renderizarCarrito = function() {
    const container = document.getElementById('cart-items-container');
    const totalEl   = document.getElementById('cart-total-price');
    if (!container) return;

    const productos = window.catalogoGrivenza || [];
    container.innerHTML = '';

    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-bag-shopping"></i>
                <p>Tu carrito está vacío</p>
                <small>Agrega productos desde el catálogo</small>
            </div>`;
        if (totalEl) totalEl.textContent = '$0';
        return;
    }

    let total = 0;
    carrito.forEach(item => {
        const prod = productos.find(p => p.referencia === item.referencia);
        if (!prod) return;
        const sub = prod.valor * item.cantidad;
        total += sub;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <img src="${prod.imagen}" alt="${prod.nombre_comercial_web}">
            <div class="cart-item-info">
                <h4>${prod.nombre_comercial_web}</h4>
                <p style="font-size:.78rem;color:#64748b;margin-bottom:4px">${prod.referencia} · ${prod.acabado}</p>
                <p>${fmtCOP(prod.valor)} × ${item.cantidad} = <strong>${fmtCOP(sub)}</strong></p>
                <button class="cart-item-remove" onclick="window.quitarDelCarrito('${item.referencia}')">
                    <i class="fa-solid fa-trash-can"></i> Eliminar
                </button>
            </div>`;
        container.appendChild(el);
    });

    if (totalEl) totalEl.textContent = fmtCOP(total);
};

// ── CONTADOR ──────────────────────────────────────────────────────────────────
function actualizarContadorUI() {
    const el = document.getElementById('cart-count');
    if (el) el.textContent = carrito.reduce((s, i) => s + i.cantidad, 0);
}

// ── SIDEBAR OPEN/CLOSE ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorUI();

    const overlay  = document.getElementById('cart-overlay');
    const sidebar  = document.getElementById('cart-sidebar');
    const btnOpen  = document.getElementById('btn-open-cart');
    const btnClose = document.getElementById('close-cart-btn');

    function abrirCarrito() {
        sidebar?.classList.add('active');
        overlay?.classList.add('active');
        window.renderizarCarrito();
    }
    function cerrarCarrito() {
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    }

    btnOpen?.addEventListener('click', abrirCarrito);
    btnClose?.addEventListener('click', cerrarCarrito);
    overlay?.addEventListener('click', cerrarCarrito);
});

// ── UTILS ──────────────────────────────────────────────────────────────────────
function fmtCOP(val) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}