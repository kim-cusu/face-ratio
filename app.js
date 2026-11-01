// 두개골 원은 고정입니다. 인상을 가르는 값은 턱과 눈의 위치입니다.
// 슬라이더 숫자는 모두 0~100이고, 화면 좌표는 BOX를 기준으로 계산합니다.

const BOX = { cx: 200, cy: 156, R: 104 };
const VIEW = "16 4 368 430";
const MODEL = {
  eyeT0: 0.34,
  eyeT1: 0.66,
  jawDrop0: 0.18,
  jawDrop1: 1.05,
};
const STORE_KEY = "face-ratio-studio-v6";

const SLIDER_KEYS = [
  "jawLength",
  "jawWidth",
  "jawCorner",
  "chinWidth",
  "cheekSoft",
  "eyeLevel",
  "eyeSize",
  "eyeGap",
  "eyeTilt",
  "eyeOpen",
  "browHeight",
  "browTilt",
  "noseLength",
  "noseWidth",
  "mouthWidth",
  "mouthPos",
  "smile",
];

const GROUPS = [
  {
    title: "턱선",
    hint: "원 아래에서 인상이 갈립니다. 원은 움직이지 않습니다.",
    sliders: [
      { key: "jawLength", label: "턱 길이", min: "짧음", max: "김" },
      { key: "jawWidth", label: "턱 너비", min: "좁음", max: "넓음" },
      { key: "jawCorner", label: "턱각 높이", min: "아래", max: "위" },
      { key: "chinWidth", label: "턱끝 너비", min: "뾰족", max: "각짐" },
      { key: "cheekSoft", label: "볼 둥글기", min: "각짐", max: "둥글" },
    ],
  },
  {
    title: "눈",
    hint: "눈 사이 1.0눈이면 눈 하나 간격입니다. 어릴수록 눈이 크고 아래에 있습니다.",
    sliders: [
      { key: "eyeLevel", label: "눈 높이", min: "위", max: "아래" },
      { key: "eyeSize", label: "눈 크기", min: "작음", max: "큼" },
      { key: "eyeGap", label: "눈 간격", min: "좁음", max: "넓음" },
      { key: "eyeTilt", label: "눈꼬리", min: "내림", max: "올림" },
      { key: "eyeOpen", label: "눈 세로", min: "가늘", max: "둥글" },
    ],
  },
  {
    title: "눈썹 · 코 · 입",
    hint: "눈과 턱 사이에 놓입니다. 눈을 옮기면 함께 따라옵니다.",
    sliders: [
      { key: "browHeight", label: "눈썹 높이", min: "가까움", max: "멀음" },
      { key: "browTilt", label: "눈썹 각도", min: "처짐", max: "치켜" },
      { key: "noseLength", label: "코 길이", min: "짧음", max: "김" },
      { key: "noseWidth", label: "코 너비", min: "좁음", max: "넓음" },
      { key: "mouthWidth", label: "입 너비", min: "좁음", max: "넓음" },
      { key: "mouthPos", label: "입 위치", min: "위", max: "아래" },
      { key: "smile", label: "입꼬리", min: "내림", max: "올림" },
    ],
  },
];

const PRESETS = [
  {
    id: "child",
    name: "유아",
    iris: "#8a5a32",
    values: {
      jawLength: 40,
      jawWidth: 32,
      jawCorner: 42,
      chinWidth: 34,
      cheekSoft: 78,
      eyeLevel: 58,
      eyeSize: 68,
      eyeGap: 52,
      eyeTilt: 54,
      eyeOpen: 76,
      browHeight: 46,
      browTilt: 52,
      noseLength: 50,
      noseWidth: 40,
      mouthWidth: 52,
      mouthPos: 50,
      smile: 58,
    },
  },
  {
    id: "teen",
    name: "청소년",
    iris: "#3c6e9a",
    values: {
      jawLength: 58,
      jawWidth: 42,
      jawCorner: 48,
      chinWidth: 30,
      cheekSoft: 55,
      eyeLevel: 46,
      eyeSize: 58,
      eyeGap: 58,
      eyeTilt: 56,
      eyeOpen: 64,
      browHeight: 50,
      browTilt: 54,
      noseLength: 50,
      noseWidth: 44,
      mouthWidth: 48,
      mouthPos: 50,
      smile: 50,
    },
  },
  {
    id: "adult",
    name: "성인",
    iris: "#5c4030",
    values: {
      jawLength: 78,
      jawWidth: 54,
      jawCorner: 66,
      chinWidth: 42,
      cheekSoft: 32,
      eyeLevel: 36,
      eyeSize: 48,
      eyeGap: 60,
      eyeTilt: 48,
      eyeOpen: 48,
      browHeight: 42,
      browTilt: 44,
      noseLength: 50,
      noseWidth: 48,
      mouthWidth: 46,
      mouthPos: 50,
      smile: 46,
    },
  },
  {
    id: "chibi",
    name: "치비",
    iris: "#7b52c8",
    values: {
      jawLength: 28,
      jawWidth: 26,
      jawCorner: 36,
      chinWidth: 38,
      cheekSoft: 88,
      eyeLevel: 66,
      eyeSize: 78,
      eyeGap: 46,
      eyeTilt: 56,
      eyeOpen: 84,
      browHeight: 40,
      browTilt: 52,
      noseLength: 50,
      noseWidth: 34,
      mouthWidth: 50,
      mouthPos: 50,
      smile: 64,
    },
  },
];

const state = {
  current: null,
  reference: null,
  compare: false,
  guides: true,
  overlay: true,
  presetId: "teen",
  customs: [],
  base: null,
};

let drag = null;

