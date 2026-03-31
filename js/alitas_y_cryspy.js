(function () {
const wingsMenuData = {
    clasicas: {
        name: 'Clásicas',
        description: 'Alitas tradicionales con salsa a elección.',
        quantities: [
            { pieces: 8, price: 125 },
            { pieces: 10, price: 135 },
            { pieces: 14, price: 165 },
            { pieces: 27, price: 290 },
            { pieces: 50, price: 505 }
        ]
    },
    premium: {
        name: 'Premium',
        description: 'Alitas gourmet con aderezos especiales y extras.',
        quantities: [
            { pieces: 8, price: 175 },
            { pieces: 14, price: 265 }
        ]
    },
    lovers: {
        name: 'Lovers',
        description: 'Porción grande para compartir con salsas mixtas.',
        quantities: [
            { pieces: 6, price: 110 },
            { pieces: 10, price: 160 }
        ]
    },
    'crispy-wings': {
        name: 'Crispy Wings',
        description: 'Alitas empanizadas extra crujientes.',
        quantities: [
            { pieces: 8, price: 135 },
            { pieces: 10, price: 150 }
        ]
    }
};

const salsaGroups = [
    {
        title: 'No picantes',
        options: [
            'Natural ABCG',
            'Miel',
            'Al mojo de ajo',
            'Lemon pepper',
            'Parmesano',
            'Mostaza-miel',
            'BBQ original',
            'Tamarindo'
        ]
    },
    {
        title: 'Picantes',
        options: [
            'Red buffalo',
            'BBQ chipotle',
            'Enchiltepina',
            'Guacamole habanero',
            'Mango habanero',
            'Habanero tradicional',
            'Habanero hot'
        ]
    }
];

const modalOverlay = document.getElementById('wings-modal-overlay');
const modalTitle = document.getElementById('wings-modal-title');
const modalDescription = document.getElementById('wings-modal-description');
const quantityOptions = document.getElementById('quantity-options');
const salsaGroupsContainer = document.getElementById('salsa-groups');
const salsaLimitNotice = document.getElementById('salsa-limit-notice');
const modalSummary = document.getElementById('modal-summary');
const closeButton = document.getElementById('wings-modal-close');
const cancelButton = document.getElementById('wings-modal-cancel');
const orderForm = document.getElementById('wings-order-form');
const MAX_SALSAS = 2;

let activeProductId = null;

if (!modalOverlay || !modalTitle || !modalDescription || !quantityOptions || !salsaGroupsContainer || !modalSummary || !closeButton || !cancelButton || !orderForm) {
    return;
}

const formatPrice = value => `$${value}`;

const buildQuantityOptions = product => {
    quantityOptions.innerHTML = product.quantities.map((option, index) => `
        <div class="quantity-card">
            <label>
                <input type="radio" name="wing-quantity" value="${option.pieces}" data-price="${option.price}" ${index === 0 ? 'checked' : ''}>
                <span class="option-copy">
                    <strong>${option.pieces} piezas</strong>
                    <span>${formatPrice(option.price)}</span>
                </span>
            </label>
        </div>
    `).join('');
};

const buildSalsaOptions = () => {
    salsaGroupsContainer.innerHTML = salsaGroups.map(group => `
        <div class="salsa-group">
            <h4>${group.title}</h4>
            ${group.options.map(option => `
                <label class="salsa-option">
                    <input type="checkbox" name="wing-salsa" value="${option}">
                    <span class="option-copy">
                        <strong>${option}</strong>
                    </span>
                </label>
            `).join('')}
        </div>
    `).join('');
};

const getSelectedQuantity = () => {
    const selected = orderForm.querySelector('input[name="wing-quantity"]:checked');
    if (!selected) {
        return null;
    }

    return {
        pieces: Number(selected.value),
        price: Number(selected.dataset.price)
    };
};

const getSelectedSalsas = () => Array.from(orderForm.querySelectorAll('input[name="wing-salsa"]:checked'))
    .map(input => input.value);

const setSalsaLimitNotice = message => {
    if (!salsaLimitNotice) {
        return;
    }

    if (!message) {
        salsaLimitNotice.textContent = '';
        salsaLimitNotice.classList.remove('visible');
        return;
    }

    salsaLimitNotice.textContent = message;
    salsaLimitNotice.classList.add('visible');
};

const enforceSalsaSelectionLimit = changedInput => {
    const salsaInputs = Array.from(orderForm.querySelectorAll('input[name="wing-salsa"]'));
    const selectedInputs = salsaInputs.filter(input => input.checked);

    if (selectedInputs.length > MAX_SALSAS && changedInput) {
        changedInput.checked = false;
        setSalsaLimitNotice(`Solo puedes seleccionar ${MAX_SALSAS} salsas.`);
    }

    const selectedCount = salsaInputs.filter(input => input.checked).length;

    salsaInputs.forEach(input => {
        input.disabled = selectedCount >= MAX_SALSAS && !input.checked;
    });

    if (selectedCount < MAX_SALSAS) {
        setSalsaLimitNotice('');
    }
};

const updateSummary = () => {
    const product = wingsMenuData[activeProductId];
    const quantity = getSelectedQuantity();
    const salsas = getSelectedSalsas();

    if (!product || !quantity) {
        modalSummary.textContent = 'Selecciona una cantidad para continuar.';
        return;
    }

    const salsaText = salsas.length ? salsas.join(', ') : 'Sin salsa seleccionada';
    modalSummary.innerHTML = `
        <strong>${product.name}</strong>: ${quantity.pieces} piezas por ${formatPrice(quantity.price)}.<br>
        Salsas (max ${MAX_SALSAS}): ${salsaText}
    `;
};

const openModal = productId => {
    const product = wingsMenuData[productId];
    if (!product) {
        return;
    }

    activeProductId = productId;
    modalTitle.textContent = product.name;
    modalDescription.textContent = product.description;
    buildQuantityOptions(product);
    buildSalsaOptions();
    setSalsaLimitNotice('');
    enforceSalsaSelectionLimit();
    updateSummary();
    modalOverlay.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

const closeModal = () => {
    modalOverlay.classList.add('hidden');
    document.body.classList.remove('modal-open');
    activeProductId = null;
    setSalsaLimitNotice('');
    orderForm.reset();
};

document.querySelectorAll('.btn-add[data-item-id]').forEach(button => {
    button.addEventListener('click', () => {
        openModal(button.dataset.itemId);
    });
});

orderForm.addEventListener('change', event => {
    if (event.target && event.target.name === 'wing-salsa') {
        enforceSalsaSelectionLimit(event.target);
    }

    updateSummary();
});

orderForm.addEventListener('submit', event => {
    event.preventDefault();

    const product = wingsMenuData[activeProductId];
    const quantity = getSelectedQuantity();
    const salsas = getSelectedSalsas();

    if (salsas.length > MAX_SALSAS) {
        setSalsaLimitNotice(`Solo puedes seleccionar ${MAX_SALSAS} salsas.`);
        return;
    }

    const salsaText = salsas.length ? salsas.join(', ') : 'sin salsa seleccionada';

    document.dispatchEvent(new CustomEvent('cart:add', {
        detail: {
            productType: 'alitas',
            name: product.name,
            size: `${quantity.pieces} piezas`,
            crust: `Salsas: ${salsaText}`,
            halfMode: 'complete',
            halfAndHalf: false,
            secondHalf: '',
            total: quantity.price
        }
    }));
    closeModal();
});

closeButton.addEventListener('click', closeModal);
cancelButton.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', event => {
    if (event.target === modalOverlay) {
        closeModal();
    }
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
        closeModal();
    }
});
})();