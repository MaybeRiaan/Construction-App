// Playdar · finish the Figma flow
//
// Run once in the "Playdar — App flow" Figma file from the Figma desktop app
// (Plugins → Development → Import plugin from manifest…, then run it).
// It builds the last 8 boards (E12, E13, E14, E15, F1, F2, F3, F4),
// groups the boards into one section per flow, wires the clickable prototype,
// labels the Components page and removes the hidden build data. Running it a
// second time does nothing. See ../README.md.
//
// Generated from the app's web build; the board data below is machine-written.

// BUILDER START
const BUILDER = function (figma) {
// Playdar → Figma builder. This is the body of new Function('figma', SRC); it returns
// run(job). No backticks or dollar-brace sequences: the source travels inside String.raw.
var FAM = { B: 'Bricolage Grotesque', F: 'Figtree', S: 'Big Shoulders Stencil' };
var WNAME = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
var AVAIL = { 'Bricolage Grotesque': [300, 400, 500, 600, 700, 800], Figtree: [300, 400, 500, 600, 700, 800, 900], 'Big Shoulders Stencil': [100, 200, 300, 400, 500, 600, 700, 800, 900] };
function fontName(fam, w) {
  var family = FAM[fam] || 'Figtree';
  var list = AVAIL[family];
  var best = list[0];
  for (var i = 0; i < list.length; i++) if (Math.abs(list[i] - w) < Math.abs(best - w)) best = list[i];
  return { family: family, style: WNAME[best] };
}
function rgba(hex) {
  var h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: h.length > 6 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
}

var ST = null; // persistent state (JSON in a text node)
var STATE_NODE = null;
var VARS = {}; // id -> Variable (cache)
var NODES = {}; // id -> node (cache)
var LINKS = [];
var STATS = { frames: 0, texts: 0, inst: 0, svg: 0, errors: [] };

async function getNode(id) {
  if (!NODES[id]) NODES[id] = await figma.getNodeByIdAsync(id);
  return NODES[id];
}
async function getVar(id) {
  if (!VARS[id]) VARS[id] = await figma.variables.getVariableByIdAsync(id);
  return VARS[id];
}

async function paint(ci, sc) {
  var hex = ST.colors[ci];
  var c = rgba(hex);
  var p = { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a };
  var vid = ST.cvar && ST.cvar[sc] && ST.cvar[sc][ci];
  if (vid) {
    var v = await getVar(vid);
    if (v) {
      p.opacity = 1;
      p = figma.variables.setBoundVariableForPaint(p, 'color', v);
    }
  }
  return p;
}

function effectList(ei) {
  return ST.effects[ei].map(function (e) {
    var c = rgba(ST.colors[e[5]]);
    return { type: e[0] ? 'INNER_SHADOW' : 'DROP_SHADOW', color: c, offset: { x: e[1], y: e[2] }, radius: e[3], spread: e[4], visible: true, blendMode: 'NORMAL' };
  });
}
async function applyEffects(node, ei) {
  if (ei == null || ei < 0) {
    node.effects = [];
    return;
  }
  var sid = ST.fxStyle && ST.fxStyle[ei];
  if (sid) {
    try {
      await node.setEffectStyleIdAsync(sid);
      return;
    } catch (e) {}
  }
  node.effects = effectList(ei);
}

async function loadFontsFor(tsIdxList) {
  var seen = {};
  var jobs = [];
  for (var i = 0; i < tsIdxList.length; i++) {
    var t = ST.tstyles[tsIdxList[i]];
    var f = fontName(t[0], t[1]);
    var k = f.family + '|' + f.style;
    if (!seen[k]) {
      seen[k] = 1;
      jobs.push(figma.loadFontAsync(f));
    }
  }
  await Promise.all(jobs);
}
function collectTs(n, out) {
  var k = n[0];
  if (k === 'T') {
    var r = n[6];
    if (typeof r[0] === 'number') out.push(r[0]);
    else for (var i = 0; i < r.length; i++) out.push(r[i][2]);
  } else if (k === 'F') {
    for (var j = 0; j < n[6].length; j++) collectTs(n[6][j], out);
  } else if (k === 'I') {
    var ov = n[6];
    for (var q = 0; q < ov.length; q++) {
      if (ov[q][0] === 'ts') {
        var rr = ov[q][2];
        if (typeof rr[0] === 'number') out.push(rr[0]);
        else for (var z = 0; z < rr.length; z++) out.push(rr[z][2]);
      }
    }
  }
}

async function styleRange(t, s, e, tsi, ci, sc) {
  var ts = ST.tstyles[tsi];
  var fn = fontName(ts[0], ts[1]);
  var sid = ST.tsStyle && ST.tsStyle[tsi];
  var styled = false;
  if (sid) {
    try {
      await t.setRangeTextStyleIdAsync(s, e, sid);
      styled = true;
    } catch (err) {}
  }
  if (!styled) {
    t.setRangeFontName(s, e, fn);
    t.setRangeFontSize(s, e, ts[2]);
    t.setRangeLineHeight(s, e, ts[3] ? { unit: 'PIXELS', value: ts[3] } : { unit: 'AUTO' });
    t.setRangeLetterSpacing(s, e, { unit: 'PIXELS', value: ts[4] || 0 });
    if (ts[5]) t.setRangeTextCase(s, e, ts[5] === 'U' ? 'UPPER' : ts[5] === 'L' ? 'LOWER' : 'TITLE');
  }
  if (ts[6]) t.setRangeTextDecoration(s, e, ts[6] === 'U' ? 'UNDERLINE' : 'STRIKETHROUGH');
  t.setRangeFills(s, e, [await paint(ci, sc)]);
}
async function styleRuns(t, runs, sc) {
  var len = t.characters.length;
  if (typeof runs[0] === 'number') await styleRange(t, 0, len, runs[0], runs[1], sc);
  else for (var i = 0; i < runs.length; i++) await styleRange(t, runs[i][0], Math.min(runs[i][1], len), runs[i][2], runs[i][3], sc);
}

var AL_PA = { N: 'MIN', C: 'CENTER', X: 'MAX', SB: 'SPACE_BETWEEN' };
var AL_CA = { N: 'MIN', C: 'CENTER', X: 'MAX', S: 'MIN' };

async function applyFrameProps(f, n, sc) {
  var p = n[5];
  f.fills = p.f != null && p.f >= 0 ? [await paint(p.f, sc)] : [];
  if (p.r != null) {
    if (typeof p.r === 'number') f.cornerRadius = p.r;
    else {
      f.topLeftRadius = p.r[0];
      f.topRightRadius = p.r[1];
      f.bottomRightRadius = p.r[2];
      f.bottomLeftRadius = p.r[3];
    }
  }
  if (p.s) {
    f.strokes = [await paint(p.s[0], sc)];
    f.strokeAlign = 'INSIDE';
    if (p.s.length === 2) f.strokeWeight = p.s[1];
    else {
      f.strokeTopWeight = p.s[1];
      f.strokeRightWeight = p.s[2];
      f.strokeBottomWeight = p.s[3];
      f.strokeLeftWeight = p.s[4];
    }
    if (p.d) f.dashPattern = [4, 4];
  }
  if (p.e != null) await applyEffects(f, p.e);
  if (p.o != null) f.opacity = p.o;
  f.clipsContent = !!p.c;
}

function setAutoLayout(f, a) {
  f.layoutMode = a[0] === 'H' ? 'HORIZONTAL' : 'VERTICAL';
  f.paddingTop = a[1];
  f.paddingRight = a[2];
  f.paddingBottom = a[3];
  f.paddingLeft = a[4];
  f.itemSpacing = Math.max(0, a[5]);
  f.primaryAxisAlignItems = AL_PA[a[6]] || 'MIN';
  f.counterAxisAlignItems = AL_CA[a[7]] || 'MIN';
}
function setHug(f, a, w, h) {
  var H = a[0] === 'H';
  var hugW = !!a[8];
  var hugH = !!a[9];
  f.resize(Math.max(w, 0.01), Math.max(h, 0.01));
  f.primaryAxisSizingMode = (H ? hugW : hugH) ? 'AUTO' : 'FIXED';
  f.counterAxisSizingMode = (H ? hugH : hugW) ? 'AUTO' : 'FIXED';
}

function place(node, parent, n) {
  var p = n[0] === 'T' ? n[7] : n[0] === 'I' ? n[7] : n[0] === 'M' ? n[5] : n[0] === 'F' ? n[5] : n[6];
  var al = parent && parent.layoutMode && parent.layoutMode !== 'NONE';
  if (al && p && p.ab) node.layoutPositioning = 'ABSOLUTE';
  if (!al || (p && p.ab)) {
    node.x = n[1];
    node.y = n[2];
  }
  if (al && p && !p.ab) {
    if (p.fw) {
      try {
        node.layoutSizingHorizontal = 'FILL';
      } catch (e) {}
    }
    if (p.fh) {
      try {
        node.layoutSizingVertical = 'FILL';
      } catch (e) {}
    }
  }
}

// ---------- map (regenerates the Riverbend demo geometry for a camera) ----------
var MAPPAL = {
  light: { land: '#E3E7EC', town: '#DDE2E8', water: '#B9D3EE', waterEdge: '#A6C4E4', park: '#CBE6C6', parkEdge: '#B6D9B0', road: '#F7F8FA', roadMajor: '#FFFFFF', roadMajorCasing: '#C7CED8' },
  dark: { land: '#20242A', town: '#252A31', water: '#1A2C42', waterEdge: '#1F3550', park: '#1F3326', parkEdge: '#24402D', road: '#30353E', roadMajor: '#3B414B', roadMajorCasing: '#2B3038' },
};
var GEO = {
  river: [[-13000, -500], [-10000, -1150], [-7200, -650], [-4800, -1200], [-2600, -1000], [-1200, -520], [200, -380], [1500, -620], [2800, -300], [4300, -760], [6400, -380], [8800, -980], [13000, -520]],
  riverWidth: 70,
  lake: { x: 5000, y: 2050, r: 640 },
  parks: [{ x: 300, y: 450, r: 430 }, { x: -2650, y: 2150, r: 680 }, { x: 1900, y: -1450, r: 400 }, { x: -900, y: -720, r: 170 }, { x: 3200, y: 900, r: 270 }, { x: -4250, y: -420, r: 760 }, { x: 2500, y: -2150, r: 360 }, { x: -3150, y: -1650, r: 210 }, { x: 4200, y: -620, r: 190 }, { x: -1800, y: 600, r: 150 }, { x: 700, y: -2250, r: 150 }, { x: -4550, y: 2950, r: 420 }],
  townRadius: 5600,
};
var MAJOR = [
  [[-9000, 1150], [-5200, 980], [-2600, 900], [0, 760], [2600, 930], [5200, 1180], [9000, 1500]],
  [[-9000, -120], [-5600, -420], [-3200, -350], [-1300, -60], [600, 80], [2400, 220], [4600, 120], [9000, 280]],
  [[-8200, 6400], [-5200, 4300], [-3500, 3150], [-2000, 1700], [-700, 780]],
  [[3600, -8000], [3300, -3600], [3000, -1500], [3350, 300], [3900, 2600], [4200, 8000]],
  [[-1450, -8000], [-1350, -3800], [-1150, -1700], [-1350, -200], [-2150, 1000], [-2350, 3900], [-2700, 8000]],
  [[200, 760], [700, 1200], [1500, 1750], [2300, 2500], [2700, 4200], [2900, 8000]],
  [[600, 80], [900, -900], [1300, -1900], [1700, -3200], [2200, -8000]],
];
function seeded(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var WORLD = null;
function buildWorld() {
  if (WORLD) return WORLD;
  var f = Math.round;
  function blob(cx, cy, r, seed, wobble) {
    var rand = seeded(seed);
    var a1 = rand() * 6.28;
    var a2 = rand() * 6.28;
    var n = 32;
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var rr = r * (1 + wobble * Math.sin(3 * a + a1) + wobble * 0.6 * Math.sin(5 * a + a2));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    var mid = function (p, q) {
      return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    };
    var segs = [['M', [f(mid(pts[n - 1], pts[0])[0]), f(mid(pts[n - 1], pts[0])[1])]]];
    for (var j = 0; j < n; j++) {
      var p = pts[j];
      var m = mid(p, pts[(j + 1) % n]);
      segs.push(['Q', [f(p[0]), f(p[1])], [f(m[0]), f(m[1])]]);
    }
    segs.push(['Z']);
    return segs;
  }
  function smooth(pts) {
    var segs = [['M', [f(pts[0][0]), f(pts[0][1])]]];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i];
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var p3 = pts[i + 2] || p2;
      segs.push(['C', [f(p1[0] + (p2[0] - p0[0]) / 6), f(p1[1] + (p2[1] - p0[1]) / 6)], [f(p2[0] - (p3[0] - p1[0]) / 6), f(p2[1] - (p3[1] - p1[1]) / 6)], [f(p2[0]), f(p2[1])]]);
    }
    return segs;
  }
  function distToPolyline(p, line) {
    var best = Infinity;
    for (var i = 0; i < line.length - 1; i++) {
      var ax = line[i][0], ay = line[i][1], bx = line[i + 1][0], by = line[i + 1][1];
      var dx = bx - ax, dy = by - ay;
      var t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(p[0] - ax - t * dx, p[1] - ay - t * dy));
    }
    return best;
  }
  var rand = seeded(424242);
  var theta = (7 * Math.PI) / 180;
  var cos = Math.cos(theta), sin = Math.sin(theta);
  var S = 230;
  var townR = GEO.townRadius;
  var N = Math.ceil((townR + 600) / S);
  function node(i, j) {
    var r = seeded(i * 7349 + j * 9157 + 17);
    var u = i * S + (r() - 0.5) * 44;
    var v = j * S + (r() - 0.5) * 44;
    return [u * cos - v * sin, u * sin + v * cos];
  }
  function townEdge(p) {
    var a = Math.atan2(p[1], p[0]);
    return townR * (1 + 0.12 * Math.sin(3 * a + 0.7) + 0.07 * Math.sin(5 * a + 2.1));
  }
  function blocked(p) {
    if (Math.hypot(p[0], p[1]) > townEdge(p)) return true;
    if (Math.hypot(p[0] - GEO.lake.x, p[1] - GEO.lake.y) < GEO.lake.r * 1.12) return true;
    if (distToPolyline(p, GEO.river) < GEO.riverWidth / 2 + 30) return true;
    return GEO.parks.some(function (k) {
      return Math.hypot(p[0] - k.x, p[1] - k.y) < k.r * 0.95;
    });
  }
  var minor = [];
  for (var i = -N; i <= N; i++) {
    for (var j = -N; j <= N; j++) {
      var a = node(i, j);
      var dirs = [[1, 0], [0, 1]];
      for (var d = 0; d < 2; d++) {
        var b = node(i + dirs[d][0], j + dirs[d][1]);
        var m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (blocked(m) || blocked(a) || blocked(b)) continue;
        if (rand() < 0.16) continue;
        minor.push([f(a[0]), f(a[1]), f(b[0]), f(b[1])]);
      }
    }
  }
  function ring(r) {
    var pts = [];
    for (var i = 0; i <= 48; i++) {
      var a = (i / 48) * Math.PI * 2;
      var rr = r * (1 + 0.06 * Math.sin(3 * a + 1.3) + 0.03 * Math.sin(7 * a));
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.86]);
    }
    return pts;
  }
  var majors = MAJOR.concat([ring(4700)]).map(smooth);
  WORLD = {
    town: blob(0, 0, townR, 11, 0.12),
    parks: GEO.parks.map(function (p, i) {
      return blob(p.x, p.y, p.r, 100 + i, 0.14);
    }),
    lake: blob(GEO.lake.x, GEO.lake.y, GEO.lake.r, 7, 0.12),
    river: smooth(GEO.river),
    minor: minor,
    majors: majors,
  };
  return WORLD;
}
function mapSvg(p, w, h, sc) {
  var W = buildWorld();
  var pal = MAPPAL[sc] || MAPPAL.light;
  var tx = p.cam[0], ty = p.cam[1], s = p.cam[2];
  var X = function (x) {
    return Math.round((s * x + tx) * 10) / 10;
  };
  var Y = function (y) {
    return Math.round((-s * y + ty) * 10) / 10;
  };
  function pathD(segs) {
    var d = '';
    for (var i = 0; i < segs.length; i++) {
      var sg = segs[i];
      d += sg[0];
      for (var k = 1; k < sg.length; k++) d += (k > 1 ? ' ' : '') + X(sg[k][0]) + ' ' + Y(sg[k][1]);
    }
    return d;
  }
  function visible(segs, pad) {
    var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (var i = 0; i < segs.length; i++) for (var k = 1; k < segs[i].length; k++) {
      var x = X(segs[i][k][0]), y = Y(segs[i][k][1]);
      if (x < x1) x1 = x;
      if (x > x2) x2 = x;
      if (y < y1) y1 = y;
      if (y > y2) y2 = y;
    }
    return x2 > -pad && x1 < w + pad && y2 > -pad && y1 < h + pad;
  }
  var body = '<rect width="' + w + '" height="' + h + '" fill="' + pal.land + '"/>';
  body += '<path d="' + pathD(W.town) + '" fill="' + pal.town + '"/>';
  var parks = W.parks.filter(function (sg) {
    return visible(sg, 20);
  });
  if (parks.length) body += '<path d="' + parks.map(pathD).join('') + '" fill="' + pal.park + '" stroke="' + pal.parkEdge + '" stroke-width="1.5"/>';
  if (visible(W.lake, 20)) body += '<path d="' + pathD(W.lake) + '" fill="' + pal.water + '" stroke="' + pal.waterEdge + '" stroke-width="1.5"/>';
  body += '<path d="' + pathD(W.river) + '" fill="none" stroke="' + pal.water + '" stroke-width="' + Math.round(GEO.riverWidth * s * 10) / 10 + '" stroke-linecap="round" stroke-linejoin="round"/>';
  if (p.mw) {
    var md = '';
    for (var i = 0; i < W.minor.length; i++) {
      var m = W.minor[i];
      var ax = X(m[0]), ay = Y(m[1]), bx = X(m[2]), by = Y(m[3]);
      if (Math.max(ax, bx) < -4 || Math.min(ax, bx) > w + 4 || Math.max(ay, by) < -4 || Math.min(ay, by) > h + 4) continue;
      md += 'M' + ax + ' ' + ay + 'L' + bx + ' ' + by;
    }
    if (md) body += '<path d="' + md + '" fill="none" stroke="' + pal.road + '" stroke-width="' + p.mw + '" stroke-linecap="round"/>';
  }
  var jw = p.jw || 2.2;
  var majors = W.majors.filter(function (sg) {
    return visible(sg, 10);
  });
  var md2 = majors.map(pathD).join('');
  if (md2) {
    body += '<path d="' + md2 + '" fill="none" stroke="' + pal.roadMajorCasing + '" stroke-width="' + (jw + 2.5) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    body += '<path d="' + md2 + '" fill="none" stroke="' + pal.roadMajor + '" stroke-width="' + jw + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  if (p.tr) for (var t = 0; t < p.tr.length; t++) {
    var tr = p.tr[t];
    body += '<path d="' + tr[0] + '" fill="none" stroke="' + ST.colors[tr[1]] + '" stroke-width="' + tr[2] + '" stroke-linecap="round" stroke-linejoin="round"' + (tr[3] < 1 ? ' opacity="' + tr[3] + '"' : '') + '/>';
  }
  if (p.ci) body += p.ci;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + body + '</svg>';
}

// ---------- node factory ----------
function recolorVectors(root, prop, color) {
  var nodes = 'findAll' in root ? root.findAll(function (x) {
    return x.type === 'VECTOR' || x.type === 'ELLIPSE' || x.type === 'RECTANGLE' || x.type === 'LINE' || x.type === 'POLYGON' || x.type === 'BOOLEAN_OPERATION' || x.type === 'STAR';
  }) : [];
  for (var i = 0; i < nodes.length; i++) {
    var v = nodes[i];
    if (prop === 'strokes' && v.strokes && v.strokes.length) v.strokes = [color];
    if (prop === 'fills' && v.fills && v.fills.length) v.fills = [color];
  }
}
function scaleNode(node, k) {
  if (typeof node.rescale === 'function') node.rescale(k);
  else node.resize(Math.max(node.width * k, 0.01), Math.max(node.height * k, 0.01));
}
function setStrokeWeight(root, wgt) {
  var nodes = root.findAll(function (x) {
    return 'strokeWeight' in x && x.strokes && x.strokes.length;
  });
  for (var i = 0; i < nodes.length; i++) nodes[i].strokeWeight = wgt;
}

async function make(n, parent, sc) {
  var k = n[0];
  var node;
  if (k === 'F') {
    node = figma.createFrame();
    parent.appendChild(node);
    var p = n[5];
    node.name = p.n || (p.a ? (p.a[0] === 'H' ? 'Row' : 'Stack') : 'Frame');
    node.resize(Math.max(n[3], 0.01), Math.max(n[4], 0.01));
    await applyFrameProps(node, n, sc);
    if (p.a) setAutoLayout(node, p.a);
    for (var i = 0; i < n[6].length; i++) await make(n[6][i], node, sc);
    if (p.a) setHug(node, p.a, n[3], n[4]);
    if (p.ph) await photoPlaceholder(node, sc);
    place(node, parent, n);
    if (p.lk) LINKS.push([node.id, p.lk]);
    STATS.frames++;
  } else if (k === 'T') {
    node = figma.createText();
    parent.appendChild(node);
    var tp = n[7];
    var runs = n[6];
    var first = typeof runs[0] === 'number' ? runs[0] : runs[0][2];
    var ts0 = ST.tstyles[first];
    node.fontName = fontName(ts0[0], ts0[1]);
    node.characters = n[5];
    await styleRuns(node, runs, sc);
    node.textAlignHorizontal = tp.al === 'C' ? 'CENTER' : tp.al === 'R' ? 'RIGHT' : tp.al === 'J' ? 'JUSTIFIED' : 'LEFT';
    if (tp.ar) node.textAutoResize = 'WIDTH_AND_HEIGHT';
    else {
      node.resize(Math.max(n[3], 1), Math.max(n[4], 1));
      node.textAutoResize = 'HEIGHT';
    }
    if (tp.ml && !tp.ar) {
      node.textTruncation = 'ENDING';
      node.maxLines = tp.ml;
    }
    if (tp.o != null) node.opacity = tp.o;
    if (tp.n) node.name = tp.n;
    if (tp.hl) {
      node.strokes = [await paint(tp.hl[0], sc)];
      node.strokeWeight = tp.hl[1];
      node.strokeAlign = 'OUTSIDE';
    }
    place(node, parent, n);
    if (tp.rt) {
      var th = (tp.rt * Math.PI) / 180;
      var cw = node.width, ch = node.height;
      var cx = n[1] + n[3] / 2, cy = n[2] + n[4] / 2;
      var cs = Math.cos(th), sn = Math.sin(th);
      node.relativeTransform = [[cs, sn, cx - (cs * cw) / 2 - (sn * ch) / 2], [-sn, cs, cy + (sn * cw) / 2 - (cs * ch) / 2]];
    }
    if (tp.lk) LINKS.push([node.id, tp.lk]);
    STATS.texts++;
  } else if (k === 'S') {
    var lp = n[6];
    var comp = await getNode(ST.lib[n[5]]);
    var inst = comp.createInstance();
    var isIcon = ST.libKind[n[5]] === 'i';
    if (lp.fit) {
      node = figma.createFrame();
      parent.appendChild(node);
      node.name = comp.name.split('/').pop();
      node.fills = [];
      node.clipsContent = true;
      node.resize(Math.max(n[3], 0.01), Math.max(n[4], 0.01));
      node.appendChild(inst);
      var sx = n[3] / comp.width, sy = n[4] / comp.height;
      var s1 = lp.fit === 1 ? Math.max(sx, sy) : Math.min(sx, sy);
      scaleNode(inst, s1);
      inst.x = (n[3] - inst.width) / 2;
      inst.y = (n[4] - inst.height) / 2;
    } else {
      node = inst;
      parent.appendChild(inst);
      var sc1 = n[3] / comp.width;
      if (Math.abs(sc1 - 1) > 0.001) scaleNode(inst, sc1);
      if (Math.abs(inst.height - n[4]) > 0.6 || Math.abs(inst.width - n[3]) > 0.6) inst.resize(Math.max(n[3], 0.01), Math.max(n[4], 0.01));
    }
    if (isIcon) {
      if (lp.c != null) recolorVectors(inst, 'strokes', await paint(lp.c, sc));
      if (lp.fc != null) recolorVectors(inst, 'fills', await paint(lp.fc, sc));
      if (lp.sw) setStrokeWeight(inst, (lp.sw * n[3]) / 24);
    }
    place(node, parent, n);
    if (lp.lk) LINKS.push([node.id, lp.lk]);
    STATS.inst++;
  } else if (k === 'V') {
    node = figma.createNodeFromSvg(n[5]);
    parent.appendChild(node);
    node.name = n[6].n || 'Vector';
    if (Math.abs(node.width - n[3]) > 0.6 || Math.abs(node.height - n[4]) > 0.6) node.resize(Math.max(n[3], 0.01), Math.max(n[4], 0.01));
    place(node, parent, n);
    STATS.svg++;
  } else if (k === 'M') {
    node = figma.createNodeFromSvg(mapSvg(n[5], n[3], n[4], sc));
    parent.appendChild(node);
    node.name = 'Map · Riverbend';
    node.clipsContent = true;
    place(node, parent, n);
    STATS.svg++;
  } else if (k === 'I') {
    var cmp = await getNode(ST.comps[n[5]]);
    node = cmp.createInstance();
    parent.appendChild(node);
    var ip = n[7];
    if (ip.n) node.name = ip.n;
    var ov = n[6];
    for (var q = 0; q < ov.length; q++) await override(node, ov[q], sc);
    var al = parent.layoutMode && parent.layoutMode !== 'NONE' && !ip.ab;
    if (!(al && ip.fw) && Math.abs(node.width - n[3]) > 1) node.resize(Math.max(n[3], 0.01), node.height);
    if (!(al && ip.fh) && Math.abs(node.height - n[4]) > 1) node.resize(node.width, Math.max(n[4], 0.01));
    place(node, parent, n);
    if (ip.lk) LINKS.push([node.id, ip.lk]);
    STATS.inst++;
  }
  return node;
}

async function override(inst, o, sc) {
  var op = o[0];
  var t = inst;
  var path = o[1];
  for (var i = 0; i < path.length; i++) {
    if (!('children' in t) || !t.children[path[i]]) return;
    t = t.children[path[i]];
  }
  try {
    if (op === 't' || op === 'ts') {
      var segs = t.getStyledTextSegments(['fontName']);
      await Promise.all(segs.map(function (s) {
        return figma.loadFontAsync(s.fontName);
      }));
      if (op === 't') t.characters = o[2];
      else await styleRuns(t, o[2], sc);
    } else if (op === 'f') t.fills = o[2] >= 0 ? [await paint(o[2], sc)] : [];
    else if (op === 's') t.strokes = o[2] ? [await paint(o[2][0], sc)] : [];
    else if (op === 'e') await applyEffects(t, o[2]);
    else if (op === 'o') t.opacity = o[2];
    else if (op === 'sw') {
      var target = await getNode(ST.lib[o[2]]);
      if (t.type === 'INSTANCE') t.swapComponent(target);
      else if (t.children && t.children[0] && t.children[0].type === 'INSTANCE') t.children[0].swapComponent(target);
    } else if (op === 'ic') recolorVectors(t, 'strokes', await paint(o[2], sc));
    else if (op === 'if') recolorVectors(t, 'fills', await paint(o[2], sc));
    else if (op === 'isw') setStrokeWeight(t, (o[2] * t.width) / 24);
  } catch (e) {
    STATS.errors.push(op + ':' + String(e && e.message).slice(0, 80));
  }
}

async function photoPlaceholder(f, sc) {
  await figma.loadFontAsync({ family: 'Figtree', style: 'SemiBold' });
  f.fills = [{ type: 'SOLID', color: sc === 'dark' ? { r: 0.17, g: 0.19, b: 0.22 } : { r: 0.8, g: 0.83, b: 0.87 } }];
  var t = figma.createText();
  f.appendChild(t);
  if (f.layoutMode && f.layoutMode !== 'NONE') t.layoutPositioning = 'ABSOLUTE';
  t.fontName = { family: 'Figtree', style: 'SemiBold' };
  t.characters = 'Kid’s photo';
  t.fontSize = 13;
  t.fills = [{ type: 'SOLID', color: { r: 0.42, g: 0.46, b: 0.52 } }];
  t.x = (f.width - t.width) / 2;
  t.y = (f.height - t.height) / 2;
  t.name = 'Photo placeholder';
}

// ---------- state ----------
async function loadState(id) {
  STATE_NODE = await figma.getNodeByIdAsync(id);
  ST = JSON.parse(STATE_NODE.characters);
}
async function saveState() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  STATE_NODE.characters = JSON.stringify(ST);
}

