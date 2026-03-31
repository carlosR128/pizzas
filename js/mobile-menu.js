const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileDropdown = document.getElementById('mobile-dropdown-menu');

if (hamburgerBtn && mobileDropdown) {
    const closeMobileMenu = () => {
        mobileDropdown.classList.remove('show');
        mobileDropdown.classList.add('hidden');
        hamburgerBtn.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    };

    hamburgerBtn.addEventListener('click', event => {
        event.stopPropagation();
        const isOpen = mobileDropdown.classList.contains('show');

        if (isOpen) {
            closeMobileMenu();
            return;
        }

        mobileDropdown.classList.add('show');
        mobileDropdown.classList.remove('hidden');
        hamburgerBtn.classList.add('open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
    });

    mobileDropdown.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    document.addEventListener('click', event => {
        if (!mobileDropdown.contains(event.target) && !hamburgerBtn.contains(event.target)) {
            closeMobileMenu();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMobileMenu();
        }
    });
}
