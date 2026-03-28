(function () {
    const slides = document.querySelectorAll('.promo-slide');
    const dots   = document.querySelectorAll('.promo-dot');
    if (!slides.length) return;

    let current  = 0;
    const INTERVAL = 5 * 60 * 1000; // 5 minutos

    function goTo(index) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    document.querySelector('.slider-prev').addEventListener('click', function () {
        goTo(current - 1);
        resetTimer();
    });

    document.querySelector('.slider-next').addEventListener('click', function () {
        goTo(current + 1);
        resetTimer();
    });

    dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
            goTo(i);
            resetTimer();
        });
    });

    let timer = setInterval(function () { goTo(current + 1); }, INTERVAL);

    function resetTimer() {
        clearInterval(timer);
        timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
    }
})();
