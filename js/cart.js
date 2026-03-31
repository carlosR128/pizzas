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

    const normalizeCartItems = items => items.map(item => {
        const qty = Math.max(1, Number(item.qty || 1));
        const unitPrice = Number(item.unitPrice || item.total || item.price || 0);
        return {
            id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: item.name || 'Producto',
            size: item.size || '',
            crust: item.crust || '',
            halfMode: item.halfMode || 'complete',
            halfAndHalf: Boolean(item.halfAndHalf),
            secondHalf: item.secondHalf || '',
            qty: qty,
            unitPrice: unitPrice,
            total: unitPrice * qty
        };
    });

    let cartItems = normalizeCartItems(safeParse(window.localStorage.getItem(STORAGE_KEY)));
    let cartRefs = null;
    let toastRef = null;

    const formatPrice = value => `$${Number(value || 0).toFixed(0)}`;

    /* Envuelve .item-price y .btn-add en un .item-footer por tarjeta.
       Esto coloca el precio a la izquierda y el botÃ³n a la derecha
       sin necesidad de cambiar el HTML de cada pÃ¡gina. */
    const wrapCardFooters = () => {
        document.querySelectorAll('.item-info:not([data-footer-wrapped])').forEach(info => {
            const price = info.querySelector(':scope > .item-price');
            const btn   = info.querySelector(':scope > .btn-add');
            if (!price || !btn) {
                return;
            }
            const footer = document.createElement('div');
            footer.className = 'item-footer';
            info.appendChild(footer);
            footer.appendChild(price);
            footer.appendChild(btn);
            info.setAttribute('data-footer-wrapped', '1');
        });
    };

    const showToast = message => {
        if (!toastRef) {
            return;
        }

        toastRef.textContent = message;
        toastRef.classList.add('show');

        window.clearTimeout(showToast.timeoutId);
        showToast.timeoutId = window.setTimeout(() => {
            toastRef.classList.remove('show');
        }, 2200);
    };

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

    const getItemUnitPrice = item => Number(item.unitPrice || item.total || item.price || 0);
    const getItemLineTotal = item => getItemUnitPrice(item) * Number(item.qty || 1);
    const getTotal = () => cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);

    const updateCartTriggers = () => {
        const triggers = Array.from(document.querySelectorAll('.nav-carrito'));
        const count = cartItems.reduce((sum, item) => sum + Number(item.qty || 1), 0);

        triggers.forEach(trigger => {
            trigger.setAttribute('data-cart-count', String(count));
            trigger.setAttribute('aria-label', `Abrir carrito (${count} productos)`);
            trigger.classList.toggle('has-items', count > 0);
        });
    };

    const parsePrice = text => {
        if (!text) {
            return 0;
        }

        const normalized = String(text).replace(/,/g, '.');
        const match = normalized.match(/\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : 0;
    };

    const shouldSkipAutoAdd = addButton => {
        if (!addButton) {
            return true;
        }

        // Alitas usa modal propio con configuracion antes de agregar.
        if (addButton.hasAttribute('data-item-id')) {
            return true;
        }

        // Pizzas usa modal propio con tamano/orilla/mitad y mitad.
        const hasPizzaModal = Boolean(document.getElementById('pizza-config-form'));
        const hasPizzaTabs = Boolean(document.querySelector('.pizza-tabs'));
        if (hasPizzaModal && hasPizzaTabs) {
            return true;
        }

        return false;
    };

    const buildDetailFromCard = addButton => {
        const card = addButton.closest('.menu-item');
        if (!card) {
            return null;
        }

        const titleEl = card.querySelector('.item-info h3');
        const priceEl = card.querySelector('.item-price');
        const selectEls = Array.from(card.querySelectorAll('.item-select'));

        const selectedOptionText = selectEls
            .map(selectEl => {
                if (!selectEl || !selectEl.options || selectEl.selectedIndex < 0) {
                    return '';
                }
                const label = card.querySelector(`label[for="${selectEl.id}"]`);
                const optionText = selectEl.options[selectEl.selectedIndex].textContent.trim();
                return label ? `${label.textContent.trim()}: ${optionText}` : optionText;
            })
            .filter(Boolean)
            .join(' | ');

        return {
            name: titleEl ? titleEl.textContent.trim() : 'Producto',
            size: selectedOptionText,
            crust: '',
            halfMode: 'complete',
            halfAndHalf: false,
            secondHalf: '',
            total: parsePrice(priceEl ? priceEl.textContent : '')
        };
    };

    const buildWhatsAppMessage = () => {
        const lines = ['Hola, quiero hacer este pedido:'];

        cartItems.forEach((item, index) => {
            lines.push(`${index + 1}. ${item.name}`);

            buildItemMeta(item).forEach(meta => {
                lines.push(`   - ${meta}`);
            });

            lines.push(`   - Cantidad: ${Number(item.qty || 1)}`);
            lines.push(`   - Precio unitario: ${formatPrice(getItemUnitPrice(item))}`);
            lines.push(`   - Subtotal: ${formatPrice(getItemLineTotal(item))}`);
        });

        lines.push(`Total: ${formatPrice(getTotal())}`);
        return lines.join('\n');
    };

    const syncCartHighlights = () => {
        const cartNames = new Set(cartItems.map(item => item.name.trim().toLowerCase()));
        document.querySelectorAll('.menu-item').forEach(card => {
            const heading = card.querySelector('h3');
            if (!heading) { return; }
            const name = heading.textContent.trim().toLowerCase();
            card.classList.toggle('in-cart', cartNames.has(name));
        });
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
            syncCartHighlights();
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
                        <div class="cart-qty-controls" aria-label="Controles de cantidad">
                            <button type="button" class="cart-qty-btn" data-cart-dec="${item.id}" aria-label="Disminuir cantidad">-</button>
                            <span class="cart-qty-value">${Number(item.qty || 1)}</span>
                            <button type="button" class="cart-qty-btn" data-cart-inc="${item.id}" aria-label="Aumentar cantidad">+</button>
                        </div>
                        <strong>${formatPrice(getItemLineTotal(item))}</strong>
                        <button type="button" class="cart-remove-btn" data-remove-cart-item="${item.id}">Quitar</button>
                    </div>
                </article>
            `;
        }).join('');

        cartRefs.total.textContent = formatPrice(getTotal());
        cartRefs.send.disabled = false;
        cartRefs.clear.disabled = false;
        syncCartHighlights();
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
        const unitPrice = Number(detail.total || detail.price || 0);
        const item = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
            name: detail.name || 'Producto',
            size: detail.size || '',
            crust: detail.crust || '',
            halfMode: detail.halfMode || 'complete',
            halfAndHalf: Boolean(detail.halfAndHalf),
            secondHalf: detail.secondHalf || '',
            qty: 1,
            unitPrice: unitPrice,
            total: unitPrice
        };

        const existing = cartItems.find(current => (
            current.name === item.name
            && current.size === item.size
            && current.crust === item.crust
            && current.halfMode === item.halfMode
            && current.halfAndHalf === item.halfAndHalf
            && current.secondHalf === item.secondHalf
            && getItemUnitPrice(current) === unitPrice
        ));

        if (existing) {
            existing.qty = Number(existing.qty || 1) + 1;
            existing.unitPrice = getItemUnitPrice(existing);
            existing.total = getItemLineTotal(existing);
        } else {
            cartItems.push(item);
        }

        saveCart();
        renderCart();
        openCart();
        showToast(`${item.name} agregado al carrito`);
    };

    const removeItem = id => {
        cartItems = cartItems.filter(item => item.id !== id);
        saveCart();
        renderCart();
    };

    const changeItemQty = (id, delta) => {
        const item = cartItems.find(current => current.id === id);
        if (!item) {
            return;
        }

        const nextQty = Number(item.qty || 1) + Number(delta || 0);

        if (nextQty <= 0) {
            removeItem(id);
            return;
        }

        item.qty = nextQty;
        item.total = getItemLineTotal(item);
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
            <div class="cart-toast" id="cart-toast"></div>
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

        const fragment = document.createDocumentFragment();
        while (markup.firstElementChild) {
            fragment.appendChild(markup.firstElementChild);
        }
        document.body.appendChild(fragment);

        toastRef = document.getElementById('cart-toast');

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
            const incBtn = event.target.closest('[data-cart-inc]');
            if (incBtn) {
                changeItemQty(incBtn.getAttribute('data-cart-inc'), 1);
                return;
            }

            const decBtn = event.target.closest('[data-cart-dec]');
            if (decBtn) {
                changeItemQty(decBtn.getAttribute('data-cart-dec'), -1);
                return;
            }

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

    document.addEventListener('click', event => {
        const addButton = event.target.closest('.menu-item .btn-add');
        if (!addButton || shouldSkipAutoAdd(addButton)) {
            return;
        }

        event.preventDefault();

        const detail = buildDetailFromCard(addButton);
        if (!detail) {
            return;
        }

        addItem(detail);
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

    if (!toastRef) {
        toastRef = document.getElementById('cart-toast');
    }


    // Aplica el footer de tarjetas al cargar y tras cada navegacion SPA
    wrapCardFooters();
    document.addEventListener('menu:sectionchange', () => {
        wrapCardFooters();
        syncCartHighlights();
    });
    renderCart();
})();
