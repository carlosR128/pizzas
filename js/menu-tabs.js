(function () {
    const submenuNav = document.querySelector('.submenu-nav');
    const submenuContainer = submenuNav ? submenuNav.querySelector('.submenu-container') : null;

    if (!submenuNav || !submenuContainer) {
        return;
    }

    const STORAGE_KEY = 'abcg:last-menu-section';
    const SCRIPT_REFRESH_PARAM = '_menuTabs';
    const links = Array.from(submenuContainer.querySelectorAll('.submenu-link[href]'));
    const loadedScripts = new Set(
        Array.from(document.querySelectorAll('script[src]'))
            .map(script => {
                try {
                    return new URL(script.getAttribute('src'), window.location.href).href;
                } catch (error) {
                    return '';
                }
            })
            .filter(Boolean)
    );

    if (!links.length) {
        return;
    }

    const toPath = value => {
        try {
            const resolved = new URL(value, window.location.href);
            return resolved.pathname.split('/').pop() || '';
        } catch (error) {
            return '';
        }
    };

    const availablePaths = new Set(links.map(link => toPath(link.getAttribute('href'))).filter(Boolean));

    const updateStickyOffset = () => {
        const header = document.querySelector('header');
        const offset = header ? Math.round(header.getBoundingClientRect().height) : 0;
        document.documentElement.style.setProperty('--submenu-sticky-top', offset + 'px');
    };

    const isMenuTabsScript = src => /\/js\/menu-tabs\.js(\?|$)/i.test(src);

    const withRefreshParam = src => {
        const separator = src.includes('?') ? '&' : '?';
        return src + separator + SCRIPT_REFRESH_PARAM + '=' + Date.now();
    };

    const appendScript = (src, options) => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = options.forceReload ? withRefreshParam(src) : src;
        script.async = false;
        script.defer = Boolean(options.defer);

        if (options.type) {
            script.type = options.type;
        }

        script.dataset.menuTabsManaged = 'true';
        script.dataset.originalSrc = src;

        script.onload = () => {
            resolve();
        };

        script.onerror = () => {
            reject(new Error('No se pudo cargar el script: ' + src));
        };

        document.body.appendChild(script);
    });

    const runPageScripts = async doc => {
        const scripts = Array.from(doc.querySelectorAll('script[src]')).map(script => {
            const rawSrc = script.getAttribute('src');

            if (!rawSrc) {
                return null;
            }

            try {
                const absoluteSrc = new URL(rawSrc, window.location.href).href;
                const isBodyScript = script.closest('body') !== null;

                return {
                    src: absoluteSrc,
                    defer: script.defer || script.hasAttribute('defer'),
                    type: script.type || '',
                    forceReload: isBodyScript && !script.defer && !script.hasAttribute('defer')
                };
            } catch (error) {
                return null;
            }
        }).filter(Boolean);

        for (const script of scripts) {
            if (isMenuTabsScript(script.src)) {
                continue;
            }

            if (script.forceReload) {
                await appendScript(script.src, {
                    defer: false,
                    type: script.type,
                    forceReload: true
                });
                loadedScripts.add(script.src);
                continue;
            }

            if (!loadedScripts.has(script.src)) {
                await appendScript(script.src, {
                    defer: script.defer,
                    type: script.type,
                    forceReload: false
                });
                loadedScripts.add(script.src);
            }
        }
    };

    const getLocationPath = () => {
        const current = toPath(window.location.pathname);
        return availablePaths.has(current) ? current : '';
    };

    const setActiveLink = path => {
        links.forEach(link => {
            link.classList.toggle('active', toPath(link.getAttribute('href')) === path);
        });
    };

    let activePath = getLocationPath() || toPath(links[0].getAttribute('href'));
    let requestController = null;

    const replaceMain = doc => {
        const currentMain = document.querySelector('main');
        const nextMain = doc.querySelector('main');

        if (!currentMain || !nextMain) {
            return false;
        }

        currentMain.replaceWith(nextMain);
        return true;
    };

    const changeSection = async (path, options) => {
        const settings = {
            pushState: true,
            saveState: true,
            ...options
        };

        if (!availablePaths.has(path)) {
            return;
        }

        if (path === activePath) {
            setActiveLink(path);
            if (settings.saveState) {
                window.localStorage.setItem(STORAGE_KEY, path);
            }
            return;
        }

        if (requestController) {
            requestController.abort();
        }

        requestController = new AbortController();
        submenuNav.classList.add('is-loading');

        try {
            const response = await fetch(path, {
                signal: requestController.signal,
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error('No fue posible cargar la seccion.');
            }

            const html = await response.text();
            const parsed = new DOMParser().parseFromString(html, 'text/html');
            const replaced = replaceMain(parsed);

            if (!replaced) {
                throw new Error('No se encontro el contenido principal en la pagina destino.');
            }

            await runPageScripts(parsed);

            document.title = parsed.title || document.title;
            activePath = path;
            setActiveLink(path);

            if (settings.saveState) {
                window.localStorage.setItem(STORAGE_KEY, path);
            }

            if (settings.pushState) {
                window.history.pushState({ menuPath: path }, '', path);
            }

            document.dispatchEvent(new CustomEvent('menu:sectionchange', {
                detail: { path: path }
            }));
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }

            window.location.href = path;
        } finally {
            submenuNav.classList.remove('is-loading');
            requestController = null;
        }
    };

    submenuContainer.addEventListener('click', event => {
        const link = event.target.closest('.submenu-link');

        if (!link) {
            return;
        }

        const path = toPath(link.getAttribute('href'));

        if (!availablePaths.has(path)) {
            return;
        }

        event.preventDefault();
        changeSection(path, { pushState: true, saveState: true });
    });

    window.addEventListener('popstate', event => {
        const statePath = event.state && typeof event.state.menuPath === 'string'
            ? event.state.menuPath
            : getLocationPath();

        if (statePath && availablePaths.has(statePath)) {
            changeSection(statePath, { pushState: false, saveState: true });
        }
    });

    updateStickyOffset();
    window.addEventListener('resize', updateStickyOffset);
    window.addEventListener('orientationchange', updateStickyOffset);

    const savedPath = window.localStorage.getItem(STORAGE_KEY);
    const currentPath = getLocationPath();

    if (savedPath && availablePaths.has(savedPath) && savedPath !== currentPath) {
        changeSection(savedPath, { pushState: false, saveState: false });
    } else {
        activePath = currentPath || activePath;
        setActiveLink(activePath);
        window.localStorage.setItem(STORAGE_KEY, activePath);
        window.history.replaceState({ menuPath: activePath }, '', window.location.href);
    }
})();