// ---------- jobs ----------
function gridPos(kind, idx) {
  var g = ST.grid[kind];
  var col = idx % g.cols;
  var row = Math.floor(idx / g.cols);
  return [g.x + col * g.cell[0], g.y + row * g.cell[1]];
}

async function jobLib(job) {
  var page = await getNode(ST.pages.comps);
  await figma.setCurrentPageAsync(page);
  var out = [];
  for (var i = 0; i < job.items.length; i++) {
    var idx = job.items[i][0];
    var e = job.items[i][1];
    if (ST.lib[idx]) continue;
    var comp;
    if (e.base != null) {
      var base = await getNode(ST.lib[e.base]);
      comp = base.clone();
      if (comp.type !== 'COMPONENT') comp = figma.createComponentFromNode(comp);
      var lockC = rgba(e.lock);
      var lockP = { type: 'SOLID', color: { r: lockC.r, g: lockC.g, b: lockC.b } };
      var vs = comp.findAll(function (x) {
        return 'fills' in x && x.type !== 'FRAME' && x.type !== 'GROUP' && x.type !== 'COMPONENT';
      });
      for (var j = 0; j < vs.length; j++) {
        var v = vs[j];
        var shadow = v.fills && v.fills.length && v.fills[0].type === 'SOLID' && v.fills[0].color.r < 0.01 && v.fills[0].color.g < 0.01 && v.fills[0].color.b < 0.01 && (v.fills[0].opacity || 1) < 0.3;
        if (shadow) {
          v.visible = false;
          continue;
        }
        if (v.fills && v.fills.length) v.fills = [lockP];
        if (v.strokes && v.strokes.length) v.strokes = [lockP];
      }
    } else {
      var svg = e.svg;
      if (svg.indexOf('<svg') !== 0) svg = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='" + (e.fill ? '#101216' : 'none') + "' stroke='#101216' stroke-width='" + (e.sw || 2) + "' stroke-linecap='round' stroke-linejoin='round'>" + svg + '</svg>';
      var fr = figma.createNodeFromSvg(svg);
      comp = figma.createComponentFromNode(fr);
    }
    comp.name = e.n;
    var kind = e.n.indexOf('Icon/') === 0 ? 'i' : 'a';
    var cnt = ST.count[kind] || 0;
    ST.count[kind] = cnt + 1;
    var pos = gridPos(kind === 'i' ? 'icons' : 'art', cnt);
    comp.x = pos[0];
    comp.y = pos[1];
    ST.lib[idx] = comp.id;
    ST.libKind[idx] = kind;
    out.push(comp.id);
  }
  await saveState();
  return { made: out.length, ids: out };
}

async function jobComps(job) {
  var page = await getNode(ST.pages.comps);
  await figma.setCurrentPageAsync(page);
  var ts = [];
  for (var i = 0; i < job.items.length; i++) collectTs(job.items[i][1].node, ts);
  await loadFontsFor(ts);
  var out = [];
  for (var j = 0; j < job.items.length; j++) {
    var idx = job.items[j][0];
    var c = job.items[j][1];
    if (ST.comps[idx]) continue;
    var comp = figma.createComponent();
    var n = c.node;
    comp.resize(Math.max(n[3], 0.01), Math.max(n[4], 0.01));
    await applyFrameProps(comp, n, c.scheme);
    if (n[5].a) setAutoLayout(comp, n[5].a);
    for (var q = 0; q < n[6].length; q++) await make(n[6][q], comp, c.scheme);
    if (n[5].a) setHug(comp, n[5].a, n[3], n[4]);
    comp.name = c.n;
    var pos = gridPos('ui', ST.count.ui || 0);
    ST.count.ui = (ST.count.ui || 0) + 1;
    comp.x = pos[0];
    comp.y = pos[1];
    ST.comps[idx] = comp.id;
    out.push(comp.id);
  }
  await saveState();
  return { made: out.length, ids: out, stats: STATS };
}

