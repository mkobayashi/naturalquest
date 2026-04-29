(() => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  onReady(() => {
    // 本文フェードイン（.rv → .on）
    const rvEls = document.querySelectorAll('.rv');
    if (rvEls.length) {
      const obs = new IntersectionObserver(
        (entries) =>
          entries.forEach((x) => {
            if (x.isIntersecting) x.target.classList.add('on');
          }),
        { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
      );
      rvEls.forEach((el) => obs.observe(el));
    }

    // サブ見出しスライドイン + 章タイトルフェードイン
    const photoTargets = document.querySelectorAll('.photo-wrap, .photo-fade');
    if (photoTargets.length) {
      const photoObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('seen');
            const title = entry.target.closest('.chapter')?.querySelector('.ch-title');
            if (title) title.classList.add('on');
          });
        },
        { threshold: 0.25 },
      );
      photoTargets.forEach((el) => photoObs.observe(el));
    }

    // photo-fade クロスフェード（4秒ごとに切り替え）
    if (!prefersReducedMotion) {
      const faders = document.querySelectorAll('.photo-fade');
      if (faders.length) {
        const timers = new WeakMap();
        const stop = (el) => {
          const t = timers.get(el);
          if (t) clearInterval(t);
          timers.delete(el);
        };

        const faderObs = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const el = entry.target;
              if (entry.isIntersecting) {
                if (!timers.has(el)) {
                  const t = setInterval(() => el.classList.toggle('show-b'), 4000);
                  timers.set(el, t);
                }
              } else {
                stop(el);
              }
            });
          },
          { threshold: 0.3 },
        );

        faders.forEach((el) => faderObs.observe(el));
        window.addEventListener(
          'pagehide',
          () => {
            faders.forEach((el) => stop(el));
          },
          { once: true },
        );
      }
    }

    // ヘッダースクロール
    const hd = document.getElementById('hd');
    if (hd) {
      window.addEventListener(
        'scroll',
        () => hd.classList.toggle('scrolled', scrollY > 50),
        { passive: true },
      );
    }
  });
})();
