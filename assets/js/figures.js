/*
 * figures.js — small, live, code-driven illustrations of the work.
 *
 * Each figure draws into a <canvas>, only animates while it is on screen,
 * and settles into a still frame when the visitor prefers reduced motion.
 * Exposed as window.Figures = { create, mount, reduceMotion }.
 */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const FG = '237, 235, 230';
  const HOT = '255, 90, 31';
  const ink = (a) => `rgba(${FG}, ${a})`;
  const hot = (a) => `rgba(${HOT}, ${a})`;
  const MONO = '"Geist Mono", ui-monospace, Menlo, monospace';
  const SERIF = '"Instrument Serif", Georgia, serif';
  const SANS = '"Geist", ui-sans-serif, system-ui, sans-serif';

  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmt = (n) => Math.round(n).toLocaleString('en-GB');

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function font(ctx, size, family = MONO, style = '') {
    ctx.font = `${style} 400 ${size}px ${family}`.trim();
  }

  function label(ctx, text, x, y, { size = 10, color = ink(0.5), align = 'left', base = 'alphabetic' } = {}) {
    font(ctx, size);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.fillText(text.toUpperCase(), x, y);
  }

  function line(ctx, a, b) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  function dot(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function ring(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function wrap(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = next;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /** Total length of a closed tour over points. */
  function tourLength(tour, p) {
    let len = 0;
    for (let i = 0; i < tour.length; i++) len += dist(p[tour[i]], p[tour[(i + 1) % tour.length]]);
    return len;
  }

  /** Best-improvement 2-opt move, or null when the tour is 2-optimal. */
  function best2opt(tour, p) {
    const n = tour.length;
    let best = -1e-6;
    let move = null;
    for (let i = 0; i < n - 1; i++) {
      const a = p[tour[i]];
      const b = p[tour[i + 1]];
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const c = p[tour[j]];
        const d = p[tour[(j + 1) % n]];
        const delta = dist(a, c) + dist(b, d) - dist(a, b) - dist(c, d);
        if (delta < best) { best = delta; move = [i, j]; }
      }
    }
    return move;
  }

  /** Reverse tour[i+1..j] in place; returns the two new edges. */
  function apply2opt(tour, [i, j]) {
    for (let l = i + 1, r = j; l < r; l++, r--) [tour[l], tour[r]] = [tour[r], tour[l]];
    return [[tour[i], tour[i + 1]], [tour[j], tour[(j + 1) % tour.length]]];
  }

  /** Walk a closed tour: point at distance d along it. */
  function pointOnTour(tour, p, d) {
    for (let i = 0; i < tour.length; i++) {
      const a = p[tour[i]];
      const b = p[tour[(i + 1) % tour.length]];
      const seg = dist(a, b);
      if (d <= seg) {
        const t = seg ? d / seg : 0;
        return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
      }
      d -= seg;
    }
    return { ...p[tour[0]] };
  }

  /* ------------------------------------------------------------------------ */
  /* Base class                                                               */
  /* ------------------------------------------------------------------------ */

  class Figure {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = opts;
      this.w = 0;
      this.h = 0;
      this.time = 0;
      this.running = false;
    }

    measure() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      if (w === this.w && h === this.h && dpr === this.dpr) return false;
      this.w = w;
      this.h = h;
      this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.compact = this.opts.compact || w < 460;
      return true;
    }

    init() {
      this.measure();
      this.layout();
      this.reset();
      if (reduceMotion) this.settle();
      this.render();
      return this;
    }

    resize() {
      if (this.measure()) {
        this.layout();
        this.render();
      }
    }

    start() {
      if (this.running || reduceMotion) return;
      this.running = true;
      let last = performance.now();
      const tick = (now) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        this.time += dt;
        this.update(dt);
        this.render();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }

    render() {
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.draw(this.ctx);
    }

    /** Fast-forward to a representative still frame (reduced motion). */
    settle() {
      for (let i = 0; i < 240; i++) {
        this.time += 1 / 30;
        this.update(1 / 30);
      }
    }

    layout() {}
    reset() {}
    update() {}
    draw() {}
  }

  /* ------------------------------------------------------------------------ */
  /* Fig. 00 — hero: a live 2-opt solver over scattered stops                 */
  /* ------------------------------------------------------------------------ */

  class RouteFigure extends Figure {
    layout() {
      this.margin = Math.max(24, Math.min(this.w, this.h) * 0.06);
      this.px = (this.pts || []).map((p) => this.toPx(p));
      if (this.tour) this.measureTour();
    }

    toPx(p) {
      const m = this.margin;
      return { x: m + p.u * (this.w - m * 2), y: m + p.v * (this.h - m * 2) };
    }

    reset() {
      const n = this.opts.stops || clamp(Math.round((this.w * this.h) / 30000), 14, 52);
      this.pts = this.scatter(n);
      this.px = this.pts.map((p) => this.toPx(p));
      this.tour = shuffle([...this.pts.keys()]);
      this.initial = tourLength(this.tour, this.px);
      this.swaps = 0;
      this.flashes = [];
      this.phase = 'solve';
      this.acc = 0;
      this.car = 0;
      this.trail = [];
      this.measureTour();
      this.emit();
    }

    scatter(n) {
      const pts = [];
      const minD = Math.sqrt((this.w * this.h) / n) * 0.55;
      let tries = 0;
      while (pts.length < n && tries++ < n * 400) {
        const p = { u: Math.random(), v: Math.random(), born: -10 };
        const q = this.toPx(p);
        if (pts.every((o) => dist(this.toPx(o), q) > minD)) pts.push(p);
      }
      return pts;
    }

    measureTour() {
      this.total = tourLength(this.tour, this.px);
    }

    emit() {
      if (!this.opts.onStats) return;
      const length = tourLength(this.tour, this.px);
      this.opts.onStats({
        stops: this.pts.length,
        gain: this.initial ? Math.max(0, 1 - length / this.initial) : 0,
        swaps: this.swaps,
        solved: this.phase !== 'solve',
      });
    }

    addStop(x, y) {
      if (this.pts.length >= 140) return;
      const m = this.margin;
      const p = {
        u: clamp((x - m) / (this.w - m * 2), 0, 1),
        v: clamp((y - m) / (this.h - m * 2), 0, 1),
        born: this.time,
      };
      this.pts.push(p);
      const k = this.pts.length - 1;
      this.px.push(this.toPx(p));

      // Cheapest insertion, then let 2-opt tidy up around it.
      const t = this.tour;
      let best = Infinity;
      let at = 1;
      for (let i = 0; i < t.length; i++) {
        const a = this.px[t[i]];
        const b = this.px[t[(i + 1) % t.length]];
        const cost = dist(a, this.px[k]) + dist(this.px[k], b) - dist(a, b);
        if (cost < best) { best = cost; at = i + 1; }
      }
      t.splice(at, 0, k);
      this.initial += best;
      this.flashes.push({ a: t[at - 1], b: k, life: 1 }, { a: k, b: t[(at + 1) % t.length], life: 1 });
      this.phase = 'solve';
      this.acc = 0;
      this.trail = [];
      this.measureTour();
      this.emit();
      if (!this.running) {
        if (reduceMotion) this.settle();
        this.render();
      }
    }

    addRandomStop() {
      const m = this.margin;
      this.addStop(rand(m, this.w - m), rand(m, this.h - m));
    }

    update(dt) {
      for (const f of this.flashes) f.life -= dt * 1.3;
      this.flashes = this.flashes.filter((f) => f.life > 0);

      if (this.phase === 'solve') {
        this.acc += dt;
        const step = this.opts.stepTime || 0.075;
        while (this.acc >= step) {
          this.acc -= step;
          const move = best2opt(this.tour, this.px);
          if (!move) {
            this.phase = 'drive';
            this.measureTour();
            this.emit();
            break;
          }
          for (const [a, b] of apply2opt(this.tour, move)) this.flashes.push({ a, b, life: 1 });
          this.swaps++;
          this.emit();
        }
      } else {
        const speed = Math.max(70, this.total / 16);
        this.car = (this.car + dt * speed) % this.total;
        this.trail.push(pointOnTour(this.tour, this.px, this.car));
        if (this.trail.length > 46) this.trail.shift();
      }
    }

    settle() {
      let move;
      while ((move = best2opt(this.tour, this.px))) {
        apply2opt(this.tour, move);
        this.swaps++;
      }
      this.phase = 'drive';
      this.flashes = [];
      this.measureTour();
      this.emit();
    }

    draw(ctx) {
      const { px, tour } = this;
      const n = tour.length;
      if (!n) return;

      ctx.lineWidth = 1;
      ctx.strokeStyle = ink(this.opts.lineAlpha || 0.17);
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const p = px[tour[i % n]];
        if (i) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();

      ctx.lineWidth = 1.4;
      for (const f of this.flashes) {
        ctx.strokeStyle = hot(f.life * 0.9);
        line(ctx, px[f.a], px[f.b]);
      }

      for (let i = 0; i < px.length; i++) {
        const age = this.time - this.pts[i].born;
        ctx.fillStyle = ink(0.55);
        dot(ctx, px[i].x, px[i].y, 1.8);
        if (age < 1.4) {
          ctx.strokeStyle = hot(1 - age / 1.4);
          ctx.lineWidth = 1;
          ring(ctx, px[i].x, px[i].y, 3 + age * 14);
        }
      }

      const depot = px[tour[0]];
      ctx.strokeStyle = hot(0.9);
      ctx.lineWidth = 1;
      ring(ctx, depot.x, depot.y, 5);

      if (this.phase === 'drive' && this.trail.length > 1) {
        ctx.lineWidth = 2;
        for (let i = 1; i < this.trail.length; i++) {
          ctx.strokeStyle = hot((i / this.trail.length) * 0.85);
          line(ctx, this.trail[i - 1], this.trail[i]);
        }
        const c = this.trail[this.trail.length - 1];
        ctx.fillStyle = hot(1);
        dot(ctx, c.x, c.y, 3.2);
      }
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Fig. 01 — warehouse pick path                                            */
  /* ------------------------------------------------------------------------ */

  class WarehouseFigure extends Figure {
    layout() {
      const pad = this.compact ? 16 : 26;
      const panel = this.compact ? 0 : Math.round(this.w * 0.26);
      this.panel = { x: this.w - panel - pad * 0.4, y: pad, w: panel, h: this.h - pad * 2 };
      const plan = { x: pad, y: pad + 14, w: this.w - pad * 2 - (panel ? panel + pad : 0), h: this.h - pad * 2 - 14 };
      this.plan = plan;

      this.K = this.compact ? 6 : 8; // racks
      this.B = this.compact ? 6 : 9; // bays per rack
      // Width in rack units: racks + one aisle per pair + entry lane + back-to-back gaps.
      const rw = plan.w / (this.K + (this.K / 2 + 1) * 1.15 + (this.K / 2) * 0.1725);
      this.rw = rw;
      const aisle = rw * 1.15;
      this.cross = plan.h * 0.13;
      this.bh = (plan.h - this.cross * 2) / this.B;

      // Racks come in back-to-back pairs with a pick aisle between each pair.
      this.rackX = [];
      let x = plan.x + aisle;
      for (let k = 0; k < this.K; k++) {
        this.rackX.push(x);
        x += rw;
        if (k % 2 === 0) x += aisle; // aisle between the pair
        else x += aisle * 0.15; // back-to-back gap
      }
      this.aisleX = (k) => (k % 2 === 0 ? this.rackX[k] + rw + aisle / 2 : this.rackX[k] - aisle / 2);
      this.topY = plan.y + this.cross / 2;
      this.botY = plan.y + plan.h - this.cross / 2;
      this.dock = { x: plan.x + aisle * 0.5, y: this.botY };
      if (this.bins && this.bins.length !== this.K * this.B) this.reset();
      else if (this.bins) this.planRoute();
    }

    reset() {
      this.bins = [];
      for (let k = 0; k < this.K; k++) {
        for (let b = 0; b < this.B; b++) this.bins.push({ k, b, level: rand(0.15, 0.95), flash: 0 });
      }
      this.newOrder();
    }

    binAt(k, b) {
      return this.bins[k * this.B + b];
    }

    binCode(bin) {
      return `${String.fromCharCode(65 + bin.k)}-${pad2(bin.b + 1)}`;
    }

    newOrder() {
      const picks = new Set();
      const count = this.compact ? 4 : 5;
      while (picks.size < count) picks.add(randInt(0, this.K * this.B - 1));
      this.order = [...picks].map((i) => ({ bin: this.bins[i], qty: randInt(1, 6), done: false }));
      // S-shape ordering: aisle by aisle, alternating direction.
      const aisleOf = (o) => Math.floor(o.bin.k / 2);
      this.order.sort((a, b) => aisleOf(a) - aisleOf(b) || (aisleOf(a) % 2 ? b.bin.b - a.bin.b : a.bin.b - b.bin.b));
      this.planRoute();
      this.pos = 0;
      this.pause = 0.6;
    }

    access(bin) {
      return { x: this.aisleX(bin.k), y: this.plan.y + this.cross + (bin.b + 0.5) * this.bh };
    }

    /** Manhattan route through aisles, using whichever cross-aisle is shorter. */
    planRoute() {
      const pts = [{ ...this.dock, stop: -1 }];
      let cur = this.dock;
      const stops = [...this.order.map((o, i) => ({ ...this.access(o.bin), stop: i })), { ...this.dock, stop: -2 }];
      for (const s of stops) {
        if (Math.abs(s.x - cur.x) > 1) {
          const viaTop = cur.y - this.topY + (s.y - this.topY);
          const viaBot = this.botY - cur.y + (this.botY - s.y);
          const y = viaTop < viaBot ? this.topY : this.botY;
          pts.push({ x: cur.x, y }, { x: s.x, y });
        }
        pts.push(s);
        cur = s;
      }
      this.route = pts;
      this.segs = [];
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        total += dist(pts[i - 1], pts[i]);
        this.segs.push(total);
      }
      this.routeLen = total;
    }

    pointAt(d) {
      const pts = this.route;
      let prev = 0;
      for (let i = 1; i < pts.length; i++) {
        const end = this.segs[i - 1];
        if (d <= end) {
          const t = (d - prev) / (end - prev || 1);
          return { x: lerp(pts[i - 1].x, pts[i].x, t), y: lerp(pts[i - 1].y, pts[i].y, t), i };
        }
        prev = end;
      }
      return { ...pts[pts.length - 1], i: pts.length - 1 };
    }

    update(dt) {
      for (const b of this.bins) b.flash = Math.max(0, b.flash - dt * 1.2);
      if (this.pause > 0) {
        this.pause -= dt;
        return;
      }
      const speed = this.plan.w * 0.24;
      const before = this.pointAt(this.pos);
      this.pos = Math.min(this.routeLen, this.pos + speed * dt);
      const after = this.pointAt(this.pos);

      // Stop on every pick location the picker passed this frame.
      for (let i = before.i; i <= after.i; i++) {
        const node = this.route[i];
        if (node && node.stop >= 0 && !this.order[node.stop].done && this.segs[i - 1] <= this.pos) {
          const o = this.order[node.stop];
          o.done = true;
          o.bin.flash = 1;
          o.bin.level = Math.max(0.05, o.bin.level - 0.18);
          this.pos = this.segs[i - 1];
          this.pause = 0.45;
          return;
        }
      }
      if (this.pos >= this.routeLen) {
        for (const b of this.bins) if (b.level < 0.3 && Math.random() < 0.5) b.level = rand(0.6, 0.95); // restock
        this.newOrder();
      }
    }

    draw(ctx) {
      const { plan, rw, bh } = this;

      // Racks and bins
      ctx.lineWidth = 1;
      for (const bin of this.bins) {
        const x = this.rackX[bin.k];
        const y = plan.y + this.cross + bin.b * bh;
        const target = this.order.find((o) => o.bin === bin);
        ctx.fillStyle = ink(0.03 + bin.level * 0.13);
        ctx.fillRect(x + 1, y + 1, rw - 2, bh - 2);
        if (bin.flash > 0) {
          ctx.fillStyle = hot(bin.flash * 0.9);
          ctx.fillRect(x + 1, y + 1, rw - 2, bh - 2);
        }
        ctx.strokeStyle = target && !target.done ? hot(0.95) : ink(0.13);
        ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, bh - 1);
      }

      // Rack letters
      for (let k = 0; k < this.K; k++) {
        label(ctx, String.fromCharCode(65 + k), this.rackX[k] + rw / 2, plan.y - 2, { align: 'center', size: 9, color: ink(0.38) });
      }

      // Route ahead (dashed) and travelled (accent)
      const here = this.pointAt(this.pos);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = ink(0.26);
      ctx.beginPath();
      ctx.moveTo(here.x, here.y);
      for (let i = here.i; i < this.route.length; i++) ctx.lineTo(this.route[i].x, this.route[i].y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = hot(0.75);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.route[0].x, this.route[0].y);
      for (let i = 1; i < here.i; i++) ctx.lineTo(this.route[i].x, this.route[i].y);
      ctx.lineTo(here.x, here.y);
      ctx.stroke();

      // Dock
      ctx.strokeStyle = ink(0.5);
      ctx.lineWidth = 1;
      ctx.strokeRect(this.dock.x - 5, this.dock.y - 5, 10, 10);
      label(ctx, 'Dock', this.dock.x + 10, this.dock.y + 3.5, { size: 9, color: ink(0.45) });

      // Picker
      ctx.fillStyle = hot(1);
      dot(ctx, here.x, here.y, 3.6);
      ctx.strokeStyle = hot(0.35);
      ring(ctx, here.x, here.y, 7 + Math.sin(this.time * 6) * 1.5);

      if (!this.panel.w) return;

      // Pick list panel
      const p = this.panel;
      ctx.strokeStyle = ink(0.14);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, p.y + p.h);
      ctx.stroke();
      const x = p.x + 16;
      let y = p.y + 10;
      label(ctx, 'Pick list', x, y, { size: 9.5, color: ink(0.45) });
      y += 26;
      const next = this.order.findIndex((o) => !o.done);
      this.order.forEach((o, i) => {
        const done = o.done;
        const current = i === next;
        label(ctx, this.binCode(o.bin), x, y, { size: 11, color: current ? hot(1) : done ? ink(0.85) : ink(0.45) });
        label(ctx, `×${o.qty}`, x + 52, y, { size: 11, color: done ? ink(0.85) : ink(0.4) });
        label(ctx, done ? '✓' : current ? '→' : '·', p.x + p.w - 6, y, { size: 11, align: 'right', color: done ? ink(0.85) : current ? hot(1) : ink(0.3) });
        y += 22;
      });
      const doneCount = this.order.filter((o) => o.done).length;
      y = p.y + p.h - 6;
      label(ctx, `${doneCount}/${this.order.length} lines`, x, y - 12, { size: 9.5, color: ink(0.45) });
      ctx.fillStyle = ink(0.1);
      ctx.fillRect(x, y, p.w - 22, 2);
      ctx.fillStyle = hot(0.9);
      ctx.fillRect(x, y, (p.w - 22) * (doneCount / this.order.length), 2);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Fig. 02 — travel-cost matrix → nearest neighbour → 2-opt                 */
  /* ------------------------------------------------------------------------ */

  class MatrixFigure extends Figure {
    layout() {
      const pad = this.compact ? 16 : 28;
      const labelSpace = 16;
      const size = Math.min(this.h - pad * 2 - labelSpace - 22, this.w * 0.42);
      this.m = { x: pad + labelSpace, y: pad + labelSpace, size };
      const mapX = this.m.x + size + pad * 1.4;
      this.map = { x: mapX, y: pad, w: this.w - mapX - pad, h: this.h - pad * 2 - 22 };
      if (this.pts) this.px = this.pts.map((p) => this.toPx(p));
    }

    toPx(p) {
      return { x: this.map.x + p.u * this.map.w, y: this.map.y + p.v * this.map.h };
    }

    reset() {
      const n = this.compact ? 7 : 8;
      this.n = n;
      this.pts = [];
      let tries = 0;
      while (this.pts.length < n && tries++ < 2000) {
        const p = { u: rand(0.06, 0.94), v: rand(0.08, 0.92) };
        if (this.pts.every((o) => Math.hypot(o.u - p.u, (o.v - p.v) * 0.7) > 0.2)) this.pts.push(p);
      }
      this.n = this.pts.length;
      this.px = this.pts.map((p) => this.toPx(p));
      this.phase = 'measure';
      this.clock = 0;
      this.cells = 0;
      this.tour = [0];
      this.visited = new Set([0]);
      this.flash = [];
      this.nnCost = 0;
      this.optCost = 0;
      this.car = 0;
      this.fade = 1;
    }

    cost(i, j) {
      return dist(this.px[i], this.px[j]);
    }

    update(dt) {
      this.clock += dt;
      for (const f of this.flash) f.life -= dt * 1.5;
      this.flash = this.flash.filter((f) => f.life > 0);
      const n = this.n;

      if (this.phase === 'measure') {
        this.cells = Math.min(n * n, this.cells + dt * 34);
        if (this.cells >= n * n) this.next('build');
      } else if (this.phase === 'build' && this.clock > 0.28) {
        this.clock = 0;
        if (this.visited.size < n) {
          const last = this.tour[this.tour.length - 1];
          let best = -1;
          for (let j = 0; j < n; j++) {
            if (!this.visited.has(j) && (best < 0 || this.cost(last, j) < this.cost(last, best))) best = j;
          }
          this.tour.push(best);
          this.visited.add(best);
          this.flash.push({ a: last, b: best, life: 1 });
        } else {
          this.nnCost = tourLength(this.tour, this.px);
          this.optCost = this.nnCost;
          this.next('improve');
        }
      } else if (this.phase === 'improve' && this.clock > 0.6) {
        this.clock = 0;
        const move = best2opt(this.tour, this.px);
        if (move) {
          for (const [a, b] of apply2opt(this.tour, move)) this.flash.push({ a, b, life: 1 });
          this.optCost = tourLength(this.tour, this.px);
        } else {
          this.next('drive');
        }
      } else if (this.phase === 'drive') {
        const total = tourLength(this.tour, this.px);
        this.car = (this.car + dt * total / 3.2) % total;
        if (this.clock > 4.2) this.next('fade');
      } else if (this.phase === 'fade') {
        this.fade = Math.max(0, 1 - this.clock / 0.6);
        if (this.clock > 0.7) this.reset();
      }
    }

    next(phase) {
      this.phase = phase;
      this.clock = 0;
    }

    settle() {
      this.cells = this.n * this.n;
      while (this.visited.size < this.n) {
        const last = this.tour[this.tour.length - 1];
        let best = -1;
        for (let j = 0; j < this.n; j++) {
          if (!this.visited.has(j) && (best < 0 || this.cost(last, j) < this.cost(last, best))) best = j;
        }
        this.tour.push(best);
        this.visited.add(best);
      }
      this.nnCost = tourLength(this.tour, this.px);
      let move;
      while ((move = best2opt(this.tour, this.px))) apply2opt(this.tour, move);
      this.optCost = tourLength(this.tour, this.px);
      this.phase = 'drive';
      this.flash = [];
    }

    draw(ctx) {
      const { n, m } = this;
      const cell = m.size / n;
      ctx.globalAlpha = this.fade;

      let maxD = 1;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) maxD = Math.max(maxD, this.cost(i, j));

      const closed = this.phase !== 'build' && this.phase !== 'measure';
      const edges = new Set();
      for (let i = 0; i < this.tour.length - (closed ? 0 : 1); i++) {
        const a = this.tour[i];
        const b = this.tour[(i + 1) % this.tour.length];
        edges.add(`${a}-${b}`);
        edges.add(`${b}-${a}`);
      }

      // Matrix
      const filled = Math.floor(this.cells);
      for (let i = 0; i < n; i++) {
        label(ctx, String.fromCharCode(65 + i), m.x - 8, m.y + (i + 0.5) * cell + 3.5, { size: 9, align: 'center', color: ink(0.4) });
        label(ctx, String.fromCharCode(65 + i), m.x + (i + 0.5) * cell, m.y - 6, { size: 9, align: 'center', color: ink(0.4) });
        for (let j = 0; j < n; j++) {
          const k = i * n + j;
          const x = m.x + j * cell;
          const y = m.y + i * cell;
          ctx.strokeStyle = ink(0.08);
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
          if (i === j || k >= filled) continue;
          const t = 1 - this.cost(i, j) / maxD;
          ctx.fillStyle = edges.has(`${i}-${j}`) ? hot(0.85) : ink(0.04 + t * 0.4);
          ctx.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        }
      }
      if (this.phase === 'measure' && filled < n * n) {
        const i = Math.floor(filled / n);
        const j = filled % n;
        ctx.strokeStyle = hot(1);
        ctx.strokeRect(m.x + j * cell + 0.5, m.y + i * cell + 0.5, cell - 1, cell - 1);
        if (i !== j) {
          ctx.strokeStyle = hot(0.6);
          line(ctx, this.px[i], this.px[j]);
        }
      }

      // Map: tour so far
      ctx.strokeStyle = ink(0.55);
      ctx.lineWidth = 1.2;
      if (this.tour.length > 1) {
        ctx.beginPath();
        this.tour.forEach((idx, i) => (i ? ctx.lineTo(this.px[idx].x, this.px[idx].y) : ctx.moveTo(this.px[idx].x, this.px[idx].y)));
        if (closed) ctx.closePath();
        ctx.stroke();
      }
      ctx.lineWidth = 2;
      for (const f of this.flash) {
        ctx.strokeStyle = hot(f.life);
        line(ctx, this.px[f.a], this.px[f.b]);
      }
      ctx.lineWidth = 1;

      this.px.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? hot(1) : ink(0.9);
        dot(ctx, p.x, p.y, i === 0 ? 3.6 : 2.6);
        label(ctx, String.fromCharCode(65 + i), p.x + 7, p.y - 6, { size: 9, color: ink(0.5) });
      });

      if (this.phase === 'drive') {
        const c = pointOnTour(this.tour, this.px, this.car);
        ctx.fillStyle = hot(1);
        dot(ctx, c.x, c.y, 3.4);
      }

      // Readout
      const y = this.h - (this.compact ? 12 : 18);
      const phaseName = { measure: 'Measuring pairs', build: 'Nearest neighbour', improve: '2-opt', drive: 'Route ready', fade: 'Route ready' }[this.phase];
      label(ctx, `${n}×${n} matrix · ${phaseName}`, m.x - 16, y, { size: 9.5, color: ink(0.5) });
      if (this.nnCost && !this.compact) {
        const gain = 1 - this.optCost / this.nnCost;
        label(ctx, `Cost ${fmt(this.nnCost)} → ${fmt(this.optCost)}${gain > 0.001 ? `  (−${(gain * 100).toFixed(1)}%)` : ''}`, this.w - 28, y, { size: 9.5, align: 'right', color: ink(0.5) });
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Fig. 03 — weekly job board                                               */
  /* ------------------------------------------------------------------------ */

  class JobsFigure extends Figure {
    layout() {
      const pad = this.compact ? 14 : 26;
      this.days = this.compact ? ['Mon', 'Tue', 'Wed', 'Thu'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      this.crews = this.compact ? 3 : 4;
      const left = this.compact ? 50 : 68;
      const top = 24;
      const bottom = this.compact ? 22 : 30;
      this.grid = { x: pad + left, y: pad + top, w: this.w - pad * 2 - left, h: this.h - pad * 2 - top - bottom };
      this.cw = this.grid.w / this.days.length;
      this.ch = this.grid.h / this.crews;
      this.pad = pad;
      if (this.slots && this.slots.length !== this.days.length * this.crews) this.reset();
    }

    reset() {
      this.week = this.week ? this.week + 1 : 42;
      this.nextId = this.nextId || 1040;
      this.slots = Array.from({ length: this.days.length * this.crews }, () => null);
      this.clock = 0;
      this.clearing = 0;
    }

    update(dt) {
      this.clock += dt;
      for (const s of this.slots) if (s) { s.age += dt; s.flash = Math.max(0, s.flash - dt * 1.6); }

      if (this.clearing) {
        this.clearing += dt;
        if (this.clearing > 1.2) this.reset();
        return;
      }
      if (this.clock < 0.32) return;
      this.clock = 0;

      const empty = this.slots.map((s, i) => (s ? -1 : i)).filter((i) => i >= 0);
      const scheduled = this.slots.filter((s) => s && s.state === 0);
      const onsite = this.slots.filter((s) => s && s.state === 1);

      const r = Math.random();
      if (empty.length && (r < 0.45 || (!scheduled.length && !onsite.length))) {
        const i = empty[Math.floor(Math.random() * Math.min(empty.length, 4))]; // fill roughly in order
        this.slots[i] = { id: this.nextId++, state: 0, age: 0, flash: 0 };
      } else if (scheduled.length && (onsite.length < 3 || r < 0.6)) {
        const s = scheduled[0];
        s.state = 1;
        s.flash = 1;
      } else if (onsite.length) {
        const s = onsite[Math.floor(Math.random() * onsite.length)];
        s.state = 2;
        s.flash = 1;
      } else if (!empty.length && this.slots.every((s) => s && s.state === 2)) {
        this.clearing = 0.001;
      }
    }

    settle() {
      for (let i = 0; i < this.slots.length; i++) {
        const r = Math.random();
        this.slots[i] = r < 0.82 ? { id: this.nextId++, state: i < this.slots.length * 0.5 ? 2 : r < 0.5 ? 1 : 0, age: 9, flash: 0 } : null;
      }
    }

    draw(ctx) {
      const { grid, cw, ch, days } = this;
      const fade = this.clearing ? Math.max(0, 1 - this.clearing / 0.8) : 1;

      days.forEach((d, i) => label(ctx, d, grid.x + i * cw + 8, grid.y - 9, { size: 9.5, color: ink(0.45) }));
      label(ctx, `Week ${this.week}`, this.pad, grid.y - 9, { size: 9.5, color: ink(0.7) });
      for (let r = 0; r < this.crews; r++) {
        label(ctx, `Crew ${String.fromCharCode(65 + r)}`, this.pad, grid.y + r * ch + ch / 2 + 3.5, { size: 9.5, color: ink(0.45) });
      }

      ctx.strokeStyle = ink(0.1);
      ctx.lineWidth = 1;
      for (let i = 0; i <= days.length; i++) line(ctx, { x: grid.x + i * cw + 0.5, y: grid.y }, { x: grid.x + i * cw + 0.5, y: grid.y + grid.h });
      for (let r = 0; r <= this.crews; r++) line(ctx, { x: grid.x, y: grid.y + r * ch + 0.5 }, { x: grid.x + grid.w, y: grid.y + r * ch + 0.5 });

      const counts = [0, 0, 0];
      ctx.globalAlpha = fade;
      this.slots.forEach((s, i) => {
        if (!s) return;
        counts[s.state]++;
        const col = i % days.length;
        const row = Math.floor(i / days.length);
        const grow = easeOut(s.age / 0.4);
        const inset = 5;
        const w = (cw - inset * 2) * grow;
        const h = ch - inset * 2;
        const x = grid.x + col * cw + inset;
        const y = grid.y + row * ch + inset;

        if (s.state === 1) {
          ctx.fillStyle = hot(0.88);
          ctx.fillRect(x, y, w, h);
        } else if (s.state === 2) {
          ctx.fillStyle = ink(0.16);
          ctx.fillRect(x, y, w, h);
        }
        ctx.strokeStyle = s.state === 0 ? ink(0.55) : s.state === 1 ? hot(1) : ink(0.25);
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        if (s.flash) {
          ctx.fillStyle = ink(s.flash * 0.35);
          ctx.fillRect(x, y, w, h);
        }
        if (grow > 0.9 && w > 40) {
          const color = s.state === 1 ? 'rgba(10,10,10,0.9)' : s.state === 2 ? ink(0.55) : ink(0.85);
          label(ctx, `J-${s.id}`, x + 7, y + 15, { size: 9.5, color });
          if (h > 34) {
            const state = ['Scheduled', 'On site', 'Done ✓'][s.state];
            label(ctx, state, x + 7, y + h - 8, { size: 8.5, color: s.state === 1 ? 'rgba(10,10,10,0.75)' : ink(0.4) });
          }
        }
      });
      ctx.globalAlpha = 1;

      const y = this.h - this.pad + 4;
      const text = this.compact
        ? `${counts[1]} on site · ${counts[2]} done`
        : `${counts[0]} scheduled · ${counts[1]} on site · ${counts[2]} done`;
      label(ctx, text, this.pad, y, { size: 9.5, color: ink(0.5) });
      if (!this.compact) {
        ctx.fillStyle = hot(0.9);
        ctx.fillRect(this.w - this.pad - 8, y - 7, 8, 8);
        label(ctx, 'On site', this.w - this.pad - 14, y, { size: 9.5, align: 'right', color: ink(0.45) });
      }
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Fig. 04 — EEG channels through an artifact-removal stage                 */
  /* ------------------------------------------------------------------------ */

  const CHANNELS = ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'O1', 'O2'];

  // Deterministic noise so each sample keeps its value while it scrolls.
  function hash(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  }

  class EEGFigure extends Figure {
    layout() {
      const pad = this.compact ? 12 : 24;
      this.channels = this.compact ? CHANNELS.slice(0, 2).concat(CHANNELS.slice(4)) : CHANNELS;
      const left = this.compact ? 34 : 46;
      const fnirs = this.compact ? 0 : this.h * 0.2;
      const top = 20;
      this.plot = { x: pad + left, y: pad + top, w: this.w - pad * 2 - left, h: this.h - pad * 2 - top - fnirs - (this.compact ? 16 : 22) };
      this.fnirs = fnirs ? { x: this.plot.x, y: this.plot.y + this.plot.h + 14, w: this.plot.w * 0.54, h: fnirs - 10 } : null;
      this.lineX = this.plot.x + this.plot.w * 0.62;
      this.window = this.compact ? 2.4 : 3.4;
      this.pad = pad;
      this.phase = this.channels.map((_, i) => ({ a: rand(0, 6.28), t: rand(0, 6.28), b: rand(0, 6.28), s: i * 13.7 }));
    }

    reset() {
      this.blinks = [];
      this.nextBlink = 0.8;
    }

    fatigue(t) {
      return clamp(0.5 + 0.34 * Math.sin(t * 0.16 + 1.1) + 0.08 * Math.sin(t * 0.53), 0.06, 0.94);
    }

    signal(c, t, clean) {
      const name = this.channels[c];
      const ph = this.phase[c];
      const occipital = name[0] === 'O';
      const frontal = name.startsWith('Fp');
      const fat = this.fatigue(t);
      let v = (occipital ? 0.85 : 0.35) * Math.sin(6.28 * 10.1 * t + ph.a); // alpha
      v += fat * 0.7 * Math.sin(6.28 * 5.8 * t + ph.t); // theta rises with fatigue
      v += 0.2 * Math.sin(6.28 * 19 * t + ph.b); // beta
      v += 0.35 * Math.sin(6.28 * 1.3 * t + ph.s) + 0.22 * Math.sin(6.28 * 2.9 * t + ph.a * 2);
      if (!clean) {
        v += 0.32 * hash(Math.floor(t * 160) + ph.s * 1000); // broadband noise
        if (frontal || name[0] === 'F') {
          const gain = frontal ? 3.4 : 1.3;
          for (const b of this.blinks) v += gain * Math.exp(-Math.pow((t - b) / 0.09, 2));
        }
      }
      return v;
    }

    update(dt) {
      if (this.time > this.nextBlink) {
        this.blinks.push(this.time + 0.15);
        this.nextBlink = this.time + rand(1.6, 3.4);
      }
      this.blinks = this.blinks.filter((b) => b > this.time - this.window - 1);
    }

    xAt(t) {
      return this.plot.x + (1 - (this.time - t) / this.window) * this.plot.w;
    }

    draw(ctx) {
      const { plot, channels } = this;
      const rowH = plot.h / channels.length;
      const amp = rowH * 0.19;

      // Header
      label(ctx, 'Cleaned', plot.x, plot.y - 10, { size: 9, color: ink(0.45) });
      label(ctx, 'Raw · 250 Hz', plot.x + plot.w, plot.y - 10, { size: 9, align: 'right', color: ink(0.45) });
      if (!this.compact) label(ctx, '← Artifact removal', this.lineX + 8, plot.y - 10, { size: 9, color: hot(0.9) });

      // Processing line
      ctx.strokeStyle = hot(0.6);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      line(ctx, { x: this.lineX, y: plot.y - 4 }, { x: this.lineX, y: plot.y + plot.h });
      ctx.setLineDash([]);

      // Blink artifacts still in the raw region
      for (const b of this.blinks) {
        const x = this.xAt(b);
        const half = ((0.42 / this.window) * plot.w) / 2;
        const x0 = Math.max(this.lineX, x - half);
        const x1 = Math.min(plot.x + plot.w, x + half);
        if (x1 - x0 > 4) {
          ctx.strokeStyle = hot(0.9);
          ctx.strokeRect(x0 + 0.5, plot.y + 2.5, x1 - x0 - 1, rowH * 2.1);
          label(ctx, 'Blink', x0 + 3, plot.y + rowH * 2.1 + 13, { size: 8.5, color: hot(0.95) });
        }
      }

      // Traces
      const step = 1.5;
      channels.forEach((name, c) => {
        const mid = plot.y + rowH * (c + 0.5);
        label(ctx, name, plot.x - 10, mid + 3, { size: 9, align: 'right', color: ink(0.45) });
        ctx.beginPath();
        for (let x = plot.x; x <= plot.x + plot.w; x += step) {
          const t = this.time - (1 - (x - plot.x) / plot.w) * this.window;
          const clean = x < this.lineX;
          const y = mid - clamp(this.signal(c, t, clean), -3.6, 3.6) * amp;
          if (x === plot.x) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = ink(0.72);
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // fNIRS lane
      const f = this.fnirs;
      if (f) {
        label(ctx, 'fNIRS', plot.x - 10, f.y + f.h / 2 + 3, { size: 9, align: 'right', color: ink(0.45) });
        [['HbO', 1, ink(0.85), []], ['HbR', -0.55, ink(0.45), [3, 3]]].forEach(([name, sign, color, dash], k) => {
          ctx.beginPath();
          for (let x = f.x; x <= f.x + f.w; x += 3) {
            const t = this.time * 0.6 - (1 - (x - f.x) / f.w) * 9;
            const v = sign * (0.55 * Math.sin(t * 0.7 + 1) + 0.25 * Math.sin(t * 1.9 + k)) + this.fatigue(this.time) * 0.3 * sign;
            const y = f.y + f.h / 2 - v * f.h * 0.4;
            if (x === f.x) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.setLineDash(dash);
          ctx.strokeStyle = color;
          ctx.stroke();
          ctx.setLineDash([]);
          label(ctx, name, f.x + f.w + 8, f.y + 10 + k * 14, { size: 9, color });
        });

        // Classifier readout
        const p = this.fatigue(this.time);
        const gx = this.lineX + plot.w * 0.06;
        const gw = plot.x + plot.w - gx;
        const gy = f.y + 6;
        label(ctx, 'P(fatigue)', gx, gy + 4, { size: 9, color: ink(0.45) });
        label(ctx, p.toFixed(2), gx + gw, gy + 4, { size: 11, align: 'right', color: p > 0.66 ? hot(1) : ink(0.9) });
        ctx.fillStyle = ink(0.1);
        ctx.fillRect(gx, gy + 14, gw, 3);
        ctx.fillStyle = p > 0.66 ? hot(1) : ink(0.8);
        ctx.fillRect(gx, gy + 14, gw * p, 3);
        const state = p > 0.66 ? 'High' : p > 0.38 ? 'Moderate' : 'Low';
        label(ctx, `State: ${state}`, gx, gy + 34, { size: 9, color: ink(0.55) });
      } else {
        const p = this.fatigue(this.time);
        label(ctx, `P(fatigue) ${p.toFixed(2)}`, plot.x + plot.w, this.h - this.pad + 2, { size: 9, align: 'right', color: p > 0.66 ? hot(1) : ink(0.6) });
      }
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Fig. 05 — prompt recovery                                                */
  /* ------------------------------------------------------------------------ */

  const EXAMPLES = [
    {
      original: 'The quarterly report is due on Friday.',
      rewrite: 'Hark! The reckoning of the quarter must be delivered ere Friday’s sun doth set.',
      stem: 'Rewrite this ',
      answer: 'in Shakespearean English.',
      decoys: ['as a pirate.', 'more formally.', 'as a poem.', 'for a child.'],
    },
    {
      original: 'Our team shipped the new dashboard this week.',
      rewrite: 'Huge week! Our team just shipped the new dashboard — so proud of these people. #shipping #teamwork',
      stem: 'Rewrite this ',
      answer: 'as an upbeat LinkedIn post.',
      decoys: ['as a tweet.', 'as a press release.', 'more casually.', 'as a haiku.'],
    },
    {
      original: 'Please restart the server before you deploy.',
      rewrite: 'Restart the server, you must. Then deploy, you may.',
      stem: 'Rewrite this ',
      answer: 'in the voice of Yoda.',
      decoys: ['as a riddle.', 'as a pirate.', 'backwards.', 'politely.'],
    },
  ];

  class PromptFigure extends Figure {
    reset() {
      this.ex = this.ex === undefined ? 0 : (this.ex + 1) % EXAMPLES.length;
      this.phase = 'original';
      this.clock = 0;
      this.words = 0;
      this.chars = 0;
      this.decoy = 0;
      this.alpha = 0;
    }

    update(dt) {
      this.clock += dt;
      const ex = EXAMPLES[this.ex];
      const words = ex.rewrite.split(' ').length;
      switch (this.phase) {
        case 'original':
          this.alpha = Math.min(1, this.clock / 0.5);
          if (this.clock > 1.1) this.go('rewrite');
          break;
        case 'rewrite':
          this.words = Math.min(words, this.clock * 9);
          if (this.words >= words && this.clock > words / 9 + 0.5) this.go('search');
          break;
        case 'search':
          this.decoy = Math.floor(this.clock * 11);
          if (this.clock > 1.4) this.go('lock');
          break;
        case 'lock':
          this.chars = Math.min(ex.answer.length, this.clock * 38);
          if (this.clock > 3.6) this.go('out');
          break;
        case 'out':
          this.alpha = Math.max(0, 1 - this.clock / 0.45);
          if (this.clock > 0.5) this.reset();
          break;
      }
    }

    go(phase) {
      this.phase = phase;
      this.clock = 0;
    }

    settle() {
      this.alpha = 1;
      this.words = 99;
      this.chars = 99;
      this.phase = 'lock';
      this.clock = 3;
    }

    draw(ctx) {
      const ex = EXAMPLES[this.ex];
      const pad = this.compact ? 16 : Math.max(28, this.w * 0.05);
      const width = this.w - pad * 2;
      const big = clamp(this.w / (this.compact ? 22 : 27), 14, 36);

      // Measure the block first so it can sit centred in the frame.
      const head = big * 0.8 + 12;
      font(ctx, big * 0.68, SANS);
      const origLines = this.compact ? 0 : wrap(ctx, ex.original, width).length;
      font(ctx, big, SERIF, 'italic');
      const rewriteLines = wrap(ctx, ex.rewrite, width).length;
      const total = (this.compact ? 2 : 3) * head
        + (this.compact ? 0 : origLines * big * 0.9 + big * 0.55)
        + rewriteLines * big * 1.08 + big * 0.5 + big * 0.5;
      let y = Math.max(pad + 6, (this.h - total) / 2 + big * 0.3);
      ctx.globalAlpha = this.alpha;

      const section = (n, text) => {
        label(ctx, `${n}  ${text}`, pad, y, { size: 9.5, color: ink(0.45) });
        ctx.strokeStyle = ink(0.12);
        line(ctx, { x: pad + ctx.measureText(`${n}  ${text}`.toUpperCase()).width + 10, y: y - 3.5 }, { x: pad + width, y: y - 3.5 });
        y += head;
      };

      if (!this.compact) {
        section('01', 'Original');
        font(ctx, big * 0.68, SANS);
        ctx.fillStyle = ink(0.6);
        ctx.textAlign = 'left';
        for (const l of wrap(ctx, ex.original, width)) {
          ctx.fillText(l, pad, y);
          y += big * 0.9;
        }
        y += big * 0.55;
      }

      section(this.compact ? '01' : '02', 'Rewritten by an LLM');
      font(ctx, big, SERIF, 'italic');
      ctx.fillStyle = ink(0.95);
      const shown = ex.rewrite.split(' ').slice(0, Math.ceil(this.words)).join(' ');
      const lines = wrap(ctx, ex.rewrite, width);
      let remaining = shown.length;
      for (const l of lines) {
        if (remaining <= 0) { y += big * 1.08; continue; }
        ctx.fillText(l.slice(0, remaining), pad, y);
        remaining -= l.length + 1;
        y += big * 1.08;
      }
      y += big * 0.5;

      section(this.compact ? '02' : '03', 'Recovered prompt');
      if (this.phase === 'original' || this.phase === 'rewrite') {
        ctx.globalAlpha = 1;
        return;
      }
      font(ctx, big * 0.72, MONO);
      ctx.textAlign = 'left';
      ctx.fillStyle = ink(0.45);
      ctx.fillText('>', pad, y);
      const x = pad + big * 0.72 * 1.2;
      ctx.fillStyle = ink(0.92);
      ctx.fillText(ex.stem, x, y);
      const sx = x + ctx.measureText(ex.stem).width;
      if (this.phase === 'search') {
        ctx.fillStyle = ink(0.4);
        ctx.fillText(ex.decoys[this.decoy % ex.decoys.length], sx, y);
      } else {
        ctx.fillStyle = hot(1);
        const typed = ex.answer.slice(0, Math.ceil(this.chars));
        ctx.fillText(typed, sx, y);
        const cx = sx + ctx.measureText(typed).width + 2;
        if (Math.floor(this.time * 2.2) % 2 === 0 || this.chars < ex.answer.length) {
          ctx.fillRect(cx, y - big * 0.55, big * 0.36, big * 0.68);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Fig. 06 — data → features → model → API → client apps                    */
  /* ------------------------------------------------------------------------ */

  class PipelineFigure extends Figure {
    layout() {
      const pad = this.compact ? 14 : 30;
      const chartH = this.compact ? 0 : this.h * 0.3;
      const flowH = this.h - pad * 2 - chartH;
      const midY = pad + flowH * 0.5;
      const nw = clamp(this.w * 0.12, 52, 104);
      const nh = this.compact ? 26 : 34;
      const names = this.compact ? ['Data', 'Model', 'API'] : ['Data', 'Features', 'Model', 'API'];
      const span = this.w * (this.compact ? 0.62 : 0.66) - pad;
      this.nodes = names.map((name, i) => ({
        name,
        x: pad + (i / (names.length - 1)) * (span - nw),
        y: midY - nh / 2,
        w: nw,
        h: nh,
      }));
      const ax = this.w - pad - nw;
      const gap = Math.min(flowH / 3.2, nh * 1.9);
      this.apps = [0, 1, 2].map((i) => ({ name: `Client ${i + 1}`, x: ax, y: midY - nh / 2 + (i - 1) * gap, w: nw, h: nh, hits: 0, pulse: 0 }));
      this.chart = chartH ? { x: pad, y: this.h - pad - chartH + 24, w: this.w - pad * 2, h: chartH - 34 } : null;
      this.pad = pad;
    }

    reset() {
      this.packets = [];
      this.spawn = 0;
      this.served = 0;
    }

    port(n, side) {
      return { x: side === 'out' ? n.x + n.w : n.x, y: n.y + n.h / 2 };
    }

    update(dt) {
      this.spawn += dt;
      if (this.spawn > 0.22) {
        this.spawn = 0;
        this.packets.push({ seg: 0, t: 0, app: randInt(0, 2), speed: rand(1.3, 1.8) });
      }
      const last = this.nodes.length - 1;
      for (const p of this.packets) {
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.seg++;
          if (p.seg > last) {
            const app = this.apps[p.app];
            app.hits++;
            app.pulse = 1;
            this.served++;
            p.done = true;
          }
        }
      }
      this.packets = this.packets.filter((p) => !p.done);
      for (const a of this.apps) a.pulse = Math.max(0, a.pulse - dt * 2.4);
    }

    draw(ctx) {
      const { nodes, apps } = this;
      const last = nodes.length - 1;
      const modelIdx = nodes.findIndex((n) => n.name === 'Model');

      // Edges
      ctx.strokeStyle = ink(0.22);
      ctx.lineWidth = 1;
      for (let i = 0; i < last; i++) line(ctx, this.port(nodes[i], 'out'), this.port(nodes[i + 1], 'in'));
      const api = nodes[last];
      for (const a of apps) {
        const from = this.port(api, 'out');
        const to = this.port(a, 'in');
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.bezierCurveTo((from.x + to.x) / 2, from.y, (from.x + to.x) / 2, to.y, to.x, to.y);
        ctx.stroke();
      }

      // Packets
      for (const p of this.packets) {
        let pos;
        if (p.seg < last) {
          const a = this.port(nodes[p.seg], 'out');
          const b = this.port(nodes[p.seg + 1], 'in');
          pos = { x: lerp(a.x, b.x, p.t), y: lerp(a.y, b.y, p.t) };
        } else {
          const a = this.port(api, 'out');
          const b = this.port(apps[p.app], 'in');
          const t = p.t;
          const mx = (a.x + b.x) / 2;
          // cubic bezier point
          const u = 1 - t;
          pos = {
            x: u * u * u * a.x + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * b.x,
            y: u * u * u * a.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t * t * t * b.y,
          };
        }
        ctx.fillStyle = p.seg >= modelIdx ? hot(1) : ink(0.75);
        dot(ctx, pos.x, pos.y, 2.4);
      }

      // Nodes
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 4);
      for (const n of nodes) {
        const isModel = n.name === 'Model';
        ctx.fillStyle = 'rgba(18,18,17,1)';
        ctx.fillRect(n.x, n.y, n.w, n.h);
        ctx.strokeStyle = isModel ? hot(0.6 + pulse * 0.4) : ink(0.45);
        ctx.strokeRect(n.x + 0.5, n.y + 0.5, n.w - 1, n.h - 1);
        label(ctx, n.name, n.x + n.w / 2, n.y + n.h / 2 + 3.5, { size: 9.5, align: 'center', color: isModel ? hot(1) : ink(0.85) });
      }
      for (const a of apps) {
        ctx.fillStyle = 'rgba(18,18,17,1)';
        ctx.fillRect(a.x, a.y, a.w, a.h);
        ctx.fillStyle = hot(a.pulse * 0.35);
        ctx.fillRect(a.x, a.y, a.w, a.h);
        ctx.strokeStyle = ink(0.45);
        ctx.strokeRect(a.x + 0.5, a.y + 0.5, a.w - 1, a.h - 1);
        label(ctx, a.name, a.x + a.w / 2, a.y + a.h / 2 + 3.5, { size: 9.5, align: 'center', color: ink(0.85) });
      }
      label(ctx, `${fmt(this.served)} predictions served`, this.pad, this.pad + 4, { size: 9.5, color: ink(0.5) });

      // Uplift chart: baseline vs launch, ending at the reported +7%.
      const c = this.chart;
      if (!c) return;
      ctx.strokeStyle = ink(0.12);
      line(ctx, { x: c.x, y: c.y - 14 }, { x: c.x + c.w, y: c.y - 14 });
      label(ctx, 'Client profit vs baseline', c.x, c.y - 22, { size: 9, color: ink(0.45) });
      const progress = reduceMotion ? 1 : (this.time % 9) / 6;
      const n = 60;
      const baseY = c.y + c.h * 0.78;
      const topY = c.y + c.h * 0.12;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = ink(0.35);
      line(ctx, { x: c.x, y: baseY }, { x: c.x + c.w, y: baseY });
      ctx.setLineDash([]);
      ctx.strokeStyle = hot(0.95);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let end = { x: c.x, y: baseY };
      for (let i = 0; i <= n * clamp(progress, 0, 1); i++) {
        const t = i / n;
        const lift = easeOut(clamp((t - 0.25) / 0.75, 0, 1));
        const wobble = Math.sin(i * 1.7) * 0.03 + Math.sin(i * 0.6) * 0.02;
        const x = c.x + t * c.w;
        const y = lerp(baseY, topY, clamp(lift + wobble, 0, 1.05));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        end = { x, y };
      }
      ctx.stroke();
      ctx.lineWidth = 1;
      label(ctx, 'Baseline', c.x + c.w, baseY + 13, { size: 9, align: 'right', color: ink(0.4) });
      if (progress >= 1) label(ctx, '+7%', end.x - 6, end.y - 8, { size: 11, align: 'right', color: hot(1) });
      label(ctx, 'Launch', c.x + c.w * 0.25, baseY + 13, { size: 9, color: ink(0.4) });
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Mounting                                                                 */
  /* ------------------------------------------------------------------------ */

  const registry = {
    route: RouteFigure,
    wms: WarehouseFigure,
    matrix: MatrixFigure,
    jobs: JobsFigure,
    eeg: EEGFigure,
    prompt: PromptFigure,
    pipeline: PipelineFigure,
  };

  const mounted = new Set();

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const fig = entry.target.__figure;
        if (!fig) continue;
        fig.visible = entry.isIntersecting;
        if (fig.visible && !document.hidden) fig.start();
        else fig.stop();
      }
    }, { rootMargin: '80px 0px' })
    : null;

  const ro = 'ResizeObserver' in window
    ? new ResizeObserver((entries) => entries.forEach((e) => e.target.__figure && e.target.__figure.resize()))
    : null;

  function create(type, canvas, opts) {
    const Ctor = registry[type];
    return Ctor ? new Ctor(canvas, opts).init() : null;
  }

  /** Create a figure and manage its lifecycle (visibility, resizing). */
  function mount(canvas, type, opts) {
    const fig = create(type || canvas.dataset.figure, canvas, opts);
    if (!fig) return null;
    canvas.__figure = fig;
    mounted.add(fig);
    if (io) io.observe(canvas);
    else fig.start();
    if (ro) ro.observe(canvas);
    return fig;
  }

  document.addEventListener('visibilitychange', () => {
    for (const fig of mounted) {
      if (document.hidden) fig.stop();
      else if (fig.visible) fig.start();
    }
  });

  // Canvas text uses web fonts; repaint stills once they have arrived.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => mounted.forEach((fig) => fig.render()));
  }

  window.Figures = { create, mount, reduceMotion };
})();