function clampInt(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function fmt(n) {
  return Number(n).toFixed(1);
}

function cloneFace(face) {
  return {
    iris: face.iris,
    ...Object.fromEntries(SLIDER_KEYS.map((key) => [key, face[key]])),
  };
}

function allPresets() {
  return [...PRESETS, ...state.customs];
}

function presetById(id) {
  return allPresets().find((preset) => preset.id === id);
}

function matchPreset(face) {
  const found = allPresets().find((preset) =>
    SLIDER_KEYS.every((key) => preset.values[key] === face[key])
  );
  return found ? found.id : "custom";
}

function objectParticle(word) {
  const code = word.charCodeAt(word.length - 1);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return hasBatchim ? "을" : "를";
}

function rememberBase(preset) {
  state.base = {
    id: preset.id,
    name: preset.name,
    face: faceFromPreset(preset),
  };
}

function faceFromPreset(preset) {
  return { iris: preset.iris, ...preset.values };
}

function sanitizeFace(raw) {
  const base = faceFromPreset(PRESETS[0]);
  if (!raw || typeof raw !== "object") return base;
  for (const key of SLIDER_KEYS) {
    const value = Number(raw[key]);
    if (Number.isFinite(value)) base[key] = clampInt(value);
  }
  if (typeof raw.iris === "string" && /^#[0-9a-fA-F]{6}$/.test(raw.iris)) {
    base.iris = raw.iris;
  }
  return base;
}

function polar(angle) {
  return {
    x: BOX.cx + BOX.R * Math.cos(angle),
    y: BOX.cy + BOX.R * Math.sin(angle),
  };
}

function eyeYFromLevel(level) {
  const t = MODEL.eyeT0 + (MODEL.eyeT1 - MODEL.eyeT0) * (level / 100);
  return BOX.cy - BOX.R + t * 2 * BOX.R;
}

function levelFromEyeY(y, jawLength) {
  const chinY = chinYFrom(jawLength);
  const top = BOX.cy - BOX.R;
  const faceH = Math.max(BOX.R * 1.7, chinY - top);
  const third = faceH / 3;
  return clampInt((((y - top) / third - 0.78) / 0.6) * 100);
}

function chinYFrom(level) {
  const drop = BOX.R * (MODEL.jawDrop0 + (MODEL.jawDrop1 - MODEL.jawDrop0) * (level / 100));
  return BOX.cy + BOX.R + drop;
}

function levelFromChinY(y) {
  const drop = (y - (BOX.cy + BOX.R)) / BOX.R;
  return clampInt(((drop - MODEL.jawDrop0) / (MODEL.jawDrop1 - MODEL.jawDrop0)) * 100);
}

function attachHalf(cheekSoft) {
  const beta = lerp(0.42, 0.62, cheekSoft / 100);
  return BOX.R * Math.cos(beta);
}

function halfJawFrom(level) {
  return BOX.R * lerp(0.56, 0.9, level / 100);
}

function levelFromHalfJaw(half) {
  const plane = BOX.R * 0.78;
  return clampInt(((half / plane - 0.7) / 0.28) * 100);
}

function layout(face) {
  const { cx, cy, R } = BOX;
  const soft = face.cheekSoft / 100;
  const beta = lerp(0.48, 0.7, soft);
  const leftAngle = Math.PI - beta;
  const rightAngle = Math.PI * 2 + beta;
  const leftA = polar(leftAngle);
  const rightA = polar(beta);
  const chinY = chinYFrom(face.jawLength);
  const plane = R * 0.78;
  const halfJaw = Math.min(plane * lerp(0.7, 0.98, face.jawWidth / 100), rightA.x - cx);
  const cornerY = lerp(chinY - R * 0.08, rightA.y + (chinY - rightA.y) * 0.28, face.jawCorner / 100);
  const leftC = { x: cx - halfJaw, y: Math.max(rightA.y + 8, Math.min(chinY - 12, cornerY)) };
  const rightC = { x: cx + halfJaw, y: leftC.y };
  let halfChin = halfJaw * lerp(0.34, 0.62, face.chinWidth / 100);
  const chinL = { x: cx - halfChin, y: chinY };
  const chinR = { x: cx + halfChin, y: chinY };

  const mirror = (point) => ({ x: cx * 2 - point.x, y: point.y });
  const arc = [];
  const steps = 40;
  for (let i = 0; i <= steps; i += 1) {
    const angle = leftAngle + ((rightAngle - leftAngle) * i) / steps;
    arc.push(polar(angle));
  }

  const move = (point) => `M ${fmt(point.x)} ${fmt(point.y)}`;
  const line = (point) => `L ${fmt(point.x)} ${fmt(point.y)}`;
  let jawD = `${move(rightA)} L ${fmt(rightC.x)} ${fmt(rightC.y)} L ${fmt(chinR.x)} ${fmt(chinR.y)}`;
  jawD += ` Q ${fmt(cx)} ${fmt(chinY + 3)} ${fmt(chinL.x)} ${fmt(chinL.y)}`;
  jawD += ` L ${fmt(leftC.x)} ${fmt(leftC.y)} L ${fmt(leftA.x)} ${fmt(leftA.y)}`;

  let faceD = move(arc[0]);
  for (let i = 1; i < arc.length; i += 1) faceD += line(arc[i]);
  faceD += ` L ${fmt(rightC.x)} ${fmt(rightC.y)} L ${fmt(chinR.x)} ${fmt(chinR.y)}`;
  faceD += ` Q ${fmt(cx)} ${fmt(chinY + 3)} ${fmt(chinL.x)} ${fmt(chinL.y)}`;
  faceD += ` L ${fmt(leftC.x)} ${fmt(leftC.y)} Z`;

  const eyeY = cy + R * lerp(-0.22, 0.28, face.eyeLevel / 100);
  const unit = (plane * 2) / 5;
  const eyeW = unit * lerp(0.88, 1.22, face.eyeSize / 100);
  const eyeH = eyeW * lerp(0.48, 0.74, face.eyeOpen / 100);
  const gap = unit * lerp(0.75, 1.3, face.eyeGap / 100);
  let eyeDx = gap / 2 + eyeW / 2;
  if (eyeDx + eyeW / 2 > plane) eyeDx = plane - eyeW / 2;
  const innerGap = eyeDx * 2 - eyeW;
  const tiltPx = ((face.eyeTilt - 50) / 50) * eyeH * 0.28;

  const lower = Math.max(24, chinY - eyeY);
  const noseT = 0.5 + (face.noseLength - 50) / 280;
  const noseY = eyeY + lower * Math.min(0.62, Math.max(0.38, noseT));
  const mouthT = 1 / 3 + (face.mouthPos - 50) / 280;
  const mouthY = noseY + (chinY - noseY) * Math.min(0.55, Math.max(0.18, mouthT));
  const rawMouthW = unit * lerp(1.15, 1.7, face.mouthWidth / 100);
  const halfAt = (y) => {
    if (y <= rightA.y) {
      const dy = y - cy;
      return Math.sqrt(Math.max(0, R * R - dy * dy));
    }
    if (y <= cornerY) {
      const t = (y - rightA.y) / Math.max(1, cornerY - rightA.y);
      return lerp(rightA.x - cx, halfJaw, t);
    }
    const t = (y - cornerY) / Math.max(1, chinY - cornerY);
    return lerp(halfJaw, halfChin, Math.min(1, t));
  };
  const mouthW = Math.min(rawMouthW, Math.max(eyeW * 0.7, halfAt(mouthY) * 0.82));
  const noseW = eyeW * lerp(0.48, 0.85, face.noseWidth / 100);
  const smile = (face.smile - 50) / 50;
  const browY = eyeY - eyeH * 0.55 - lerp(eyeH * 0.15, eyeH * 0.55, face.browHeight / 100);

  return {
    cx,
    cy,
    R,
    leftA,
    rightA,
    leftC,
    rightC,
    chinL,
    chinR,
    chinY,
    cornerY,
    halfJaw,
    faceD,
    jawD,
    eyeY,
    eyeW,
    eyeH,
    eyeDx,
    tiltPx,
    noseY,
    noseW,
    mouthY,
    mouthW,
    smile,
    browY,
    stats: {
      eyeFromMid: Math.round(((eyeY - cy) / (2 * R)) * 100),
      jawRad: (chinY - (cy + R)) / R,
      eyeGapRatio: innerGap / eyeW,
      jawToCircle: halfJaw / R,
      above: eyeY - (cy - R),
      below: Math.max(1, chinY - eyeY),
    },
  };
}

function describe(face) {
  let chin = "보통 길이 턱";
  if (face.jawLength < 14) chin = "아주 짧은 턱";
  else if (face.jawLength < 30) chin = "짧은 턱";
  else if (face.jawLength >= 52) chin = "긴 턱";

  let eyes = "눈은 가운데";
  if (face.eyeLevel < 40) eyes = "눈은 가운데보다 위";
  else if (face.eyeLevel > 58) eyes = "눈은 가운데보다 아래";

  let shape = "";
  if (face.jawWidth > 80 && face.chinWidth > 40) shape = "각진 턱";
  else if (face.jawWidth < 52 && face.chinWidth < 18) shape = "좁고 뾰족한 턱";
  else if (face.cheekSoft > 75) shape = "둥근 볼";

  return [chin, eyes, shape].filter(Boolean).join(" · ");
}

function presetName(face) {
  const id = matchPreset(face);
  if (id === "custom") return "직접 조절";
  return presetById(id).name;
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) el.setAttribute(key, String(value));
  }
  return el;
}

