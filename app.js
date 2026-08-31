/* =====================================================================
   Adrian Masella — landing page (build estático)
   Recriação do comportamento do protótipo .dc.html sem o dc-runtime:
   - shim de estados de estilo (style-hover / style-focus / style-active)
   - reveal on scroll
   - luz que acompanha o mouse
   - formulário de qualificação em 7 etapas (0..6)
   ===================================================================== */
(function () {
  'use strict';

  var CONFIG = {
    showPattern: true,     // faixa de pílulas antes do rodapé (sempre renderizada no build)
    revealOnScroll: true,  // anima os blocos [data-reveal] ao entrarem na viewport
    luzDoMouse: true        // halo que segue o cursor em telas grandes
  };

  /* ---------------------------------------------------------------
     Shim: style-hover / style-focus / style-active
     O dc-runtime aplicava esses atributos como estilo inline nos
     eventos correspondentes. Reproduzimos o mesmo aqui.
     (Não é usado nos inputs nem nos .am-opt — esses usam CSS.)
  --------------------------------------------------------------- */
  function initStateStyles() {
    var els = document.querySelectorAll('[style-hover],[style-focus],[style-active]');
    Array.prototype.forEach.call(els, function (el) {
      var sh = el.getAttribute('style-hover');
      var sf = el.getAttribute('style-focus');
      var sa = el.getAttribute('style-active');
      var on = { h: false, f: false, a: false };

      // O style "base" é capturado quando NENHUM estado está ativo — e não
      // uma única vez no load. Assim mudanças feitas por outros scripts
      // (ex.: o reveal on scroll, que zera opacity/transform) são preservadas
      // ao entrar/sair do hover, em vez de revertidas.
      var snapshot = null;

      function anyOn() { return on.h || on.f || on.a; }

      function render() {
        if (!anyOn()) {
          if (snapshot !== null) { el.style.cssText = snapshot; snapshot = null; }
          return;
        }
        if (snapshot === null) snapshot = el.style.cssText;
        var s = snapshot;
        if (on.h && sh) s += ';' + sh;
        if (on.f && sf) s += ';' + sf;
        if (on.a && sa) s += ';' + sa;
        el.style.cssText = s;
      }

      if (sh) {
        el.addEventListener('mouseenter', function () { on.h = true; render(); });
        el.addEventListener('mouseleave', function () { on.h = false; on.a = false; render(); });
      }
      if (sf) {
        el.addEventListener('focus', function () { on.f = true; render(); });
        el.addEventListener('blur', function () { on.f = false; render(); });
      }
      if (sa) {
        el.addEventListener('mousedown', function () { on.a = true; render(); });
        window.addEventListener('mouseup', function () { if (on.a) { on.a = false; render(); } });
      }
    });
  }

  /* ---------------------------------------------------------------
     Reveal on scroll — blocos [data-reveal]
  --------------------------------------------------------------- */
  function initReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    function show(n) { n.style.opacity = '1'; n.style.transform = 'translateY(0)'; }

    if (!CONFIG.revealOnScroll || !('IntersectionObserver' in window)) {
      nodes.forEach(show);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    nodes.forEach(function (n) { io.observe(n); });

    // Rede de segurança: se o observer não disparar, revela tudo
    setTimeout(function () {
      nodes.forEach(function (n) { if (n.style.opacity !== '1') show(n); });
      io.disconnect();
    }, 2200);
  }

  /* ---------------------------------------------------------------
     Luz que acompanha o mouse (#am-luz / #am-luz-halo)
  --------------------------------------------------------------- */
  function initLuz() {
    var luz = document.getElementById('am-luz');
    var halo = document.getElementById('am-luz-halo');
    if (!luz || !halo) return;

    var podeLuz = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1000px)').matches;
    if (!podeLuz) return;

    var pos = { x: -1000, y: -1000 };
    var pend = null;

    function aplicar() {
      pend = null;
      var x = pos.x, y = pos.y;
      var alvo = document.elementFromPoint(x, y);
      var bloqueado = !alvo || !!alvo.closest('#am-hero, footer, [data-faixa]');
      var secao = alvo && alvo.closest('section');
      halo.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (bloqueado || !secao) { luz.style.opacity = '0'; return; }
      /* Clipa a luz só contra as zonas onde ela não pode aparecer
         (hero, rodapé, faixas). Entre seções normais ela transita
         livre, com o próprio degradê do halo suavizando a borda. */
      var vh = window.innerHeight;
      var top = 0, bottom = vh;
      var zonas = document.querySelectorAll('#am-hero, footer, [data-faixa]');
      for (var i = 0; i < zonas.length; i++) {
        var b = zonas[i].getBoundingClientRect();
        if (b.bottom <= y && b.bottom > top) top = b.bottom;
        if (b.top >= y && b.top < bottom) bottom = b.top;
      }
      luz.style.clipPath = 'inset(' + Math.max(0, top) + 'px 0 ' + Math.max(0, vh - bottom) + 'px 0)';
      luz.style.opacity = CONFIG.luzDoMouse === false ? '0' : '1';
    }
    function agendar() { if (!pend) pend = requestAnimationFrame(aplicar); }

    window.addEventListener('mousemove', function (ev) { pos = { x: ev.clientX, y: ev.clientY }; agendar(); }, { passive: true });
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar, { passive: true });
    document.addEventListener('mouseleave', function () { luz.style.opacity = '0'; });
  }

  /* ---------------------------------------------------------------
     Formulário de qualificação (etapas 0..6)
  --------------------------------------------------------------- */
  function initForm() {
    var root = document.getElementById('formulario');
    if (!root) return;

    var steps = Array.prototype.slice.call(root.querySelectorAll('.am-step'));
    var progress = document.getElementById('am-progress');
    var current = 0;

    var data = {
      nome: '', whatsapp: '', email: '',
      empresa: '', presenca: '', faturamento: '',
      filtro: null, urgencia: null
    };

    /* --- captura de UTMs + envio para o dataLayer (GTM) --- */
    function utms() {
      var p = new URLSearchParams(window.location.search);
      var out = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
        if (p.get(k)) out[k] = p.get(k);
      });
      return out;
    }

    function push(evento, dados) {
      // TODO: integração de leads ainda não definida.
      // Hoje os eventos abaixo ficam apenas no window.dataLayer (pronto para GTM).
      // Para enviar de fato (CRM / Formspree / webhook), plugue o envio aqui.
      window.dataLayer = window.dataLayer || [];
      var obj = Object.assign({ event: evento }, dados || {}, utms());
      window.dataLayer.push(obj);
      if (window.console && console.debug) console.debug('[form event]', obj);
    }

    function setProgress() {
      var pct = current === 0 ? 0 : Math.round((current / 6) * 100);
      if (progress) progress.style.width = pct + '%';
    }

    function go(n) {
      current = n;
      steps.forEach(function (s) {
        var alvo = Number(s.getAttribute('data-step')) === n;
        s.hidden = !alvo;
        if (alvo) {
          var inner = s.querySelector('.am-fade');
          if (inner) { inner.style.animation = 'none'; void inner.offsetWidth; inner.style.animation = ''; }
        }
      });
      setProgress();
    }

    function fieldEl(name) { return root.querySelector('[name="' + name + '"]'); }
    function errEl(name) { return root.querySelector('.am-error[data-error="' + name + '"]'); }
    function setErr(name, on) {
      var f = fieldEl(name), e = errEl(name);
      if (f) f.classList.toggle('is-error', !!on);
      if (e) e.hidden = !on;
    }

    /* --- inputs / select --- */
    ['nome', 'whatsapp', 'email', 'empresa', 'presenca', 'faturamento'].forEach(function (name) {
      var f = fieldEl(name);
      if (!f) return;
      var ev = f.tagName === 'SELECT' ? 'change' : 'input';
      f.addEventListener(ev, function () {
        var v = f.value;
        if (name === 'whatsapp') { v = v.replace(/\D/g, '').slice(0, 11); f.value = v; }
        data[name] = v;
        setErr(name, false);
      });
    });

    /* --- regras de validação (iguais ao protótipo) --- */
    var okNome = function () { return data.nome.trim().split(' ').filter(Boolean).length >= 2; };
    var okWhats = function () { return data.whatsapp.replace(/\D/g, '').length >= 10; };
    var okEmail = function () { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()); };
    var okEmpresa = function () { return data.empresa.trim().length > 1; };
    var okPresenca = function () { return data.presenca.trim().length > 1; };
    var okFat = function () { return data.faturamento !== ''; };

    /* --- ações dos botões (data-action) --- */
    var actions = {
      iniciar: function () {
        push('form_start', { form_name: 'qualificacao_leads' });
        go(1);
      },
      avancarContato: function () {
        setErr('nome', !okNome());
        setErr('whatsapp', !okWhats());
        setErr('email', !okEmail());
        if (!okNome() || !okWhats() || !okEmail()) return;
        push('lead_captured', { nome: data.nome.trim(), whatsapp: data.whatsapp.trim(), email: data.email.trim() });
        go(2);
      },
      avancarEmpresa: function () {
        setErr('empresa', !okEmpresa());
        setErr('presenca', !okPresenca());
        if (!okEmpresa() || !okPresenca()) return;
        go(3);
      },
      avancarQualificacao: function () {
        setErr('faturamento', !okFat());
        if (!okFat()) return;
        go(4);
      },
      voltar0: function () { go(0); },
      voltar1: function () { go(1); },
      voltar2: function () { go(2); },
      voltar3: function () { go(3); },
      voltar4: function () { go(4); }
    };

    Array.prototype.forEach.call(root.querySelectorAll('[data-action]'), function (btn) {
      btn.addEventListener('click', function () {
        var fn = actions[btn.getAttribute('data-action')];
        if (fn) fn();
      });
    });

    /* --- grupos de opção (etapas 4 e 5) --- */
    function selectOpt(group, value, btn) {
      Array.prototype.forEach.call(root.querySelectorAll('.am-opt[data-group="' + group + '"]'), function (b) {
        b.classList.toggle('is-selected', b === btn);
      });
      data[group] = value;
    }

    Array.prototype.forEach.call(root.querySelectorAll('.am-opt'), function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-group');
        var value = btn.getAttribute('data-value');
        selectOpt(group, value, btn);

        if (group === 'filtro') {
          setTimeout(function () { go(5); }, 220);
        } else if (group === 'urgencia') {
          setTimeout(function () {
            var payload = {
              nome: data.nome.trim(),
              whatsapp: data.whatsapp.trim(),
              email: data.email.trim(),
              empresa: data.empresa.trim(),
              presenca_online: data.presenca.trim(),
              faturamento: data.faturamento,
              acordo_valores: data.filtro,
              urgencia: data.urgencia
            };
            var evento = data.filtro === 'Sim, esse investimento está dentro do nosso orçamento.'
              ? 'lead_qualificado'
              : 'lead_desqualificado';
            push(evento, payload);
            go(6);
          }, 220);
        }
      });
    });

    setProgress();
  }

  /* --------------------------------------------------------------- */
  function init() {
    initStateStyles();
    initReveal();
    initLuz();
    initForm();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
