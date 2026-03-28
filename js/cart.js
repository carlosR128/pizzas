(() => {
    const STORAGE_KEY = 'abcg-cart-items';
    const WHATSAPP_NUMBER = '5212231286667';

    const safeParse = value => {
        try {
            const parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    };

    let cartItems = safeParse(window.localStorage.getItem(STORAGE_KEY));
    let cartRefs = null;

    const formatPrice = value => `$${Number(value || 0).toFixed(0)}`;

    const saveCart = () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    };

    const buildItemMeta = item => {
        const lines = [];

        if (item.size) {
            lines.push(`Tamano: ${item.size}`);
        }

        if (item.crust) {
            lines.push(`Orilla: ${item.crust}`);
        }

        if (item.halfAndHalf) {
            lines.push(`Mitad y mitad: ${item.secondHalf ? item.secondHalf : 'Si'}`);
        }

        return lines;
    };

    const getTotal = () => cartItems.reduce((sum, item) => sum + Number(item.total || item.price || 0), 0);

    const updateCartTriggers = () => {
        const triggers = Array.from(document.querySelectorAll('.nav-carrito'));
        const count = cartItems.length;

        triggers.forEach(trigger => {
            trigger.setAttribute('data-cart-count', String(count));
            trigger.setAttribute('aria-label', `Abrir carrito (${count} productos)`);
            trigger.classList.toggle('has-items', count > 0);
        });
    };

    const buildWhatsAppMessage = () => {
        const lines = ['Hola, quiero hacer este pedido:'];

        cartItems.forEach((item, index) => {
            lines.push(`${index + 1}. ${item.name}`);

            buildItemMeta(item).forEach(meta => {
                lines.push(`   - ${meta}`);
            });

            lines.push(`   - Precio: ${formatPrice(item.total || item.price || 0)}`);
        });

        lines.push(`Total: ${formatPrice(getTotal())}`);
        return lines.join('\n');
    };

    const renderCart = () => {
        if (!cartRefs) {
            return;
        }

        updateCartTriggers();

        if (!cartItems.length) {
            cartRefs.items.innerHTML = '<p class="cart-empty">Tu carrito esta vacio.</p>';
            cartRefs.total.textContent = formatPrice(0);
            cartRefs.send.disabled = true;
            cartRefs.clear.disabled = true;
            return;
        }

        cartRefs.items.innerHTML = cartItems.map(item => {
            const meta = buildItemMeta(item)
                .map(line => `<li>${line}</li>`)
                .join('');

            return `
                <article class="cart-item" data-cart-id="${item.id}">
                    <div class="cart-item-copy">
                        <h3>${item.name}</h3>
                        <ul>${meta}</ul>
                    </div>
                    <div class="cart-item-side">
                        <strong>${formatPrice(item.total || item.price || 0)}</strong>
                        <button type="button" class="cart-remove-btn" data-remove-cart-item="${item.id}">Quitar</button>
                    </div>
                </article>
            `;
        }).join('');

        cartRefs.total.textContent = formatPrice(getTotal());
        cartRefs.send.disabled = false;
        cartRefs.clear.disabled = false;
    };

    const openCart = () => {
        if (!cartRefs) {
            return;
        }

        cartRefs.overlay.classList.remove('hidden');
        cartRefs.panel.classList.add('open');
        document.body.classList.add('modal-open');
    };

    const closeCart = () => {
        if (!cartRefs) {
            return;
        }

        cartRefs.overlay.classList.add('hidden');
        cartRefs.panel.classList.remove('open');
        document.body.classList.remove('modal-open');
    };

    const addItem = detail => {
        const item = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: detail.name || 'Producto',
            size: detail.size || '',
            crust: detail.crust || '',
            halfMode: detail.halfMode || 'complete',
            halfAndHalf: Boolean(detail.halfAndHalf),
            secondHalf: detail.secondHalf || '',
            total: Number(detail.total || detail.price || 0)
        };

        cartItems.push(item);
        saveCart();
        renderCart();
        openCart();
    };

    const removeItem = id => {
        cartItems = cartItems.filter(item => item.id !== id);
        saveCart();
        renderCart();
    };

    const clearCart = () => {
        cartItems = [];
        saveCart();
        renderCart();
    };

    const sendToWhatsApp = () => {
        if (!cartItems.length) {
            return;
        }

        const text = encodeURIComponent(buildWhatsAppMessage());
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener');
    };

    const ensureCartUI = () => {
        if (document.getElementById('cart-overlay')) {
            cartRefs = {
                overlay: document.getElementById('cart-overlay'),
                panel: document.getElementById('cart-panel'),
                items: document.getElementById('cart-items'),
                total: document.getElementById('cart-total-value'),
                send: document.getElementById('cart-send-whatsapp'),
                clear: document.getElementById('cart-clear')
            };
            return;
        }

        const markup = document.createElement('div');
        markup.innerHTML = `
            <div class="modal-overlay hidden cart-overlay" id="cart-overlay">
                <aside class="cart-panel" id="cart-panel" aria-labelledby="cart-title" aria-modal="true" role="dialog">
                    <div class="cart-header">
                        <div>
                            <p class="modal-tag">Tu pedido</p>
                            <h2 id="cart-title">Carrito</h2>
                        </div>
                        <button type="button" class="modal-close" id="cart-close" aria-label="Cerrar carrito">&times;</button>
                    </div>
                    <div class="cart-items" id="cart-items"></div>
                    <div class="cart-footer">
                        <div class="cart-total-row">
                            <span>Total</span>
                            <strong id="cart-total-value">$0</strong>
                        </div>
                        <div class="cart-actions-row">
                            <button type="button" class="btn-add btn-secondary" id="cart-clear">Vaciar</button>
                            <button type="button" class="btn-add" id="cart-send-whatsapp">Enviar pedido por WhatsApp</button>
                        </div>
                    </div>
                </aside>
            </div>
        `;

        document.body.appendChild(markup.firstElementChild);

        cartRefs = {
            overlay: document.getElementById('cart-overlay'),
            panel: document.getElementById('cart-panel'),
            items: document.getElementById('cart-items'),
            total: document.getElementById('cart-total-value'),
            send: document.getElementById('cart-send-whatsapp'),
            clear: document.getElementById('cart-clear')
        };

        const closeBtn = document.getElementById('cart-close');

        closeBtn.addEventListener('click', closeCart);
        cartRefs.overlay.addEventListener('click', event => {
            if (event.target === cartRefs.overlay) {
                closeCart();
            }
        });
        cartRefs.items.addEventListener('click', event => {
            const removeBtn = event.target.closest('[data-remove-cart-item]');
            if (!removeBtn) {
                return;
            }
            removeItem(removeBtn.getAttribute('data-remove-cart-item'));
        });
        cartRefs.clear.addEventListener('click', clearCart);
        cartRefs.send.addEventListener('click', sendToWhatsApp);
    };

    document.addEventListener('click', event => {
        const cartTrigger = event.target.closest('.nav-carrito');
        if (!cartTrigger) {
            return;
        }

        event.preventDefault();
        openCart();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeCart();
        }
    });

    document.addEventListener('cart:add', event => {
        if (!event.detail) {
            return;
        }

        addItem(event.detail);
    });

    ensureCartUI();
    renderCart();
})();