function addTitle(el, text) {
  const title = svgEl("title");
  title.textContent = text;
  el.append(title);
}

function eyeGeometry(ex, ey, side, w, h, tilt) {
  const x = (local) => ex + side * local;
  const y = (local) => ey + local;
  const ix = -w / 2;
  const iy = h * 0.12 + tilt * 0.18;
  const ox = w / 2;
  const oy = -tilt;
  const upper = `M ${fmt(x(ix))} ${fmt(y(iy))} C ${fmt(x(-w * 0.05))} ${fmt(y(-h * 0.98))}, ${fmt(x(w * 0.22))} ${fmt(y(-h * 0.62 - tilt * 0.2))}, ${fmt(x(ox))} ${fmt(y(oy))}`;
  const outline = `${upper} C ${fmt(x(w * 0.08))} ${fmt(y(h * 0.42))}, ${fmt(x(-w * 0.22))} ${fmt(y(h * 0.3))}, ${fmt(x(ix))} ${fmt(y(iy))} Z`;
  return { outline, upper, x, y, ix, ox };
}

function drawEye(parent, defs, spec) {
  const { ex, ey, side, w, h, tilt, iris, uid, ghost, lashes } = spec;
  const geo = eyeGeometry(ex, ey, side, w, h, tilt);
  if (ghost) {
    const path = svgEl("path", {
      d: geo.outline,
      fill: "none",
      stroke: "#315fbf",
      "stroke-width": 1.6,
      "stroke-dasharray": "4 3",
      "stroke-linejoin": "round",
    });
    parent.append(path);
    return;
  }

  const clipId = `eye-${uid}-${side > 0 ? "r" : "l"}`;
  const clip = svgEl("clipPath", { id: clipId });
  clip.append(svgEl("path", { d: geo.outline }));
  defs.append(clip);

  parent.append(
    svgEl("path", {
      d: geo.outline,
      fill: "#fffaf7",
      stroke: "#2a221c",
      "stroke-width": 1.7,
      "stroke-linejoin": "round",
    })
  );

  const irisG = svgEl("g", { "clip-path": `url(#${clipId})` });
  const irisR = Math.min(h * 0.58, w * 0.38);
  const irisX = geo.x(w * 0.02);
  const irisY = geo.y(h * 0.04);
  irisG.append(
    svgEl("circle", { cx: irisX, cy: irisY, r: irisR, fill: iris }),
    svgEl("circle", { cx: irisX, cy: irisY + irisR * 0.08, r: irisR * 0.58, fill: "#1a1420" }),
    svgEl("circle", {
      cx: irisX - side * irisR * 0.28,
      cy: irisY - irisR * 0.32,
      r: irisR * 0.28,
      fill: "#fff",
    }),
    svgEl("circle", {
      cx: irisX + side * irisR * 0.18,
      cy: irisY - irisR * 0.02,
      r: irisR * 0.1,
      fill: "#fff",
      opacity: 0.9,
    })
  );
  parent.append(irisG);
  parent.append(
    svgEl("path", {
      d: geo.upper,
      fill: "none",
      stroke: "#2a221c",
      "stroke-width": Math.max(2.2, h * 0.16),
      "stroke-linecap": "round",
    })
  );

  if (lashes && w > 46) {
    for (let i = 0; i < 3; i += 1) {
      const base = w * (0.22 + i * 0.12);
      const lift = h * (0.18 + i * 0.12) + tilt * 0.25;
      parent.append(
        svgEl("line", {
          x1: geo.x(base),
          y1: geo.y(-h * 0.18 - i * 2),
          x2: geo.x(base + w * 0.08),
          y2: geo.y(-h * 0.18 - lift),
          stroke: "#2a221c",
          "stroke-width": 1.4,
          "stroke-linecap": "round",
        })
      );
    }
  }
}

