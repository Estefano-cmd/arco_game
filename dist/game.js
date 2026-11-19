(() => {
  const canvas = document.getElementById("game"),
    ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id),
    W = 1200,
    H = 620;
  const stages = [
    {
      name: "Bosque de los Susurros",
      chapter: "I",
      goal: 3,
      time: 70,
      colors: ["#29244e", "#76518c", "#a16d9f"],
      caption: "El bosque te espera",
      intro:
        "Los corazones mágicos se mueven entre los árboles. Tensa tu arco y demuestra tu puntería.",
      end: "El bosque ha abierto sus senderos para ti. La magia continúa junto al lago.",
    },
    {
      name: "Lago de las Estrellas",
      chapter: "II",
      goal: 4,
      time: 70,
      colors: ["#12294c", "#574c90", "#8e77ba"],
      caption: "El lago de las estrellas",
      intro:
        "Los corazones se mueven con más velocidad. Sigue su ritmo y apunta un poquito más alto.",
      end: "Las estrellas brillan a tu paso. Ya casi llegas al jardín secreto.",
    },
    {
      name: "Jardín Eterno",
      chapter: "III",
      goal: 5,
      time: 75,
      colors: ["#33204e", "#885292", "#b57cac"],
      caption: "El jardín eterno",
      intro:
        "Último desafío: los corazones son más veloces. Cinco aciertos separan tu arco de una sorpresa.",
      end: "¡La magia es tuya!",
    },
  ];
  let stage = 0,
    mode = "intro",
    hits = 0,
    total = 0,
    remaining = 70,
    last = 0,
    worldTime = 0,
    charging = false,
    chargeStart = 0,
    charge = 0,
    pointer = { x: 910, y: 290 },
    arrows = [],
    sparks = [],
    floaters = [],
    target = null,
    shake = 0,
    soundOn = false,
    audio = null;
  const bow = { x: 167, y: 404 };
  const rand = (a, b) => a + Math.random() * (b - a),
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  for (let i = 0; i < 95; i++)
    floaters.push({
      x: rand(0, W),
      y: rand(20, H),
      s: rand(1, 3.5),
      phase: rand(0, 7),
      spd: rand(5, 20),
    });
  function playTone(f = 600, d = 0.1, type = "sine", vol = 0.05) {
    if (!soundOn) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, audio.currentTime);
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d);
      o.connect(g);
      g.connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + d);
    } catch {}
  }
  function updateHud() {
    const s = stages[stage];
    $("chapter").textContent = `✦ CAPÍTULO ${s.chapter}`;
    $("levelName").textContent = s.name;
    $("hearts").textContent = "♥ ".repeat(hits) + "♡ ".repeat(s.goal - hits);
    $("timer").textContent = `${Math.max(0, Math.ceil(remaining))}s`;
    $("score").textContent = String(total).padStart(4, "0");
    $("progressText").textContent = `0${stage + 1} / 03`;
    $("progressFill").style.width = `${((stage + hits / s.goal) / 3) * 100}%`;
  }
  function overlay(kicker, title, desc, label, action) {
    $("overlayKicker").textContent = kicker;
    $("overlayTitle").textContent = title;
    $("overlayText").textContent = desc;
    $("overlayBtn").textContent = label;
    $("overlayBtn").onclick = action;
    $("overlay").classList.remove("hidden");
  }
  function spawnTarget() {
    target = {
      x: rand(790, 1020),
      baseY: rand(235, 390),
      y: 295,
      t: rand(0, 10),
      speed: rand(1.05, 1.55) + stage * 0.5,
      amplitude: 38 + stage * 19,
      radius: 48 - stage * 4,
      phase: rand(0, 7),
    };
    target.y = target.baseY;
  }
  function initStage(n) {
    stage = n;
    hits = 0;
    remaining = stages[n].time;
    arrows = [];
    sparks = [];
    charging = false;
    spawnTarget();
    mode = "intro";
    updateHud();
    overlay(
      `CAPÍTULO ${stages[n].chapter} · ${n + 1} DE 3`,
      stages[n].caption,
      stages[n].intro,
      "Entrar al mundo ✦",
      () => {
        mode = "playing";
        $("overlay").classList.add("hidden");
        playTone(560, 0.23);
      },
    );
    $("touchHint").style.display = "block";
  }
  function start() {
    initStage(0);
  }
  function finishStage() {
    mode = "transition";
    charging = false;
    playTone(710, 0.2);
    setTimeout(() => playTone(920, 0.34), 160);
    if (stage === 2) {
      setTimeout(showReward, 950);
    } else {
      setTimeout(() => {
        const next = stage + 1;
        overlay(
          "CAPÍTULO COMPLETADO ✧",
          "¡Un mundo conquistado!",
          stages[stage].end,
          "Siguiente capítulo ✦",
          () => initStage(next),
        );
        mode = "intermission";
      }, 850);
    }
  }
  function showReward() {
    mode = "won";
    $("reward").classList.add("show");
    $("reward").setAttribute("aria-hidden", "false");
    $("progressFill").style.width = "100%";
    for (let i = 0; i < 3; i++)
      setTimeout(() => playTone(540 + i * 170, 0.35, "sine", 0.06), i * 220);
  }
  function gameOver() {
    mode = "lost";
    charging = false;
    overlay(
      "UNA NUEVA OPORTUNIDAD",
      "La magia aún te espera",
      "El tiempo se terminó, pero los corazones siempre dan otra oportunidad. ¡Vuelve a intentarlo!",
      "Intentar de nuevo ♡",
      () => initStage(stage),
    );
  }
  function aimAngle() {
    return Math.atan2(pointer.y - bow.y, pointer.x - bow.x);
  }
  function fire() {
    if (mode !== "playing" || !charging) return;
    charging = false;
    const held = (performance.now() - chargeStart) / 1000,
      power = clamp(0.68 + held * 0.5, 0.68, 1);
    let angle = aimAngle();
    angle = clamp(angle, -1.25, 0.78);
    const speed = 1120 * power;
    arrows.push({
      x: bow.x + 40,
      y: bow.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: angle,
      life: 0,
      stuck: false,
    });
    playTone(210, 0.14, "triangle", 0.09);
    shake = 3;
  }
  function burst(x, y, color, count = 22) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2),
        v = rand(30, 190);
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.45, 1.2),
        max: 1.2,
        size: rand(2, 6),
        color,
      });
    }
  }
  function hit() {
    hits++;
    total += 100 + Math.floor(remaining) * 2;
    burst(target.x, target.y, "#efb6fa", 35);
    burst(target.x, target.y, "#fff0c5", 18);
    shake = 8;
    playTone(780, 0.22, "sine", 0.08);
    setTimeout(() => playTone(1070, 0.28), 95);
    spawnTarget();
    updateHud();
    if (hits >= stages[stage].goal) finishStage();
  }
  function sky(colors) {
    let gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.55, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    let moon = ctx.createRadialGradient(895, 140, 4, 895, 140, 220);
    moon.addColorStop(0, "#ffe7ffc0");
    moon.addColorStop(0.2, "#dfb5f54f");
    moon.addColorStop(1, "#cea2f000");
    ctx.fillStyle = moon;
    ctx.fillRect(680, 0, 460, 420);
    ctx.fillStyle = "#fbe5ff";
    ctx.beginPath();
    ctx.arc(892, 125, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.arc(906, 115, 34, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 42; i++) {
      const x = (i * 227 + 81) % W,
        y = (i * 139 + 41) % 340;
      ctx.globalAlpha = 0.3 + 0.45 * Math.sin(worldTime + i) ** 2;
      ctx.fillStyle = "#fff5ff";
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 5 === 0 ? 1 : 0), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function hillLayer(y, color, scale, seed) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, y);
    for (let x = 0; x <= W; x += 16)
      ctx.lineTo(
        x,
        y +
          Math.sin(x / scale + seed) * 29 +
          Math.sin(x / (scale * 0.55) + seed) * 9,
      );
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
  function pine(x, base, h, shade) {
    ctx.fillStyle = shade;
    ctx.fillRect(x - 5, base - h * 0.3, 10, h * 0.4);
    ctx.beginPath();
    ctx.moveTo(x, base - h);
    ctx.lineTo(x - h * 0.27, base - h * 0.24);
    ctx.lineTo(x + h * 0.27, base - h * 0.24);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, base - h * 0.78);
    ctx.lineTo(x - h * 0.35, base);
    ctx.lineTo(x + h * 0.35, base);
    ctx.fill();
  }
  function blossom(x, y, size, color) {
    ctx.fillStyle = color;
    for (let k = 0; k < 5; k++) {
      const a = (k * Math.PI * 2) / 5 + worldTime * 0.06;
      ctx.beginPath();
      ctx.ellipse(
        x + Math.cos(a) * size * 0.45,
        y + Math.sin(a) * size * 0.45,
        size * 0.43,
        size * 0.28,
        a,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = "#ffe4ab";
    ctx.beginPath();
    ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  function landscape() {
    sky(stages[stage].colors);
    hillLayer(330, "#30264eaa", 83, 1);
    hillLayer(412, stage === 1 ? "#292d60" : "#3e2b5d", 135, 2);
    if (stage === 1) {
      const lake = ctx.createLinearGradient(0, 410, 0, 620);
      lake.addColorStop(0, "#7c6fa7");
      lake.addColorStop(1, "#22264c");
      ctx.fillStyle = lake;
      ctx.fillRect(0, 425, W, 195);
      for (let i = 0; i < 24; i++) {
        ctx.strokeStyle = `rgba(229,191,255,${0.08 + (i % 3) * 0.04})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let x = (i * 149) % W;
        ctx.ellipse(x, 470 + i * 6, 25 + (i % 4) * 10, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      hillLayer(505, stage === 2 ? "#4f305d" : "#392956", 160, 5);
      for (let i = 0; i < 18; i++) {
        const x = i * 83 - 50;
        pine(
          x,
          480 + (i % 4) * 18,
          150 + (i % 5) * 25,
          i % 2 ? "#241d40" : "#2d234b",
        );
      }
    }
    ctx.fillStyle = stage === 1 ? "#25244a" : "#231a3a";
    ctx.beginPath();
    ctx.moveTo(0, 580);
    ctx.quadraticCurveTo(340, 530, 650, 575);
    ctx.quadraticCurveTo(920, 595, 1200, 530);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();
    for (let i = 0; i < 45; i++) {
      const x = (i * 117 + 15) % W,
        y = 545 + ((i * 29) % 80);
      ctx.strokeStyle = i % 2 ? "#6b6581" : "#775783";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.quadraticCurveTo(x - 9, y + 15, x + 4, y);
      ctx.stroke();
      if (i % 3 === 0)
        blossom(
          x + 4,
          y,
          5 + (i % 3),
          ["#ba79d6", "#dba5e8", "#fcdbfb"][i % 3],
        );
    }
    if (stage === 2) {
      for (let i = 0; i < 8; i++)
        blossom(120 + i * 155, 540 + (i % 3) * 24, 13, "#c28cdc");
    }
    for (const p of floaters) {
      const fy = (p.y - worldTime * p.spd + H * 10) % H;
      const alpha = 0.35 + 0.4 * Math.sin(worldTime * 2 + p.phase) ** 2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = stage === 1 ? "#d8f5ff" : "#efc1ff";
      ctx.shadowColor = "#e4b6ff";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(worldTime + p.phase) * 9, fy, p.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  function drawHeart(x, y, size, fill) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 50, size / 50);
    ctx.beginPath();
    ctx.moveTo(0, 39);
    ctx.bezierCurveTo(-72, -5, -45, -48, 0, -25);
    ctx.bezierCurveTo(45, -48, 72, -5, 0, 39);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }
  function drawTarget() {
    if (!target) return;
    const { x, y, radius: r } = target;
    ctx.save();
    ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 115);
    glow.addColorStop(0, "#f0b3ff9c");
    glow.addColorStop(0.55, "#d29dff2d");
    glow.addColorStop(1, "#f0b3ff00");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 115, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(Math.sin(worldTime * 1.3) * 0.11);
    for (let k = 3; k >= 0; k--) {
      ctx.strokeStyle = ["#b778d099", "#ffd7f8", "#9d59c8", "#ffffffa0"][3 - k];
      ctx.lineWidth = k === 0 ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 5 + k * 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawHeart(0, 0, r * 0.91, "#cc76e1");
    drawHeart(-6, -7, r * 0.38, "#ffdeff");
    ctx.fillStyle = "#fff4ff";
    ctx.font = "22px serif";
    ctx.fillText("✦", 22, -30);
    ctx.restore();
  }
  function bowDrawing() {
    ctx.save();
    ctx.translate(bow.x, bow.y);
    const angle = mode === "playing" ? aimAngle() : -0.13;
    ctx.rotate(clamp(angle, -1.2, 0.7));
    // Dibujar el cuerpo del arco
    ctx.strokeStyle = "#9b5cbd";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(10, -80);
    ctx.quadraticCurveTo(70, 0, 10, 80);
    ctx.stroke();

    // Dibujar la cuerda
    ctx.strokeStyle = "#f0c1ec";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(10, -80);
    ctx.lineTo(charging ? -30 - charge * 19 : -8, 0);
    ctx.lineTo(10, 80);
    ctx.stroke();
 /*    ctx.strokeStyle = "#e7b575";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(45, 0);
    ctx.stroke();
    ctx.fillStyle = "#e9b5fa";
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.lineTo(29, -9);
    ctx.lineTo(29, 9);
    ctx.fill();
    ctx.fillStyle = "#e2bbd9";
    ctx.fillRect(-30, -5, 16, 10);
    ctx.restore();
    ctx.fillStyle = "#f6d7ff";
    ctx.font = "35px serif";
    ctx.fillText("✧", bow.x - 70, bow.y - 125); */
    // Dibujar la flecha únicamente mientras se tensa el arco
if (charging) {
    // Cuerpo de la flecha
    ctx.strokeStyle = '#e7b575';
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(45, 0);
    ctx.stroke();

    // Punta de la flecha
    ctx.fillStyle = '#e9b5fa';
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.lineTo(29, -9);
    ctx.lineTo(29, 9);
    ctx.fill();

    // Parte trasera de la flecha
    ctx.fillStyle = '#e2bbd9';
    ctx.fillRect(-30, -5, 16, 10);
}
    if (charging) {
      ctx.fillStyle = "#130d28cc";
      ctx.fillRect(bow.x - 47, bow.y + 104, 122, 12);
      ctx.fillStyle = "#e8b0ff";
      ctx.fillRect(bow.x - 45, bow.y + 106, 118 * charge, 8);
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#f5daff";
      ctx.fillText("POTENCIA", bow.x - 22, bow.y + 136);
    }
  }
  function arcGuide() {
    if (!charging) return;
    const angle = clamp(aimAngle(), -1.25, 0.78),
      speed =
        1120 *
        clamp(0.68 + ((performance.now() - chargeStart) / 1000) * 0.5, 0.68, 1);
    ctx.fillStyle = "#efd6ff99";
    for (let t = 0.13; t < 1.55; t += 0.11) {
      const x = bow.x + 40 + Math.cos(angle) * speed * t,
        y = bow.y + Math.sin(angle) * speed * t + 215 * t * t;
      if (x > W || y > H || y < 0) break;
      ctx.globalAlpha = 0.75 - t * 0.35;
      ctx.beginPath();
      ctx.arc(x, y, 3.7 - t * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawArrows() {
    for (const a of arrows) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      ctx.strokeStyle = "#f7d6ad";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.fillStyle = "#fff4eb";
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(0, -7);
      ctx.lineTo(0, 7);
      ctx.fill();
      ctx.fillStyle = "#d7a1f8";
      ctx.beginPath();
      ctx.moveTo(-50, 0);
      ctx.lineTo(-61, -8);
      ctx.lineTo(-43, -5);
      ctx.lineTo(-61, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  function drawSparks() {
    for (const p of sparks) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  function frame(ts) {
    const dt = Math.min((ts - last) / 1000 || 0, 0.035);
    last = ts;
    worldTime += dt;
    if (mode === "playing") {
      remaining -= dt;
      target.t += dt;
      target.y =
        target.baseY + Math.sin(target.t * target.speed) * target.amplitude;
      target.x = clamp(
        target.x + Math.sin(target.t * 0.6 + target.phase) * dt * 25,
        740,
        1070,
      );
      if (charging)
        charge = clamp(
          0.68 + ((performance.now() - chargeStart) / 1000) * 0.5,
          0.68,
          1,
        );
      for (let i = arrows.length - 1; i >= 0; i--) {
        let a = arrows[i];
        const px = a.x,
          py = a.y;
        a.life += dt;
        a.x += a.vx * dt;
        a.vy += 430 * dt;
        a.y += a.vy * dt;
        a.rotation = Math.atan2(a.vy, a.vx);
        const dx = a.x - px,
          dy = a.y - py,
          len2 = dx * dx + dy * dy,
          t = clamp(
            ((target.x - px) * dx + (target.y - py) * dy) / (len2 || 1),
            0,
            1,
          ),
          cx = px + dx * t,
          cy = py + dy * t;
        if (Math.hypot(cx - target.x, cy - target.y) < target.radius * 0.85) {
          arrows.splice(i, 1);
          hit();
          break;
        }
        if (a.x > W + 70 || a.y > H + 70 || a.y < -100 || a.life > 2.3)
          arrows.splice(i, 1);
      }
      if (remaining <= 0) gameOver();
      updateHud();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      let p = sparks[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 170 * dt;
      p.life -= dt;
      if (p.life <= 0) sparks.splice(i, 1);
    }
    ctx.save();
    if (shake > 0) {
      ctx.translate(rand(-shake, shake), rand(-shake, shake));
      shake = Math.max(0, shake - dt * 36);
    }
    landscape();
    drawTarget();
    arcGuide();
    drawArrows();
    bowDrawing();
    drawSparks();
    ctx.restore();
    requestAnimationFrame(frame);
  }
  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = clamp(((e.clientX - r.left) * W) / r.width, 300, W - 25);
    pointer.y = clamp(((e.clientY - r.top) * H) / r.height, 20, H - 15);
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (mode !== "playing") return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    setPointer(e);
    charging = true;
    chargeStart = performance.now();
    charge = 0.68;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (mode !== "playing") return;
    if (e.pointerType === "mouse" || charging) setPointer(e);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (charging) {
      setPointer(e);
      fire();
    }
  });
  canvas.addEventListener("pointercancel", () => (charging = false));
  canvas.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!charging) {
        charging = true;
        chargeStart = performance.now();
      } else fire();
    }
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      pointer.x +=
        e.key === "ArrowRight" ? 20 : e.key === "ArrowLeft" ? -20 : 0;
      pointer.y += e.key === "ArrowDown" ? 20 : e.key === "ArrowUp" ? -20 : 0;
    }
  });
  $("restart").onclick = () => {
    total = 0;
    start();
  };
  $("soundBtn").onclick = () => {
    soundOn = !soundOn;
    $("soundBtn").textContent = soundOn ? "♫" : "♪";
    $("soundBtn").setAttribute(
      "aria-label",
      soundOn ? "Desactivar sonido" : "Activar sonido",
    );
    playTone(500, 0.15);
  };
  $("rewardClose").onclick = () => {
    $("reward").classList.remove("show");
    $("reward").setAttribute("aria-hidden", "true");
  };
  $("replay").onclick = () => {
    $("reward").classList.remove("show");
    $("reward").setAttribute("aria-hidden", "true");
    total = 0;
    start();
  };
  $("saveTicket").onclick = () => window.print();
  start();
  requestAnimationFrame(frame);
})();
