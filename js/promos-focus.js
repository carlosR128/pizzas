(function () {
    function focusPromoGrid() {
        if (window.location.hash) {
            return;
        }

        const promoGridStart = document.querySelector('#promos-list .menu-section-container');
        if (!promoGridStart) {
            return;
        }

        // Sin hash: aterriza directamente en la grilla de combos.
        promoGridStart.scrollIntoView({ behavior: 'auto', block: 'start' });
    }

    window.addEventListener('load', focusPromoGrid);
})();