function drawBrow(parent, face, geo, ex, side) {
  const tilt = (face.browTilt - 50) / 50;
  const innerX = ex - side * geo.eyeW * 0.46;
  const outerX = ex + side * geo.eyeW * 0.58;
  const innerY = geo.browY + tilt * 5;
  const outerY = geo.browY - tilt * geo.eyeH * 0.35;
  const midX = (innerX + outerX) / 2;
  const midY = Math.min(innerY, outerY) - 2;
  parent.append(
    svgEl("path", {
      d: `M ${fmt(innerX)} ${fmt(innerY)} Q ${fmt(midX)} ${fmt(midY)}, ${fmt(outerX)} ${fmt(outerY)}`,
      fill: "none",
      stroke: "#2a221c",
      "stroke-width": lerp(5.4, 2.3, face.eyeSize / 100),
      "stroke-linecap": "round",
    })
  );
}

function drawFace(container, face, opts) {
  const geo = layout(face);
  const svg = svgEl("svg", {
    viewBox: VIEW,
    role: "img",
    "aria-label": describe(face),
    "data-role": opts.role || "",
  });
  const defs = svgEl("defs");
  svg.append(defs);

  const neckBottom = Math.min(geo.chinY + 46, 428);
  const neckW = BOX.R * 0.2;
  svg.append(
    svgEl("path", {
      d: `M ${fmt(BOX.cx - neckW)} ${fmt(geo.chinY - 6)}
          L ${fmt(BOX.cx - neckW * 0.86)} ${fmt(neckBottom)}
          L ${fmt(BOX.cx + neckW * 0.86)} ${fmt(neckBottom)}
          L ${fmt(BOX.cx + neckW)} ${fmt(geo.chinY - 6)} Z`,
      fill: "#efc0ab",
    })
  );

  svg.append(
    svgEl("path", {
      d: geo.faceD,
      fill: "#f6d3c2",
      stroke: "#2a221c",
      "stroke-width": 2.1,
      "stroke-linejoin": "round",
    })
  );

  for (const side of [-1, 1]) {
    const ex = geo.cx + side * geo.eyeDx;
    drawBrow(svg, face, geo, ex, side);
    drawEye(svg, defs, {
      ex,
      ey: geo.eyeY,
      side,
      w: geo.eyeW,
      h: geo.eyeH,
      tilt: geo.tiltPx,
      iris: face.iris,
      uid: opts.uid,
      lashes: !opts.compact,
    });
  }

  const bridge = Math.max(12, (geo.noseY - geo.eyeY) * 0.42);
  const nose = svgEl("path", {
    d: `M ${fmt(geo.cx)} ${fmt(geo.noseY - bridge)}
        L ${fmt(geo.cx)} ${fmt(geo.noseY - geo.noseW * 0.1)}
        M ${fmt(geo.cx - geo.noseW)} ${fmt(geo.noseY)}
        Q ${fmt(geo.cx)} ${fmt(geo.noseY + geo.noseW * 0.55)}, ${fmt(geo.cx + geo.noseW)} ${fmt(geo.noseY)}`,
    fill: "none",
    stroke: "#2a221c",
    "stroke-width": 1.8,
    "stroke-linecap": "round",
  });
  svg.append(nose);

  svg.append(
    svgEl("path", {
      d: `M ${fmt(geo.cx - geo.mouthW)} ${fmt(geo.mouthY)} Q ${fmt(geo.cx)} ${fmt(geo.mouthY + geo.smile * 10)}, ${fmt(geo.cx + geo.mouthW)} ${fmt(geo.mouthY)}`,
      fill: "none",
      stroke: "#2a221c",
      "stroke-width": 1.8,
      "stroke-linecap": "round",
    })
  );

  if (opts.guides) {
    svg.append(
      svgEl("circle", {
        cx: geo.cx,
        cy: geo.cy,
        r: geo.R,
        fill: "none",
        stroke: "#2f7d52",
        "stroke-width": opts.compact ? 2.4 : 1.8,
      }),
      svgEl("line", {
        x1: geo.cx,
        y1: geo.cy - geo.R - 16,
        x2: geo.cx,
        y2: geo.chinY + 18,
        stroke: "#e23d5b",
        "stroke-width": 1.2,
      }),
      svgEl("line", {
        x1: geo.cx - geo.R,
        y1: geo.cy,
        x2: geo.cx + geo.R,
        y2: geo.cy,
        stroke: "#e23d5b",
        "stroke-width": 1.2,
      }),
      svgEl("line", {
        x1: geo.cx - geo.R - 8,
        y1: geo.eyeY,
        x2: geo.cx + geo.R + 8,
        y2: geo.eyeY,
        stroke: "#e23d5b",
        "stroke-width": 1.4,
      }),
      svgEl("path", {
        d: geo.jawD,
        fill: "none",
        stroke: "#d4537e",
        "stroke-width": opts.compact ? 2.6 : 2,
        "stroke-linejoin": "round",
        "stroke-linecap": "round",
      })
    );

    if (!opts.compact) {
      const label = (text, x, y, color) => {
        const node = svgEl("text", {
          x,
          y,
          fill: color,
          "font-size": 12,
          "font-family": "IBM Plex Sans KR, Malgun Gothic, sans-serif",
        });
        node.textContent = text;
        svg.append(node);
      };
      label("같은 원", geo.cx - 22, geo.cy - geo.R - 8, "#2f7d52");
      label("눈선", geo.cx + geo.R + 28, geo.eyeY + 4, "#e23d5b");
      svg.append(
        svgEl("line", {
          x1: geo.cx - geo.R * 0.55,
          y1: geo.noseY,
          x2: geo.cx + geo.R * 0.55,
          y2: geo.noseY,
          stroke: "#315fbf",
          "stroke-width": 1.2,
        }),
        svgEl("line", {
          x1: geo.cx - geo.R * 0.4,
          y1: geo.mouthY,
          x2: geo.cx + geo.R * 0.4,
          y2: geo.mouthY,
          stroke: "#315fbf",
          "stroke-width": 1.2,
        })
      );
      label("코", geo.cx + geo.R * 0.58, geo.noseY + 4, "#315fbf");
      label("입", geo.cx + geo.R * 0.44, geo.mouthY + 4, "#315fbf");
      const bracketX = geo.cx - geo.R - 28;
      const topY = geo.cy - geo.R;
      svg.append(
        svgEl("line", { x1: bracketX, y1: topY, x2: bracketX, y2: geo.eyeY, stroke: "#e23d5b", "stroke-width": 1.2 }),
        svgEl("line", { x1: bracketX - 4, y1: topY, x2: bracketX + 4, y2: topY, stroke: "#e23d5b", "stroke-width": 1.2 }),
        svgEl("line", { x1: bracketX - 4, y1: geo.eyeY, x2: bracketX + 4, y2: geo.eyeY, stroke: "#e23d5b", "stroke-width": 1.2 }),
        svgEl("line", { x1: bracketX, y1: geo.eyeY, x2: bracketX, y2: geo.chinY, stroke: "#2f7d52", "stroke-width": 1.2 }),
        svgEl("line", { x1: bracketX - 4, y1: geo.chinY, x2: bracketX + 4, y2: geo.chinY, stroke: "#2f7d52", "stroke-width": 1.2 })
      );
      label("위", bracketX - 16, (topY + geo.eyeY) / 2 + 4, "#e23d5b");
      label("아래", bracketX - 28, (geo.eyeY + geo.chinY) / 2 + 4, "#2f7d52");
    }
  }

  if (opts.ghost) {
    const ghost = layout(opts.ghost);
    svg.append(
      svgEl("path", {
        d: ghost.jawD,
        fill: "none",
        stroke: "#315fbf",
        "stroke-width": 1.7,
        "stroke-dasharray": "5 4",
        "stroke-linejoin": "round",
      }),
      svgEl("line", {
        x1: ghost.cx - ghost.R * 0.7,
        y1: ghost.eyeY,
        x2: ghost.cx + ghost.R * 0.7,
        y2: ghost.eyeY,
        stroke: "#315fbf",
        "stroke-width": 1.4,
        "stroke-dasharray": "5 4",
      })
    );
    for (const side of [-1, 1]) {
      drawEye(svg, defs, {
        ex: ghost.cx + side * ghost.eyeDx,
        ey: ghost.eyeY,
        side,
        w: ghost.eyeW,
        h: ghost.eyeH,
        tilt: ghost.tiltPx,
        ghost: true,
        uid: `${opts.uid}-ghost`,
      });
    }
  }

  if (opts.handles) {
    const eyeHit = svgEl("line", {
      x1: geo.cx - geo.R,
      y1: geo.eyeY,
      x2: geo.cx + geo.R,
      y2: geo.eyeY,
      stroke: "transparent",
      "stroke-width": 16,
      "data-handle": "eye",
    });
    addTitle(eyeHit, "끌어서 눈 높이를 조절합니다");
    svg.append(eyeHit);
    addHandle(svg, geo.cx + geo.R + 14, geo.eyeY, "eye", "눈 높이");
    addHandle(svg, geo.cx, geo.chinY, "chin", "턱 길이");
    addHandle(svg, geo.leftC.x, geo.leftC.y, "jaw", "턱 너비");
    addHandle(svg, geo.rightC.x, geo.rightC.y, "jaw", "턱 너비");
  }

  container.replaceChildren(svg);
  return geo;
}

