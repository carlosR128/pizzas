(() => {
    const classicSizePrices = {
        individual: 99,
        mediana: 149,
        familiar: 199,
        extra: 249,
        jumbo: 299
    };

    const specialSizePrices = {
        individual: 155,
        mediana: 199,
        familiar: 229,
        extra: 315,
        jumbo: 335
    };

    const crustPrices = {
        normal: 0,
        salchicha: 35,
        queso: 45
    };

    const halfAndHalfPrice = 20;

    let currentPizza = null;

    const formatPrice = value => `$${value}`;
    const getCurrentSizePrices = () => currentPizza && currentPizza.sizePrices ? currentPizza.sizePrices : classicSizePrices;

    const getPizzaItems = () => Array.from(document.querySelectorAll('.menu-item .item-info h3'));

    const getModalRefs = () => {
        const overlay = document.getElementById('pizza-modal-overlay');
        if (!overlay) {
            return null;
        }

        return {
            overlay: overlay,
            closeBtn: document.getElementById('pizza-modal-close'),
            cancelBtn: document.getElementById('pizza-modal-cancel'),
            form: document.getElementById('pizza-config-form'),
            title: document.getElementById('pizza-modal-title'),
            description: document.getElementById('pizza-modal-description'),
            sizeWrap: document.getElementById('pizza-size-options'),
            crustWrap: document.getElementById('pizza-crust-options'),
            halfModeWrap: document.getElementById('pizza-half-mode-options'),
            halfWrap: document.getElementById('pizza-half-selector-wrap'),
            halfLabel: document.getElementById('pizza-half-selector-label'),
            halfSelect: document.getElementById('pizza-half-selector'),
            summary: document.getElementById('pizza-price-summary')
        };
    };

    const buildOptionCards = (container, groupName, optionsMap, checkedKey) => {
        if (!container) {
            return;
        }

        container.innerHTML = Object.entries(optionsMap).map(([key, price]) => {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const checked = key === checkedKey ? 'checked' : '';
            return `
                <label class="pizza-choice">
                    <input type="radio" name="${groupName}" value="${key}" ${checked}>
                    <span class="pizza-choice-label">
                        <strong>${label}</strong>
                        <span>${price > 0 ? '+' + formatPrice(price) : 'Sin costo extra'}</span>
                    </span>
                </label>
            `;
        }).join('');
    };

    const buildHalfSelector = refs => {
        if (!refs || !refs.halfSelect || !currentPizza) {
            return;
        }

        const options = getPizzaItems()
            .map(item => item.textContent.trim())
            .filter(name => name && name !== currentPizza.name);

        refs.halfSelect.innerHTML = options.map(name => `<option value="${name}">${name}</option>`).join('');
    };

    const getSelectedValue = (form, name) => {
        const selected = form ? form.querySelector(`input[name="${name}"]:checked`) : null;
        return selected ? selected.value : '';
    };

    const updateHalfUI = refs => {
        if (!refs || !refs.halfWrap || !refs.form) {
            return;
        }

        const selectedHalfMode = getSelectedValue(refs.form, 'pizza-half-mode') || 'complete';
        const isComplete = selectedHalfMode === 'complete';

        refs.halfWrap.classList.toggle('hidden', isComplete);

        if (refs.halfLabel) {
            const labelMap = {
                half: 'Elige la segunda mitad',
                complete: 'Elige la segunda mitad'
            };

            refs.halfLabel.textContent = labelMap[selectedHalfMode] || labelMap.complete;
        }
    };

    const updateSummary = refs => {
        if (!refs || !refs.form || !refs.summary || !currentPizza) {
            return;
        }

        const selectedSize = getSelectedValue(refs.form, 'pizza-size') || 'individual';
        const selectedCrust = getSelectedValue(refs.form, 'pizza-crust') || 'normal';
        const selectedHalfMode = getSelectedValue(refs.form, 'pizza-half-mode') || 'complete';
        const isHalf = selectedHalfMode === 'half';

        const sizePrices = getCurrentSizePrices();
        const basePrice = sizePrices[selectedSize] || 0;
        const crustExtra = crustPrices[selectedCrust] || 0;
        const halfExtra = isHalf ? halfAndHalfPrice : 0;
        const total = basePrice + crustExtra + halfExtra;

        const halfLabelMap = {
            half: 'Mitad y mitad',
            complete: 'Pizza completa'
        };

        const secondHalfText = isHalf && refs.halfSelect && refs.halfSelect.value
            ? `<br>2da mitad: ${refs.halfSelect.value}`
            : '';

        refs.summary.innerHTML = `
            <strong>${currentPizza.name}</strong><br>
            Tamaño: ${selectedSize} (${formatPrice(basePrice)})<br>
            Orilla: ${selectedCrust}${crustExtra ? ` (+${formatPrice(crustExtra)})` : ''}<br>
            Modo: ${halfLabelMap[selectedHalfMode] || halfLabelMap.complete}${isHalf ? ` (+${formatPrice(halfAndHalfPrice)})` : ''}${secondHalfText}<br>
            <strong>Total: ${formatPrice(total)}</strong>
        `;
    };

    const openPizzaModal = pizzaData => {
        const refs = getModalRefs();
        if (!refs || !refs.form) {
            return;
        }

        currentPizza = pizzaData;
        refs.title.textContent = pizzaData.name;
        refs.description.textContent = pizzaData.description;

        buildOptionCards(refs.sizeWrap, 'pizza-size', getCurrentSizePrices(), 'individual');
        buildOptionCards(refs.crustWrap, 'pizza-crust', crustPrices, 'normal');

        const defaultHalfMode = refs.form.querySelector('input[name="pizza-half-mode"][value="complete"]');
        if (defaultHalfMode) {
            defaultHalfMode.checked = true;
        }

        buildHalfSelector(refs);
        updateHalfUI(refs);
        updateSummary(refs);

        refs.overlay.classList.remove('hidden');
        document.body.classList.add('modal-open');
    };

    const closePizzaModal = () => {
        const refs = getModalRefs();
        if (!refs || !refs.overlay || refs.overlay.classList.contains('hidden')) {
            return;
        }

        refs.overlay.classList.add('hidden');
        document.body.classList.remove('modal-open');
        currentPizza = null;
    };

    const handleTabClick = button => {
        const tabName = button.getAttribute('data-tab');
        if (!tabName) {
            return;
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn === button);
        });

        document.querySelectorAll('[id$="-section"]').forEach(section => {
            section.classList.add('hidden');
        });

        const target = document.getElementById(tabName + '-section');
        if (target) {
            target.classList.remove('hidden');
        }
    };

    const initPizzaPage = () => {
        const firstTab = document.querySelector('.tab-btn.active') || document.querySelector('.tab-btn');
        if (firstTab) {
            handleTabClick(firstTab);
        }
    };

    document.addEventListener('click', event => {
        const tabButton = event.target.closest('.tab-btn');
        if (tabButton) {
            handleTabClick(tabButton);
            return;
        }

        const addButton = event.target.closest('.menu-item .btn-add');
        if (addButton) {
            const card = addButton.closest('.menu-item');
            const section = addButton.closest('.menu-section-container');
            const name = card ? card.querySelector('h3') : null;
            const description = card ? card.querySelector('.item-description') : null;
            const isSpecial = section && section.id === 'especiales-section';

            if (name && description) {
                openPizzaModal({
                    name: name.textContent.trim(),
                    description: description.textContent.trim(),
                    category: isSpecial ? 'especiales' : 'clasicas',
                    sizePrices: isSpecial ? specialSizePrices : classicSizePrices
                });
            }
            return;
        }

        const refs = getModalRefs();
        if (!refs) {
            return;
        }

        if (event.target === refs.closeBtn || event.target === refs.cancelBtn) {
            closePizzaModal();
        }
    });

    document.addEventListener('change', event => {
        const refs = getModalRefs();
        if (!refs || !currentPizza || !refs.overlay || refs.overlay.classList.contains('hidden')) {
            return;
        }

        if (event.target === refs.halfSelect || event.target.matches('input[name="pizza-size"], input[name="pizza-crust"], input[name="pizza-half-mode"]')) {
            updateHalfUI(refs);
            updateSummary(refs);
        }
    });

    document.addEventListener('submit', event => {
        const refs = getModalRefs();
        if (!refs || event.target !== refs.form || !currentPizza) {
            return;
        }

        event.preventDefault();

        const selectedSize = getSelectedValue(refs.form, 'pizza-size') || 'individual';
        const selectedCrust = getSelectedValue(refs.form, 'pizza-crust') || 'normal';
        const selectedHalfMode = getSelectedValue(refs.form, 'pizza-half-mode') || 'complete';
        const isHalf = selectedHalfMode === 'half';
        const sizePrices = getCurrentSizePrices();
        const secondHalf = isHalf && refs.halfSelect ? refs.halfSelect.value : '';
        const total = (sizePrices[selectedSize] || 0) + (crustPrices[selectedCrust] || 0) + (isHalf ? halfAndHalfPrice : 0);

        const detail = {
            productType: 'pizza',
            name: currentPizza.name,
            size: selectedSize,
            crust: selectedCrust,
            halfMode: selectedHalfMode,
            halfAndHalf: isHalf,
            secondHalf: secondHalf,
            total: total
        };

        document.dispatchEvent(new CustomEvent('cart:add', {
            detail: detail
        }));

        closePizzaModal();
    });

    document.addEventListener('click', event => {
        const refs = getModalRefs();
        if (!refs || !refs.overlay || refs.overlay.classList.contains('hidden')) {
            return;
        }

        if (event.target === refs.overlay) {
            closePizzaModal();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') {
            return;
        }

        closePizzaModal();
    });

    document.addEventListener('menu:sectionchange', event => {
        if (event.detail && event.detail.path === 'pizzas.html') {
            initPizzaPage();
        }
    });

    initPizzaPage();
})();
