/* «Тапыши» — вся графика: питомцы, яйца, шапки, гербы, иконки. Чистый SVG, без внешних файлов. */
(function () {
  'use strict';
  var n = 0;
  function uid(p) { return (p || 'g') + (++n).toString(36); }
  function lin(id, c1, c2, x2, y2) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
  }
  function rad(id, c1, c2, cx, cy) {
    return '<radialGradient id="' + id + '" cx="' + (cx || .38) + '" cy="' + (cy || .3) + '" r=".8"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>';
  }
  // глаза: open (.eo) и «счастливые» дуги (.eh) — переключаются классом .happy
  // EYE — параметры глаз для стадий взросления (размер, «уверенные» веки); задаёт growPet() на время отрисовки
  var EYE = null;
  function eyes(x1, x2, y, r, kind, o) {
    o = o || {};
    var E = EYE || {}; r = r * (E.s || 1);
    var open = '', happy = '', hs = o.happyStroke || '#2a2c3a', lids = '';
    [x1, x2].forEach(function (x) {
      if (E.lid && E.lidColor && kind !== 'sleepy') {
        var cid = uid('lc'), inner = x < 100 ? 1 : -1, yo = y - r + 2 * r * E.lid * .55, yi = y - r + 2 * r * E.lid * 1.25;
        lids += '<clipPath id="' + cid + '"><circle cx="' + x + '" cy="' + y + '" r="' + (r + .5) + '"/></clipPath><g clip-path="url(#' + cid + ')"><path d="M' + (x - r - 2) + ' ' + (y - r - 3) + ' H' + (x + r + 2) + ' V' + (inner > 0 ? yi : yo) + ' L' + (x - r - 2) + ' ' + (inner > 0 ? yo : yi) + 'Z" fill="' + E.lidColor + '"/></g>' +
          '<path d="M' + (x - r - 1) + ' ' + (inner > 0 ? yo : yi) + ' L' + (x + r + 1) + ' ' + (inner > 0 ? yi : yo) + '" stroke="' + (E.lineColor || '#1e2030') + '" stroke-width="' + (r * .32) + '" stroke-linecap="round"/>';
      }
      if (kind === 'white') {
        open += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff"/>' +
          '<circle cx="' + (x + r * .08) + '" cy="' + (y + r * .12) + '" r="' + (r * .74) + '" fill="#1e2030"/>';
      } else if (kind === 'iris') {
        open += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff"/>' +
          '<circle cx="' + (x + r * .06) + '" cy="' + (y + r * .1) + '" r="' + (r * .78) + '" fill="' + (o.iris || '#33c7c0') + '"/>' +
          '<circle cx="' + (x + r * .08) + '" cy="' + (y + r * .14) + '" r="' + (r * .46) + '" fill="#1b1533"/>';
      } else if (kind === 'sleepy') {
        open += '<path d="M' + (x - r) + ' ' + y + ' Q' + x + ' ' + (y + r * 1.5) + ' ' + (x + r) + ' ' + y + 'Z" fill="#2a1a10"/>' +
          '<path d="M' + (x - r - 2) + ' ' + y + ' L' + (x + r + 2) + ' ' + y + '" stroke="#5a341c" stroke-width="3.2" stroke-linecap="round"/>' +
          '<circle cx="' + (x - r * .25) + '" cy="' + (y + r * .45) + '" r="' + (r * .22) + '" fill="#fff" opacity=".85"/>';
      } else { // dot
        open += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#1e2030"/>';
      }
      if (kind !== 'sleepy') {
        open += '<circle cx="' + (x - r * .3) + '" cy="' + (y - r * .28) + '" r="' + (r * .34) + '" fill="#fff"/>' +
          '<circle cx="' + (x + r * .32) + '" cy="' + (y + r * .36) + '" r="' + (r * .15) + '" fill="#fff" opacity=".9"/>';
      }
      happy += '<path d="M' + (x - r * .95) + ' ' + (y + r * .25) + ' Q' + x + ' ' + (y - r * 1.05) + ' ' + (x + r * .95) + ' ' + (y + r * .25) + '" fill="none" stroke="' + hs + '" stroke-width="' + Math.max(3.4, r * .38) + '" stroke-linecap="round"/>';
    });
    return '<g class="eo">' + open + lids + '</g><g class="eh">' + happy + '</g>';
  }
  function blush(x1, x2, y, c) {
    c = c || '#ff8fb0';
    return '<ellipse cx="' + x1 + '" cy="' + y + '" rx="10" ry="5.5" fill="' + c + '" opacity=".55"/><ellipse cx="' + x2 + '" cy="' + y + '" rx="10" ry="5.5" fill="' + c + '" opacity=".55"/>';
  }
  var shadow = '<ellipse cx="100" cy="197" rx="56" ry="8" fill="#1b0f4a" opacity=".2"/>';

  // ---------- ПИТОМЦЫ ----------
  // каждый: { svg(defsIds) -> {defs, back, body, head}, hat:{x,y,s}, eyes:[x1,x2,y] }
  var PETS = {};

  PETS.raccoon = function (o) {
    var g1 = uid('rb'), g2 = uid('rh'), grown = o.stage === 'grown';
    var defs = rad(g1, '#c5cad9', '#868ca3') + rad(g2, '#cfd3e0', '#8f95ab', .4, .25);
    // хвост
    var rings = [[146, 168, 19], [161, 152, 18], [172, 133, 17], [177, 112, 16], [175, 92, 14]];
    var tail = '';
    rings.forEach(function (r, i) { tail += '<ellipse cx="' + r[0] + '" cy="' + r[1] + '" rx="' + r[2] + '" ry="' + (r[2] * .92) + '" fill="' + (i % 2 ? '#3f4255' : '#adb2c4') + '"/>'; });
    tail += '<ellipse cx="171" cy="86" rx="6" ry="4" fill="#fff" opacity=".25"/>';
    var body =
      '<ellipse cx="78" cy="190" rx="16" ry="9" fill="#474b5e"/><ellipse cx="122" cy="190" rx="16" ry="9" fill="#474b5e"/>' +
      '<ellipse cx="100" cy="152" rx="47" ry="40" fill="url(#' + g1 + ')"/>' +
      '<ellipse cx="100" cy="161" rx="29" ry="26" fill="#f2f3f9"/>' +
      '<ellipse cx="59" cy="153" rx="11" ry="17" transform="rotate(28 59 153)" fill="#4e5266"/>' +
      '<ellipse cx="141" cy="153" rx="11" ry="17" transform="rotate(-28 141 153)" fill="#4e5266"/>';
    var head =
      '<path d="M50 80 C38 40 62 26 88 50 Z" fill="#8f95ab"/><path d="M57 71 C52 48 64 41 79 53 Z" fill="#ffadc4"/>' +
      '<path d="M150 80 C162 40 138 26 112 50 Z" fill="#8f95ab"/><path d="M143 71 C148 48 136 41 121 53 Z" fill="#ffadc4"/>' +
      '<ellipse cx="100" cy="95" rx="60" ry="50" fill="url(#' + g2 + ')"/>' +
      '<path d="M41 100 L30 92 L42 110 L32 112 L48 120 Z" fill="#a4a9bb"/><path d="M159 100 L170 92 L158 110 L168 112 L152 120 Z" fill="#a4a9bb"/>' +
      '<path d="M52 108 Q100 74 148 108 Q142 145 100 145 Q58 145 52 108Z" fill="#f4f5fa"/>' +
      '<path d="M100 46 Q111 66 105 86 L95 86 Q89 66 100 46Z" fill="#5b6075"/>' +
      '<path d="M43 93 Q58 70 88 84 Q100 92 112 84 Q142 70 157 93 Q151 116 124 111 Q108 107 100 100 Q92 107 76 111 Q49 116 43 93Z" fill="#363a4c"/>' +
      eyes(76, 124, 94, grown ? 10 : 11.5, 'white', { happyStroke: '#fff' }) +
      (grown ? '<path d="M62 76 Q76 70 90 80" stroke="#22243a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M138 76 Q124 70 110 80" stroke="#22243a" stroke-width="5" fill="none" stroke-linecap="round"/>' : '') +
      '<ellipse cx="100" cy="115" rx="8.5" ry="6" fill="#2a2c38"/><ellipse cx="97" cy="113" rx="3" ry="1.6" fill="#fff" opacity=".7"/>' +
      (grown ? '<path d="M88 124 Q100 132 114 121" stroke="#2a2c38" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
             : '<path d="M89 122 Q94.5 128.5 100 122 Q105.5 128.5 111 122" stroke="#2a2c38" stroke-width="3" fill="none" stroke-linecap="round"/>') +
      blush(63, 137, 120);
    if (!grown) return { defs: defs, back: tail, body: body, head: head, hat: { x: 100, y: 58, s: 1 }, eyes: [76, 124, 94] };
    // взрослый енот: больше тело, голова выше, бандана, монета
    var gs = .9, hy = 80;
    var t = 'translate(100 ' + hy + ') scale(' + gs + ') translate(-100 -95)';
    var g3 = uid('rc');
    defs += rad(g3, '#ffe27a', '#f4a51c');
    var bodyG =
      '<ellipse cx="74" cy="192" rx="18" ry="9" fill="#474b5e"/><ellipse cx="126" cy="192" rx="18" ry="9" fill="#474b5e"/>' +
      '<ellipse cx="100" cy="146" rx="56" ry="50" fill="url(#' + g1 + ')"/>' +
      '<ellipse cx="100" cy="158" rx="35" ry="34" fill="#f2f3f9"/>' +
      '<path d="M54 118 Q100 142 146 118 L144 134 Q100 158 56 134Z" fill="#ff4d6d"/><path d="M54 118 Q100 142 146 118" stroke="#d92f52" stroke-width="2" fill="none"/>' +
      '<circle cx="72" cy="132" r="2.5" fill="#fff" opacity=".8"/><circle cx="100" cy="142" r="2.5" fill="#fff" opacity=".8"/><circle cx="128" cy="132" r="2.5" fill="#fff" opacity=".8"/>' +
      '<path d="M128 132 L150 150 L138 154Z" fill="#e63958"/>' +
      '<ellipse cx="52" cy="160" rx="13" ry="20" transform="rotate(20 52 160)" fill="#4e5266"/>' +
      '<g transform="translate(150 158)"><circle r="17" fill="url(#' + g3 + ')" stroke="#d88a0f" stroke-width="2.5"/><circle r="11" fill="none" stroke="#fff3c0" stroke-width="2" opacity=".8"/><path d="M-4 -6 L4 -6 L4 6 M-6 0 L2 0" stroke="#c77a06" stroke-width="3" fill="none" stroke-linecap="round"/></g>' +
      '<ellipse cx="146" cy="168" rx="11" ry="13" fill="#4e5266"/>';
    return {
      defs: defs, back: '<g transform="translate(150 182) scale(1.22) translate(-146 -170)">' + tail + '</g>', body: bodyG,
      head: '<g transform="' + t + '">' + head + '</g>',
      hat: { x: 100, y: hy - 37 * gs + 1, s: gs }, eyes: [100 + (76 - 100) * gs, 100 + (124 - 100) * gs, hy + (94 - 95) * gs]
    };
  };

  PETS.goose = function () {
    var g1 = uid('gb'), g2 = uid('gk');
    var defs = rad(g1, '#ffffff', '#d9deeb', .4, .25) + lin(g2, '#ffc04a', '#ff8418');
    var back = '<path d="M140 140 Q168 128 170 112 Q160 120 150 118 Q164 108 160 96 Q150 112 136 120Z" fill="#e2e6f0"/>';
    var body =
      '<path d="M70 186 l-10 8 h22z M70 186 l0 8" fill="#ff9a1f"/><ellipse cx="78" cy="191" rx="15" ry="7" fill="url(#' + g2 + ')"/><ellipse cx="122" cy="191" rx="15" ry="7" fill="url(#' + g2 + ')"/>' +
      '<ellipse cx="100" cy="150" rx="49" ry="42" fill="url(#' + g1 + ')"/>' +
      '<path d="M54 136 Q34 158 58 182 Q74 168 68 138Z" fill="#dfe4ef"/><path d="M146 136 Q166 158 142 182 Q126 168 132 138Z" fill="#dfe4ef"/>' +
      '<path d="M60 150 Q56 162 62 172" stroke="#c9d0df" stroke-width="2" fill="none"/><path d="M140 150 Q144 162 138 172" stroke="#c9d0df" stroke-width="2" fill="none"/>';
    var head =
      '<path d="M96 52 Q88 34 100 38 Q100 28 112 34 Q104 44 106 54Z" fill="#e6eaf3"/>' +
      '<circle cx="100" cy="92" r="45" fill="url(#' + g1 + ')"/>' +
      '<path d="M56 78 Q100 56 144 78 L142 90 Q100 70 58 90Z" fill="#ff4d5e"/><path d="M58 84 Q100 64 142 84" stroke="#ffd1d6" stroke-width="2" stroke-dasharray="3 6" fill="none" opacity=".8"/>' +
      '<path d="M138 80 L164 70 L156 86Z" fill="#e63950"/><path d="M138 86 L160 96 L146 100Z" fill="#e63950"/><circle cx="140" cy="84" r="5" fill="#ff4d5e"/>' +
      eyes(83, 117, 101, 8, 'dot') +
      '<path d="M71 92 L92 96" stroke="#2a2c3a" stroke-width="4.5" stroke-linecap="round"/><path d="M129 92 L108 96" stroke="#2a2c3a" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M82 114 Q100 104 118 114 Q114 131 100 133 Q86 131 82 114Z" fill="url(#' + g2 + ')"/><path d="M85 118 Q100 124 115 118" stroke="#e0701a" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="94" cy="111" rx="5" ry="2" fill="#fff" opacity=".5"/>' +
      blush(68, 132, 116);
    return { defs: defs, back: back, body: body, head: head, hat: { x: 100, y: 62, s: .92 }, eyes: [83, 117, 101] };
  };

  PETS.capybara = function (o) {
    var g1 = uid('cb'), g2 = uid('ch'), g3 = uid('cm');
    var defs = rad(g1, '#d49862', '#a5693b') + rad(g2, '#dba36c', '#ab6f40', .4, .25) + rad(g3, '#ffc35a', '#ff7a00');
    var body =
      '<ellipse cx="74" cy="189" rx="14" ry="8" fill="#7b4a28"/><ellipse cx="126" cy="189" rx="14" ry="8" fill="#7b4a28"/>' +
      '<ellipse cx="100" cy="155" rx="57" ry="38" fill="url(#' + g1 + ')"/>' +
      '<ellipse cx="100" cy="164" rx="34" ry="20" fill="#e2b483" opacity=".7"/>';
    var head =
      '<circle cx="60" cy="62" r="12" fill="#9a5f37"/><circle cx="60" cy="63" r="6.5" fill="#6e3e20"/>' +
      '<circle cx="140" cy="62" r="12" fill="#9a5f37"/><circle cx="140" cy="63" r="6.5" fill="#6e3e20"/>' +
      '<rect x="45" y="55" width="110" height="96" rx="47" fill="url(#' + g2 + ')"/>' +
      '<path d="M70 66 Q74 60 80 66 M96 62 Q100 56 104 62 M120 66 Q126 60 130 66" stroke="#b77b4a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>' +
      eyes(76, 124, 92, 8, 'sleepy', { happyStroke: '#4a2a16' }) +
      '<ellipse cx="100" cy="124" rx="38" ry="25" fill="#9d6338"/><ellipse cx="100" cy="118" rx="26" ry="10" fill="#b87a49" opacity=".6"/>' +
      '<ellipse cx="88" cy="118" rx="4.5" ry="3.4" fill="#3e2212"/><ellipse cx="112" cy="118" rx="4.5" ry="3.4" fill="#3e2212"/>' +
      '<path d="M91 133 Q100 139 109 133" stroke="#3e2212" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      blush(62, 138, 112, '#ff8a7a') +
      (o.hat ? '' : '<g class="mandarin"><circle cx="100" cy="44" r="16" fill="url(#' + g3 + ')"/><circle cx="94" cy="38" r="4" fill="#fff" opacity=".45"/><path d="M100 29 Q111 18 121 27 Q110 34 100 29Z" fill="#3fbf5f"/><path d="M100 29 L100 33" stroke="#2f8f45" stroke-width="2.5" stroke-linecap="round"/></g>');
    return { defs: defs, back: '', body: body, head: head, hat: { x: 100, y: 66, s: 1 }, eyes: [76, 124, 93] };
  };

  PETS.dragon = function () {
    var g1 = uid('db'), g2 = uid('dh'), g3 = uid('dw'), g4 = uid('dg');
    var defs = rad(g1, '#a98bff', '#6a4be3') + rad(g2, '#b49aff', '#6f51ea', .4, .25) + lin(g3, '#ffb3e6', '#a374ff') + lin(g4, '#ffe28a', '#ffb02e');
    var back =
      '<path d="M62 132 Q22 108 26 64 Q40 86 50 84 Q46 104 64 112 Z" fill="url(#' + g3 + ')"/><path d="M60 124 Q40 106 38 86 M58 116 Q50 104 50 92" stroke="#fff" stroke-width="2" fill="none" opacity=".4"/>' +
      '<path d="M138 132 Q178 108 174 64 Q160 86 150 84 Q154 104 136 112 Z" fill="url(#' + g3 + ')"/><path d="M140 124 Q160 106 162 86 M142 116 Q150 104 150 92" stroke="#fff" stroke-width="2" fill="none" opacity=".4"/>' +
      '<path d="M130 172 Q170 182 174 146" stroke="#6f51ea" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M174 124 L189 146 L174 150 L161 141Z" fill="url(#' + g4 + ')"/>';
    var body =
      '<ellipse cx="80" cy="190" rx="15" ry="8" fill="#5136c4"/><ellipse cx="120" cy="190" rx="15" ry="8" fill="#5136c4"/>' +
      '<circle cx="72" cy="194" r="2.4" fill="#fff"/><circle cx="80" cy="196" r="2.4" fill="#fff"/><circle cx="120" cy="196" r="2.4" fill="#fff"/><circle cx="128" cy="194" r="2.4" fill="#fff"/>' +
      '<ellipse cx="100" cy="152" rx="47" ry="40" fill="url(#' + g1 + ')"/>' +
      '<ellipse cx="100" cy="160" rx="28" ry="28" fill="url(#' + g4 + ')"/>' +
      '<path d="M78 150 Q100 156 122 150 M76 162 Q100 168 124 162 M80 174 Q100 180 120 174" stroke="#e99b2a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>';
    var head =
      '<path d="M86 50 L93 30 L102 48Z M100 46 L108 26 L116 48Z" fill="url(#' + g4 + ')"/>' +
      '<path d="M66 60 Q52 38 60 24 Q70 42 84 52Z" fill="url(#' + g4 + ')"/><path d="M134 60 Q148 38 140 24 Q130 42 116 52Z" fill="url(#' + g4 + ')"/>' +
      '<ellipse cx="100" cy="93" rx="57" ry="48" fill="url(#' + g2 + ')"/>' +
      '<path d="M44 92 L32 86 L44 104Z M156 92 L168 86 L156 104Z" fill="#8a6cf5"/>' +
      eyes(77, 123, 89, 13, 'iris', { iris: '#3ad3c7' }) +
      '<ellipse cx="100" cy="117" rx="30" ry="17" fill="#c2aaff"/><ellipse cx="91" cy="112" rx="3" ry="2.2" fill="#4a32a8"/><ellipse cx="109" cy="112" rx="3" ry="2.2" fill="#4a32a8"/>' +
      '<path d="M89 124 Q100 133 111 124" stroke="#3b2690" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M104 127 L106.5 133 L109.5 125.5Z" fill="#fff"/>' +
      '<circle cx="70" cy="66" r="3" fill="#cdbbff"/><circle cx="62" cy="74" r="2" fill="#cdbbff"/><circle cx="130" cy="66" r="3" fill="#cdbbff"/><circle cx="138" cy="74" r="2" fill="#cdbbff"/>' +
      blush(62, 138, 112, '#ff8fd0');
    return { defs: defs, back: back, body: body, head: head, hat: { x: 100, y: 58, s: .95 }, eyes: [77, 123, 89] };
  };

  // ---------- ШАПКИ (база шапки в 0,0, ширина ~90) ----------
  var HATS = {
    crown: function () {
      var g = uid('hc');
      return '<defs>' + lin(g, '#ffe47a', '#f5a313') + '</defs><path d="M-36 2 L-41 -38 L-20 -18 L0 -48 L20 -18 L41 -38 L36 2Z" fill="url(#' + g + ')" stroke="#d98a07" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<rect x="-38" y="-8" width="76" height="12" rx="5" fill="#f7b928" stroke="#d98a07" stroke-width="2"/>' +
        '<circle cx="0" cy="-2" r="4.5" fill="#ff4d6d"/><circle cx="-22" cy="-2" r="3.5" fill="#3ad3c7"/><circle cx="22" cy="-2" r="3.5" fill="#3ad3c7"/>' +
        '<circle cx="0" cy="-48" r="4" fill="#fff6c8"/><circle cx="-41" cy="-38" r="3.4" fill="#fff6c8"/><circle cx="41" cy="-38" r="3.4" fill="#fff6c8"/><path d="M-26 -14 L-30 -30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>';
    },
    ushanka: function () {
      var g = uid('hu');
      return '<defs>' + lin(g, '#a8714a', '#6e4126') + '</defs>' +
        '<ellipse cx="-47" cy="12" rx="13" ry="24" fill="#e7c9a2"/><ellipse cx="47" cy="12" rx="13" ry="24" fill="#e7c9a2"/>' +
        '<path d="M-44 0 Q-46 -50 0 -50 Q46 -50 44 0Z" fill="url(#' + g + ')"/>' +
        '<rect x="-48" y="-16" width="96" height="22" rx="11" fill="#f0d6b3"/><path d="M-40 -10 q4 -3 8 0 q4 3 8 0 q4 -3 8 0 q4 3 8 0 q4 -3 8 0 q4 3 8 0 q4 -3 8 0 q4 3 8 0 q4 -3 8 0 q4 3 8 0" stroke="#d6b48a" stroke-width="2" fill="none"/>' +
        '<path d="M0 -31 l3.2 6.6 7.2 1 -5.2 5 1.3 7.2 -6.5 -3.4 -6.5 3.4 1.3 -7.2 -5.2 -5 7.2 -1z" fill="#ff4d5e"/>';
    },
    party: function () {
      var g = uid('hp');
      return '<defs>' + lin(g, '#ff8fd0', '#8a5cff', 1, 1) + '</defs><path d="M-28 2 L0 -64 L28 2Z" fill="url(#' + g + ')"/>' +
        '<path d="M-20 -16 L16 -2 M-12 -34 L22 -18 M-4 -52 L12 -44" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>' +
        '<circle cx="0" cy="-66" r="9" fill="#ffd23f"/><circle cx="-3" cy="-69" r="3" fill="#fff" opacity=".7"/><ellipse cx="0" cy="2" rx="30" ry="6" fill="#ffd23f"/>';
    },
    // «Тапыш» — шапка подписчиков канала: фирменный колпак с лапкой и золотой каймой
    tapysh: function () {
      var g = uid('ht'), k = uid('hk');
      return '<defs>' + lin(g, '#8b6bff', '#ff5aa5', 0, 1) + lin(k, '#ffe47a', '#f5a313') + '</defs>' +
        '<path d="M-31 2 Q-15 -28 -2 -50 Q2 -55 6 -50 Q17 -28 31 2Z" fill="url(#' + g + ')"/>' +
        '<path d="M-18 -18 Q-11 -34 -4 -44" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".45" fill="none"/>' +
        '<g fill="#fff"><ellipse cx="2" cy="-14" rx="7.5" ry="6"/><circle cx="-6.5" cy="-23" r="3"/><circle cx="-0.5" cy="-26.5" r="3"/><circle cx="5.8" cy="-26" r="3"/><circle cx="11" cy="-21.5" r="2.8"/></g>' +
        '<circle cx="2" cy="-55" r="9" fill="url(#' + k + ')" stroke="#e0a010" stroke-width="2"/><circle cx="-1" cy="-58" r="3" fill="#fff" opacity=".75"/>' +
        '<rect x="-35" y="-5" width="70" height="11" rx="5.5" fill="url(#' + k + ')" stroke="#d98a07" stroke-width="2"/>' +
        '<circle cx="-20" cy="0.5" r="2.2" fill="#ff4d8a"/><circle cx="0" cy="0.5" r="2.2" fill="#ff4d8a"/><circle cx="20" cy="0.5" r="2.2" fill="#ff4d8a"/>';
    },
    viking: function () {
      var g = uid('hv'), h = uid('hh');
      return '<defs>' + lin(g, '#e2e8f3', '#8f9bb3') + lin(h, '#fff4dc', '#e0bf86') + '</defs>' +
        '<path d="M-38 -14 Q-70 -20 -66 -62 Q-58 -36 -34 -34Z" fill="url(#' + h + ')" stroke="#c39b5c" stroke-width="2"/><path d="M38 -14 Q70 -20 66 -62 Q58 -36 34 -34Z" fill="url(#' + h + ')" stroke="#c39b5c" stroke-width="2"/>' +
        '<path d="M-42 2 Q-42 -46 0 -46 Q42 -46 42 2Z" fill="url(#' + g + ')"/><rect x="-44" y="-10" width="88" height="13" rx="5" fill="#b07a3a"/>' +
        '<rect x="-5" y="-46" width="10" height="38" rx="4" fill="#b07a3a"/><circle cx="-26" cy="-4" r="2.6" fill="#ffd56a"/><circle cx="0" cy="-4" r="2.6" fill="#ffd56a"/><circle cx="26" cy="-4" r="2.6" fill="#ffd56a"/><path d="M-26 -30 Q-20 -38 -10 -40" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6" fill="none"/>';
    },
    witch: function () {
      var g = uid('hw');
      return '<defs>' + lin(g, '#5a3a9c', '#2c1a5c') + '</defs><ellipse cx="0" cy="-2" rx="58" ry="11" fill="#2c1a5c"/>' +
        '<path d="M-30 -6 Q-14 -40 4 -82 Q12 -86 16 -78 Q10 -66 14 -56 Q24 -30 30 -6Z" fill="url(#' + g + ')"/>' +
        '<path d="M-29 -10 Q0 -2 29 -10 L27 -22 Q0 -14 -26 -22Z" fill="#ff8a1f"/><rect x="-7" y="-21" width="14" height="12" rx="2" fill="none" stroke="#ffd23f" stroke-width="3"/>' +
        '<path d="M-6 -46 l2 4 4.4 .6 -3.2 3 .8 4.4 -4 -2 -4 2 .8 -4.4 -3.2 -3 4.4 -.6z" fill="#ffd23f"/><circle cx="8" cy="-62" r="2.2" fill="#ffd23f"/>';
    },
    santa: function () {
      return '<path d="M-38 0 Q-34 -52 18 -54 Q50 -54 58 -18 L48 -14 Q40 -38 18 -36 Q30 -16 38 0Z" fill="#ff3b4f"/><path d="M-30 -14 Q-20 -40 10 -44" stroke="#ff8a96" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>' +
        '<circle cx="56" cy="-14" r="10" fill="#fff"/><rect x="-44" y="-12" width="88" height="17" rx="8.5" fill="#fff"/>';
    },
    wreath: function () {
      var s = '<path d="M-44 0 Q0 -22 44 0" stroke="#3fbf5f" stroke-width="6" fill="none" stroke-linecap="round"/>';
      var cols = ['#ff6b9a', '#ffd23f', '#8a5cff', '#ff8a1f', '#3ad3c7', '#ff6b9a', '#ffd23f'];
      for (var i = 0; i < 7; i++) {
        var t = i / 6, x = -42 + 84 * t, y = -22 * 2 * t * (1 - t) * 1.0 - 1;
        s += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + [0, 72, 144, 216, 288].map(function (a) { return '<circle cx="' + (6 * Math.cos(a * Math.PI / 180)).toFixed(1) + '" cy="' + (6 * Math.sin(a * Math.PI / 180)).toFixed(1) + '" r="5" fill="' + cols[i] + '"/>'; }).join('') + '<circle r="3.4" fill="#fff6c8"/></g>';
      }
      return s;
    },
    cap: function () {
      var g = uid('hk');
      return '<defs>' + lin(g, '#6fb8ff', '#3a6cf0') + '</defs><path d="M-40 0 Q-40 -46 0 -46 Q40 -46 40 0Z" fill="url(#' + g + ')"/>' +
        '<path d="M0 -46 V0 M-24 -38 Q-16 -18 -18 0 M24 -38 Q16 -18 18 0" stroke="#2f58c9" stroke-width="2" fill="none" opacity=".6"/><circle cx="0" cy="-46" r="5" fill="#2f58c9"/>' +
        '<path d="M-44 -2 Q0 24 44 -2 Q0 9 -44 -2Z" fill="#23409e"/><circle cx="0" cy="-22" r="10" fill="#ffe066" stroke="#f0a000" stroke-width="2"/><path d="M-4 -24 l4 -4 4 4 M0 -28 v10" stroke="#c56d00" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M-28 -30 Q-22 -40 -12 -42" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45" fill="none"/>';
    },
    bow: function () {
      return '<g transform="translate(26 -4) rotate(14)"><path d="M0 0 L-28 -18 Q-34 0 -28 16Z" fill="#ff5aa5"/><path d="M0 0 L28 -18 Q34 0 28 16Z" fill="#ff5aa5"/>' +
        '<path d="M-8 -3 L-24 -12 M-8 3 L-24 10 M8 -3 L24 -12 M8 3 L24 10" stroke="#ff9ad5" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="-18" cy="-2" r="2.6" fill="#fff"/><circle cx="20" cy="2" r="2.6" fill="#fff"/><rect x="-7" y="-8" width="14" height="16" rx="6" fill="#e63d8a"/></g>';
    },
    shades: null // очки — рисуются отдельно по глазам
  };
  function shades(e) {
    var x1 = e[0], x2 = e[1], y = e[2], w = (x2 - x1) * .62, hh = w * .62;
    var g = uid('hs');
    return '<defs>' + lin(g, '#3a3f5c', '#0d0f1c') + '</defs>' +
      '<path d="M' + (x1 + w * .45) + ' ' + y + ' Q100 ' + (y - 8) + ' ' + (x2 - w * .45) + ' ' + y + '" stroke="#111" stroke-width="4" fill="none"/>' +
      [x1, x2].map(function (x) { return '<rect x="' + (x - w / 2) + '" y="' + (y - hh / 2) + '" width="' + w + '" height="' + hh + '" rx="' + (hh * .45) + '" fill="url(#' + g + ')" stroke="#111" stroke-width="3"/><path d="M' + (x - w * .3) + ' ' + (y - hh * .12) + ' l' + (w * .22) + ' ' + (-hh * .2) + '" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>'; }).join('');
  }



  // ---------- СКИНЫ (за трофеи дуэлей) ----------
  // Скин перекрашивает само тело питомца (мех/перья/чешую) «градиентной картой» по яркости исходного цвета,
  // поэтому тени и блики сохраняются, а работает на любой стадии: стадии рисуются из тех же цветов.
  // Глаза, румянец, клюв, шапки и вещи не трогаем. Редкие скины добавляют узор поверх тела и цветное свечение.
  var FUR = {
    raccoon: ['#474b5e', '#4e5266', '#8f95ab', '#f2f3f9', '#a4a9bb', '#22243a', '#c5cad9', '#868ca3', '#cfd3e0', '#3f4255', '#adb2c4', '#f4f5fa', '#5b6075', '#363a4c',
      '#2b2e44', '#111320', '#1a1c2c', '#23263a', '#15172a'],
    goose: ['#dfe4ef', '#c9d0df', '#ffffff', '#d9deeb', '#e2e6f0', '#e6eaf3', '#e9edf5'],
    capybara: ['#7b4a28', '#9a5f37', '#6e3e20', '#d49862', '#a5693b', '#dba36c', '#ab6f40', '#e2b483', '#b77b4a', '#4a2a16', '#9d6338', '#b87a49', '#8e5530'],
    dragon: ['#cdbbff', '#6f51ea', '#5136c4', '#4a32a8', '#a98bff', '#6a4be3', '#b49aff', '#a374ff', '#8a6cf5', '#c2aaff', '#5f42d6', '#8d72f3', '#3b2690']
  };
  // map: [тёмный, средний, светлый] — куда уходит самый тёмный, средний и самый светлый цвет меха; pat — узор; glow — свечение
  var SKINS = {
    raccoon_ginger: { map: ['#5a2a12', '#e0742a', '#fff1e0'] },
    raccoon_snow:   { map: ['#6d7a96', '#d9e2f2', '#ffffff'] },
    raccoon_night:  { map: ['#0b0f2e', '#2c3a8c', '#9fb4ff'], pat: 'stars', patColor: '#cfe0ff', glow: '#6f8cff' },
    goose_flamingo: { map: ['#c2457a', '#ff9cc4', '#ffe3ef'] },
    goose_coal:     { map: ['#16161f', '#3b3d4f', '#8a8ea6'] },
    goose_ice:      { map: ['#3d8fd6', '#9fe0ff', '#f2fdff'], pat: 'snow', patColor: '#ffffff', glow: '#7fe3ff' },
    capybara_choco: { map: ['#24120a', '#5b3220', '#c08a62'] },
    capybara_mint:  { map: ['#1f6b5a', '#5fd3b0', '#e6fff6'] },
    capybara_lava:  { map: ['#1a0d10', '#4a1f22', '#d0603a'], pat: 'cracks', patColor: '#ffae3a', glow: '#ff7a2a' },
    dragon_emerald: { map: ['#0d4a35', '#22b07a', '#c8ffe4'] },
    dragon_sea:     { map: ['#0d2f6b', '#2f8fe0', '#c9f2ff'] },
    dragon_fire:    { map: ['#4a0a0a', '#e2341c', '#ffd36b'], pat: 'scales', patColor: '#ffcf5a', glow: '#ff6a1f' }
  };
  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgb2hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function luma(h) { var c = hex2rgb(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function mix(a, b, t) { a = hex2rgb(a); b = hex2rgb(b); return rgb2hex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  var SKIN_CACHE = {};
  function skinTable(kind, id) {
    var key = kind + ':' + id; if (SKIN_CACHE[key]) return SKIN_CACHE[key];
    var sk = SKINS[id], fur = FUR[kind], ls = fur.map(luma), lo = Math.min.apply(null, ls), hi = Math.max.apply(null, ls), t = {};
    fur.forEach(function (c, i) {
      var x = (ls[i] - lo) / ((hi - lo) || 1);
      t[c.toLowerCase()] = x < .5 ? mix(sk.map[0], sk.map[1], x * 2) : mix(sk.map[1], sk.map[2], (x - .5) * 2);
    });
    return (SKIN_CACHE[key] = t);
  }
  function recolor(s, tbl) { return s.replace(/#[0-9a-fA-F]{6}\b/g, function (c) { return tbl[c.toLowerCase()] || c; }); }
  // узор: те же фигуры тела (только меховые), залитые узором
  function patternDefs(id, pid) {
    var sk = SKINS[id], c = sk.patColor, p = '';
    if (sk.pat === 'stars') p = '<pattern id="' + pid + '" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">' + star(8, 9, 4.2, c, .95) + star(25, 24, 2.6, c, .8) + '<circle cx="26" cy="7" r="1.3" fill="' + c + '"/><circle cx="9" cy="27" r="1" fill="' + c + '"/></pattern>';
    if (sk.pat === 'snow') p = '<pattern id="' + pid + '" width="30" height="30" patternUnits="userSpaceOnUse"><g stroke="' + c + '" stroke-width="1.6" stroke-linecap="round" opacity=".95"><path d="M9 3 V15 M3.8 6 L14.2 12 M3.8 12 L14.2 6"/></g><circle cx="24" cy="22" r="1.8" fill="' + c + '"/><circle cx="21" cy="8" r="1" fill="' + c + '"/></pattern>';
    if (sk.pat === 'cracks') p = '<pattern id="' + pid + '" width="46" height="40" patternUnits="userSpaceOnUse"><path d="M2 8 L14 14 L12 26 L24 32 M14 14 L28 10 L36 18 L44 14 M36 18 L34 30 L46 36 M12 26 L2 34" stroke="' + c + '" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></pattern>';
    if (sk.pat === 'scales') p = '<pattern id="' + pid + '" width="16" height="12" patternUnits="userSpaceOnUse"><path d="M0 0 Q8 12 16 0 M-8 6 Q0 18 8 6 M8 6 Q16 18 24 6" stroke="' + c + '" stroke-width="1.6" fill="none" opacity=".9"/></pattern>';
    return p;
  }
  function patternOver(src, kind, pid) {
    var fur = FUR[kind], out = '', re = /<(path|ellipse|circle|rect)\b[^>]*?\/>/g, m;
    while ((m = re.exec(src))) {
      var tag = m[0], f = /fill="(#[0-9a-fA-F]{6})"/.exec(tag);
      if (!f || fur.indexOf(f[1].toLowerCase()) < 0 || /opacity="\.?[0-4]/.test(tag)) continue;
      out += tag.replace(/fill="#[0-9a-fA-F]{6}"/, 'fill="url(#' + pid + ')"').replace(/stroke="[^"]*"/g, 'stroke="none"');
    }
    return out;
  }
  // применяет скин к частям питомца (back/body/head/feet — строки SVG до сборки)
  function applySkin(kind, parts, id) {
    if (!id || !SKINS[id] || id.indexOf(kind + '_') !== 0) return parts;
    var tbl = skinTable(kind, id), sk = SKINS[id], r = {};
    Object.keys(parts).forEach(function (k) { r[k] = recolor(parts[k], tbl); });
    if (sk.pat) {
      var pid = uid('sp');
      r.defs = (r.defs || '') + patternDefs(id, pid);
      r.backPat = '<g opacity=".55">' + patternOver(parts.back, kind, pid) + '</g>';
      r.bodyPat = '<g opacity=".55">' + patternOver(parts.body, kind, pid) + '</g>';
    }
    return r;
  }
  function skinFilter(id, fid) {
    var sk = SKINS[id]; if (!sk || !sk.glow) return '';
    return '<filter id="' + fid + '" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="' + sk.glow + '" flood-opacity=".9"/><feDropShadow dx="0" dy="0" stdDeviation="1.6" flood-color="' + sk.glow + '" flood-opacity="1"/></filter>';
  }

  // ---------- ВЗРОСЛЕНИЕ (вариант A «Минимализм») ----------
  // Стадии по уровню «Улучшить»: 1–9 Малыш (обычная графика), 10 Подросток, 20 Взрослый, 30 Сильный (мягкое сияние),
  // 40 Мастер (яркое цветное сияние + кольцо), 50 Легенда (золотая аура). Растёт само тело: пропорции, ножки, взгляд, размер.
  // Уровни и названия совпадают с server/game.js (STAGES).
  var GLOW = { raccoon: '#c9f1ff', goose: '#fff0a8', capybara: '#ffd59a', dragon: '#f0c4ff' };
  var STAGES = [
    { name: 'Малыш',     lvl: 1,  s: 1.00, L: 0,  bx: 1.00, by: 1.00, hs: 1.00, eye: { s: 1 } },
    { name: 'Подросток', lvl: 5,  s: 1.05, L: 13, bx: .90,  by: 1.10, hs: .90,  eye: { s: .9 } },
    { name: 'Взрослый',  lvl: 10, s: 1.11, L: 20, bx: .98,  by: 1.16, hs: .86,  eye: { s: .84, lid: .3 } },
    { name: 'Сильный',   lvl: 15, s: 1.14, L: 20, bx: 1.00, by: 1.17, hs: .86,  eye: { s: .84, lid: .3 } },
    { name: 'Мастер',    lvl: 20, s: 1.18, L: 25, bx: 1.08, by: 1.22, hs: .84,  eye: { s: .8, lid: .38 } },
    { name: 'Легенда',   lvl: 25, s: 1.20, L: 25, bx: 1.08, by: 1.22, hs: .84,  eye: { s: .8, lid: .38 } }
  ];
  var LEG = { raccoon: ['#474b5e', 22, [78, 122]], goose: ['#ff9a1f', 8, [80, 120]], capybara: ['#8e5530', 22, [74, 126]], dragon: ['#5f42d6', 22, [80, 120]] };
  var LID = { raccoon: ['#363a4c', '#15172a'], goose: ['#e9edf5', '#2a2c3a'], capybara: null, dragon: ['#8d72f3', '#3b2690'] };
  function star(x, y, r, c, o) {
    return '<path transform="translate(' + x + ' ' + y + ') scale(' + r / 10 + ')" d="M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10Z" fill="' + c + '" opacity="' + (o || 1) + '"/>';
  }
  // ---- фирменные детали «Взрослого» ----
  function raccoonMask() {
    var g = uid('mk');
    return '<defs>' + lin(g, '#2b2e44', '#111320') + '</defs>' +
      '<path d="M44 90 Q30 80 14 86 Q24 92 22 100 Q34 92 44 98Z" fill="#1a1c2c"/><path d="M44 96 Q30 104 26 120 Q38 110 47 104Z" fill="#23263a"/>' +
      '<path d="M40 93 Q44 70 76 74 Q92 76 100 85 Q108 76 124 74 Q156 70 160 93 Q156 115 126 114 Q110 113 100 103 Q90 113 74 114 Q44 115 40 93Z" fill="url(#' + g + ')"/>' +
      '<path d="M50 84 Q60 76 76 77" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".28"/>' +
      eyes(76, 124, 94, 11.5, 'white', { happyStroke: '#fff' });
  }
  function gooseBowtie() {
    return '<g transform="translate(100 141)"><path d="M0 0 L-24 -13 Q-29 0 -24 13Z" fill="#ff4d5e"/><path d="M0 0 L24 -13 Q29 0 24 13Z" fill="#ff4d5e"/>' +
      '<path d="M-6 -2 L-19 -8 M-6 2 L-19 8 M6 -2 L19 -8 M6 2 L19 8" stroke="#ffb3bc" stroke-width="2" stroke-linecap="round" opacity=".9"/>' +
      '<rect x="-7" y="-8" width="14" height="16" rx="6" fill="#e63950"/><circle cx="-2" cy="-3" r="2" fill="#fff" opacity=".6"/></g>';
  }
  function capyMandarins() {
    var g = uid('cm2');
    return '<defs>' + rad(g, '#ffc35a', '#ff7a00') + '</defs><g>' +
      '<circle cx="100" cy="17" r="12.5" fill="url(#' + g + ')"/><circle cx="96" cy="12" r="3.2" fill="#fff" opacity=".45"/>' +
      '<path d="M100 5 Q109 -4 118 3 Q109 9 100 5Z" fill="#3fbf5f"/><path d="M100 5 Q92 -3 84 2 Q92 8 100 5Z" fill="#35a852"/><path d="M100 5 L100 8" stroke="#2f8f45" stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle cx="128" cy="40" r="3" fill="#fff6c8"/></g>';
  }
  function dragonWings(back, stage) {
    var i = back.indexOf('<path d="M130 172');
    var wings = back.slice(0, i), tail = back.slice(i);
    if (stage < 2) return back;
    var extra = '<path d="M56 118 Q30 100 30 74 M144 118 Q170 100 170 74" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>';
    return '<g transform="translate(100 124) scale(1.42 1.38) translate(-100 -124)">' + wings + extra + '</g>' + tail;
  }
  // ---- аура / сияние ----
  function glowBack(kind, stage) {
    if (stage < 3) return '';
    var g = uid('gl'), s = '';
    s += '<defs><radialGradient id="' + g + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + GLOW[kind] + '" stop-opacity="1"/><stop offset=".55" stop-color="' + GLOW[kind] + '" stop-opacity=".5"/><stop offset="1" stop-color="' + GLOW[kind] + '" stop-opacity="0"/></radialGradient></defs>';
    if (stage >= 4) {
      var gr = uid('au'), rays = '';
      for (var a = 0; a < 360; a += 20) {
        rays += '<path d="M0 0 L' + (150 * Math.cos((a - 4) * Math.PI / 180)).toFixed(1) + ' ' + (150 * Math.sin((a - 4) * Math.PI / 180)).toFixed(1) + ' L' + (150 * Math.cos((a + 4) * Math.PI / 180)).toFixed(1) + ' ' + (150 * Math.sin((a + 4) * Math.PI / 180)).toFixed(1) + 'Z" fill="#ffe27a"/>';
      }
      s += '<defs><radialGradient id="' + gr + '" cx=".5" cy=".5" r=".5"><stop offset=".15" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="m' + gr + '"><circle cx="0" cy="0" r="150" fill="url(#' + gr + ')"/></mask></defs>' +
        '<g transform="translate(100 112)" mask="url(#m' + gr + ')" opacity=".75">' + rays + '</g>' +
        '<circle cx="100" cy="112" r="112" fill="none" stroke="#ffe27a" stroke-width="3" opacity=".55"/><circle cx="100" cy="112" r="122" fill="none" stroke="#fff6c8" stroke-width="1.5" stroke-dasharray="2 9" stroke-linecap="round" opacity=".7"/>';
    }
    s += '<circle cx="100" cy="114" r="' + (stage >= 4 ? 120 : 112) + '" fill="url(#' + g + ')"/>';
    return s;
  }
  function sparklesV1(stage) {
    if (stage === 1) return star(28, 70, 7, '#fff', .9) + star(176, 50, 6, '#fff6c8', .9) + '<path d="M18 150 q-6 -8 0 -16 M182 140 q6 -8 0 -16" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>';
    if (stage === 3) return star(10, 60, 9, '#fff', .95) + star(190, 40, 8, '#fff6c8') + star(196, 150, 6, '#fff', .8) + star(2, 158, 6, '#fff6c8', .8);
    if (stage >= 4) return star(-4, 40, 11, '#ffe27a') + star(204, 26, 10, '#fff6c8') + star(206, 150, 8, '#ffe27a') + star(-8, 160, 8, '#fff') + star(160, -24, 7, '#fff') + star(40, -20, 6, '#ffe27a');
    return '';
  }

  function sparkles(stage) {
    if (stage === 3) return sparklesV1(3);
    if (stage === 4) return star(4, 50, 11, '#fff') + star(196, 30, 10, '#fff6c8') + star(204, 140, 8, '#fff') + star(-6, 150, 8, '#fff6c8') + star(150, -22, 7, '#fff') + star(46, -16, 6, '#fff6c8') + star(214, 84, 5, '#fff') + star(-14, 96, 5, '#fff');
    if (stage === 5) return sparklesV1(4);
    return '';
  }
  function glow(kind, stage) {
    if (stage === 3) return glowBack(kind, 3);
    if (stage === 5) return glowBack(kind, 4);
    if (stage === 4) { // 40: крупнее и ярче, чем 30, но без золота
      var g = uid('gl'), c = GLOW[kind];
      return '<defs><radialGradient id="' + g + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".25" stop-color="' + c + '" stop-opacity="1"/><stop offset=".6" stop-color="' + c + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient></defs>' +
        '<circle cx="100" cy="112" r="132" fill="url(#' + g + ')"/><circle cx="100" cy="112" r="104" fill="none" stroke="' + c + '" stroke-width="3" opacity=".6"/>';
    }
    return '';
  }
  function growPet(kind, stage, o) {
    o = o || {};
    var st = STAGES[stage], lc = LID[kind];
    EYE = { s: st.eye.s, lid: lc ? st.eye.lid : 0, lidColor: lc && lc[0], lineColor: lc && lc[1] };
    var P = PETS[kind]({ hat: o.hat });
    var back = P.back, head = P.head, body = P.body;
    // ноги: отделяем ступни от тела
    var cut = body.indexOf('<ellipse cx="100"'), feet = body.slice(0, cut); body = body.slice(cut);
    // один акцент на стадию (из v1): 20+ фирменная деталь
    if (stage >= 2) {
      if (kind === 'raccoon') head += raccoonMask();
      if (kind === 'goose') head += gooseBowtie();
      if (kind === 'capybara' && !o.hat) head += capyMandarins();
      if (kind === 'dragon') back = dragonWings(back, 2);
    }
    // хвост/уши длиннее с возрастом (тело, не вещи)
    if (kind === 'raccoon' && stage >= 1) back = '<g transform="translate(146 176) scale(' + [1, 1.12, 1.25, 1.25, 1.32, 1.32][stage] + ') translate(-146 -176)">' + back + '</g>';
    if (kind === 'goose' && stage >= 1) back = '<g transform="translate(140 130) scale(' + [1, 1.15, 1.3, 1.3, 1.4, 1.4][stage] + ') translate(-140 -130)">' + back + '</g>';
    var hat = '';
    if (o.hat === 'shades') hat = shades(P.eyes);
    else if (o.hat && HATS[o.hat]) hat = '<g class="p-hat" transform="translate(' + P.hat.x + ' ' + P.hat.y + ') scale(' + P.hat.s + ')">' + HATS[o.hat]() + '</g>';
    EYE = null;
    var L = st.L, lg = LEG[kind].slice();
    var SK = applySkin(kind, { back: back, body: body, head: head, feet: feet, defs: P.defs, leg: lg[0] }, o.skin);
    back = SK.back; body = SK.body; head = SK.head; feet = SK.feet; lg[0] = SK.leg;
    if (SK.bodyPat) { back += SK.backPat; body += SK.bodyPat; }
    var bodyT = 'translate(0 ' + (-L) + ') translate(100 194) scale(' + st.bx + ' ' + st.by + ') translate(-100 -194)';
    var lift = -L - (st.by - 1) * 60;
    var headT = 'translate(100 ' + (140 + lift) + ') scale(' + st.hs + ') translate(-100 -140)';
    var allT = 'translate(100 197) scale(' + st.s + ') translate(-100 -197)';
    var legs = '';
    if (L > 0) lg[2].forEach(function (x) {
      var xx = 100 + (x - 100) * st.bx;
      legs += '<rect x="' + (xx - lg[1] / 2) + '" y="' + (186 - L - 14) + '" width="' + lg[1] + '" height="' + (L + 20) + '" rx="' + (lg[1] / 2) + '" fill="' + lg[0] + '"/>';
    });
    var feetG = L > 0 ? '<g transform="translate(100 190) scale(' + st.bx + ' 1) translate(-100 -190)">' + feet + '</g>' : '';
    var f = stage === 5 ? uid('lf') : '';
    var sfid = uid('sg'), sf = o.skin && SKINS[o.skin] && SKINS[o.skin].glow && o.skin.indexOf(kind + '_') === 0 ? skinFilter(o.skin, sfid) : '';
    var defs = SK.defs + sf + (f ? '<filter id="' + f + '" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="3.2" flood-color="#ffd23f" flood-opacity=".95"/></filter>' : '');
    var shadow = '<ellipse cx="100" cy="197" rx="' + (56 * st.s * st.bx) + '" ry="8" fill="#1b0f4a" opacity=".2"/>';
    return '<svg class="pet grow g' + stage + ' pet-' + kind + (o.cls ? ' ' + o.cls : '') + '" viewBox="' + (o.vb || '-42 -58 284 268') + '" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' +
      glow(kind, stage) + shadow +
      '<g' + (sf ? ' filter="url(#' + sfid + ')"' : '') + '><g transform="' + allT + '"' + (f ? ' filter="url(#' + f + ')"' : '') + '>' +
        legs + feetG +
        '<g transform="' + bodyT + '"><g class="p-back">' + back + '</g><g class="p-body">' + (L > 0 ? '' : feet) + body + '</g></g>' +
        '<g class="p-head" transform="' + headT + '">' + head + hat + '</g>' +
      '</g></g>' + sparkles(stage) + '</svg>';
  }
  function stageOf(petLvl) { var i = 0; for (var k = 1; k < STAGES.length; k++) if (petLvl >= STAGES[k].lvl) i = k; return i; }

  // pet(kind, { grow: 0…5 }) — стадия взросления; 0 (или без grow) — малыш, как раньше
  function pet(kind, o) {
    o = o || {};
    if (o.grow > 0 && STAGES[o.grow]) return growPet(kind, o.grow, o);
    var P = PETS[kind](o), hat = '';
    if (o.skin) {
      var cut0 = P.body.indexOf('<ellipse cx="100"');
      var SK0 = applySkin(kind, { back: P.back, body: P.body, head: P.head, defs: P.defs }, o.skin);
      P = Object.assign({}, P, { back: SK0.back + (SK0.backPat || ''), body: SK0.body + (SK0.bodyPat || ''), head: SK0.head, defs: SK0.defs });
      if (SKINS[o.skin] && SKINS[o.skin].glow && o.skin.indexOf(kind + '_') === 0) { P.glowF = uid('sg'); P.defs += skinFilter(o.skin, P.glowF); }
    }
    if (o.hat === 'shades') hat = shades(P.eyes);
    else if (o.hat && HATS[o.hat]) hat = '<g class="p-hat" transform="translate(' + P.hat.x + ' ' + P.hat.y + ') scale(' + P.hat.s + ')">' + HATS[o.hat]() + '</g>';
    var flip = o.flip ? ' transform="translate(200 0) scale(-1 1)"' : '';
    return '<svg class="pet pet-' + kind + (o.cls ? ' ' + o.cls : '') + '" viewBox="' + (o.vb || '0 0 200 206') + '" xmlns="http://www.w3.org/2000/svg"><defs>' + P.defs + '</defs><g' + flip + (P.glowF ? ' filter="url(#' + P.glowF + ')"' : '') + '>' +
      (o.noShadow ? '' : shadow) + '<g class="p-back">' + P.back + '</g><g class="p-body">' + P.body + '</g><g class="p-head">' + P.head + '</g>' + hat + '</g></svg>';
  }
  // аватар: только голова, крупно
  function avatar(kind, o) {
    o = o || {};
    var vb = { raccoon: '22 20 156 140', goose: '30 22 140 132', capybara: '28 18 144 140', dragon: '18 14 164 140' }[kind];
    if (o.stage === 'grown' && kind === 'raccoon') vb = '22 6 156 140';
    return pet(kind, { stage: o.stage, hat: o.hat, skin: o.skin, vb: vb, noShadow: true, cls: 'ava-svg' });
  }
  function hatIcon(id) {
    if (id === 'shades') return '<svg viewBox="0 0 200 120" class="hat-svg">' + shades([62, 138, 60]) + '</svg>';
    return '<svg viewBox="-75 -95 150 120" class="hat-svg">' + HATS[id]() + '</svg>';
  }

  // ---------- ЯЙЦА ----------
  var EGG = 'M80 8 C124 8 152 86 152 124 C152 170 120 194 80 194 C40 194 8 170 8 124 C8 86 36 8 80 8Z';
  function egg(kind, o) {
    o = o || {};
    var g = uid('eg'), c = uid('ec'), s = '';
    var col = { raccoon: ['#e3e6ef', '#9aa0b5'], goose: ['#fffaf0', '#f1dcb8'], capybara: ['#f2cf9e', '#c58a52'], dragon: ['#c3a6ff', '#6a43e0'] }[kind];
    if (kind === 'raccoon') s = '<path d="M0 70 Q40 58 80 70 T160 70 V92 Q120 80 80 92 T0 92Z M0 128 Q40 116 80 128 T160 128 V150 Q120 138 80 150 T0 150Z" fill="#4a4e63"/><path d="M0 100 Q40 92 80 100 T160 100" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/>';
    else if (kind === 'goose') s = [[50, 60, 9], [104, 48, 7], [118, 96, 11], [40, 112, 8], [78, 92, 6], [96, 146, 10], [50, 162, 7], [130, 150, 6], [76, 30, 5]].map(function (d) { return '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="#ff9a2a" opacity=".85"/>'; }).join('') + '<path d="M0 124 l14 -10 14 10 14 -10 14 10 14 -10 14 10 14 -10 14 10 14 -10 14 10 14 -10 V136 l-14 10 -14 -10 -14 10 -14 -10 -14 10 -14 -10 -14 10 -14 -10 -14 10 -14 -10 -14 10Z" fill="#ff4d5e" opacity=".9"/>';
    else if (kind === 'capybara') s = [[44, 70, 16, 11], [112, 60, 12, 8], [98, 112, 20, 13], [38, 140, 13, 9], [126, 150, 15, 10], [72, 172, 11, 7]].map(function (d) { return '<ellipse cx="' + d[0] + '" cy="' + d[1] + '" rx="' + d[2] + '" ry="' + d[3] + '" fill="#8e5a31" opacity=".55"/>'; }).join('') + '<path d="M70 18 Q80 4 96 10 Q86 22 70 18Z" fill="#3fbf5f"/>';
    else if (kind === 'dragon') {
      for (var r = 0; r < 8; r++) for (var q = 0; q < 7; q++) { var x = q * 26 + (r % 2) * 13 - 6, y = 30 + r * 22; s += '<path d="M' + (x - 12) + ' ' + y + ' Q' + x + ' ' + (y + 16) + ' ' + (x + 12) + ' ' + y + '" stroke="#ffd56a" stroke-width="2.6" fill="none" opacity=".55"/>'; }
      s += '<path d="M112 50 l3 7 7.5 1 -5.5 5 1.4 7.5 -6.4 -3.6 -6.4 3.6 1.4 -7.5 -5.5 -5 7.5 -1z M44 120 l2 4.6 5 .7 -3.6 3.4 .9 5 -4.3 -2.4 -4.3 2.4 .9 -5 -3.6 -3.4 5 -.7z" fill="#fff3b0"/>';
    }
    var stage = o.stage || 0;
    var cracks = '';
    if (stage >= 1) cracks += '<path d="M84 40 L76 56 L88 64 L80 80" class="crack"/>';
    if (stage >= 2) cracks += '<path d="M80 80 L94 92 L86 104 L100 116 M88 64 L104 60 L112 72" class="crack"/><path d="M40 120 L52 128 L46 140" class="crack"/>';
    if (stage >= 3) cracks += '<path d="M14 108 L30 98 L42 110 L58 96 L72 108 L86 96 L100 110 L114 96 L128 108 L146 98" class="crack big"/><path d="M118 140 L128 150 L122 162" class="crack"/>';
    return '<svg class="egg egg-' + kind + '" viewBox="0 0 160 206" xmlns="http://www.w3.org/2000/svg"><defs>' + rad(g, col[0], col[1], .35, .25) + '<clipPath id="' + c + '"><path d="' + EGG + '"/></clipPath></defs>' +
      '<ellipse cx="80" cy="198" rx="56" ry="7" fill="#1b0f4a" opacity=".2"/>' +
      '<path d="' + EGG + '" fill="url(#' + g + ')"/><g clip-path="url(#' + c + ')">' + s + '<path d="M152 90 Q160 170 80 196 Q150 196 160 120Z" fill="#000" opacity=".08"/></g>' +
      '<ellipse cx="52" cy="54" rx="13" ry="22" transform="rotate(24 52 54)" fill="#fff" opacity=".45"/><ellipse cx="44" cy="84" rx="5" ry="7" fill="#fff" opacity=".35"/>' +
      '<g fill="none" stroke="#3a2b55" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">' + cracks + '</g></svg>';
  }
  // скорлупка (две половинки) для анимации вылупления
  function shellHalves(kind) {
    var g = uid('eh'), col = { raccoon: ['#e3e6ef', '#9aa0b5'], goose: ['#fffaf0', '#f1dcb8'], capybara: ['#f2cf9e', '#c58a52'], dragon: ['#c3a6ff', '#6a43e0'] }[kind];
    var top = 'M80 8 C124 8 152 86 152 100 L138 108 L120 96 L104 110 L88 96 L72 110 L56 96 L40 110 L22 98 L8 104 C10 86 36 8 80 8Z';
    var bot = 'M8 112 L22 106 L40 118 L56 104 L72 118 L88 104 L104 118 L120 104 L138 116 L152 108 C152 170 120 194 80 194 C40 194 8 170 8 124Z';
    var d = '<defs>' + rad(g, col[0], col[1], .35, .25) + '</defs>';
    return {
      top: '<svg viewBox="0 0 160 206" class="shell shell-top">' + d + '<path d="' + top + '" fill="url(#' + g + ')" stroke="#3a2b55" stroke-width="3" stroke-linejoin="round"/><ellipse cx="52" cy="54" rx="13" ry="22" transform="rotate(24 52 54)" fill="#fff" opacity=".45"/></svg>',
      bot: '<svg viewBox="0 0 160 206" class="shell shell-bot">' + d + '<path d="' + bot + '" fill="url(#' + g + ')" stroke="#3a2b55" stroke-width="3" stroke-linejoin="round"/></svg>'
    };
  }

  // ---------- ГЕРБЫ КЛАНОВ ----------
  function crest(kind, o) {
    o = o || {};
    var g = uid('cr');
    var col = o.colors || { raccoon: ['#4fe3a2', '#14a87a'], goose: ['#ff8a6b', '#e2364f'], capybara: ['#ffc15a', '#e07b1a'], dragon: ['#b59bff', '#6a43e0'] }[kind];
    var inner = avatar(kind, { stage: kind === 'raccoon' ? 'grown' : null }).replace('<svg ', '<svg x="18" y="16" width="64" height="58" ');
    return '<svg class="crest" viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg"><defs>' + lin(g, col[0], col[1]) + '</defs>' +
      '<path d="M50 4 L92 16 Q94 70 50 108 Q6 70 8 16Z" fill="#fff" opacity=".95"/>' +
      '<path d="M50 10 L86 20 Q87 68 50 100 Q13 68 14 20Z" fill="url(#' + g + ')"/>' +
      '<path d="M50 10 L86 20 Q87 40 80 56 Q50 30 16 40 Q14 30 14 20Z" fill="#fff" opacity=".15"/>' + inner +
      '<path d="M22 84 Q50 92 78 84 L74 96 Q50 102 26 96Z" fill="#ffd23f"/><path d="M38 88 l2 4 4 .5 -3 2.6 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -2.6 4 -.5z M62 88 l2 4 4 .5 -3 2.6 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -2.6 4 -.5z" fill="#e08a00" transform="translate(0 -1) scale(1)"/></svg>';
  }

  // ---------- ИКОНКИ ----------
  var IC = {
    cup: '<svg viewBox="0 0 24 24" class="i-cup"><path d="M7 3.5 H17 V9 Q17 14 12 14.6 Q7 14 7 9Z" fill="#ffc93a" stroke="#d98a07" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 5.5 H4.2 Q4 9.6 7.6 10.6 M17 5.5 H19.8 Q20 9.6 16.4 10.6" fill="none" stroke="#d98a07" stroke-width="1.6" stroke-linecap="round"/><path d="M10.6 14.4 H13.4 L13.9 17.6 H10.1Z" fill="#e9a21a"/><rect x="7.6" y="17.4" width="8.8" height="3.4" rx="1.2" fill="#b86a00"/><path d="M9.2 5.4 Q9 8.6 10.6 10.4" stroke="#fff6c8" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/></svg>',
    coin: '<svg viewBox="0 0 40 40" class="i-coin"><circle cx="20" cy="20" r="18" fill="url(#icg)" stroke="#d47a00" stroke-width="2"/><circle cx="20" cy="20" r="12.5" fill="none" stroke="#fff4c0" stroke-width="2" opacity=".75"/><g fill="#c56d00"><ellipse cx="20" cy="23.5" rx="5" ry="4"/><circle cx="13.6" cy="17.6" r="2.4"/><circle cx="17.6" cy="13.8" r="2.4"/><circle cx="22.4" cy="13.8" r="2.4"/><circle cx="26.4" cy="17.6" r="2.4"/></g></svg>',
    bolt: '<svg viewBox="0 0 24 24" class="i-bolt"><path d="M13.5 2 L4.5 13.5 H11 L9.8 22 L19.5 9.8 H13 Z" fill="#ffd23f" stroke="#f08c00" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    paw: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="15.5" rx="5.2" ry="4.4" fill="currentColor"/><circle cx="5.4" cy="10" r="2.3" fill="currentColor"/><circle cx="9.2" cy="5.8" r="2.4" fill="currentColor"/><circle cx="14.8" cy="5.8" r="2.4" fill="currentColor"/><circle cx="18.6" cy="10" r="2.3" fill="currentColor"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 2 L20.5 5 Q21 15 12 22 Q3 15 3.5 5Z" fill="currentColor"/><path d="M12 7.5 l1.4 2.9 3.2.5 -2.3 2.2 .5 3.1 -2.8 -1.5 -2.8 1.5 .5 -3.1 -2.3 -2.2 3.2 -.5z" fill="#fff" opacity=".9"/></svg>',
    swords: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4 L14 14 M4 4 h4 M4 4 v4"/><path d="M20 4 L10 14 M20 4 h-4 M20 4 v4"/><path d="M12 16 l-4 4 M8 16 l4 4 M12 16 l4 4 M16 16 l-4 4" stroke-width="2.6"/><circle cx="6" cy="18" r="2" fill="currentColor"/><circle cx="18" cy="18" r="2" fill="currentColor"/></svg>',
    friends: '<svg viewBox="0 0 24 24"><circle cx="8.5" cy="8" r="3.8" fill="currentColor"/><path d="M1.5 20 Q2 13.5 8.5 13.5 Q15 13.5 15.5 20Z" fill="currentColor"/><circle cx="17" cy="8.8" r="3.1" fill="currentColor" opacity=".75"/><path d="M14.6 14.2 Q16 13.6 17 13.6 Q22.4 13.6 22.6 19.4 H17.2 Q17 16.2 14.6 14.2Z" fill="currentColor" opacity=".75"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M4 8 H20 L18.8 20.5 Q18.6 22 17 22 H7 Q5.4 22 5.2 20.5Z" fill="currentColor"/><path d="M8.5 10 V6.5 Q8.5 2.8 12 2.8 Q15.5 2.8 15.5 6.5 V10" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="8.5" cy="11" r="1.4" fill="#fff"/><circle cx="15.5" cy="11" r="1.4" fill="#fff"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19 V6 M6 11 L12 5 L18 11"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="2.5" fill="currentColor"/><rect x="2" y="7" width="20" height="4.5" rx="1.8" fill="currentColor"/><rect x="10.6" y="7" width="2.8" height="14" fill="#fff" opacity=".85"/><path d="M12 7 Q8 1.5 5.8 4.4 Q4.4 7 12 7 Q19.6 7 18.2 4.4 Q16 1.5 12 7Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15.5 14"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 5 Q16 4 15 4 H6 Q4 4 4 6 V15 Q4 16 5 16"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 V15 M7 8 L12 3 L17 8"/><path d="M5 12 V19 Q5 21 7 21 H17 Q19 21 19 19 V12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 L10 17.5 L19 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M12 5 V19 M5 12 H19"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="11" rx="3" fill="currentColor"/><path d="M8 10.5 V8 Q8 3.5 12 3.5 Q16 3.5 16 8 V10.5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M9 11 V4.5 Q9 3 10.5 3 Q12 3 12 4.5 V10 L12 9 Q12 7.6 13.4 7.6 Q14.8 7.6 14.8 9 V10.4 Q14.8 9.2 16.1 9.2 Q17.4 9.2 17.4 10.6 V11.6 Q17.4 10.6 18.6 10.6 Q19.8 10.6 19.8 12 V15.5 Q19.8 21 14.2 21 H12.4 Q9.6 21 7.8 18.6 L4.6 14.2 Q3.8 13 4.9 12.2 Q6 11.4 7 12.4 L9 14.4Z" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.5 l2.9 6 6.6.9 -4.8 4.6 1.2 6.5 -5.9 -3.2 -5.9 3.2 1.2 -6.5 -4.8 -4.6 6.6 -.9z" fill="currentColor"/></svg>',
    chest: '<svg viewBox="0 0 64 56"><path d="M6 24 Q6 6 32 6 Q58 6 58 24Z" fill="url(#chg)" stroke="#5a2f12" stroke-width="2.5"/><rect x="6" y="24" width="52" height="26" rx="4" fill="url(#chg)" stroke="#5a2f12" stroke-width="2.5"/><rect x="4" y="21" width="56" height="7" rx="2" fill="#ffc83d" stroke="#d47a00" stroke-width="2"/><rect x="26" y="20" width="12" height="15" rx="3" fill="#ffd23f" stroke="#d47a00" stroke-width="2"/><circle cx="32" cy="28" r="2.4" fill="#7d4520"/><rect x="14" y="6" width="5" height="44" fill="#ffc83d" opacity=".8"/><rect x="45" y="6" width="5" height="44" fill="#ffc83d" opacity=".8"/></svg>',
    medal: '<svg viewBox="0 0 80 96"><path d="M22 2 H38 L44 34 H28Z" fill="#ff4d6d"/><path d="M58 2 H42 L36 34 H52Z" fill="#4f8bff"/><circle cx="40" cy="60" r="30" fill="url(#mdg)" stroke="#d47a00" stroke-width="3"/><circle cx="40" cy="60" r="22" fill="none" stroke="#fff4c0" stroke-width="2.5" opacity=".8"/><path d="M40 44 l5 10.2 11.2 1.6 -8.1 7.9 1.9 11.2 -10 -5.3 -10 5.3 1.9 -11.2 -8.1 -7.9 11.2 -1.6z" fill="#fff8d6" stroke="#e08a00" stroke-width="1.5"/></svg>'
  };

  var GLOBAL_DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><radialGradient id="icg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff1a1"/><stop offset=".55" stop-color="#ffc83d"/><stop offset="1" stop-color="#f08c00"/></radialGradient><linearGradient id="chg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c07a3e"/><stop offset="1" stop-color="#7d4520"/></linearGradient><linearGradient id="mdg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1a1"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#e88400"/></linearGradient></defs></svg>';
  window.ART = { SKINS: SKINS, STAGES: STAGES, stageOf: stageOf, globalDefs: GLOBAL_DEFS, pet: pet, avatar: avatar, egg: egg, shellHalves: shellHalves, crest: crest, hatIcon: hatIcon, IC: IC };
})();