function addHandle(parent, x, y, type, label) {
  const hit = svgEl("circle", {
    cx: x,
    cy: y,
    r: 14,
    fill: "transparent",
    "data-handle": type,
  });
  addTitle(hit, `${label} 끌어서 조절`);
  const ring = svgEl("circle", {
    cx: x,
    cy: y,
    r: 6.5,
    fill: "#f7f3ea",
    stroke: "#241e18",
    "stroke-width": 2,
    "pointer-events": "none",
  });
  parent.append(hit, ring);
}

function statItems(geo) {
  const eye = geo.stats.eyeFromMid;
  let eyeText = "가운데";
  if (eye >= 3) eyeText = `${eye}% 아래`;
  else if (eye <= -3) eyeText = `${Math.abs(eye)}% 위`;
  const gap = geo.stats.eyeGapRatio;
  const gapText = gap < 0.08 ? "거의 붙음" : `${gap.toFixed(1)}눈`;
  const lower = geo.stats.below / geo.stats.above;
  return [
    ["눈 위치", eyeText],
    ["눈 사이", gapText],
    ["눈 기준", `위 1 : 아래 ${lower.toFixed(2)}`],
    ["턱 길이", `반지름 ${geo.stats.jawRad.toFixed(2)}배`],
  ];
}

function faceCard(face, opts) {
  const card = document.createElement("article");
  card.className = `face-card${opts.cardClass ? ` ${opts.cardClass}` : ""}`;
  const head = document.createElement("div");
  head.className = "face-kicker";
  const kicker = document.createElement("span");
  kicker.textContent = opts.kicker;
  const name = document.createElement("strong");
  name.textContent = presetName(face);
  head.append(kicker, name);

  const wrap = document.createElement("div");
  wrap.className = "svg-wrap";
  const geo = drawFace(wrap, face, opts);

  const caption = document.createElement("p");
  caption.className = "caption";
  caption.textContent = describe(face);

  const list = document.createElement("ul");
  list.className = "metrics";
  for (const [label, value] of statItems(geo)) {
    const item = document.createElement("li");
    const strong = document.createElement("b");
    strong.textContent = value;
    item.append(label, strong);
    list.append(item);
  }

  card.append(head, wrap, caption, list);
  return card;
}

