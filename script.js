// Script mínimo para: menu hambúrguer, back-to-top, scroll suave (fallback) e ano no footer.

document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const btnMenu = document.getElementById('btn-menu');
  const body = document.body;
  const backToTop = document.getElementById('back-to-top');
  const menuList = document.getElementById('menu-list');

  // Ano no footer
  const anoEl = document.getElementById('ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  // Toggle menu (mobile)
  btnMenu.addEventListener('click', () => {
    const expanded = btnMenu.getAttribute('aria-expanded') === 'true';
    btnMenu.setAttribute('aria-expanded', String(!expanded));
    body.classList.toggle('menu-open');
  });

  // Close menu ao clicar em item
  menuList.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && body.classList.contains('menu-open')) {
      body.classList.remove('menu-open');
      btnMenu.setAttribute('aria-expanded', 'false');
    }
  });

  // Mostrar botão voltar ao topo ao rolar
  window.addEventListener('scroll', () => {
    if (window.scrollY > 420) {
      backToTop.style.display = 'flex';
    } else {
      backToTop.style.display = 'none';
    }
  });

  // Voltar ao topo suave
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Melhorar links âncora (fallback se necessário)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // fechar menu mobile se aberto
          if (body.classList.contains('menu-open')) {
            body.classList.remove('menu-open');
            btnMenu.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  });

  // Remove background-attachment fixed on mobile for performance (deixa hero com cover normal)
  const mq = window.matchMedia('(max-width: 720px)');
  const hero = document.querySelector('.hero');
  function toggleFixedBg(e) {
    if (hero) {
      if (e.matches) hero.style.backgroundAttachment = 'scroll';
      else hero.style.backgroundAttachment = '';
    }
  }
  mq.addListener(toggleFixedBg);
  toggleFixedBg(mq);

  // Gerenciar lazy-load do iframe dinamicamente para compatibilidade
  (function manageIframeLazyLoad() {
    const iframe = document.querySelector('.iframe-container iframe');
    if (!iframe) return;

    const supportsLoading = 'loading' in HTMLIFrameElement.prototype;
    if (supportsLoading) {
      // definir programaticamente para evitar atributo estático no HTML que alguns validadores/browsers marcam
      iframe.setAttribute('loading', 'lazy');
      return; // browser cuidará do lazy
    }

    // Se não suportado, usar IntersectionObserver para carregar on-demand
    if ('IntersectionObserver' in window) {
      // mover o src para data-src para prevenir carregamento imediato
      if (iframe.getAttribute('src')) {
        iframe.dataset.src = iframe.getAttribute('src');
        iframe.removeAttribute('src');
      }

      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (iframe.dataset.src) iframe.src = iframe.dataset.src;
            obs.disconnect();
          }
        });
      });
      io.observe(iframe);
    } else {
      // último recurso: carregar após pequeno delay
      if (iframe.getAttribute('src')) {
        iframe.dataset.src = iframe.getAttribute('src');
        iframe.removeAttribute('src');
      }
      setTimeout(() => {
        if (iframe.dataset.src) iframe.src = iframe.dataset.src;
      }, 1000);
    }
  })();

  // Lightbox simples para galeria
  (function galleryLightbox() {
    const gallery = document.querySelector('.gallery-grid');
    if (!gallery) return;

    const lightbox = document.getElementById('lightbox');
    const lbImg = lightbox ? lightbox.querySelector('.lightbox__img') : null;
    const lbCaption = lightbox ? lightbox.querySelector('.lightbox__caption') : null;
    const lbClose = lightbox ? lightbox.querySelector('.lightbox__close') : null;
    const items = Array.from(gallery.querySelectorAll('.gallery-item img'));
    if (!lightbox || !lbImg || !lbClose) return;

    let currentIndex = -1;

    function openAt(index) {
      const img = items[index];
      if (!img) return;
      currentIndex = index;
      lbImg.src = img.src;
      lbImg.alt = img.alt || '';
      lbCaption.textContent = img.alt || '';
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }

    function close() {
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lbImg.src = '';
      currentIndex = -1;
    }

    function showNext(dir) {
      if (currentIndex === -1) return;
      let next = currentIndex + dir;
      if (next < 0) next = items.length - 1;
      if (next >= items.length) next = 0;
      openAt(next);
    }

    // abrir ao clicar
    items.forEach((img, idx) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openAt(idx));
    });

    // fechar via botão
    lbClose.addEventListener('click', close);

    // fechar via backdrop
    lightbox.addEventListener('click', (e) => {
      if (e.target && e.target.dataset && e.target.dataset.close !== undefined) close();
    });

    // teclado
    document.addEventListener('keydown', (e) => {
      if (lightbox.getAttribute('aria-hidden') === 'false') {
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') showNext(1);
        if (e.key === 'ArrowLeft') showNext(-1);
      }
    });
  })();

  // Parallax simples para a galeria (respeita preferências de movimento reduzido)
  (function galleryParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const gallery = document.querySelector('.gallery-grid');
    if (!gallery) return;

    const items = Array.from(gallery.querySelectorAll('.gallery-item'));

    // atribuir velocidades diferentes (aleatório sutil) se não definidas
    items.forEach((it, idx) => {
      if (!it.dataset.speed) {
        // -0.15 .. 0.15 (direção/velocidade)
        const speed = (idx % 3 - 1) * 0.06; // valores: -0.06, 0, 0.06 repetidos
        it.dataset.speed = String(speed);
      }
      // preparar will-change para desempenho
      const img = it.querySelector('img');
      if (img) img.style.willChange = 'transform';
    });

    let ticking = false;

    function update() {
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset;

      items.forEach(it => {
        const rect = it.getBoundingClientRect();
        const img = it.querySelector('img');
        if (!img) return;
        // distância do centro da viewport
        const itemCenter = rect.top + rect.height / 2;
        const viewportCenter = viewportHeight / 2;
        const distance = (itemCenter - viewportCenter) / viewportHeight; // -1 .. 1
        const speed = parseFloat(it.dataset.speed) || 0;
        const translate = distance * 30 * speed; // ajuste final em px
        img.style.transform = `translateY(${translate}px)`;
      });
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // atualizar inicialmente
    update();
  })();

  // Esconder placeholder quando o iframe terminar de carregar (ou quando o src for atribuído)
  (function hideMapPlaceholderOnLoad() {
    const container = document.querySelector('.iframe-container');
    const iframe = container ? container.querySelector('iframe') : null;
    const placeholder = container ? container.querySelector('.map-placeholder') : null;
    if (!container || !iframe || !placeholder) return;

    // Função para marcar como carregado
    function markLoaded() {
      container.classList.add('loaded');
      // para acessibilidade, indicar que o mapa está disponível
      placeholder.setAttribute('aria-hidden', 'true');
    }

    // Se o iframe já tiver src (carregado inline), esperar evento load
    iframe.addEventListener('load', () => {
      markLoaded();
    });

    // Caso o script mova o src para data-src e carregue via IntersectionObserver,
    // observar mudanças no atributo src para detectar quando o carregamento começa
    const obs = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'src') {
          // esperar próximo evento load
          iframe.addEventListener('load', markLoaded, { once: true });
        }
      }
    });
    obs.observe(iframe, { attributes: true });
  })();
});
