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
    if (typeof window.gsap === 'undefined') {
      return;
    }
    if (window.matchMedia && window.matchMedia('(max-width: 991px)').matches) {
      return;
    }

    var pageWrapper = document.querySelector('.page_wrapper');
    var dayDiv = document.querySelector('.day-div');
    var nightDiv = document.querySelector('.night-div');
    var navLatest = document.querySelector('.nav_latest');
    var navScrolledTargets = [];
    if (navLatest) navScrolledTargets.push(navLatest);
    var dropdownEls = document.querySelectorAll('.nav_latest_dropdown');
    for (var di = 0; di < dropdownEls.length; di++) navScrolledTargets.push(dropdownEls[di]);
    var linkBlockEls = document.querySelectorAll('.nav_latest_link_block');
    for (var li = 0; li < linkBlockEls.length; li++) navScrolledTargets.push(linkBlockEls[li]);
    var secondaryBtnEls = document.querySelectorAll('.nav_secondary_btn');
    for (var sbi = 0; sbi < secondaryBtnEls.length; sbi++) navScrolledTargets.push(secondaryBtnEls[sbi]);
    var primaryBtnEls = document.querySelectorAll('.nav_primary_btn');
    for (var pbi = 0; pbi < primaryBtnEls.length; pbi++) navScrolledTargets.push(primaryBtnEls[pbi]);
    if (!pageWrapper || !dayDiv || !nightDiv) {
      return;
    }

    function setNight() {
      document.body.classList.add('is-night');
      for (var i = 0; i < navScrolledTargets.length; i++) {
        navScrolledTargets[i].classList.add('is-scrolled');
      }
    }
    function setDay() {
      document.body.classList.remove('is-night');
      for (var i = 0; i < navScrolledTargets.length; i++) {
        navScrolledTargets[i].classList.remove('is-scrolled');
      }
    }
    function armNavNightAtThreshold() {
      function check() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        if (window.pageYOffset >= max * 0.05) {
          window.removeEventListener('scroll', check);
          setNight();
        }
      }
      window.addEventListener('scroll', check, { passive: true });
      check();
    }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      gsap.set(dayDiv, { opacity: 0 });
      gsap.set(nightDiv, { opacity: 1 });
      setNight();
      return;
    }

    if (dayDiv.getBoundingClientRect().bottom <= 0) {
      gsap.to(dayDiv, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(nightDiv, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      setNight();
      return;
    }

    dayDiv.style.willChange = 'opacity';
    nightDiv.style.willChange = 'opacity';

    // Phases:
    //   'forward-armed'    next DOWN scroll plays forward; scroll is locked
    //   'forward-playing'  forward animation running; scroll is locked
    //   'free'             animation done; scroll is normal
    //   'reverse-playing'  reverse animation running; scroll is locked
    var phase = 'forward-armed';
    var lastTouchY = null;

    var tl = gsap.timeline({
      paused: true,
      onComplete: function () {
        phase = 'free';
        armNavNightAtThreshold();
      },
      onReverseComplete: function () {
        phase = 'forward-armed';
        setDay();
      }
    });
    tl.to(dayDiv, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0)
      .to(nightDiv, { opacity: 1, duration: 0.6, ease: 'power2.inOut' }, 0);

    function getDirection(e) {
      if (e.type === 'wheel') {
        if (e.deltaY > 0) return 'down';
        if (e.deltaY < 0) return 'up';
        return null;
      }
      if (e.type === 'touchmove') {
        if (!e.touches || !e.touches.length) return null;
        var y = e.touches[0].clientY;
        var dir = null;
        if (lastTouchY !== null) {
          if (y < lastTouchY - 1) dir = 'down';
          else if (y > lastTouchY + 1) dir = 'up';
        }
        lastTouchY = y;
        return dir;
      }
      if (e.type === 'keydown') {
        var k = e.key;
        if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'End') return 'down';
        if (k === 'ArrowUp' || k === 'PageUp' || k === 'Home') return 'up';
      }
      return null;
    }

    function onScrollInput(e) {
      if (phase === 'free') return;

      if (phase === 'forward-armed') {
        var dir = getDirection(e);
        if (dir === 'down') {
          if (e.cancelable) e.preventDefault();
          phase = 'forward-playing';
          tl.play();
        }
        return;
      }

      if (e.cancelable) e.preventDefault();
    }
    function onKeyDown(e) {
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp' ||
          k === 'PageDown' || k === 'PageUp' ||
          k === ' ' || k === 'Home' || k === 'End') {
        onScrollInput(e);
      }
    }
    function onTouchStart(e) {
      if (e.touches && e.touches.length) lastTouchY = e.touches[0].clientY;
    }

    window.addEventListener('wheel', onScrollInput, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onScrollInput, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    if (typeof window.ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.create({
        start: 1,
        onLeaveBack: function () {
          if (phase === 'free' && tl.progress() === 1) {
            phase = 'reverse-playing';
            tl.reverse();
          }
        }
      });
    }
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
    // No-op: hero pin/runway logic has been removed; the hero now scrolls
    // naturally with the rest of the page, so there is no body min-height
    // to manage here. Kept as a stub to preserve the existing call site.
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

    var lastWidth = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      play();
    });
  }

  function initConnectItsmBinary() {
    var cards = document.querySelectorAll('.connect-itsm');
    if (!cards.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    var CELL = 20;
    var RADIUS = 160;

    var style = document.createElement('style');
    style.textContent = [
      '.connect-itsm { position: relative; }',
      '.binary-canvas {',
      '  position: absolute;',
      '  inset: 0;',
      '  width: 100%;',
      '  height: 100%;',
      '  pointer-events: none;',
      '  z-index: 10;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    function setupCard(card) {
      var canvas = document.createElement('canvas');
      canvas.className = 'binary-canvas';
      card.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var cols = 0;
      var rows = 0;
      var grid = [];
      var cssW = 0;
      var cssH = 0;
      var mouseX = -9999;
      var mouseY = -9999;
      var hovering = false;
      var rafId = null;
      var idleFrames = 0;

      function initGrid() {
        var rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var dpr = window.devicePixelRatio || 1;
        cssW = rect.width;
        cssH = rect.height;
        canvas.width = Math.ceil(cssW * dpr);
        canvas.height = Math.ceil(cssH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        cols = Math.ceil(cssW / CELL) + 1;
        rows = Math.ceil(cssH / CELL) + 1;
        grid = new Array(rows * cols);
        for (var i = 0; i < grid.length; i++) {
          grid[i] = {
            char: Math.random() < 0.5 ? '0' : '1',
            alpha: 0,
            phase: Math.random() * Math.PI * 2,
            speed: 0.016 + Math.random() * 0.014,
            flipIn: 15 + ((Math.random() * 45) | 0)
          };
        }
      }

      function draw() {
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.font = '500 ' + ((CELL * 0.62) | 0) + "px Geist, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var anyVisible = false;
        var radiusSq = RADIUS * RADIUS;

        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var cell = grid[r * cols + c];
            var cx = (c + 0.5) * CELL;
            var cy = (r + 0.5) * CELL;
            var dx = cx - mouseX;
            var dy = cy - mouseY;
            var distSq = dx * dx + dy * dy;

            if (distSq < radiusSq) {
              var dist = Math.sqrt(distSq);
              var t = 1 - dist / RADIUS;
              cell.alpha += (t * 0.9 - cell.alpha) * 0.13;
              cell.phase += cell.speed;
              cell.flipIn--;
              if (cell.flipIn <= 0) {
                cell.char = Math.random() < 0.5 ? '0' : '1';
                cell.flipIn = 18 + ((Math.random() * 40) | 0);
              }
            } else {
              cell.alpha *= 0.86;
            }

            if (cell.alpha > 0.005) {
              anyVisible = true;
              var pulse = 0.5 + 0.5 * Math.sin(cell.phase);
              var a = cell.alpha * pulse;
              var d = distSq < radiusSq ? (1 - Math.sqrt(distSq) / RADIUS) : 0;
              var rr = (180 + d * 75) | 0;
              var gg = (200 + d * 55) | 0;
              var bb = (220 + d * 35) | 0;
              ctx.fillStyle = 'rgba(' + rr + ',' + gg + ',' + bb + ',' + a + ')';
              ctx.fillText(cell.char, cx, cy);
            }
          }
        }

        if (hovering || anyVisible) {
          idleFrames = 0;
          rafId = requestAnimationFrame(draw);
        } else {
          idleFrames++;
          if (idleFrames > 6) {
            rafId = null;
          } else {
            rafId = requestAnimationFrame(draw);
          }
        }
      }

      function start() {
        if (rafId === null) {
          idleFrames = 0;
          rafId = requestAnimationFrame(draw);
        }
      }

      card.addEventListener('mouseenter', function (e) {
        var rect = card.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        hovering = true;
        start();
      });
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        hovering = true;
        start();
      });
      card.addEventListener('mouseleave', function () {
        hovering = false;
        mouseX = -9999;
        mouseY = -9999;
      });

      card.addEventListener('touchmove', function (e) {
        if (!e.touches || !e.touches.length) return;
        var rect = card.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
        hovering = true;
        start();
      }, { passive: true });
      card.addEventListener('touchend', function () {
        hovering = false;
        mouseX = -9999;
        mouseY = -9999;
      });

      var resizeTimer = null;
      window.addEventListener('resize', function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initGrid, 150);
      });

      initGrid();
    }

    each(cards, setupCard);
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
    initConnectItsmBinary();
    waitForAllImages(refreshHeroRunway);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