function renderFaces() {
  const host = document.getElementById("faces");
  host.className = state.compare ? "faces compare" : "faces";
  host.replaceChildren();
  if (state.compare && state.reference) {
    host.append(
      faceCard(state.reference, {
        uid: "ref",
        role: "ref",
        kicker: "기준",
        cardClass: "is-ref",
        guides: state.guides,
        handles: false,
      })
    );
  }
  host.append(
    faceCard(state.current, {
      uid: "live",
      role: "live",
      kicker: state.compare ? "조절 중" : "지금 얼굴",
      cardClass: state.compare ? "is-live" : "",
      guides: state.guides,
      handles: state.guides,
      ghost: state.compare && state.overlay ? state.reference : null,
    })
  );
}

function miniButton(face, opts) {
  const card = document.createElement("div");
  card.className = `strip-card${opts.active ? " is-active" : ""}`;
  const open = document.createElement(opts.presetId ? "button" : "div");
  open.className = "strip-open";
  if (opts.presetId) {
    open.type = "button";
    open.dataset.preset = opts.presetId;
  }
  const wrap = document.createElement("div");
  drawFace(wrap, face, { uid: opts.uid, guides: true, compact: true });
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = opts.name;
  const note = document.createElement("span");
  note.className = "note";
  note.textContent = describe(face);
  open.append(wrap, name, note);
  const actions = document.createElement("div");
  actions.className = "card-actions";
  const pin = document.createElement("button");
  pin.type = "button";
  pin.className = "pin";
  pin.dataset.pin = opts.pin;
  pin.textContent = "기준";
  actions.append(pin);
  if (opts.deletable) {
    const del = document.createElement("button");
    del.type = "button";
    del.className = "pin";
    del.dataset.delete = opts.presetId;
    del.textContent = "삭제";
    actions.append(del);
  }
  card.append(open, actions);
  return card;
}

function renderStrip() {
  const host = document.getElementById("strip");
  host.replaceChildren();
  for (const preset of allPresets()) {
    host.append(
      miniButton(faceFromPreset(preset), {
        uid: `mini-${preset.id}`,
        name: preset.name,
        presetId: preset.id,
        pin: preset.id,
        deletable: preset.id.startsWith("mine-"),
        active: state.presetId === preset.id,
      })
    );
  }
  host.append(
    miniButton(state.current, {
      uid: "mini-now",
      name: "지금",
      pin: "current",
      active: state.presetId === "custom",
    })
  );
}