async function jobScreens(job) {
  var page = await getNode(ST.pages.flow);
  await figma.setCurrentPageAsync(page);
  var ts = [];
  for (var i = 0; i < job.items.length; i++) collectTs(job.items[i].node, ts);
  await loadFontsFor(ts);
  var out = {};
  for (var j = 0; j < job.items.length; j++) {
    var s = job.items[j];
    if (ST.screens[s.code]) {
      var old = await getNode(ST.screens[s.code]);
      if (old) old.remove();
    }
    LINKS = [];
    var n = s.node;
    var f = figma.createFrame();
    page.appendChild(f);
    f.name = s.code + ' · ' + s.title;
    f.resize(n[3], n[4]);
    f.x = s.pos[0];
    f.y = s.pos[1];
    await applyFrameProps(f, n, s.scheme);
    f.clipsContent = true;
    for (var q = 0; q < n[6].length; q++) await make(n[6][q], f, s.scheme);
    ST.screens[s.code] = f.id;
    ST.links[s.code] = LINKS;
    out[s.code] = f.id;
  }
  await saveState();
  return { screens: out, stats: STATS };
}

return async function run(job) {
  await loadState(job.state);
  var r;
  if (job.kind === 'lib') r = await jobLib(job);
  else if (job.kind === 'comps') r = await jobComps(job);
  else if (job.kind === 'screens') r = await jobScreens(job);
  else if (job.kind === 'eval') r = await new Function('ctx', 'return (async function () { ' + job.code + ' })()')({ ST: ST, getNode: getNode, make: make, paint: paint, saveState: saveState, STATS: STATS, figma: figma, loadFontsFor: loadFontsFor, mapSvg: mapSvg });
  return r;
};

};
// BUILDER END

