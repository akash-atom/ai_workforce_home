(function () {
  function each(list, fn) {
    for (var i = 0; i < list.length; i++) {
      fn(list[i]);
    }
  }

  function findByChannel(list, channel) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].getAttribute('data-channel') === channel) {
        return list[i];
      }
    }
    return null;
  }

  function initHeroCrossfade() {
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
      return;
    }
    if (window.matchMedia && window.matchMedia('(max-width: 991px)').matches) {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    var sticky = document.querySelector('.page_wrapper');
    var dayImg = document.querySelector('.ai-workforce-hero-img');
    var nightImg = document.querySelector('.ai-workforce-hero-img-night');
    if (!sticky || !dayImg || !nightImg) {
      return;
    }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      gsap.set(dayImg, { opacity: 0 });
      gsap.set(nightImg, { opacity: 1 });
      return;
    }

    var runway = sticky.parentElement;
    var scrollDistance = window.innerHeight;

    sticky.style.setProperty('position', 'sticky', 'important');
    sticky.style.setProperty('top', '0', 'important');
    runway.style.setProperty('min-height', (sticky.offsetHeight + scrollDistance) + 'px');

    dayImg.style.willChange = 'opacity';
    nightImg.style.willChange = 'opacity';
    gsap.set(dayImg, { opacity: 1 });
    gsap.set(nightImg, { opacity: 0 });

    var tl = gsap.timeline({ paused: true });
    tl.to(dayImg, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0)
      .to(nightImg, { opacity: 1, duration: 0.6, ease: 'power2.inOut' }, 0);

    ScrollTrigger.create({
      start: 1,
      end: scrollDistance,
      onEnter: function () { tl.play(); },
      onLeaveBack: function () { tl.reverse(); }
    });
  }

  function initChannelSwitcher() {
    if (typeof window.gsap === 'undefined') {
      return;
    }

    var rows = document.querySelectorAll('.logo-name-wrapper[data-channel]');
    var screens = document.querySelectorAll('.product-screen[data-channel]');
    if (!rows.length || !screens.length) {
      return;
    }

    var channelStyle = document.createElement('style');
    channelStyle.textContent = [
      '.logo-name-wrapper {',
      '  transition: border-color 300ms cubic-bezier(0.2, 0, 0, 1);',
      '}',
      '.logo-name-wrapper.is-active {',
      '  border-color: #953BFF;',
      '}',
      '#channel-logo {',
      '  transition: filter 300ms cubic-bezier(0.2, 0, 0, 1);',
      '}',
      '.logo-name-wrapper.is-active #channel-logo {',
      '  filter: none;',
      '}'
    ].join('\n');
    document.head.appendChild(channelStyle);

    var activeChannel = 'browser';
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dur = reduceMotion ? 0 : 0.3;
    var slide = reduceMotion ? 0 : 8;
    var ease = 'power2.out';

    each(screens, function (el) {
      el.style.willChange = 'opacity, transform';
      gsap.set(el, { opacity: el.getAttribute('data-channel') === activeChannel ? 1 : 0, y: 0 });
    });
    each(rows, function (row) {
      var isActive = row.getAttribute('data-channel') === activeChannel;
      row.classList.toggle('is-active', isActive);
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.style.cursor = 'pointer';
    });

    function switchTo(channel) {
      if (channel === activeChannel) {
        return;
      }
      var prevScreen = findByChannel(screens, activeChannel);
      var nextScreen = findByChannel(screens, channel);
      if (!prevScreen || !nextScreen) {
        return;
      }

      gsap.to(prevScreen, { opacity: 0, y: -slide, duration: dur, ease: ease, overwrite: 'auto' });
      gsap.fromTo(nextScreen,
        { opacity: 0, y: slide },
        { opacity: 1, y: 0, duration: dur, ease: ease, overwrite: 'auto' }
      );

      each(rows, function (row) {
        row.classList.toggle('is-active', row.getAttribute('data-channel') === channel);
      });

      activeChannel = channel;
    }

    function onActivate(e) {
      var channel = e.currentTarget.getAttribute('data-channel');
      if (channel) {
        switchTo(channel);
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate(e);
      }
    }

    each(rows, function (row) {
      row.addEventListener('click', onActivate);
      row.addEventListener('keydown', onKeyDown);
    });
  }

  function initVideoPlayers() {
    if (typeof window.gsap === 'undefined') {
      return;
    }

    var players = document.querySelectorAll('.video-player');
    if (!players.length) {
      return;
    }

    var PLYR_CSS = 'https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.css';
    var PLYR_JS = 'https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.min.js';

    var plyrStyle = document.createElement('style');
    plyrStyle.textContent = [
      '.plyr__control--overlaid { display: none !important; }',
      '.video-player {',
      '  overflow: hidden;',
      '  overflow-anchor: none;',
      '  contain: layout style;',
      '}',
      '.video-player-loop video {',
      '  width: 100% !important;',
      '  height: 100% !important;',
      '  object-fit: cover;',
      '  display: block;',
      '}'
    ].join('\n');
    document.head.appendChild(plyrStyle);

    var plyrLoadingCallbacks = null;
    var activeWrapper = null;
    var saveData = navigator.connection && navigator.connection.saveData;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var skipAutoplay = !!(saveData || reduceMotion);

    function getLoopVideo(loopEl) {
      if (!loopEl) return null;
      if (loopEl.tagName === 'VIDEO') return loopEl;
      return loopEl.querySelector('video');
    }

    function playLoop(video) {
      if (!video || skipAutoplay) return;
      try {
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      } catch (err) {}
    }

    function pauseLoop(video) {
      if (!video) return;
      try { video.pause(); } catch (err) {}
    }

    function ensurePlayerReady(wrapper, onReady) {
      var iframeContainer = wrapper.querySelector('.video-player-iframe');
      var vimeoId = wrapper.getAttribute('data-vimeo-id');
      if (!iframeContainer || !vimeoId) return;

      if (wrapper._plyrInstance) {
        onReady(wrapper._plyrInstance);
        return;
      }
      if (wrapper._plyrPending) {
        wrapper._plyrPending.push(onReady);
        return;
      }
      wrapper._plyrPending = [onReady];

      loadPlyr(function (Plyr) {
        if (!Plyr) {
          wrapper._plyrPending = null;
          return;
        }
        gsap.set(iframeContainer, { opacity: 0, pointerEvents: 'none' });
        iframeContainer.innerHTML = '';
        var plyrEl = document.createElement('div');
        plyrEl.setAttribute('data-plyr-provider', 'vimeo');
        plyrEl.setAttribute('data-plyr-embed-id', vimeoId);
        iframeContainer.appendChild(plyrEl);

        var player = new Plyr(plyrEl, {
          autoplay: false,
          loop: { active: false }
        });
        wrapper._plyrInstance = player;

        var pending = wrapper._plyrPending;
        wrapper._plyrPending = null;
        for (var i = 0; i < pending.length; i++) {
          pending[i](player);
        }
      });
    }

    function preload(wrapper) {
      ensurePlayerReady(wrapper, function () {});
    }

    function loadPlyr(callback) {
      if (window.Plyr) {
        callback(window.Plyr);
        return;
      }
      if (plyrLoadingCallbacks) {
        plyrLoadingCallbacks.push(callback);
        return;
      }
      plyrLoadingCallbacks = [callback];

      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = PLYR_CSS;
      document.head.appendChild(link);

      var script = document.createElement('script');
      script.src = PLYR_JS;
      script.onload = function () {
        var cbs = plyrLoadingCallbacks;
        plyrLoadingCallbacks = null;
        for (var i = 0; i < cbs.length; i++) {
          cbs[i](window.Plyr);
        }
      };
      script.onerror = function () {
        plyrLoadingCallbacks = null;
      };
      document.head.appendChild(script);
    }

    function teardown(wrapper) {
      if (!wrapper) {
        return;
      }
      if (wrapper._plyrInstance) {
        try { wrapper._plyrInstance.pause(); } catch (err) {}
      }

      var iframeContainer = wrapper.querySelector('.video-player-iframe');
      var loop = wrapper.querySelector('.video-player-loop');
      var play = wrapper.querySelector('.video-player-play');

      if (iframeContainer) {
        gsap.set(iframeContainer, { opacity: 0, pointerEvents: 'none', zIndex: '' });
      }
      if (loop) {
        loop.style.pointerEvents = '';
        loop.style.visibility = '';
      }
      if (play) {
        play.style.pointerEvents = '';
        play.style.visibility = '';
      }

      var fadeTargets = [];
      if (loop) fadeTargets.push(loop);
      if (play) fadeTargets.push(play);
      if (fadeTargets.length) {
        gsap.to(fadeTargets, { opacity: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      }

      playLoop(getLoopVideo(loop));
    }

    function activate(wrapper) {
      if (wrapper === activeWrapper) return;
      var vimeoId = wrapper.getAttribute('data-vimeo-id');
      if (!vimeoId) return;

      if (activeWrapper) teardown(activeWrapper);
      activeWrapper = wrapper;

      var loop = wrapper.querySelector('.video-player-loop');
      var play = wrapper.querySelector('.video-player-play');
      var iframeContainer = wrapper.querySelector('.video-player-iframe');
      if (!iframeContainer) {
        activeWrapper = null;
        return;
      }

      if (loop) loop.style.pointerEvents = 'none';
      if (play) play.style.pointerEvents = 'none';

      ensurePlayerReady(wrapper, function (player) {
        if (activeWrapper !== wrapper) return;

        gsap.set(iframeContainer, { opacity: 0, pointerEvents: 'auto', zIndex: 10 });
        try { player.play(); } catch (err) {}

        pauseLoop(getLoopVideo(loop));
        var fadeTargets = [];
        if (loop) fadeTargets.push(loop);
        if (play) fadeTargets.push(play);
        if (fadeTargets.length) {
          gsap.to(fadeTargets, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: 'auto',
            onComplete: function () {
              if (loop) loop.style.visibility = 'hidden';
              if (play) play.style.visibility = 'hidden';
            }
          });
        }
        gsap.to(iframeContainer, { opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      });
    }

    function setupIO(wrapper) {
      if (!('IntersectionObserver' in window)) return;

      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;

          if (wrapper === activeWrapper && !visible && wrapper._plyrInstance) {
            try { wrapper._plyrInstance.pause(); } catch (err) {}
          }
        }
      }, { threshold: [0, 0.5] });

      io.observe(wrapper);
    }

    each(players, function (wrapper) {
      var loopVideo = getLoopVideo(wrapper.querySelector('.video-player-loop'));

      if (loopVideo) {
        loopVideo.setAttribute('preload', 'auto');
        try { loopVideo.load(); } catch (err) {}
      }

      if (skipAutoplay && loopVideo) {
        loopVideo.removeAttribute('autoplay');
        pauseLoop(loopVideo);
      }

      wrapper.style.cursor = 'pointer';
      wrapper.addEventListener('click', function () { activate(wrapper); });
      wrapper.addEventListener('mouseenter', function () { preload(wrapper); });
      wrapper.addEventListener('touchstart', function () { preload(wrapper); }, { passive: true });

      setupIO(wrapper);
    });
  }

  function initScrollSpy(ids) {
    var OFFSET = 200;

    var pairs = [];
    for (var i = 0; i < ids.length; i++) {
      var section = document.getElementById(ids[i]);
      var link = document.querySelector('a[href="#' + ids[i] + '"]');
      if (section && link) pairs.push({ section: section, link: link });
    }
    if (!pairs.length) return;

    var baseSelectors = [];
    var activeSelectors = [];
    for (var s = 0; s < pairs.length; s++) {
      var href = 'a[href="#' + pairs[s].section.id + '"]';
      baseSelectors.push(href);
      activeSelectors.push(href + '.is-active');
    }
    var spyStyle = document.createElement('style');
    spyStyle.textContent = [
      baseSelectors.join(', ') + ' {',
      '  transition: opacity 300ms cubic-bezier(0.2, 0, 0, 1);',
      '}',
      activeSelectors.join(', ') + ' {',
      '  opacity: 1;',
      '}'
    ].join('\n');
    document.head.appendChild(spyStyle);

    function update() {
      var active = null;
      for (var i = 0; i < pairs.length; i++) {
        var rect = pairs[i].section.getBoundingClientRect();
        if (rect.top - OFFSET <= 1) {
          active = pairs[i];
        }
      }
      for (var j = 0; j < pairs.length; j++) {
        var isActive = pairs[j] === active;
        pairs[j].link.classList.toggle('is-active', isActive);
        if (isActive) {
          pairs[j].link.setAttribute('aria-current', 'true');
        } else {
          pairs[j].link.removeAttribute('aria-current');
        }
      }
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }

    function scrollToSection(section) {
      var rect = section.getBoundingClientRect();
      var targetY = rect.top + window.pageYOffset - OFFSET;
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
      if (history.pushState) {
        history.pushState(null, '', ' ');
      }
    }

    document.documentElement.style.scrollBehavior = 'auto';

    for (var k = 0; k < pairs.length; k++) {
      (function (p) {
        p.link.removeAttribute('data-wf-id');
        p.link.removeAttribute('data-wf-element');
        p.link.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          scrollToSection(p.section);
        }, true);
      })(pairs[k]);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  function eagerLoadAllImages() {
    var imgs = document.querySelectorAll('img[loading="lazy"]');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].loading = 'eager';
    }
  }

  function waitForAllImages(callback) {
    var imgs = document.querySelectorAll('img');
    var pending = imgs.length;
    if (pending === 0) {
      callback();
      return;
    }
    function done() {
      pending--;
      if (pending === 0) callback();
    }
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) {
        done();
      } else {
        imgs[i].addEventListener('load', done);
        imgs[i].addEventListener('error', done);
      }
    }
  }

  function refreshHeroRunway() {
    if (window.matchMedia && window.matchMedia('(max-width: 991px)').matches) {
      return;
    }
    var pw = document.querySelector('.page_wrapper');
    if (!pw) return;
    document.body.style.minHeight = (pw.offsetHeight + window.innerHeight) + 'px';
    if (window.ScrollTrigger && typeof ScrollTrigger.refresh === 'function') {
      ScrollTrigger.refresh();
    }
  }

  function initStickyLinkState() {
    var navDesktop = document.querySelector('.nav_latest');
    var navMobile = document.querySelector('.mob_nav_latest') || document.querySelector('.mob_nav_latest_v2');
    var els = [];
    var s1 = document.getElementById('sticky-link-1');
    var s2 = document.getElementById('sticky-link-2');
    if (s1) els.push(s1);
    if (s2) els.push(s2);
    if (!els.length || (!navDesktop && !navMobile)) return;

    var style = document.createElement('style');
    style.textContent = [
      '#sticky-link-1, #sticky-link-2 {',
      '  transition: opacity 300ms cubic-bezier(0.2, 0, 0, 1);',
      '}',
      '#sticky-link-1.is-stuck, #sticky-link-2.is-stuck {',
      '  opacity: 1;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    function getActiveNav() {
      var isMobile = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;
      return isMobile ? (navMobile || navDesktop) : (navDesktop || navMobile);
    }

    function update() {
      var nav = getActiveNav();
      if (!nav) return;
      var navBottom = nav.getBoundingClientRect().bottom;
      for (var i = 0; i < els.length; i++) {
        var elTop = els[i].getBoundingClientRect().top;
        els[i].classList.toggle('is-stuck', elTop <= navBottom + 1);
      }
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        update();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  function initCustomerLogosMarquee() {
    if (typeof window.gsap === 'undefined') return;

    var wrapper = document.querySelector('.custo-logos-wrapper');
    if (!wrapper || wrapper.children.length === 0) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    var cs = getComputedStyle(wrapper);
    var gap = parseInt(cs.columnGap || cs.gap, 10) || 24;

    var track = document.createElement('div');
    track.style.display = 'flex';
    track.style.alignItems = 'center';
    track.style.gap = gap + 'px';
    track.style.flexShrink = '0';

    while (wrapper.firstChild) {
      track.appendChild(wrapper.firstChild);
    }

    var trackClone = track.cloneNode(true);
    trackClone.setAttribute('aria-hidden', 'true');

    wrapper.style.overflow = 'hidden';
    wrapper.style.display = 'flex';
    wrapper.style.gap = gap + 'px';
    wrapper.style.justifyContent = 'flex-start';
    wrapper.appendChild(track);
    wrapper.appendChild(trackClone);

    var marqueeAnimation = null;

    function play() {
      var width = parseInt(getComputedStyle(track).getPropertyValue('width'), 10);
      var distance = -1 * (width + gap);

      if (marqueeAnimation) marqueeAnimation.kill();

      marqueeAnimation = gsap.fromTo(
        wrapper.children,
        { x: 0 },
        {
          x: distance,
          duration: 45,
          repeat: -1,
          ease: 'linear'
        }
      );
    }

    play();

    wrapper.addEventListener('mouseenter', function () {
      if (marqueeAnimation) marqueeAnimation.pause();
    });
    wrapper.addEventListener('mouseleave', function () {
      if (marqueeAnimation) marqueeAnimation.resume();
    });

    window.addEventListener('resize', play);
  }

  function init() {
    eagerLoadAllImages();
    initHeroCrossfade();
    initChannelSwitcher();
    initVideoPlayers();
    initScrollSpy(['for_emp', 'for_it', 'for_biz_leaders']);
    initScrollSpy(['it_usecase', 'hr_usecase']);
    initStickyLinkState();
    initCustomerLogosMarquee();
    waitForAllImages(refreshHeroRunway);
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();