function renderChrome() {
  document.getElementById("toggle-guides").setAttribute("aria-pressed", String(state.guides));
  document.getElementById("toggle-compare").setAttribute("aria-pressed", String(state.compare));
  document.getElementById("toggle-overlay").setAttribute("aria-pressed", String(state.overlay));
  document.getElementById("stage-actions").hidden = !state.compare;
  document.getElementById("legend").hidden = !state.guides;

  const hint = document.getElementById("hint");
  hint.textContent = state.guides
    ? "눈선, 턱끝, 턱 모서리의 점을 끌어 바꿀 수 있습니다. 초록 원은 어떤 얼굴에서든 같습니다."
    : "가이드를 켜면 원, 눈선, 턱선을 같이 보며 조절할 수 있습니다.";

  const diff = document.getElementById("diff");
  diff.replaceChildren();
  if (!state.compare || !state.reference) {
    diff.hidden = true;
    return;
  }
  diff.hidden = false;
  const title = document.createElement("p");
  title.textContent = "기준과의 차이";
  diff.append(title);
  const rows = SLIDER_KEYS.map((key) => ({
    key,
    delta: state.current[key] - state.reference[key],
  }))
    .filter((row) => Math.abs(row.delta) >= 4)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);

  if (!rows.length) {
    const same = document.createElement("span");
    same.textContent = "아직 거의 같아요";
    diff.append(same);
    return;
  }

  const labels = Object.fromEntries(
    GROUPS.flatMap((group) => group.sliders).map((slider) => [slider.key, slider.label])
  );
  for (const row of rows) {
    const chip = document.createElement("span");
    if (row.key === "eyeLevel") {
      const dir = row.delta > 0 ? "아래" : "위";
      chip.textContent = `${labels[row.key]} ${Math.abs(row.delta)} ${dir}`;
    } else {
      const sign = row.delta > 0 ? "+" : "";
      chip.textContent = `${labels[row.key]} ${sign}${row.delta}`;
    }
    diff.append(chip);
  }
}

function paintRange(input) {
  const value = Number(input.value);
  input.style.setProperty("--track", `linear-gradient(90deg, #241e18 ${value}%, #ddd4c6 ${value}%)`);
}

function syncControls() {
  for (const input of document.querySelectorAll("[data-key]")) {
    input.value = state.current[input.dataset.key];
    paintRange(input);
    input.closest(".slider").querySelector("output").textContent = input.value;
  }
  for (const button of document.querySelectorAll("#preset-row button")) {
    button.classList.toggle("is-active", button.dataset.preset === state.presetId);
  }
}

function renderControls() {
  const presets = document.getElementById("preset-row");
  presets.replaceChildren();
  for (const preset of PRESETS) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.preset = preset.id;
    button.textContent = preset.name;
    presets.append(button);
  }

  const sliders = document.getElementById("sliders");
  sliders.replaceChildren();
  for (const group of GROUPS) {
    const section = document.createElement("section");
    section.className = "group";
    const title = document.createElement("h3");
    title.textContent = group.title;
    const hint = document.createElement("p");
    hint.className = "group-hint";
    hint.textContent = group.hint;
    section.append(title, hint);
    for (const slider of group.sliders) {
      const wrap = document.createElement("div");
      wrap.className = "slider";
      const top = document.createElement("div");
      top.className = "slider-top";
      const label = document.createElement("label");
      const id = `sl-${slider.key}`;
      label.htmlFor = id;
      label.textContent = slider.label;
      const output = document.createElement("output");
      output.htmlFor = id;
      output.textContent = state.current[slider.key];
      top.append(label, output);
      const input = document.createElement("input");
      input.id = id;
      input.type = "range";
      input.min = "0";
      input.max = "100";
      input.value = state.current[slider.key];
      input.dataset.key = slider.key;
      paintRange(input);
      const ends = document.createElement("div");
      ends.className = "ends";
      const min = document.createElement("span");
      min.textContent = slider.min;
      const max = document.createElement("span");
      max.textContent = slider.max;
      ends.append(min, max);
      wrap.append(top, input, ends);
      section.append(wrap);
    }
    sliders.append(section);
  }
}

function renderCustoms() {
  const host = document.getElementById("custom-row");
  host.replaceChildren();
  if (!state.customs.length) {
    const empty = document.createElement("p");
    empty.className = "group-hint";
    empty.textContent = "저장된 비율이 없습니다.";
    host.append(empty);
    return;
  }
  for (const preset of state.customs) {
    const wrap = document.createElement("div");
    wrap.className = "chip-wrap";
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.preset = preset.id;
    button.textContent = preset.name;
    button.classList.toggle("is-active", state.presetId === preset.id);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-chip";
    del.dataset.delete = preset.id;
    del.setAttribute("aria-label", `${preset.name} 삭제`);
    del.textContent = "×";
    wrap.append(button, del);
    host.append(wrap);
  }
}

function render({ save = true } = {}) {
  state.presetId = matchPreset(state.current);
  renderFaces();
  renderStrip();
  renderCustoms();
  renderChrome();
  syncControls();
  if (save) persist();
}

function applyPreset(id) {
  const preset = presetById(id);
  if (!preset) return;
  state.current = faceFromPreset(preset);
  rememberBase(preset);
  render();
}

function saveCustom(name) {
  const note = document.getElementById("copy-note");
  if (state.customs.length >= 8) {
    note.textContent = "나만의 비율은 8개까지 저장할 수 있습니다.";
    return;
  }
  const label = name.trim().slice(0, 16) || `나의 비율 ${state.customs.length + 1}`;
  const preset = {
    id: `mine-${Date.now()}`,
    name: label,
    iris: state.current.iris,
    values: Object.fromEntries(SLIDER_KEYS.map((key) => [key, state.current[key]])),
  };
  state.customs.push(preset);
  rememberBase(preset);
  document.getElementById("custom-name").value = "";
  note.textContent = `「${label}」${objectParticle(label)} 저장했습니다.`;
  render();
}

function deleteCustom(id) {
  state.customs = state.customs.filter((item) => item.id !== id);
  if (state.base?.id === id) {
    rememberBase(PRESETS.find((preset) => preset.id === "teen") || PRESETS[0]);
  }
  render();
}