const SCREENS = [
{"code":"E12","title":"Challenges","scheme":"light","node":["F",0,0,390,2471,{"f":0,"c":1},[["F",0,0,390,2471,{"ab":1,"f":0,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,2471,{"n":"ChallengesScreen","fw":1,"fh":1,"f":0,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,108,{"n":"ScreenHeader","fw":1,"a":["H",58,16,8,16,12,"N","C",0,1]},[["I",0,0,42,42,40,[["sw",[0],8]],{"n":"IconButton · Back","lk":"E1"}],["T",0,0,304,22,"Challenges",[15,1],{"fw":1,"ml":1}]]],["F",0,0,390,2363,{"fw":1,"fh":1,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,390,2363,{"fw":1,"a":["V",0,20,62,20,22,"N","N",0,1]},[["F",0,0,350,428,{"n":"Surface","fw":1,"f":0,"r":30,"e":3,"a":["V",16,16,16,16,14,"N","C",1,1]},[["F",0,0,318,62,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["S",0,0,20,20,86,{"c":39}],["F",0,0,288,62,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,288,26,"DIGGER BINGO",[24,1],{"fw":1}],["T",0,0,288,36,"New card every Monday. Three in a row wins +100 XP.",[3,5],{"fw":1}]]]]],["F",0,0,292,292,{"n":"BingoGrid"},[["F",0,0,92,92,{"n":"Cement mixer","f":0,"r":18,"e":1,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,74,46.5,93,{}],["T",0,0,64,14,"Cement mixer",[32,22],{"ar":1,"ml":1}]]],["F",100,0,92,92,{"n":"Motor grader","f":0,"r":18,"e":1,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,74,46.5,111,{}],["T",0,0,60,14,"Motor grader",[32,22],{"ar":1,"ml":1}]]],["F",200,0,92,92,{"n":"Fire engine","f":0,"r":18,"e":1,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,74,46.5,97,{}],["T",0,0,50.5,14,"Fire engine",[32,22],{"ar":1,"ml":1}]]],["F",0,100,92,92,{"n":"Backhoe loader","f":0,"r":18,"e":1,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,74,46.5,91,{}],["T",0,0,70,14,"Backhoe loader",[32,22],{"ar":1,"ml":1}]]],["F",100,100,92,92,{"n":"Free square","f":1,"r":18,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,28,28,3,{"c":7}],["T",0,0,30.5,17,"FREE",[25,7],{"ar":1}]]],["F",200,100,92,92,{"n":"Excavator, spotted","f":1,"r":18,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,74,46.5,30,{}],["T",0,0,45.5,14,"Excavator",[32,6],{"ar":1,"ml":1}],["F",69,5,18,18,{"ab":1,"f":7,"r":9,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,12,12,62,{"c":8,"sw":3.2}]]]]],["F",0,200,92,92,{"n":"Cherry picker","f":0,"r":18,"e":1,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,74,46.5,99,{}],["T",0,0,61.5,14,"Cherry picker",[32,22],{"ar":1,"ml":1}]]],["F",100,200,92,92,{"n":"Garbage truck","f":0,"r":18,"e":1,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,74,46.5,96,{}],["T",0,0,65,14,"Garbage truck",[32,22],{"ar":1,"ml":1}]]],["F",200,200,92,92,{"n":"Forklift","f":0,"r":18,"e":1,"a":["V",6,6,6,6,2,"C","C",0,0]},[["S",0,0,74,46.5,110,{}],["T",0,0,32.5,14,"Forklift",[32,22],{"ar":1,"ml":1}]]]]],["T",0,0,68.5,14,"2 of 3 in a line",[10,5],{"ar":1}]]],["F",0,0,350,186,{"n":"Surface","fw":1,"f":0,"r":30,"e":3,"a":["V",16,16,16,16,12,"N","N",0,1]},[["F",0,0,318,58,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["S",0,0,20,20,88,{"c":39}],["F",0,0,288,58,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,288,22,"Family race",[15,1],{"fw":1}],["T",0,0,288,36,"First to spot 10 different machines wins. Pick who’s spotting on each snap.",[3,5],{"fw":1}]]]]],["F",0,0,318,84,{"n":"RaceLanes","fw":1,"a":["V",0,0,0,0,12,"N","N",0,1]},[["F",0,0,318,36,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["I",0,0,34,34,58,[],{"n":"Avatar"}],["F",0,0,246,36,{"fw":1,"a":["V",0,0,0,0,4,"N","N",0,1]},[["F",0,0,246,18,{"fw":1,"a":["H",0,0,0,0,0,"SB","N",0,0]},[["T",0,0,85,18,"Max  · Leading",[7,1],{"fh":1,"ar":1}],["T",0,0,25.5,18,"1/10",[10,5],{"fh":1,"ar":1}]]],["F",0,0,246,14,{"fw":1,"f":11,"r":7,"c":1,"a":["V",0,0,0,0,0,"C","N",0,1]},[["F",0,0,24.5,14,{"f":7,"r":7},[]]]]]],["S",0,0,18,18,88,{"c":2}]]],["F",0,0,318,36,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["I",0,0,34,34,58,[["f",[],10],["sw",[0],11],["ic",[0],6]],{"n":"Avatar"}],["F",0,0,246,36,{"fw":1,"a":["V",0,0,0,0,4,"N","N",0,1]},[["F",0,0,246,18,{"fw":1,"a":["H",0,0,0,0,0,"SB","N",0,0]},[["T",0,0,21,18,"Ella",[7,1],{"fh":1,"ar":1}],["T",0,0,25.5,18,"0/10",[10,5],{"fh":1,"ar":1}]]],["F",0,0,246,14,{"fw":1,"f":11,"r":7,"c":1,"a":["V",0,0,0,0,0,"C","N",0,1]},[["F",0,0,10,14,{"f":1,"r":5.4},[]]]]]],["S",0,0,18,18,88,{"c":2}]]]]]]],["F",0,0,350,1303,{"fw":1,"a":["V",0,0,0,0,12,"N","N",0,1]},[["T",0,0,350,26,"All challenges",[9,1],{"fw":1}],["F",0,0,350,94,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,42,{"fw":1},[["F",0,0,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,102,{"c":7}]]],["F",54,1.5,200,39,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,200,21,"Today's mission",[2,1],{"fw":1}],["T",0,0,200,18,"Spot a bulldozer",[3,5],{"fw":1}]]],["I",266,0,56,24,57,[],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,293.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1},[]],["T",0,0,18.5,14,"0/1",[10,5],{"ar":1}]]]]],["F",0,0,350,85,{"fw":1,"f":11,"r":24,"e":4,"a":["V",14,14,14,14,0,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":7,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,62,{"c":8,"sw":3}]]],["F",54,0,210.5,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,210.5,21,"First spot",[2,1],{"fw":1}],["T",0,0,210.5,36,"Snap your very first construction machine.",[3,5],{"fw":1}]]],["I",276.5,0,45.5,24,22,[["t",[0],"Done"]],{"n":"Pill"}]]]]],["F",0,0,350,109,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,87,{"c":7}]]],["F",54,0,195,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,195,21,"The Big Ten",[2,1],{"fw":1}],["T",0,0,195,36,"Be the first in the family to spot 10 different machines.",[3,5],{"fw":1}]]],["I",261,0,61,24,57,[["t",[0],"+150 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,286.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1,"a":["V",2,2,2,2,0,"N","N",0,1]},[["F",0,0,28.5,6,{"f":7,"r":3},[]]]],["T",0,0,25.5,14,"1/10",[10,5],{"ar":1}]]]]],["F",0,0,350,109,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,133,{"c":7}]]],["F",54,0,199,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,199,21,"Rainbow hunt",[2,1],{"fw":1}],["T",0,0,199,36,"Spot machines in 5 different colours.",[3,5],{"fw":1}]]],["I",265,0,57,24,57,[["t",[0],"+80 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,293.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1,"a":["V",2,2,2,2,0,"N","N",0,1]},[["F",0,0,58,6,{"f":7,"r":3},[]]]],["T",0,0,18.5,14,"1/5",[10,5],{"ar":1}]]]]],["F",0,0,350,109,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,134,{"c":7}]]],["F",54,0,199.5,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,199.5,21,"Crane spotter",[2,1],{"fw":1}],["T",0,0,199.5,36,"Spot 3 cranes. Tower or mobile both count.",[3,5],{"fw":1}]]],["I",265.5,0,56.5,24,57,[["t",[0],"+60 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,293.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1},[]],["T",0,0,18.5,14,"0/3",[10,5],{"ar":1}]]]]],["F",0,0,350,109,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,101,{"c":7}]]],["F",54,0,195,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,195,21,"Road crew",[2,1],{"fw":1}],["T",0,0,195,36,"Find the whole road crew: a roller, a grader and a paver.",[3,5],{"fw":1}]]],["I",261,0,61,24,57,[["t",[0],"+120 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,293.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1},[]],["T",0,0,18.5,14,"0/3",[10,5],{"ar":1}]]]]],["F",0,0,350,109,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,67,{"c":7}]]],["F",54,0,199,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,199,21,"Name game",[2,1],{"fw":1}],["T",0,0,199,36,"Give 3 machines a name. Other hunters vote for the best ones.",[3,5],{"fw":1}]]],["I",265,0,57,24,57,[["t",[0],"+40 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,293.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1,"a":["V",2,2,2,2,0,"N","N",0,1]},[["F",0,0,96.5,6,{"f":7,"r":3},[]]]],["T",0,0,18.5,14,"1/3",[10,5],{"ar":1}]]]]],["F",0,0,350,109,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,29,{"c":7}]]],["F",54,0,199.5,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,199.5,21,"Famous finder",[2,1],{"fw":1}],["T",0,0,199.5,36,"Track down 2 famous machines that other families named.",[3,5],{"fw":1}]]],["I",265.5,0,56.5,24,57,[["t",[0],"+90 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,293.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1},[]],["T",0,0,18.5,14,"0/2",[10,5],{"ar":1}]]]]],["F",0,0,350,109,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,135,{"c":7}]]],["F",54,0,195,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,195,21,"Legend",[2,1],{"fw":1}],["T",0,0,195,36,"Spot a legendary machine. Listen for the BOOM of a pile driver.",[3,5],{"fw":1}]]],["I",261,0,61,24,57,[["t",[0],"+150 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,293.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1},[]],["T",0,0,18.5,14,"0/1",[10,5],{"ar":1}]]]]],["F",0,0,350,94,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,42,{"fw":1},[["F",0,0,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,45,{"c":7,"sw":2.2}]]],["F",54,1.5,199.5,39,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,199.5,21,"On a roll",[2,1],{"fw":1}],["T",0,0,199.5,18,"Go hunting 3 days in a row.",[3,5],{"fw":1}]]],["I",265.5,0,56.5,24,57,[["t",[0],"+60 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,293.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1,"a":["V",2,2,2,2,0,"N","N",0,1]},[["F",0,0,96.5,6,{"f":7,"r":3},[]]]],["T",0,0,18.5,14,"1/3",[10,5],{"ar":1}]]]]],["F",0,0,350,109,{"fw":1,"f":0,"r":24,"e":3,"a":["V",14,14,14,14,10,"N","N",0,1]},[["F",0,0,322,57,{"fw":1},[["F",0,7.5,42,42,{"f":1,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,19,19,3,{"c":7}]]],["F",54,0,192,57,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,192,21,"Full yard",[2,1],{"fw":1}],["T",0,0,192,36,"Collect every machine in the Yard.",[3,5],{"fw":1}]]],["I",258,0,64,24,57,[["t",[0],"+500 XP"]],{"n":"Pill"}]]],["F",0,0,322,14,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,286.5,10,{"n":"ProgressBar","fw":1,"f":11,"r":5,"e":4,"c":1,"a":["V",2,2,2,2,0,"N","N",0,1]},[["F",0,0,17,6,{"f":7,"r":3},[]]]],["T",0,0,25.5,14,"1/20",[10,5],{"ar":1}]]]]]]],["F",0,0,350,318,{"fw":1,"a":["V",0,0,0,0,12,"N","N",0,1]},[["T",0,0,350,26,"Badges",[9,1],{"fw":1}],["F",0,0,350,280,{"fw":1},[["F",0,0,78,78,{"n":"BadgeMedal · First Spot, earned","a":["V",0,0,0,0,6,"N","C",0,1]},[["F",0,0,58,58,{"f":7,"r":29,"s":[6,4],"e":20,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,84,{"c":8}]]],["T",0,0,49,14,"First Spot",[10,1],{"al":"C","ar":1,"ml":2}]]],["F",90.5,0,78,78,{"n":"BadgeMedal · Mission Done, locked","a":["V",0,0,0,0,6,"N","C",0,1]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,66.5,14,"Mission Done",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",181.5,0,78,78,{"n":"BadgeMedal · Big Ten, locked","a":["V",0,0,0,0,6,"N","C",0,1]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,36.5,14,"Big Ten",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",272,0,78,78,{"n":"BadgeMedal · Bingo!, locked","a":["V",0,0,0,0,6,"N","C",0,1]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,32,14,"Bingo!",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",0,94,78,92,{"n":"BadgeMedal · Rainbow Hunter, locked","a":["V",0,0,0,0,6,"N","C",1,1]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,78,28,"Rainbow Hunter",[10,2],{"al":"C","ml":2}]]],["F",90.5,94,78,92,{"n":"BadgeMedal · Crane Spotter, locked","a":["V",0,0,0,0,6,"N","C",0,0]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,71,14,"Crane Spotter",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",181.5,94,78,92,{"n":"BadgeMedal · Road Crew, locked","a":["V",0,0,0,0,6,"N","C",0,0]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,55,14,"Road Crew",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",272,94,78,92,{"n":"BadgeMedal · Name Game, locked","a":["V",0,0,0,0,6,"N","C",0,0]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,62,14,"Name Game",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",0,202,78,78,{"n":"BadgeMedal · Famous Finder, locked","a":["V",0,0,0,0,6,"N","C",0,1]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,73,14,"Famous Finder",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",90.5,202,78,78,{"n":"BadgeMedal · Legend, locked","a":["V",0,0,0,0,6,"N","C",0,1]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,37,14,"Legend",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",181.5,202,78,78,{"n":"BadgeMedal · On a Roll, locked","a":["V",0,0,0,0,6,"N","C",0,1]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,44.5,14,"On a Roll",[10,2],{"al":"C","ar":1,"ml":2}]]],["F",272,202,78,78,{"n":"BadgeMedal · Full Yard, locked","a":["V",0,0,0,0,6,"N","C",0,1]},[["F",0,0,58,58,{"f":11,"r":29,"s":[0,4],"e":4,"a":["V",4,4,4,4,0,"C","C",0,0]},[["S",0,0,23,23,136,{"c":2}]]],["T",0,0,42.5,14,"Full Yard",[10,2],{"al":"C","ar":1,"ml":2}]]]]]]]]]]]]]]],["F",128,2458,134,5,{"ab":1,"o":0.85,"f":1,"r":3},[]],["I",0,0,390,50,1,[["t",[0],"18:47"]],{"ab":1,"n":"StatusBarMock"}]]],"pos":[1140,9582]},
{"code":"E13","title":"Famous machines","scheme":"light","node":["F",0,0,390,2076,{"f":0,"c":1},[["F",0,0,390,2076,{"ab":1,"f":0,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,2076,{"n":"FameScreen","fw":1,"fh":1,"f":0,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,108,{"n":"ScreenHeader","fw":1,"a":["H",58,16,8,16,12,"N","C",0,1]},[["I",0,0,42,42,40,[["sw",[0],8]],{"n":"IconButton · Back","lk":"E1"}],["T",0,0,304,22,"Famous machines",[15,1],{"fw":1,"ml":1}]]],["F",0,0,390,1968,{"fw":1,"fh":1,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,390,1968,{"fw":1,"a":["V",0,20,62,20,14,"N","N",0,1]},[["F",0,0,350,86,{"fw":1,"f":8,"r":24,"a":["H",16,16,16,16,12,"N","C",0,1]},[["S",0,0,22,22,81,{"c":7}],["T",0,0,284,54,"Vote for the names you love. Then hunt them down in real life and snap them to add a famous machine to your Yard.",[3,6],{"fw":1}]]],["F",0,0,350,46,{"n":"Segmented","fw":1,"f":11,"r":18,"e":4,"a":["H",4,4,4,4,4,"N","N",0,0]},[["F",0,0,111.5,38,{"n":"Button","fw":1,"fh":1,"f":0,"r":12,"e":1,"a":["H",0,0,0,0,6,"C","C",0,0],"b":1},[["S",0,0,15,15,135,{"c":1}],["T",0,0,64,18,"Top names",[7,1],{"ar":1,"ml":1}]]],["F",0,0,111.5,38,{"n":"Button","fw":1,"fh":1,"r":12,"a":["H",0,0,0,0,6,"C","C",0,0],"b":1},[["S",0,0,15,15,2,{"c":5}],["T",0,0,46,18,"Newest",[7,5],{"ar":1,"ml":1}]]],["F",0,0,111.5,38,{"n":"Button","fw":1,"fh":1,"r":12,"a":["H",0,0,0,0,6,"C","C",0,0],"b":1},[["S",0,0,15,15,57,{"c":5}],["T",0,0,44.5,18,"Closest",[7,5],{"ar":1,"ml":1}]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"1",[24,1],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Mixy McMixface, Cement mixer","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,93,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Mixy McMixface",[27,1],{"ml":1}],["T",0,26,139.5,18,"Cement mixer · Mill Lane · 2.4 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,127,24,59,[],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Mixy McMixface","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"74",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"2",[24,1],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Big Bertha, Tower crane","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1,"lk":"E14"},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,94,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Big Bertha",[27,1],{"ml":1}],["T",0,26,139.5,18,"Tower crane · New library build · 2.0 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,103.5,24,59,[["t",[1],"The Mud Pies"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Big Bertha","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"61",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"3",[24,1],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Rolly Polly, Road roller","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,95,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Rolly Polly",[27,1],{"ml":1}],["T",0,26,139.5,18,"Road roller · Orbit Ave roadworks · 2.0 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,118,24,59,[["t",[1],"Puddle Jumpers"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Rolly Polly","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"52",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"4",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Digger Dave, Excavator","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,30,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Digger Dave",[27,1],{"ml":1}],["T",0,26,139.5,18,"Excavator · Bridge works · 1.1 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,89,24,59,[["t",[1],"Team Dino"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Digger Dave","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"48",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"5",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Stretch, Mobile crane","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,98,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Stretch",[27,1],{"ml":1}],["T",0,26,139.5,18,"Mobile crane · Bridge works · 1.2 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,118,24,59,[["t",[1],"Puddle Jumpers"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Stretch","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"44",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"6",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Blaze, Fire engine","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,97,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Blaze",[27,1],{"ml":1}],["T",0,26,139.5,18,"Fire engine · Fire station · 2.3 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,127,24,59,[],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Blaze","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"39",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"7",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Thumper, Pile driver","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,114,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Thumper",[27,1],{"ml":1}],["T",0,26,139.5,18,"Pile driver · Bridge works · 1.2 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,135,24,59,[["t",[1],"Little Diggers Crew"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Thumper","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"37",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"8",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Sir Scoops-a-Lot, Wheel loader","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,106,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Sir Scoops-a-Lot",[27,1],{"ml":1}],["T",0,26,139.5,18,"Wheel loader · Station yard · 4.1 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,126.5,24,59,[["t",[1],"Hard Hat Harriets"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Sir Scoops-a-Lot","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"33",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"9",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Gravel Gertie, Dump truck","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,108,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Gravel Gertie",[27,1],{"ml":1}],["T",0,26,139.5,18,"Dump truck · Southgate estate · 2.7 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,103.5,24,59,[["t",[1],"The Mud Pies"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Gravel Gertie","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"29",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"10",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Dozer Dan, Bulldozer","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,85,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Dozer Dan",[27,1],{"ml":1}],["T",0,26,139.5,18,"Bulldozer · Kestrel Heights estate · 5.0 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,101.5,24,59,[["t",[1],"Kestrel Crew"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Dozer Dan","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"26",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"11",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Lady Lift, Cherry picker","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,99,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Lady Lift",[27,1],{"ml":1}],["T",0,26,139.5,18,"Cherry picker · Ladder St · 2.6 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,89,24,59,[["t",[1],"Team Dino"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Lady Lift","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"21",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"12",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Gary Grader, Motor grader","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,111,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Gary Grader",[27,1],{"ml":1}],["T",0,26,139.5,18,"Motor grader · Rail trail · 5.5 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,135,24,59,[["t",[1],"Little Diggers Crew"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Gary Grader","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"18",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"13",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Binny, Garbage truck","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,96,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Binny",[27,1],{"ml":1}],["T",0,26,139.5,18,"Garbage truck · Southgate · 1.5 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,126.5,24,59,[["t",[1],"Hard Hat Harriets"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Binny","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"15",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"14",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Tele Ted, Telehandler","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,109,{}]]],["F",0,0,139.5,74,{"fw":1},[["T",0,0,139.5,23,"Tele Ted",[27,1],{"ml":1}],["T",0,26,139.5,18,"Telehandler · Foundry St · 3.7 km",[3,5],{"ml":1}],["F",0,50,139.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,101.5,24,59,[["t",[1],"Kestrel Crew"]],{"n":"Pill"}],["I",0,0,57,24,23,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Tele Ted","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,16.5,18,"12",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"15",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Swirly Sam, Cement mixer","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,93,{}]]],["F",0,0,148,74,{"fw":1},[["T",0,0,148,23,"Swirly Sam",[27,1],{"ml":1}],["T",0,26,148,18,"Cement mixer · 500 m",[3,5],{"ml":1}],["I",0,50,94,24,59,[["t",[1],"The Testers"]],{"n":"Pill"}]]],["F",0,0,48,32,{"n":"VoteButton · Vote for the name Swirly Sam","f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,8,18,"1",[7,1],{"ar":1}]]]]]]],["F",0,0,350,96,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["T",0,0,26,26,"16",[24,2],{"al":"C"}],["F",0,0,316,96,{"n":"SpotCard · Digger Dave, Excavator","fw":1,"f":0,"r":24,"e":3,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":43,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,30,{}]]],["F",0,0,148,74,{"fw":1},[["T",0,0,148,23,"Digger Dave",[27,1],{"ml":1}],["T",0,26,148,18,"Excavator · 150 m",[3,5],{"ml":1}],["I",0,50,47,24,72,[],{"n":"Pill"}]]],["F",0,0,48,32,{"n":"VoteButton · Vote for the name Digger Dave","o":0.7,"f":0,"r":16.5,"e":1,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":1}],["T",0,0,8,18,"0",[7,1],{"ar":1}]]]]]]]]]]]]]]],["F",128,2063,134,5,{"ab":1,"o":0.85,"f":1,"r":3},[]],["I",0,0,390,50,1,[["t",[0],"18:47"]],{"ab":1,"n":"StatusBarMock"}]]],"pos":[1650,9582]},
{"code":"E14","title":"Machine · Big Bertha","scheme":"light","node":["F",0,0,390,977,{"f":0,"c":1},[["F",0,0,390,977,{"ab":1,"f":0,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,977,{"n":"SpotDetailScreen","fw":1,"fh":1,"f":0,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,108,{"n":"ScreenHeader","fw":1,"a":["H",58,16,8,16,12,"N","C",0,1]},[["I",0,0,42,42,40,[["sw",[0],8]],{"n":"IconButton · Back","lk":"E13"}],["T",0,0,304,22,"Tower crane",[15,1],{"fw":1,"ml":1}]]],["F",0,0,390,869,{"fw":1,"fh":1,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,390,868.5,{"fw":1,"a":["V",0,20,142,20,18,"N","N",0,1]},[["F",0,0,350,262.5,{"fw":1,"f":43,"r":30,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,260,162.5,94,{}],["I",12,12,57,24,73,[],{"ab":1,"n":"Pill"}]]],["F",0,0,350,62,{"fw":1,"a":["H",0,0,0,0,12,"N","C",0,1]},[["F",0,0,275.5,62,{"fw":1,"a":["V",0,0,0,0,4,"N","N",0,1]},[["T",0,0,275.5,40,"Big Bertha",[22,1],{"fw":1}],["T",0,0,275.5,18,"Uncommon tower crane · New library build",[3,5],{"fw":1}]]],["F",0,0,62.5,38,{"n":"VoteButton · Vote for the name Big Bertha","f":0,"r":19.5,"e":1,"a":["H",0,12,0,12,6,"N","C",1,0],"b":1},[["S",0,0,16,16,81,{"c":1}],["T",0,0,16.5,18,"61",[7,1],{"ar":1}]]]]],["F",0,0,350,24,{"fw":1,"a":["H",0,118.9,0,0,8,"N","N",0,0]},[["I",0,0,160,24,59,[["t",[1],"Named by The Mud Pies"]],{"n":"Pill"}],["I",0,0,63,24,59,[["sw",[0],137],["isw",[0],0],["t",[1],"Oct 6"]],{"n":"Pill"}]]],["F",0,0,350,190,{"fw":1,"r":24,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,350,190,{"n":"AppMap","fw":1,"fh":1,"f":23,"c":1},[["F",0,0,350,190,{"n":"Map of places nearby","ab":1},[["M",0,0,350,190,{"n":"Map","ab":1,"cam":[112,361,0.14],"mw":1,"jw":2.2}],["T",23,-321.5,81.5,14.5,"Riverbend",[12,25],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[24,1.5]}],["F",137,8,76.5,87,{"n":"Big Bertha","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,76.5,87,74,[],{"n":"Pin"}]]]]]]]]],["T",0,0,350,28,"Location rounded to about 150 m to keep families private. Look around the area!",[10,5],{"fw":1}],["F",0,0,350,70,{"n":"Surface","fw":1,"f":0,"r":18,"e":1,"a":["H",14,14,14,14,12,"N","N",0,1]},[["S",0,0,18,18,104,{"c":39}],["T",0,0,292,42,"The operator climbs a ladder inside the tower to reach the cab.",[1,1],{"fw":1,"fh":1}]]]]]]],["F",0,883,390,94,{"ab":1,"f":0,"a":["V",16,16,22,16,0,"N","N",0,1]},[["I",0,0,358,56,63,[["sw",[0],29],["t",[1],"I found it!"]],{"fw":1,"n":"Button · I found it!"}]]]]]]],["F",128,964,134,5,{"ab":1,"o":0.85,"f":1,"r":3},[]],["I",0,0,390,50,1,[["t",[0],"18:47"]],{"ab":1,"n":"StatusBarMock"}]]],"pos":[2160,9582]},
{"code":"E15","title":"Leaderboard","scheme":"light","node":["F",0,0,390,956,{"f":0,"c":1},[["F",0,0,390,956,{"ab":1,"f":0,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,956,{"n":"LeaderboardScreen","fw":1,"fh":1,"f":0,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,108,{"n":"ScreenHeader","fw":1,"a":["H",58,16,8,16,12,"N","C",0,1]},[["I",0,0,42,42,40,[["sw",[0],8]],{"n":"IconButton · Back","lk":"E1"}],["T",0,0,304,22,"Leaderboard",[15,1],{"fw":1,"ml":1}]]],["F",0,0,390,848,{"fw":1,"fh":1,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,390,848,{"fw":1},[["F",20,0,350,90,{"a":["V",0,0,0,0,4,"N","N",0,1]},[["T",0,0,350,14,"This week · families nearby",[5,5],{"fw":1}],["T",0,0,350,32,"Top hunting crews",[4,1],{"fw":1}],["T",0,0,350,36,"XP from spots and challenges. Resets every Monday. Team names only, never kids’ names.",[3,5],{"fw":1}]]],["F",20,114,350,208,{"a":["H",0,0,0,0,10,"N","X",0,1]},[["F",0,0,110,144,{"n":"Podium","fw":1,"a":["V",0,0,0,0,8,"N","C",1,1]},[["T",0,0,79,36,"The Mud Pies",[7,1],{"al":"C","ar":1,"ml":2}],["F",0,0,110,100,{"f":0,"r":[18,18,0,0],"e":3,"a":["V",12,0,0,0,2,"N","C",0,0]},[["T",0,0,21,40,"2",[33,1],{"ar":1}],["T",0,0,40.5,14,"1620 XP",[10,5],{"ar":1}]]]]],["F",0,0,110,208,{"n":"Podium","fw":1,"a":["V",0,0,0,0,8,"N","C",1,1]},[["S",0,0,26,26,138,{"c":7,"fc":7}],["T",0,0,63,36,"Team Dino",[7,1],{"al":"C","ar":1,"ml":2}],["F",0,0,110,130,{"f":7,"r":[18,18,0,0],"a":["V",12,0,0,0,2,"N","C",0,0]},[["T",0,0,12.5,40,"1",[33,8],{"ar":1}],["T",0,0,41.5,14,"1840 XP",[10,8],{"ar":1}]]]]],["F",0,0,110,124,{"n":"Podium","fw":1,"a":["V",0,0,0,0,8,"N","C",1,1]},[["T",0,0,96,36,"Puddle Jumpers",[7,1],{"al":"C","ar":1,"ml":2}],["F",0,0,110,80,{"f":0,"r":[18,18,0,0],"e":3,"a":["V",12,0,0,0,2,"N","C",0,0]},[["T",0,0,21.5,40,"3",[33,1],{"ar":1}],["T",0,0,40.5,14,"1390 XP",[10,5],{"ar":1}]]]]]]],["F",20,340,350,404,{"a":["V",0,0,0,0,10,"N","N",0,1]},[["F",0,0,350,59,{"fw":1,"f":0,"r":18,"e":1,"a":["H",12,14,12,14,12,"N","C",0,1]},[["T",0,0,30,26,"4",[24,5],{}],["F",0,0,226.5,35,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,226.5,21,"Team Rocket Kids",[2,1],{"fw":1,"ml":1}],["T",0,0,226.5,14,"41 spots · 14 machine types",[10,5],{"fw":1}]]],["T",0,0,41.5,22,"1210",[15,1],{"ar":1}]]],["F",0,0,350,59,{"fw":1,"f":0,"r":18,"e":1,"a":["H",12,14,12,14,12,"N","C",0,1]},[["T",0,0,30,26,"5",[24,5],{}],["F",0,0,236.5,35,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,236.5,21,"Little Diggers Crew",[2,1],{"fw":1,"ml":1}],["T",0,0,236.5,14,"33 spots · 12 machine types",[10,5],{"fw":1}]]],["T",0,0,31.5,22,"980",[15,1],{"ar":1}]]],["F",0,0,350,59,{"fw":1,"f":0,"r":18,"e":1,"a":["H",12,14,12,14,12,"N","C",0,1]},[["T",0,0,30,26,"6",[24,5],{}],["F",0,0,236.5,35,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,236.5,21,"Hard Hat Harriets",[2,1],{"fw":1,"ml":1}],["T",0,0,236.5,14,"26 spots · 11 machine types",[10,5],{"fw":1}]]],["T",0,0,31.5,22,"760",[15,1],{"ar":1}]]],["F",0,0,350,59,{"fw":1,"f":0,"r":18,"e":1,"a":["H",12,14,12,14,12,"N","C",0,1]},[["T",0,0,30,26,"7",[24,5],{}],["F",0,0,236.5,35,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,236.5,21,"Kestrel Crew",[2,1],{"fw":1,"ml":1}],["T",0,0,236.5,14,"19 spots · 9 machine types",[10,5],{"fw":1}]]],["T",0,0,31.5,22,"540",[15,1],{"ar":1}]]],["F",0,0,350,59,{"fw":1,"f":0,"r":18,"e":1,"a":["H",12,14,12,14,12,"N","C",0,1]},[["T",0,0,30,26,"8",[24,5],{}],["F",0,0,236.5,35,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,236.5,21,"The Testers",[2,1],{"fw":1,"ml":1}],["T",0,0,236.5,14,"9 spots · 6 machine types",[10,5],{"fw":1}]]],["T",0,0,31.5,22,"420",[15,1],{"ar":1}]]],["F",0,0,350,59,{"fw":1,"f":1,"r":18,"a":["H",12,14,12,14,12,"N","C",0,1]},[["T",0,0,30,26,"9",[24,7],{}],["F",0,0,247,35,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,247,21,"Team Explorer (you)",[2,6],{"fw":1,"ml":1}],["T",0,0,247,14,"1 spot · 1 machine type",[10,6],{"fw":1,"o":0.75}]]],["T",0,0,21,22,"60",[15,7],{"ar":1}]]]]],["I",20,762,262,24,59,[["sw",[0],63],["isw",[0],0],["t",[1],"Includes sample crews from the demo town"]],{"n":"Pill"}]]]]]]]]],["F",128,943,134,5,{"ab":1,"o":0.85,"f":1,"r":3},[]],["I",0,0,390,50,1,[["t",[0],"18:47"]],{"ab":1,"n":"StatusBarMock"}]]],"pos":[2670,9582]},
{"code":"F1","title":"Explore · dark","scheme":"dark","node":["F",0,0,390,844,{"f":58,"c":1},[["F",0,0,390,844,{"ab":1,"f":58,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,844,{"n":"Tabs","fw":1,"fh":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,844,{"fw":1,"fh":1,"c":1},[["F",0,0,390,844,{"ab":1,"f":58,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,844,{"n":"ExploreScreen","fw":1,"fh":1,"f":59,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,844,{"n":"AppMap","fw":1,"fh":1,"f":59,"c":1},[["F",0,0,390,844,{"n":"Map of places nearby","ab":1},[["M",0,0,390,844,{"n":"Map","ab":1,"cam":[195,322,0.028336],"mw":0.7,"jw":2.2,"ci":"<circle cx='195' cy='322' r='141.7' fill='#FFC93312' stroke='#F3F4F680' stroke-dasharray='6 6' stroke-width='1.5'/><circle cx='195' cy='322' r='70.8' fill='none' stroke='#F3F4F680' stroke-dasharray='2 6' stroke-opacity='0.35' stroke-width='1'/>"}],["T",154,280.5,70.5,12,"Riverbend",[8,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",70,232,85.5,12,"Kestrel Hill",[8,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",255,272,58,12,"Old Mill",[8,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",212,378,63,12,"Fernleaf",[8,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",37.5,300,60,12,"Bluebell",[8,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",299,232,87,12,"Willow Lake",[8,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",253,367,116,12,"Station Quarter",[8,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",109.5,389.5,74,12,"Southgate",[8,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["F",186,313,18,18,{"ab":1,"f":61,"r":9,"s":[6,3],"e":5},[]],["F",254,269,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,1],{"ar":1}]]]]],["F",104,245,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,1],{"ar":1}]]]]],["F",233,347,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,1],{"ar":1}]]]]],["F",128,289,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,1],{"ar":1}]]]]],["F",224.5,297.5,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,1],{"ar":1}]]]]],["F",169,269,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,1],{"ar":1}]]]]],["F",165,311,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,1],{"ar":1}]]]]],["F",193,221,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,1],{"ar":1}]]]]],["F",197.5,285.5,32,32,{"n":"4 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":61,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7.5,14,"4",[34,1],{"ar":1}]]]]],["F",288.5,350,34,40,{"n":"Riverbend Railway Museum","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[],{"n":"Pin"}]]],["F",257.5,372.5,34,40,{"n":"The Bug House","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],18],["sw",[0,0],25]],{"n":"Pin"}]]],["F",161,185.5,34,40,{"n":"Riverbend Aquarium","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],18],["sw",[0,0],25]],{"n":"Pin"}]]],["F",311,241,34,40,{"n":"Willow Lake Beach","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],13],["sw",[0,0],24]],{"n":"Pin"}]]],["F",79,253.5,34,40,{"n":"Spark Science Centre","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[],{"n":"Pin"}]]],["F",297,299.5,34,40,{"n":"Pirate Cove Playground","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],10],["sw",[0,0],20]],{"n":"Pin"}]]],["F",57.5,294,34,40,{"n":"Bluebell Woods Fairy Trail","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],14],["sw",[0,0],21]],{"n":"Pin"}]]],["F",278.5,320.5,34,40,{"n":"Steam Train Lookout","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],17],["sw",[0,0],29]],{"n":"Pin"}]]],["F",155.5,219.5,34,40,{"n":"Riverbend Fire Station","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],17],["sw",[0,0],29]],{"n":"Pin"}]]],["F",88.5,329,34,40,{"n":"Treetop Nature Play","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],10],["sw",[0,0],20]],{"n":"Pin"}]]],["F",249,343,34,40,{"n":"Fernleaf Wetland Boardwalk","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],14],["sw",[0,0],21]],{"n":"Pin"}]]],["F",121.5,307.5,34,40,{"n":"The Swing Bridge","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],17],["sw",[0,0],29]],{"n":"Pin"}]]],["F",141,330,34,40,{"n":"Riverbend Aquatic Centre","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],13],["sw",[0,0],24]],{"n":"Pin"}]]],["F",198,346,34,40,{"n":"Little Steps Toddler Park","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],10],["sw",[0,0],20]],{"n":"Pin"}]]],["F",213.5,239.5,34,40,{"n":"The Big Dig Adventure Playground","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],10],["sw",[0,0],20]],{"n":"Pin"}]]],["F",206.5,294,34,40,{"n":"Big Dig Bridge Viewing Deck","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,75,[["f",[0],17],["sw",[0,0],29]],{"n":"Pin"}]]],["F",273,214,34,40,{"n":"Little Builders Soft Play","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,76,[],{"n":"Pin"}]]],["F",115.5,347,34,40,{"n":"Jumpin' Jungle","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,34,40,76,[],{"n":"Pin"}]]]]]]],["F",0,0,390,218,{"ab":1},[["F",0,58,390,52,{"a":["H",0,16,0,16,10,"N","N",0,0]},[["F",0,0,296,52,{"n":"Search places","fw":1,"fh":1,"f":62,"r":26,"e":21,"a":["H",0,8,0,18,10,"N","C",0,0],"b":1},[["S",0,0,19,19,33,{"c":61}],["T",0,0,165.5,21,"What’s the plan today?",[2,61],{"fw":1,"ml":1}],["F",0,0,65.5,36,{"n":"Ask Playdar","f":61,"r":18,"a":["H",0,12,0,12,5,"N","C",1,0],"b":1},[["S",0,0,14,14,2,{"c":1}],["T",0,0,22.5,18,"Ask",[7,1],{"ar":1}]]]]],["I",0,0,52,52,77,[],{"fh":1,"n":"IconButton · Filters"}]]],["F",0,120,390,44,{"c":1,"a":["H",0,0,0,0,0,"N","N",0,0]},[["F",0,0,1385,44,{"fh":1,"a":["H",0,16,6,16,8,"N","N",0,0]},[["I",0,0,65.5,38,78,[],{"fh":1,"n":"Chip · All"}],["I",0,0,82.5,38,79,[],{"fh":1,"n":"Chip · Parks"}],["I",0,0,124,38,79,[["sw",[0],20],["ic",[0],10],["t",[1],"Playgrounds"]],{"fh":1,"n":"Chip · Playgrounds"}],["I",0,0,86,38,79,[["sw",[0],22],["ic",[0],16],["t",[1],"Books"]],{"fh":1,"n":"Chip · Books"}]]]]],["I",330,174,44,44,80,[],{"n":"IconButton · Show my area"}]]],["F",0,456,390,844,{"ab":1,"f":58,"r":[30,30,0,0],"e":22,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,77,{"fw":1,"a":["V",10,0,12,0,6,"N","C",0,0]},[["F",0,0,42,5,{"o":0.6,"f":64,"r":3},[]],["F",0,0,350,44,{"a":["H",0,0,0,0,12,"SB","C",0,1]},[["F",0,0,262.5,44,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,262.5,26,"38 places nearby",[9,61],{"fw":1,"ml":1}],["T",0,0,262.5,18,"Within 5 km · Riverbend demo town",[3,52],{"fw":1,"ml":1}]]],["F",0,0,75.5,38,{"n":"Change range","f":58,"r":19.5,"e":23,"a":["H",0,12,0,12,6,"N","C",1,0],"b":1},[["S",0,0,16,16,1,{"c":61}],["T",0,0,29.5,18,"5 km",[7,61],{"ar":1}]]]]]]],["F",0,0,390,767,{"fw":1,"fh":1,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,6410,{"fw":1,"a":["V",0,0,6016.8,0,18,"N","C",0,0]},[["F",0,0,350,98,{"f":58,"r":24,"e":24,"a":["V",14,16,8,16,0,"N","N",0,1]},[["F",0,0,318,18,{"fw":1,"a":["H",0,0,0,0,0,"SB","C",0,1]},[["T",0,0,127,14,"Your radar range",[5,52],{"ar":1}],["T",0,0,29.5,18,"5 km",[7,61],{"ar":1}]]],["F",0,0,318,44,{"n":"Slider · Search range","fw":1,"a":["V",0,9,0,9,0,"C","N",0,0]},[["F",0,0,300,12,{"fw":1,"f":67,"r":6,"e":25},[]],["F",12,19,88.5,6,{"ab":1,"f":61,"r":3},[]],["F",82.5,7,30,30,{"ab":1,"f":58,"r":15,"e":23,"a":["V",0,0,0,0,0,"C","C",0,0]},[["F",0,0,10,10,{"f":68,"r":5},[]]]]]],["F",0,0,318,14,{"fw":1,"a":["H",0,0,0,0,0,"SB","N",0,0]},[["T",0,0,91.5,14,"Around the corner",[10,64],{"fh":1,"ar":1}],["T",0,0,39.5,14,"Day trip",[10,64],{"fh":1,"ar":1}]]]]],["F",0,0,350,85,{"n":"Button","f":61,"r":24,"a":["H",14,14,14,14,12,"N","C",0,1],"b":1},[["F",0,0,42,42,{"f":68,"r":21,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,22,22,37,{"c":1}]]],["F",0,0,268,57,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,268,21,"Sunny 23°",[2,1],{"fw":1}],["T",0,0,268,36,"Great day to be outside. Parks and playgrounds are calling.",[3,1],{"fw":1,"o":0.8}]]]]],["F",0,0,390,174,{"a":["V",0,20,0,20,10,"N","N",0,1]},[["T",0,0,350,14,"Quick ideas",[5,52],{"fw":1}],["F",0,0,350,150,{"fw":1,"a":["H",0,0,80,0,10,"N","N",0,0]},[["F",0,0,110,70,{"n":"Burn energy: Playgrounds, trampolines, big lawns","f":58,"r":18,"e":23,"a":["V",12,10,12,10,8,"N","N",0,1],"b":1},[["S",0,0,20,20,38,{"c":61}],["T",0,0,73,18,"Burn energy",[7,61],{"ar":1,"ml":1}]]],["F",0,0,110,70,{"n":"Rainy day: Indoor and covered spots","f":58,"r":18,"e":23,"a":["V",12,10,12,10,8,"N","N",0,1],"b":1},[["S",0,0,20,20,39,{"c":61}],["T",0,0,58.5,18,"Rainy day",[7,61],{"ar":1,"ml":1}]]],["F",0,0,110,70,{"n":"Free: Costs nothing","f":58,"r":18,"e":23,"a":["V",12,10,12,10,8,"N","N",0,1],"b":1},[["S",0,0,20,20,40,{"c":61}],["T",0,0,26.5,18,"Free",[7,61],{"ar":1,"ml":1}]]]]]]]]]]]]]]]]]]],["I",0,756,390,88,81,[],{"ab":1,"n":"TabBar"}]]]]],["F",128,831,134,5,{"ab":1,"o":0.85,"f":61,"r":3},[]],["I",0,0,390,50,82,[],{"ab":1,"n":"StatusBarMock"}]]],"pos":[120,12660]},
{"code":"F2","title":"Place · dark","scheme":"dark","node":["F",0,0,390,2053,{"f":58,"c":1},[["F",0,0,390,2053,{"ab":1,"f":58,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,2053,{"n":"PlaceScreen","fw":1,"fh":1,"f":58,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,2053,{"fw":1,"fh":1,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,390,2053,{"fw":1,"a":["V",0,0,132,0,-10,"N","N",0,1]},[["F",0,0,390,310,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["S",0,0,390,310,47,{"fw":1,"fit":1}],["F",0,270,390,40,{"ab":1,"f":58,"r":[20.5,20.5,0,0]},[]]]],["F",0,0,390,1621,{"fw":1,"a":["V",0,0,0,0,18,"N","C",0,0]},[["F",0,0,350,121,{},[["F",0,0,350,24,{"a":["H",0,208.6,0,0,6,"N","N",0,0]},[["F",0,0,57,24,{"f":12,"r":12.5,"a":["H",0,9,0,9,5,"N","C",1,0]},[["S",0,0,12,12,19,{"c":6}],["T",0,0,22,14,"Park",[10,6],{"ar":1}]]],["I",0,0,78.5,24,83,[],{"n":"Pill"}]]],["T",0,32,350,32,"Riverbend Commons",[4,61],{}],["T",0,72,350,21,"Riverbend · Commons Rd",[1,52],{}],["F",0,103,350,18,{"a":["H",0,0,0,0,14,"N","C",0,1]},[["F",0,0,58,18,{"a":["H",0,0,0,0,5,"N","C",1,1]},[["S",0,0,15,15,57,{"c":69}],["T",0,0,38,18,"550 m",[7,69],{"ar":1}]]],["F",0,0,83.5,18,{"a":["H",0,0,0,0,5,"N","C",1,1]},[["S",0,0,15,15,21,{"c":69}],["T",0,0,63.5,18,"9 min walk",[7,69],{"ar":1}]]],["F",0,0,100.5,18,{"a":["H",0,0,0,0,5,"N","C",1,1]},[["F",0,0,8,8,{"f":70,"r":4},[]],["T",0,0,87.5,18,"Open any time",[7,70],{"ar":1}]]]]]]],["F",0,0,350,85,{"a":["H",0,0,0,0,10,"N","N",0,0]},[["F",0,0,110,85,{"n":"Fact","fw":1,"fh":1,"f":58,"r":18,"e":23,"a":["V",12,10,12,10,6,"N","N",0,1]},[["S",0,0,17,17,51,{"c":69}],["T",0,0,39.5,14,"Best for",[10,52],{"ar":1,"ml":1}],["T",0,0,62,18,"Ages 0–12",[7,61],{"ar":1,"ml":1}]]],["F",0,0,110,85,{"n":"Fact","fw":1,"fh":1,"f":58,"r":18,"e":23,"a":["V",12,10,12,10,6,"N","N",0,1]},[["S",0,0,17,17,28,{"c":69}],["T",0,0,24,14,"Cost",[10,52],{"ar":1,"ml":1}],["T",0,0,26.5,18,"Free",[7,61],{"ar":1,"ml":1}]]],["F",0,0,110,85,{"n":"Fact","fw":1,"fh":1,"f":58,"r":18,"e":23,"a":["V",12,10,12,10,6,"N","N",0,1]},[["S",0,0,17,17,37,{"c":69}],["T",0,0,37,14,"Setting",[10,52],{"ar":1,"ml":1}],["T",0,0,50.5,18,"Outdoor",[7,61],{"ar":1,"ml":1}]]]]],["F",0,0,350,317,{"n":"VibeMeter","f":58,"r":26,"e":24,"a":["V",18,18,18,18,16,"N","N",0,1]},[["F",0,0,314,92,{"fw":1,"a":["H",0,0,0,0,16,"N","C",0,1]},[["F",0,0,150,92,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["V",0,0,150,92,"<svg width='150' height='92' viewBox='0 0 200 116' xmlns='http://www.w3.org/2000/svg'><path d='M20 100 A80 80 0 0 1 180 100' stroke='#181B20' stroke-width='18' stroke-linecap='round' fill='none'></path><path d='M20 100 A80 80 0 0 1 174.4 70.6' stroke='#FFC933' stroke-width='18' stroke-linecap='round' fill='none'></path><circle cx='174.38' cy='70.55' r='7' fill='#1C1F25' stroke='#FFC933' stroke-width='4'></circle></svg>",{"fw":1}],["T",54.5,56,41,36,"88",[19,61],{"ab":1,"ar":1}]]],["F",0,0,148,84,{"fw":1,"a":["V",0,0,0,0,4,"N","N",0,1]},[["T",0,0,148,14,"Vibe meter",[5,52],{"fw":1}],["T",0,0,148,26,"Total vibe",[9,61],{"fw":1}],["T",0,0,148,36,"96% of 214 parents say it’s a vibe",[3,52],{"fw":1}]]]]],["F",0,0,314,103,{"fw":1,"a":["V",0,0,0,0,7,"N","N",0,1]},[["F",0,0,314,15,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["S",0,0,15,15,2,{"c":69}],["T",0,0,70,14,"Total vibe",[10,69],{}],["F",0,0,171,8,{"fw":1,"f":67,"r":4,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,171,8,{"fw":1,"f":68,"r":4},[]]]],["T",0,0,28,14,"114",[10,52],{"al":"R"}]]],["F",0,0,314,15,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["S",0,0,15,15,58,{"c":69}],["T",0,0,70,14,"Good",[10,69],{}],["F",0,0,171,8,{"fw":1,"f":67,"r":4,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,138,8,{"f":68,"r":4},[]]]],["T",0,0,28,14,"92",[10,52],{"al":"R"}]]],["F",0,0,314,15,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["S",0,0,15,15,59,{"c":69}],["T",0,0,70,14,"Decent",[10,69],{}],["F",0,0,171,8,{"fw":1,"f":67,"r":4,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,12,8,{"f":64,"r":4},[]]]],["T",0,0,28,14,"8",[10,52],{"al":"R"}]]],["F",0,0,314,15,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["S",0,0,15,15,60,{"c":69}],["T",0,0,70,14,"Meh",[10,69],{}],["F",0,0,171,8,{"fw":1,"f":67,"r":4,"c":1},[]],["T",0,0,28,14,"0",[10,52],{"al":"R"}]]],["F",0,0,314,15,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["S",0,0,15,15,61,{"c":69}],["T",0,0,70,14,"Nope",[10,69],{}],["F",0,0,171,8,{"fw":1,"f":67,"r":4,"c":1},[]],["T",0,0,28,14,"0",[10,52],{"al":"R"}]]]]],["F",0,0,314,54,{"fw":1},[["I",0,0,115,24,84,[],{"n":"Pill"}],["I",121,0,106,24,84,[["t",[1],"Pram-friendly"]],{"n":"Pill"}],["I",0,30,99.5,24,84,[["t",[1],"Clean toilets"]],{"n":"Pill"}],["I",105.5,30,87,24,84,[["t",[1],"Lots to do"]],{"n":"Pill"}],["I",198.5,30,86.5,24,85,[],{"n":"Pill"}]]]]],["F",0,0,350,216,{},[["T",0,0,350,26,"About",[9,61],{}],["T",0,36,350,84,"The town’s main park. Wide flat paths loop the duck pond, there are huge shady oaks for picnics, and the kiosk does ice blocks in summer. Lots of space for scooters and kites.",[1,69],{}],["F",0,134,350,82,{"a":["V",0,0,0,0,8,"N","N",0,1]},[["F",0,0,350,22,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,22,22,{"f":68,"r":11,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,13,13,62,{"c":1,"sw":3}]]],["T",0,0,318,21,"Duck pond with a viewing jetty",[2,61],{"fw":1}]]],["F",0,0,350,22,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,22,22,{"f":68,"r":11,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,13,13,62,{"c":1,"sw":3}]]],["T",0,0,318,21,"Scooter-friendly loop path",[2,61],{"fw":1}]]],["F",0,0,350,22,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["F",0,0,22,22,{"f":68,"r":11,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,13,13,62,{"c":1,"sw":3}]]],["T",0,0,318,21,"Kiosk open on weekends",[2,61],{"fw":1}]]]]]]],["F",0,0,350,226,{"a":["V",0,0,0,0,10,"N","N",0,1]},[["T",0,0,350,26,"Good to know",[9,61],{"fw":1}],["F",0,0,350,190,{"fw":1},[["F",0,0,87.5,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,50,{"c":69}],["T",0,0,39.5,18,"Toilets",[7,61],{"ar":1}]]],["F",97.5,0,125,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,51,{"c":69}],["T",0,0,77,18,"Baby change",[7,61],{"ar":1}]]],["F",232,0,93,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,52,{"c":69}],["T",0,0,45,18,"Parking",[7,61],{"ar":1}]]],["F",0,50,85,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,39,{"c":69}],["T",0,0,37,18,"Shade",[7,61],{"ar":1}]]],["F",95,50,131,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,51,{"c":69}],["T",0,0,83,18,"Pram-friendly",[7,61],{"ar":1}]]],["F",236,50,112,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,54,{"c":69}],["T",0,0,64,18,"Accessible",[7,61],{"ar":1}]]],["F",0,100,137.5,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,64,{"c":69}],["T",0,0,89.5,18,"Water fountain",[7,61],{"ar":1}]]],["F",147.5,100,120,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,65,{"c":69}],["T",0,0,72,18,"Picnic spots",[7,61],{"ar":1}]]],["F",0,150,80,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,45,{"c":69,"sw":2.2}],["T",0,0,32,18,"BBQs",[7,61],{"ar":1}]]],["F",90,150,76.5,40,{"f":58,"r":18,"e":23,"a":["H",0,12,0,12,8,"N","C",1,0]},[["S",0,0,16,16,27,{"c":69}],["T",0,0,28.5,18,"Café",[7,61],{"ar":1}]]]]]]],["F",0,0,350,114,{"a":["V",0,0,0,0,10,"N","N",0,1]},[["T",0,0,350,26,"What’s on",[9,61],{"fw":1}],["F",0,0,350,78,{"fw":1,"f":58,"r":18,"e":23,"a":["H",12,12,12,12,12,"N","C",0,1]},[["F",0,0,50,54,{"f":61,"r":12,"a":["V",0,0,0,0,0,"C","C",0,0]},[["T",0,0,20.5,14,"Sat",[20,1],{"ar":1}],["T",0,0,17,22,"10",[15,1],{"ar":1}]]],["F",0,0,264,41,{"fw":1,"a":["V",0,0,0,0,2,"N","N",0,1]},[["T",0,0,264,21,"Open-air puppet show",[2,61],{"fw":1}],["T",0,0,264,18,"3:00 PM · Free · Ages 2–7",[3,52],{"fw":1}]]]]]]],["F",0,0,350,26,{"n":"Button","a":["H",0,0,0,0,0,"SB","C",0,1],"b":1},[["T",0,0,146.5,26,"Opening hours",[9,61],{"ar":1}],["S",0,0,20,20,66,{"c":61}]]],["F",0,0,350,338,{"a":["V",0,0,0,0,12,"N","N",0,1]},[["F",0,0,350,26,{"fw":1,"a":["H",0,0,0,0,0,"SB","C",0,1]},[["T",0,0,118,26,"Parents say",[9,61],{"ar":1}],["T",0,0,79.5,18,"2 vibe checks",[3,52],{"ar":1}]]],["F",0,0,350,144,{"n":"Review","fw":1,"f":58,"r":18,"e":23,"a":["V",14,14,14,14,8,"N","N",0,1]},[["F",0,0,322,34,{"fw":1},[["F",0,0,34,34,{"f":68,"r":17,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,18,18,2,{"c":1}]]],["F",44,1,211,32,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,211,18,"Total vibe",[7,61],{"fw":1}],["T",0,0,211,14,"Parent of 3 · 3 days ago",[10,52],{"fw":1}]]],["I",265,0,57,24,86,[],{"n":"Pill"}]]],["T",0,0,322,42,"Our go-to. Scooters around the pond, picnic under the oaks, ice blocks from the kiosk.",[1,69],{"fw":1}],["F",0,0,322,24,{"fw":1,"a":["H",0,37.6,0,0,6,"N","N",0,0]},[["I",0,0,99,24,83,[["t",[0],"Plenty of shade"]],{"n":"Pill"}],["I",0,0,90,24,83,[["t",[0],"Pram-friendly"]],{"n":"Pill"}],["I",0,0,83.5,24,83,[["t",[0],"Clean toilets"]],{"n":"Pill"}]]]]],["F",0,0,350,144,{"n":"Review","fw":1,"f":58,"r":18,"e":23,"a":["V",14,14,14,14,8,"N","N",0,1]},[["F",0,0,322,34,{"fw":1},[["F",0,0,34,34,{"f":68,"r":17,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,18,18,58,{"c":1}]]],["F",44,1,211,32,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,211,18,"Good vibes",[7,61],{"fw":1}],["T",0,0,211,14,"Parent of a toddler · 1 wk ago",[10,52],{"fw":1}]]],["I",265,0,57,24,86,[],{"n":"Pill"}]]],["T",0,0,322,42,"Lovely but the ducks are aggressive about bread. Bring peas instead.",[1,69],{"fw":1}],["F",0,0,322,24,{"fw":1,"a":["H",0,155.5,0,0,6,"N","N",0,0]},[["I",0,0,70.5,24,87,[],{"n":"Pill"}],["I",0,0,90,24,83,[["t",[0],"Pram-friendly"]],{"n":"Pill"}]]]]]]],["F",0,0,130,34,{"n":"Button","a":["H",8,8,8,8,8,"N","C",1,1],"b":1},[["S",0,0,14,14,67,{"c":52}],["T",0,0,92,18,"Suggest an edit",[3,52],{"ar":1}]]]]]]]]],["F",16,58,358,42,{"ab":1,"a":["H",0,0,0,0,274,"N","N",0,0]},[["I",0,0,42,42,88,[],{"n":"IconButton · Back","lk":"F1"}],["I",0,0,42,42,89,[],{"n":"SaveHeart · Save Riverbend Commons"}]]],["F",0,1963,390,90,{"ab":1,"f":58,"e":26,"a":["H",12,16,22,16,12,"N","N",0,0]},[["I",0,0,161,56,90,[],{"fw":1,"fh":1,"n":"Button · Vibe check"}],["I",0,0,185,56,91,[],{"fw":1,"fh":1,"n":"Button · Let’s go"}]]]]]]],["F",128,2040,134,5,{"ab":1,"o":0.85,"f":61,"r":3},[]],["I",0,0,390,50,82,[],{"ab":1,"n":"StatusBarMock"}]]],"pos":[630,12660]},
{"code":"F3","title":"Hunt hub · dark","scheme":"dark","node":["F",0,0,390,1994,{"f":58,"c":1},[["F",0,0,390,1994,{"ab":1,"f":58,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,1994,{"n":"Tabs","fw":1,"fh":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,1994,{"fw":1,"fh":1,"c":1},[["F",0,0,390,1994,{"ab":1,"f":58,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,1994,{"n":"HuntScreen","fw":1,"fh":1,"f":58,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,390,1994,{"fw":1,"a":["V",62,0,126,0,22,"N","C",0,0]},[["F",0,0,350,152,{"n":"SiteSign","f":8,"r":24,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["F",0,0,350,12,{"n":"Hazard","fw":1,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["V",0,0,350,12,"<svg xmlns='http://www.w3.org/2000/svg' width='350' height='12' viewBox='0 0 350 12'><rect width='350' height='12' fill='#FFC21A'/><polygon points='0,0 17,0 29,12 12,12' fill='#15171B'/><polygon points='33.9,0 50.9,0 62.9,12 45.9,12' fill='#15171B'/><polygon points='67.9,0 84.9,0 96.9,12 79.9,12' fill='#15171B'/><polygon points='101.8,0 118.8,0 130.8,12 113.8,12' fill='#15171B'/><polygon points='135.8,0 152.7,0 164.7,12 147.8,12' fill='#15171B'/><polygon points='169.7,0 186.7,0 198.7,12 181.7,12' fill='#15171B'/><polygon points='203.6,0 220.6,0 232.6,12 215.6,12' fill='#15171B'/><polygon points='237.6,0 254.6,0 266.6,12 249.6,12' fill='#15171B'/><polygon points='271.5,0 288.5,0 300.5,12 283.5,12' fill='#15171B'/><polygon points='305.5,0 322.4,0 334.4,12 317.5,12' fill='#15171B'/><polygon points='339.4,0 350,0 350,10.6' fill='#15171B'/></svg>",{"n":"Hazard stripes","fw":1}]]],["F",0,0,350,140,{"fw":1,"a":["V",16,16,16,16,6,"N","N",0,1]},[["T",0,0,318,14,"Team Explorer · Level 1",[5,7],{"fw":1,"o":0.85}],["T",0,0,318,40,"Hard Hat Hunt",[22,7],{"fw":1}],["T",0,0,318,42,"Spot construction machines on the go. Snap them, name them, collect them all.",[1,6],{"fw":1,"o":0.85}]]]]],["F",0,0,350,208,{"n":"Surface","f":58,"r":30,"e":24,"a":["V",16,16,16,16,14,"N","N",0,1]},[["F",0,0,318,52,{"fw":1,"a":["H",0,0,0,0,12,"N","C",0,1]},[["I",0,0,52,52,92,[],{"n":"Avatar"}],["F",0,0,226.5,40,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,226.5,14,"Level 1",[5,52],{"fw":1}],["T",0,0,226.5,26,"Site Visitor",[9,61],{"fw":1}]]],["F",0,0,15.5,44,{"a":["V",0,0,0,0,0,"N","X",1,1]},[["T",0,0,15.5,30,"0",[23,61],{"ar":1}],["T",0,0,13.5,14,"XP",[10,52],{"ar":1}]]]]],["F",0,0,318,14,{"n":"ProgressBar","fw":1,"f":67,"r":7,"e":25,"c":1},[]],["T",0,0,318,14,"100 XP to Hard Hat Rookie",[10,52],{"fw":1}],["F",0,0,318,54,{"fw":1,"a":["V",0,0,0,0,8,"N","N",0,0]},[["T",0,0,318,14,"Who’s spotting?",[5,52],{"fw":1}],["F",0,0,318,32,{"fw":1,"fh":1,"c":1,"a":["H",0,0,0,0,0,"N","N",0,0]},[["F",0,0,232.5,32,{"fh":1,"a":["H",0,0,0,0,8,"N","N",1,0]},[["I",0,0,122.5,32,93,[],{"fh":1,"n":"Chip · Whole family"}],["I",0,0,49,32,94,[],{"fh":1,"n":"Chip · Max"}],["I",0,0,45,32,95,[],{"fh":1,"n":"Chip · Ella"}]]]]]]]]],["F",0,0,390,76,{"a":["H",0,20,0,20,12,"N","N",0,0]},[["F",0,0,262,76,{"n":"Start a hunt","fw":1,"fh":1,"f":7,"r":30,"e":14,"a":["H",0,0,0,0,12,"C","C",0,0],"b":1,"lk":"F4"},[["F",0,0,44,44,{"f":8,"r":22,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,20,20,83,{"c":7,"fc":7}]]],["F",0,0,135,40,{"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,135,26,"START A HUNT",[24,8],{"fw":1,"ar":1}],["T",0,0,135,14,"Tracks your trip and spots",[10,8],{"fw":1,"o":0.75}]]]]],["F",0,0,76,76,{"n":"Quick spot","fh":1,"f":61,"r":30,"a":["V",0,0,0,0,2,"C","C",0,0],"b":1},[["S",0,0,24,24,84,{"c":1}],["T",0,0,54.5,14,"Quick spot",[10,1],{"ar":1}]]]]],["F",0,0,350,100,{"f":58,"r":30,"e":24},[["F",14,14,96,72,{"f":73,"r":18,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,84,52.5,85,{}]]],["F",122,15,146,70,{"a":["V",0,0,0,0,3,"N","N",0,1]},[["T",0,0,146,14,"Today’s mission",[5,52],{"fw":1}],["T",0,0,146,22,"Spot a bulldozer",[15,61],{"fw":1}],["T",0,0,146,28,"Tip: Big earthworks, new housing estates and landfill sites.",[10,52],{"fw":1,"ml":2}]]],["I",280,14,56,24,96,[],{"n":"Pill"}]]],["F",0,0,390,244,{"a":["V",0,0,0,0,12,"N","N",0,0]},[["F",0,0,390,43,{"n":"SectionHeader","fw":1,"a":["H",0,20,0,20,12,"SB","X",0,1]},[["F",0,0,304.5,43,{"fw":1,"a":["V",0,0,0,0,3,"N","N",0,1]},[["T",0,0,304.5,14,"Fill the card, win the week",[5,52],{"fw":1}],["T",0,0,304.5,26,"Challenges",[9,61],{"fw":1,"ml":1}]]],["F",0,0,33.5,26,{"n":"Button","a":["H",4,0,4,0,2,"N","C",1,1],"b":1},[["T",0,0,15.5,18,"All",[7,69],{"ar":1}],["S",0,0,16,16,56,{"c":69}]]]]],["F",0,0,390,189,{"fw":1,"fh":1,"c":1,"a":["H",0,0,0,0,0,"N","N",0,0]},[["F",0,0,882,189,{"fh":1,"a":["H",6,20,6,20,14,"N","N",0,0]},[["F",0,0,200,177,{"n":"Button","fh":1,"f":58,"r":24,"e":24,"a":["V",14,14,14,14,10,"N","N",1,1],"b":1},[["F",0,0,172,17,{"fw":1,"a":["H",0,0,0,0,0,"SB","C",0,1]},[["T",0,0,89.5,17,"DIGGER BINGO",[25,61],{"ar":1}],["S",0,0,16,16,86,{"c":52}]]],["F",0,0,98,98,{"n":"BingoGrid"},[["F",0,0,30,30,{"f":67,"r":7},[]],["F",34,0,30,30,{"f":67,"r":7},[]],["F",68,0,30,30,{"f":67,"r":7},[]],["F",0,34,30,30,{"f":67,"r":7},[]],["F",34,34,30,30,{"f":61,"r":7},[]],["F",68,34,30,30,{"f":67,"r":7},[]],["F",0,68,30,30,{"f":67,"r":7},[]],["F",34,68,30,30,{"f":67,"r":7},[]],["F",68,68,30,30,{"f":67,"r":7},[]]]],["T",0,0,172,14,"1 of 3 in a line",[10,52],{"fw":1}]]],["F",0,0,200,177,{"n":"Button","fh":1,"f":58,"r":24,"e":24,"a":["V",14,14,14,14,10,"SB","N",0,0],"b":1},[["F",0,0,172,104,{"fw":1,"a":["V",0,0,0,0,8,"N","N",1,1]},[["F",0,0,38,38,{"f":61,"r":19,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,18,18,87,{"c":7}]]],["T",0,0,172,22,"The Big Ten",[15,61],{"fw":1,"ml":1}],["T",0,0,172,28,"Be the first in the family to spot 10 different machines.",[10,52],{"fw":1,"ml":3}]]],["F",0,0,172,30,{"fw":1,"a":["V",0,0,0,0,6,"N","N",0,1]},[["F",0,0,172,10,{"n":"ProgressBar","fw":1,"f":67,"r":5,"e":25,"c":1},[]],["T",0,0,172,14,"0/10 · +150 XP",[10,52],{"fw":1}]]]]]]]]]]],["F",0,0,350,150,{"n":"Surface","f":58,"r":30,"e":24,"a":["V",16,16,16,16,12,"N","N",0,1]},[["F",0,0,318,22,{"fw":1,"a":["H",0,0,0,0,8,"N","C",0,1]},[["S",0,0,18,18,88,{"c":74}],["T",0,0,292,22,"Family race: first to 10",[15,61],{"fw":1}]]],["F",0,0,318,84,{"n":"RaceLanes","fw":1,"a":["V",0,0,0,0,12,"N","N",0,1]},[["F",0,0,318,36,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["I",0,0,34,34,97,[],{"n":"Avatar"}],["F",0,0,246,36,{"fw":1,"a":["V",0,0,0,0,4,"N","N",0,1]},[["F",0,0,246,18,{"fw":1,"a":["H",0,0,0,0,0,"SB","N",0,0]},[["T",0,0,25,18,"Max",[7,61],{"fh":1,"ar":1}],["T",0,0,25.5,18,"0/10",[10,52],{"fh":1,"ar":1}]]],["F",0,0,246,14,{"fw":1,"f":67,"r":7,"c":1,"a":["V",0,0,0,0,0,"C","N",0,1]},[["F",0,0,10,14,{"f":61,"r":5.4},[]]]]]],["S",0,0,18,18,88,{"c":64}]]],["F",0,0,318,36,{"fw":1,"a":["H",0,0,0,0,10,"N","C",0,1]},[["I",0,0,34,34,97,[["f",[],10],["sw",[0],11],["ic",[0],6]],{"n":"Avatar"}],["F",0,0,246,36,{"fw":1,"a":["V",0,0,0,0,4,"N","N",0,1]},[["F",0,0,246,18,{"fw":1,"a":["H",0,0,0,0,0,"SB","N",0,0]},[["T",0,0,21,18,"Ella",[7,61],{"fh":1,"ar":1}],["T",0,0,25.5,18,"0/10",[10,52],{"fh":1,"ar":1}]]],["F",0,0,246,14,{"fw":1,"f":67,"r":7,"c":1,"a":["V",0,0,0,0,0,"C","N",0,1]},[["F",0,0,10,14,{"f":61,"r":5.4},[]]]]]],["S",0,0,18,18,88,{"c":64}]]]]]]],["F",0,0,390,203,{"a":["V",0,0,0,0,12,"N","N",0,0]},[["F",0,0,390,43,{"n":"SectionHeader","fw":1,"a":["H",0,20,0,20,12,"SB","X",0,1]},[["F",0,0,287.5,43,{"fw":1,"a":["V",0,0,0,0,3,"N","N",0,1]},[["T",0,0,287.5,14,"0 of 20 machines",[5,52],{"fw":1}],["T",0,0,287.5,26,"Your Yard",[9,61],{"fw":1,"ml":1}]]],["F",0,0,50.5,26,{"n":"Button","a":["H",4,0,4,0,2,"N","C",1,1],"b":1},[["T",0,0,32.5,18,"Open",[7,69],{"ar":1}],["S",0,0,16,16,56,{"c":69}]]]]],["F",0,0,390,148,{"fw":1,"fh":1,"c":1,"a":["H",0,0,0,0,0,"N","N",0,0]},[["F",0,0,928,148,{"fh":1,"a":["H",6,20,6,20,12,"N","N",0,0]},[["F",0,0,138,136,{"n":"MachineCard · Excavator, not found yet","fh":1,"f":67,"r":24,"e":25,"b":1},[["S",12,11,114,71.5,89,{}],["T",10,89,118,17,"???",[26,52],{"ml":1}],["F",10,112,118,14,{"a":["H",0,0,0,0,5,"N","C",0,1]},[["F",0,0,7,7,{"f":44,"r":4},[]],["T",0,0,82,14,"Common · 10 XP",[10,52],{"ar":1}]]]]],["F",0,0,138,136,{"n":"MachineCard · Bulldozer, not found yet","fh":1,"f":67,"r":24,"e":25,"b":1},[["S",12,11,114,71.5,90,{}],["T",10,89,118,17,"???",[26,52],{"ml":1}],["F",10,112,118,14,{"a":["H",0,0,0,0,5,"N","C",0,1]},[["F",0,0,7,7,{"f":44,"r":4},[]],["T",0,0,82,14,"Common · 10 XP",[10,52],{"ar":1}]]]]],["F",0,0,138,136,{"n":"MachineCard · Backhoe loader, not found yet","fh":1,"f":67,"r":24,"e":25,"b":1},[["S",12,11,114,71.5,92,{}],["T",10,89,118,17,"???",[26,52],{"ml":1}],["F",10,112,118,14,{"a":["H",0,0,0,0,5,"N","C",0,1]},[["F",0,0,7,7,{"f":44,"r":4},[]],["T",0,0,82,14,"Common · 10 XP",[10,52],{"ar":1}]]]]]]]]]]],["F",0,0,390,367,{"a":["V",0,0,0,0,12,"N","N",0,1]},[["F",0,0,390,43,{"n":"SectionHeader","fw":1,"a":["H",0,20,0,20,12,"SB","X",0,1]},[["F",0,0,291.5,43,{"fw":1,"a":["V",0,0,0,0,3,"N","N",0,1]},[["T",0,0,291.5,14,"Named by local hunters",[5,52],{"fw":1}],["T",0,0,291.5,26,"Famous machines",[9,61],{"fw":1,"ml":1}]]],["F",0,0,46.5,26,{"n":"Button","a":["H",4,0,4,0,2,"N","C",1,1],"b":1},[["T",0,0,28.5,18,"Vote",[7,69],{"ar":1}],["S",0,0,16,16,56,{"c":69}]]]]],["F",0,0,390,312,{"fw":1,"a":["V",0,20,0,20,12,"N","N",0,1]},[["F",0,0,350,96,{"n":"SpotCard · Mixy McMixface, Cement mixer","fw":1,"f":58,"r":24,"e":24,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":73,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,93,{}]]],["F",0,0,173.5,74,{"fw":1},[["T",0,0,173.5,23,"Mixy McMixface",[27,61],{"ml":1}],["T",0,26,173.5,18,"Cement mixer · Mill Lane · 2.4 km",[3,52],{"ml":1}],["F",0,50,173.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,127,24,98,[],{"n":"Pill"}],["I",0,0,57,24,83,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Mixy McMixface","f":58,"r":16.5,"e":23,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":61}],["T",0,0,16.5,18,"74",[7,61],{"ar":1}]]]]],["F",0,0,350,96,{"n":"SpotCard · Big Bertha, Tower crane","fw":1,"f":58,"r":24,"e":24,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":73,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,94,{}]]],["F",0,0,173.5,74,{"fw":1},[["T",0,0,173.5,23,"Big Bertha",[27,61],{"ml":1}],["T",0,26,173.5,18,"Tower crane · New library build · 2.0 km",[3,52],{"ml":1}],["F",0,50,173.5,24,{"a":["H",0,7.2,0,0,6,"N","N",0,0]},[["I",0,0,103.5,24,98,[["t",[1],"The Mud Pies"]],{"n":"Pill"}],["I",0,0,57,24,83,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Big Bertha","f":58,"r":16.5,"e":23,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":61}],["T",0,0,16.5,18,"61",[7,61],{"ar":1}]]]]],["F",0,0,350,96,{"n":"SpotCard · Rolly Polly, Road roller","fw":1,"f":58,"r":24,"e":24,"a":["H",10,10,10,10,12,"N","C",0,1],"b":1},[["F",0,0,76,76,{"n":"SpotPhoto","f":73,"r":18,"c":1,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,65.5,41,95,{}]]],["F",0,0,173.5,74,{"fw":1},[["T",0,0,173.5,23,"Rolly Polly",[27,61],{"ml":1}],["T",0,26,173.5,18,"Road roller · Orbit Ave roadworks · 2.0 km",[3,52],{"ml":1}],["F",0,50,173.5,24,{"a":["H",0,0,0,0,6,"N","N",0,0]},[["I",0,0,118,24,98,[["t",[1],"Puddle Jumpers"]],{"n":"Pill"}],["I",0,0,57,24,83,[["t",[0],"Sample"]],{"n":"Pill"}]]]]],["F",0,0,56.5,32,{"n":"VoteButton · Vote for the name Rolly Polly","f":58,"r":16.5,"e":23,"a":["H",0,10,0,10,6,"N","C",1,0],"b":1},[["S",0,0,14,14,81,{"c":61}],["T",0,0,16.5,18,"52",[7,61],{"ar":1}]]]]]]]]],["F",0,0,350,80,{"n":"Button","f":61,"r":30,"a":["H",16,16,16,16,14,"N","C",0,1],"b":1},[["F",0,0,48,48,{"f":7,"r":24,"a":["V",0,0,0,0,0,"C","C",0,0]},[["S",0,0,22,22,87,{"c":8}]]],["F",0,0,222,36,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,222,14,"This week near you",[5,7],{"fw":1}],["T",0,0,222,22,"You’re #9 of 9",[15,1],{"fw":1}]]],["S",0,0,20,20,56,{"c":1}]]],["T",0,0,390,28,"Grown-ups: spot from the passenger seat or the footpath, never near a work zone.",[10,64],{"al":"C"}]]]]]]]]],["I",0,1906,390,88,99,[],{"ab":1,"n":"TabBar"}]]]]],["F",128,1981,134,5,{"ab":1,"o":0.85,"f":61,"r":3},[]],["I",0,0,390,50,82,[],{"ab":1,"n":"StatusBarMock"}]]],"pos":[1140,12660]},
{"code":"F4","title":"Live hunt · dark","scheme":"dark","node":["F",0,0,390,844,{"f":58,"c":1},[["F",0,0,390,844,{"ab":1,"f":58,"c":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,844,{"n":"Tabs","fw":1,"fh":1,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,844,{"fw":1,"fh":1,"c":1},[["F",0,0,390,844,{"ab":1,"f":58,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,844,{"n":"HuntScreen","fw":1,"fh":1,"f":59,"a":["V",0,0,0,0,0,"N","N",0,0]},[["F",0,0,390,844,{"n":"AppMap","fw":1,"fh":1,"f":59,"c":1},[["F",0,0,390,844,{"n":"Map of places nearby","ab":1},[["M",0,0,390,844,{"n":"Map","ab":1,"cam":[193.7,394.6,0.14],"mw":1,"jw":2.2,"tr":[["M193.7 394.6L176.5 360.7L180.3 361.8L184.1 362.8L187.8 363.9L191.5 365L195.3 366.1",61,9,0.85],["M193.7 394.6L176.5 360.7L180.3 361.8L184.1 362.8L187.8 363.9L191.5 365L195.3 366.1",68,5,1]]}],["T",125,223,81.5,14.5,"Riverbend",[12,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",395.5,706,73,14.5,"Fernleaf",[12,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",-87.5,762,86,14.5,"Southgate",[12,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[60,1.5]}],["T",-16,272.5,55.5,12.5,"High Street",[13,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[75,1.5],"rt":-3.1}],["T",115,387,59.5,12.5,"Willow Road",[13,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[75,1.5],"rt":4.2}],["T",-13,521.5,63.5,12.5,"Orbit Avenue",[13,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[75,1.5],"rt":-82.4}],["T",314.5,584.5,66.5,12.5,"Fernleaf Drive",[13,52],{"n":"Map label","ab":1,"al":"C","ar":1,"hl":[75,1.5],"rt":-68.2}],["F",186.5,357,18,18,{"ab":1,"f":61,"r":9,"s":[6,3],"e":5},[]],["F",315,432,32,32,{"n":"2 places here. Zoom in","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["F",0,0,32,32,{"f":7,"r":16,"s":[6,3],"e":6,"a":["V",3,3,3,3,0,"C","C",0,0]},[["T",0,0,7,14,"2",[34,8],{"ar":1}]]]]],["F",145.5,557.5,40,47,{"n":"Binny","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,40,47,100,[],{"n":"Pin"}]]],["F",61.5,39.5,40,47,{"n":"Blaze","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,40,47,100,[["sw",[0,0],97]],{"n":"Pin"}]]],["F",334.5,389.5,40,47,{"n":"Stretch","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,40,47,100,[["sw",[0,0],98]],{"n":"Pin"}]]],["F",131.5,-16.5,40,47,{"n":"Lady Lift","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,40,47,100,[["sw",[0,0],99]],{"n":"Pin"}]]],["F",236.5,81.5,40,47,{"n":"Big Bertha","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,40,47,100,[["sw",[0,0],94]],{"n":"Pin"}]]],["F",203,285.5,40,47,{"n":"Swirly Sam","ab":1,"a":["H",0,0,0,0,0,"N","N",0,0],"b":1},[["I",0,0,40,47,100,[["o",[0],1],["sw",[0,0],93]],{"n":"Pin"}]]]]]]],["F",0,0,390,279,{"ab":1,"a":["V",0,0,0,0,0,"N","C",0,0]},[["F",0,0,390,112,{"f":8,"a":["V",56,0,0,0,0,"N","N",0,1]},[["F",0,0,390,48,{"fw":1,"a":["H",0,16,10,16,12,"N","C",0,1]},[["F",0,0,10,10,{"f":76,"r":5},[]],["T",0,0,273,26,"HUNT IN PROGRESS",[24,7],{"fw":1}],["I",0,0,51,38,101,[],{"n":"Button · End"}]]],["F",0,0,390,8,{"n":"Hazard","fw":1,"c":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["V",0,0,390,8,"<svg xmlns='http://www.w3.org/2000/svg' width='390' height='8' viewBox='0 0 390 8'><rect width='390' height='8' fill='#FFC21A'/><polygon points='0,0 11.3,0 19.3,8 8,8' fill='#15171B'/><polygon points='22.6,0 33.9,0 41.9,8 30.6,8' fill='#15171B'/><polygon points='45.3,0 56.6,0 64.6,8 53.3,8' fill='#15171B'/><polygon points='67.9,0 79.2,0 87.2,8 75.9,8' fill='#15171B'/><polygon points='90.5,0 101.8,0 109.8,8 98.5,8' fill='#15171B'/><polygon points='113.1,0 124.5,0 132.5,8 121.1,8' fill='#15171B'/><polygon points='135.8,0 147.1,0 155.1,8 143.8,8' fill='#15171B'/><polygon points='158.4,0 169.7,0 177.7,8 166.4,8' fill='#15171B'/><polygon points='181,0 192.3,0 200.3,8 189,8' fill='#15171B'/><polygon points='203.6,0 215,0 223,8 211.6,8' fill='#15171B'/><polygon points='226.3,0 237.6,0 245.6,8 234.3,8' fill='#15171B'/><polygon points='248.9,0 260.2,0 268.2,8 256.9,8' fill='#15171B'/><polygon points='271.5,0 282.8,0 290.8,8 279.5,8' fill='#15171B'/><polygon points='294.2,0 305.5,0 313.5,8 302.2,8' fill='#15171B'/><polygon points='316.8,0 328.1,0 336.1,8 324.8,8' fill='#15171B'/><polygon points='339.4,0 350.7,0 358.7,8 347.4,8' fill='#15171B'/><polygon points='362,0 373.4,0 381.4,8 370,8' fill='#15171B'/><polygon points='384.7,0 390,0 390,5.3' fill='#15171B'/></svg>",{"n":"Hazard stripes","fw":1}]]]]],["F",0,0,390,90,{"a":["H",14,14,14,14,10,"N","N",0,0]},[["F",0,0,114,62,{"fw":1,"fh":1,"f":62,"r":18,"e":21,"a":["V",10,12,10,12,2,"N","N",0,1]},[["F",0,0,90,14,{"fw":1,"a":["H",0,0,0,0,6,"N","C",0,1]},[["S",0,0,14,14,100,{"c":52}],["T",0,0,24.5,14,"Time",[10,52],{"ar":1}]]],["T",0,0,90,26,"0:05",[9,61],{"fw":1}]]],["F",0,0,114,62,{"fw":1,"fh":1,"f":62,"r":18,"e":21,"a":["V",10,12,10,12,2,"N","N",0,1]},[["F",0,0,90,14,{"fw":1,"a":["H",0,0,0,0,6,"N","C",0,1]},[["S",0,0,14,14,101,{"c":52}],["T",0,0,57.5,14,"Demo drive",[10,52],{"ar":1}]]],["T",0,0,90,26,"400 m",[9,61],{"fw":1}]]],["F",0,0,114,62,{"fw":1,"fh":1,"f":62,"r":18,"e":21,"a":["V",10,12,10,12,2,"N","N",0,1]},[["F",0,0,90,14,{"fw":1,"a":["H",0,0,0,0,6,"N","C",0,1]},[["S",0,0,14,14,3,{"c":52}],["T",0,0,41,14,"Spotted",[10,52],{"ar":1}]]],["T",0,0,90,26,"0",[9,61],{"fw":1}]]]]],["F",0,0,362,77,{"n":"Button","f":7,"r":24,"e":21,"a":["H",12,12,12,12,12,"N","C",0,1],"b":1},[["S",0,0,64,40,93,{}],["F",0,0,232,53,{"fw":1,"a":["V",0,0,0,0,0,"N","N",0,1]},[["T",0,0,232,17,"FAMOUS MACHINE NEARBY!",[25,8],{"fw":1}],["T",0,0,232,36,"Swirly Sam is about 300 m away. Can you find it?",[7,8],{"fw":1}]]],["S",0,0,18,18,56,{"c":8}]]]]],["F",0,584,390,150,{"ab":1,"a":["V",0,0,0,0,10,"N","C",0,1]},[["F",0,0,198,36,{"f":62,"r":18.5,"e":21,"a":["H",0,14,0,14,8,"N","C",1,0]},[["S",0,0,15,15,102,{"c":74}],["T",0,0,147,18,"Mission: spot a bulldozer",[7,61],{"ar":1}]]],["F",0,0,104,104,{"n":"Spot a machine","f":7,"r":52,"s":[8,6],"e":17,"a":["V",6,6,6,6,0,"C","C",0,0],"b":1},[["S",0,0,34,34,84,{"c":8,"sw":2.4}],["T",0,0,37,17,"SPOT!",[25,8],{"ar":1}]]]]]]]]]]],["I",0,756,390,88,99,[],{"ab":1,"n":"TabBar"}]]]]],["F",128,831,134,5,{"ab":1,"o":0.85,"f":61,"r":3},[]],["I",0,0,390,50,82,[["t",[0],"18:48"]],{"ab":1,"n":"StatusBarMock"}]]],"pos":[1650,12660]}
];

const ROWS = [
  {
    "title": "1 · Onboarding",
    "codes": [
      "A1",
      "A2",
      "A3",
      "A4"
    ],
    "note": "First run: welcome, who’s coming along, what they love, home base."
  },
  {
    "title": "2 · Explore & search",
    "codes": [
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7"
    ],
    "note": "The map with its bottom sheet, a pin preview, search, Ask Playdar, filters and the list view."
  },
  {
    "title": "3 · Places & vibe checks",
    "codes": [
      "C1",
      "C2"
    ],
    "note": "A place page and the one-question vibe check."
  },
  {
    "title": "4 · Saved & Family",
    "codes": [
      "D1",
      "D2",
      "D3",
      "D4",
      "D5"
    ],
    "note": "Saved places, the family profile and settings, kids, venues and privacy."
  },
  {
    "title": "5 · Hard Hat Hunt · spotting",
    "codes": [
      "E1",
      "E2",
      "E3",
      "E4",
      "E5",
      "E6",
      "E7",
      "E8",
      "E9"
    ],
    "note": "The game loop: start a hunt, spot, snap, let the AI guess, name it, celebrate."
  },
  {
    "title": "6 · Hard Hat Hunt · collection & community",
    "codes": [
      "E10",
      "E11",
      "E12",
      "E13",
      "E14",
      "E15"
    ],
    "note": "The Yard, machine pages, challenges and badges, famous machines and the leaderboard."
  },
  {
    "title": "7 · Dark mode",
    "codes": [
      "F1",
      "F2",
      "F3",
      "F4"
    ],
    "note": "Key screens in the dark theme."
  }
];

const STATE_ID = '3:70';
const HOLDER_ID = '3:68';

// Tab bar taps. Dark mode only has Explore and Hunt boards.
const TABS = {
  light: { Explore: 'B1', Saved: 'D1', Hunt: 'E1', Family: 'D2' },
  dark: { Explore: 'F1', Hunt: 'F3' },
};
// Boards that move on by themselves: [from, to, seconds].
const AUTO = [['E4', 'E5', 1.5]];
const STARTS = [
  ['A1', '1 · Onboarding'],
  ['B1', '2 · Explore'],
  ['E1', '5 · Hard Hat Hunt'],
  ['F1', '7 · Dark mode'],
];

const INK = { r: 0.063, g: 0.071, b: 0.086 };
const MUTED = { r: 0.36, g: 0.39, b: 0.44 };

function go(dest) {
  return {
    type: 'NODE',
    destinationId: dest,
    navigation: 'NAVIGATE',
    transition: { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 },
    preserveScrollPosition: false,
  };
}

async function readState() {
  const node = await figma.getNodeByIdAsync(STATE_ID);
  if (!node || node.type !== 'TEXT') return null;
  return JSON.parse(node.characters);
}

async function live(id) {
  if (!id) return null;
  const n = await figma.getNodeByIdAsync(id);
  return n && !n.removed ? n : null;
}

async function buildScreens(run, warnings) {
  const st = await readState();
  let made = 0;
  for (const item of SCREENS) {
    if (await live(st.screens[item.code])) continue;
    figma.notify('Building ' + item.code + ' · ' + item.title + '…', { timeout: 3000 });
    const r = await run({ state: STATE_ID, kind: 'screens', items: [item] });
    if (r && r.stats && r.stats.errors && r.stats.errors.length) warnings.push(item.code + ': ' + r.stats.errors.slice(0, 3).join('; '));
    made++;
  }
  return made;
}

async function wire(st, warnings) {
  let count = 0;
  async function link(node, target, label) {
    const dest = await live(st.screens[target]);
    if (!node || !dest) return;
    try {
      await node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [go(dest.id)] }]);
      count++;
    } catch (e) {
      warnings.push(label + ' → ' + target + ': ' + (e && e.message));
    }
  }
  // Buttons, rows and pins recorded while the boards were built.
  for (const code of Object.keys(st.links)) {
    for (const pair of st.links[code]) await link(await live(pair[0]), pair[1], code);
  }
  // Tab bars.
  for (const code of Object.keys(st.screens)) {
    const frame = await live(st.screens[code]);
    if (!frame) continue;
    const bar = frame.findOne((n) => n.type === 'INSTANCE' && n.name === 'TabBar');
    if (!bar) continue;
    const tabs = code[0] === 'F' ? TABS.dark : TABS.light;
    for (const tab of Object.keys(tabs)) {
      if (tabs[tab] === code) continue;
      const btn = bar.findOne((n) => (n.type === 'FRAME' || n.type === 'INSTANCE') && n.name === tab);
      await link(btn, tabs[tab], code + ' tab ' + tab);
    }
  }
  // Timed hops.
  for (const [from, to, secs] of AUTO) {
    const a = await live(st.screens[from]);
    const b = await live(st.screens[to]);
    if (!a || !b) continue;
    try {
      await a.setReactionsAsync([{ trigger: { type: 'AFTER_TIMEOUT', timeout: secs }, actions: [go(b.id)] }]);
      count++;
    } catch (e) {
      warnings.push(from + ' → ' + to + ' (timed): ' + (e && e.message));
    }
  }
  return count;
}

function text(chars, family, style, size, color, lineHeight) {
  const t = figma.createText();
  t.fontName = { family: family, style: style };
  t.fontSize = size;
  if (lineHeight) t.lineHeight = { unit: 'PIXELS', value: lineHeight };
  t.fills = [{ type: 'SOLID', color: color }];
  t.characters = chars;
  return t;
}

// Moves a node under a new parent without moving it on the canvas.
function reparent(node, parent) {
  const ax = node.absoluteTransform[0][2];
  const ay = node.absoluteTransform[1][2];
  parent.appendChild(node);
  node.x += ax - node.absoluteTransform[0][2];
  node.y += ay - node.absoluteTransform[1][2];
}

async function organise(st, page) {
  const sections = [];
  for (const row of ROWS) {
    const frames = [];
    for (const code of row.codes) {
      const f = await live(st.screens[code]);
      if (f) frames.push(f);
    }
    let section = page.children.find((n) => n.type === 'SECTION' && n.name === row.title);
    const loose = frames.filter((f) => f.parent && f.parent.type === 'PAGE');
    if (!loose.length && section) {
      sections.push(section);
      continue;
    }
    if (!frames.length) continue;
    const box = (f) => [f.absoluteTransform[0][2], f.absoluteTransform[1][2], f.width, f.height];
    const boxes = frames.map(box);
    const minX = Math.min.apply(null, boxes.map((b) => b[0]));
    const minY = Math.min.apply(null, boxes.map((b) => b[1]));
    const maxX = Math.max.apply(null, boxes.map((b) => b[0] + b[2]));
    const maxY = Math.max.apply(null, boxes.map((b) => b[1] + b[3]));
    if (!section) {
      section = figma.createSection();
      page.appendChild(section);
      section.name = row.title;
      section.x = minX - 120;
      section.y = minY - 200;
      section.resizeWithoutConstraints(maxX - minX + 240, maxY - minY + 320);
      const note = text(row.note, 'Figtree', 'Regular', 28, MUTED, 36);
      section.appendChild(note);
      note.x = 120;
      note.y = 92;
    }
    for (const f of loose) reparent(f, section);
    sections.push(section);
  }
  return sections;
}

async function readme(page, top) {
  const old = page.children.find((n) => n.name === 'Read me');
  if (old) return old;
  const card = figma.createFrame();
  page.appendChild(card);
  card.name = 'Read me';
  // Resize before turning on auto layout so the hug height is not frozen.
  card.resize(1180, 100);
  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'AUTO';
  card.counterAxisSizingMode = 'FIXED';
  card.paddingTop = card.paddingBottom = 72;
  card.paddingLeft = card.paddingRight = 80;
  card.itemSpacing = 28;
  card.cornerRadius = 48;
  card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  const add = (t, gap) => {
    card.appendChild(t);
    t.layoutSizingHorizontal = 'FILL';
    t.textAutoResize = 'HEIGHT';
    if (gap) t.paragraphSpacing = gap;
  };
  const kicker = text('PLAYDAR', 'Figtree', 'Bold', 22, MUTED);
  kicker.letterSpacing = { unit: 'PIXELS', value: 3 };
  add(kicker);
  add(text('App flow', 'Bricolage Grotesque', 'ExtraBold', 104, INK, 104));
  add(
    text(
      'Every screen of the Playdar prototype as an editable board, built from the app itself. ' +
        'Each section is one flow, and boards run left to right in the order you meet them.',
      'Figtree', 'Regular', 30, INK, 44,
    ),
  );
  add(
    text(
      [
        'Press Play (top right) to click through. Flows start at Onboarding, Explore, Hard Hat Hunt and Dark mode.',
        'Board codes (A1, B2 …) give every screen a short name for comments and conversations.',
        'Colours are variables (Playdar · Light and Playdar · Dark); type and shadows are shared styles.',
        'The Components page holds the icons, machine art and UI parts the boards are made from. Edit one there and every board updates.',
        'Grey “Kid’s photo” boxes stand in for the photos families take in the Hunt.',
      ].join('\n'),
      'Figtree', 'Regular', 26, MUTED, 38,
    ),
    18,
  );
  card.x = 0;
  card.y = top - card.height - 160;
  return card;
}

async function labelComponents(st) {
  const page = await figma.getNodeByIdAsync(st.pages.comps);
  if (!page) return;
  await page.loadAsync();
  if (page.children.some((n) => n.name === 'Label · Icons')) return;
  const g = st.grid;
  const labels = [
    ['Icons', g.icons.x, g.icons.y - 90],
    ['Machines & art', g.art.x, g.art.y - 90],
    ['UI components', g.ui.x, g.ui.y - 90],
  ];
  for (const [name, x, y] of labels) {
    const t = text(name, 'Bricolage Grotesque', 'Bold', 44, INK);
    page.appendChild(t);
    t.name = 'Label · ' + name;
    t.x = x;
    t.y = y;
  }
}

async function main() {
  const st0 = await readState();
  if (!st0) return 'Nothing to do: this file is already finished, or it is not the Playdar flow file.';
  await Promise.all([
    figma.loadFontAsync({ family: 'Figtree', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Figtree', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Bricolage Grotesque', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Bricolage Grotesque', style: 'ExtraBold' }),
  ]);
  const warnings = [];
  const run = BUILDER(figma);
  const made = await buildScreens(run, warnings);

  const st = await readState();
  const page = await figma.getNodeByIdAsync(st.pages.flow);
  await figma.setCurrentPageAsync(page);
  figma.notify('Wiring the prototype…', { timeout: 3000 });
  const links = await wire(st, warnings);
  const starts = [];
  for (const [code, name] of STARTS) {
    const f = await live(st.screens[code]);
    if (f) starts.push({ nodeId: f.id, name: name });
  }
  try {
    page.flowStartingPoints = starts;
  } catch (e) {
    warnings.push('flow starts: ' + (e && e.message));
  }
  const sections = await organise(st, page);
  const top = sections.length ? Math.min.apply(null, sections.map((s) => s.y)) : 0;
  const card = await readme(page, top);
  await labelComponents(st);

  const holder = await figma.getNodeByIdAsync(HOLDER_ID);
  if (holder) holder.remove();

  figma.viewport.scrollAndZoomIntoView([card].concat(sections.slice(0, 2)));
  if (warnings.length) console.warn('Playdar finish warnings:\n' + warnings.join('\n'));
  return (
    'Playdar flow finished: ' + made + ' boards added, ' + links + ' prototype links. Press Play to try it.' +
    (warnings.length ? ' (' + warnings.length + ' warnings in the console)' : '')
  );
}

main().then(
  (msg) => figma.closePlugin(msg),
  (e) => figma.closePlugin('Playdar finish stopped: ' + (e && e.message ? e.message : String(e))),
);
