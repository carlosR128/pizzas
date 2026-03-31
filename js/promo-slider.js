(function () {
    const slides = document.querySelectorAll('.promo-slide');
    const dots   = document.querySelectorAll('.promo-dot');
    if (!slides.length) return;

    let current  = 0;
    const INTERVAL = 5000; // 5 segundos

    function goTo(index) {
        slides[current].classList.remove('active');
        if (dots[current]) {
            dots[current].classList.remove('active');
        }
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        if (dots[current]) {
            dots[current].classList.add('active');
        }
    }

    function goToPromosSection() {
        const activeSlide = slides[current];
        const targetId = activeSlide ? activeSlide.getAttribute('data-promo-target') : '';
        const hash = targetId ? `#${targetId}` : '#promos-list';
        window.location.href = `promos.html${hash}`;
    }

    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            goTo(current - 1);
            resetTimer();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            goTo(current + 1);
            resetTimer();
        });
    }

    dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
            goTo(i);
            resetTimer();
        });
    });

    slides.forEach(function (slide) {
        slide.style.cursor = 'pointer';
        slide.addEventListener('click', function () {
            goToPromosSection();
        });
    });

    let timer = setInterval(function () { goTo(current + 1); }, INTERVAL);

    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
    }
})();