function pinFace(face) {
  state.reference = cloneFace(face);
  state.compare = true;
  render();
}

function persist() {
  const data = {
    current: state.current,
    reference: state.reference,
    compare: state.compare,
    guides: state.guides,
    overlay: state.overlay,
    customs: state.customs,
    baseId: state.base?.id || "teen",
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function loadState() {
  const teen = PRESETS.find((preset) => preset.id === "teen") || PRESETS[0];
  state.current = faceFromPreset(teen);
  state.customs = [];
  rememberBase(teen);
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (!raw) return;
    state.customs = (Array.isArray(raw.customs) ? raw.customs : []).slice(0, 8).map((item, index) => {
      const face = sanitizeFace({ ...(item.values || {}), iris: item.iris });
      return {
        id: String(item.id || `mine-${index}`),
        name: String(item.name || "나만의 비율").slice(0, 16),
        iris: face.iris,
        values: Object.fromEntries(SLIDER_KEYS.map((key) => [key, face[key]])),
      };
    });
    state.current = sanitizeFace(raw.current);
    state.reference = raw.reference ? sanitizeFace(raw.reference) : null;
    state.compare = Boolean(raw.compare && state.reference);
    state.guides = raw.guides !== false;
    state.overlay = raw.overlay !== false;
    const basePreset = presetById(raw.baseId);
    rememberBase(basePreset || teen);
  } catch {
    state.current = faceFromPreset(teen);
    state.customs = [];
    rememberBase(teen);
  }
}

function clientToSvg(svg, clientX, clientY) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

function bind() {
  document.getElementById("sliders").addEventListener("input", (event) => {
    const key = event.target.dataset.key;
    if (!key) return;
    state.current[key] = Number(event.target.value);
    paintRange(event.target);
    event.target.closest(".slider").querySelector("output").textContent = event.target.value;
    render();
  });

  document.getElementById("preset-row").addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (button) applyPreset(button.dataset.preset);
  });

  document.getElementById("strip").addEventListener("click", (event) => {
    const del = event.target.closest("[data-delete]");
    if (del) {
      event.stopPropagation();
      deleteCustom(del.dataset.delete);
      return;
    }
    const pin = event.target.closest("[data-pin]");
    if (pin) {
      event.stopPropagation();
      if (pin.dataset.pin === "current") pinFace(state.current);
      else {
        const preset = presetById(pin.dataset.pin);
        if (preset) pinFace(faceFromPreset(preset));
      }
      return;
    }
    const card = event.target.closest("[data-preset]");
    if (card) applyPreset(card.dataset.preset);
  });

  document.getElementById("toggle-guides").addEventListener("click", () => {
    state.guides = !state.guides;
    render();
  });

  document.getElementById("toggle-compare").addEventListener("click", () => {
    state.compare = !state.compare;
    if (state.compare && !state.reference) state.reference = cloneFace(state.current);
    render();
  });

  document.getElementById("toggle-overlay").addEventListener("click", () => {
    state.overlay = !state.overlay;
    render();
  });

  document.getElementById("pin-current").addEventListener("click", () => {
    pinFace(state.current);
  });

  document.getElementById("load-ref").addEventListener("click", () => {
    if (!state.reference) return;
    state.current = cloneFace(state.reference);
    render();
  });

  document.getElementById("swap").addEventListener("click", () => {
    if (!state.reference) return;
    const next = cloneFace(state.current);
    state.current = cloneFace(state.reference);
    state.reference = next;
    render();
  });

  document.getElementById("custom-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveCustom(document.getElementById("custom-name").value);
  });

  document.getElementById("custom-row").addEventListener("click", (event) => {
    const del = event.target.closest("[data-delete]");
    if (del) {
      deleteCustom(del.dataset.delete);
      return;
    }
    const button = event.target.closest("[data-preset]");
    if (button) applyPreset(button.dataset.preset);
  });

  document.getElementById("reset").addEventListener("click", () => {
    if (!state.base) rememberBase(PRESETS.find((preset) => preset.id === "teen") || PRESETS[0]);
    state.current = cloneFace(state.base.face);
    document.getElementById("copy-note").textContent = `「${state.base.name}」${objectParticle(state.base.name)} 비율로 되돌렸습니다.`;
    render();
  });

  document.getElementById("copy-values").addEventListener("click", async () => {
    const note = document.getElementById("copy-note");
    const payload = Object.fromEntries(SLIDER_KEYS.map((key) => [key, state.current[key]]));
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      note.textContent = "값을 복사했습니다.";
    } catch {
      note.textContent = "복사에 실패했습니다. 브라우저 권한을 확인해 주세요.";
    }
  });

  const faces = document.getElementById("faces");
  faces.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest("[data-handle]");
    if (!handle || !state.guides) return;
    drag = { type: handle.dataset.handle };
    document.body.classList.add("is-dragging");
  });

  window.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const svg = document.querySelector("#faces svg[data-role='live']");
    if (!svg) return;
    const pos = clientToSvg(svg, event.clientX, event.clientY);
    if (drag.type === "eye") state.current.eyeLevel = levelFromEyeY(pos.y, state.current.jawLength);
    if (drag.type === "chin") state.current.jawLength = levelFromChinY(pos.y);
    if (drag.type === "jaw") {
      state.current.jawWidth = levelFromHalfJaw(Math.abs(pos.x - BOX.cx), state.current.cheekSoft);
    }
    render();
  });

  window.addEventListener("pointerup", () => {
    if (!drag) return;
    drag = null;
    document.body.classList.remove("is-dragging");
  });
}

loadState();
renderControls();
bind();
render({ save: false });
