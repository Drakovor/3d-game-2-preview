const rootPrefix = window.location.pathname.includes("/Preview/") ? ".." : ".";
const assetUrl = (path) => `${rootPrefix}${path}`;
const layoutPath = assetUrl("/Assets/Art/Environment/FloatingWorld/Metadata/world_layout.json");
const houdiniGeneratedPath = assetUrl("/Assets/Art/Environment/FloatingWorld/Metadata/houdini_generated_assets.json");
const preflightPath = assetUrl("/Assets/TerrainPipeline/ImportReports/pipeline_preflight.json");
const houdiniHeightmapPath = assetUrl("/Assets/TerrainPipeline/ExternalTerrainExports/Houdini/base_height_1025.png");

const roles = [
  ["Houdini", "Active Mac terrain heightfield plus procedural cliffs, canyons, arches, cave mouths, overhangs."],
  ["Gaea", "Future/off-Mac terrain heightmap, erosion, slope/flow/deposit masks."],
  ["World Creator", "Future/off-Mac fast terrain iteration and splat/heat map alternatives."],
  ["World Machine", "Future/off-Mac deterministic large-world terrain build option."],
  ["ZBrush", "Hero sculpt detail and high-poly rock/ruin surfaces."],
  ["Blender", "Blockout, kitbash, pivot cleanup, local reference mesh chunks."],
  ["Substance Painter", "PBR BaseColor, Normal, MaskMap for mesh assets."],
  ["Unity", "Integration, Terrain import, LODGroups, colliders, streaming cells."]
];

const installNotes = [
  "World Creator: practical native Mac terrain tool; login/customer portal needed.",
  "Gaea: official docs currently say Windows-only; use Windows machine if chosen.",
  "World Machine: official FAQ says no native Mac build for stable current release."
];

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const terrainCanvas = document.getElementById("terrain3d");
const terrain3dStatus = document.getElementById("terrain3d-status");
const assetTable = document.getElementById("asset-table");
const toolTable = document.getElementById("tool-table");
const gateTable = document.getElementById("gate-table");
const roleList = document.getElementById("role-list");
const terrainStatus = document.getElementById("terrain-status");
const houdiniStatus = document.getElementById("houdini-status");
const meshStatus = document.getElementById("mesh-status");
const installStatus = document.getElementById("install-status");

function drawGrid() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0d0b12";
  ctx.fillRect(0, 0, w, h);

  const pad = 70;
  const size = Math.min(w - pad * 2, h - pad * 2);
  const ox = (w - size) * 0.5;
  const oy = (h - size) * 0.5;

  ctx.strokeStyle = "#2b2638";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const p = i / 10;
    const x = ox + size * p;
    const y = oy + size * p;
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.lineTo(x, oy + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + size, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#7d5cff";
  ctx.lineWidth = 3;
  ctx.strokeRect(ox, oy, size, size);

  ctx.fillStyle = "#a9a0b8";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText("-500m", ox - 48, oy + size + 24);
  ctx.fillText("+500m", ox + size - 20, oy + size + 24);
  ctx.fillText("Terrain source: Houdini heightfield export", ox + 20, oy + 32);

  return { ox, oy, size };
}

function project(position, frame) {
  const x = Array.isArray(position) ? position[0] : 0;
  const z = Array.isArray(position) ? position[2] : 0;
  return {
    x: frame.ox + ((x + 500) / 1000) * frame.size,
    y: frame.oy + ((z + 500) / 1000) * frame.size
  };
}

function drawAssets(layout, houdiniAssets = []) {
  const frame = drawGrid();
  const assets = [...(layout?.meshAssets ?? []), ...houdiniAssets];
  assets.forEach((asset, index) => {
    const p = project(asset.position, frame);
    const color = asset.name?.startsWith("Houdini_") ? "#f28a3d" : index % 3 === 0 ? "#a5d96a" : index % 3 === 1 ? "#f28a3d" : "#7d5cff";
    const radius = asset.name.includes("FloatingIsland") ? 17 : 12;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.20;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ece7f5";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(asset.name.replaceAll("_", " "), p.x + radius + 8, p.y + 4);
  });
}

function renderRoles() {
  roleList.innerHTML = roles.map(([name, text]) => `
    <li class="role">
      <strong>${name}</strong>
      <span>${text}</span>
    </li>
  `).join("");
}

function renderAssets(layout, houdiniAssets = []) {
  const assets = [...(layout?.meshAssets ?? []), ...houdiniAssets];
  meshStatus.textContent = assets.length > 0
    ? `Meshes: ${assets.length} reference chunk(s) found`
    : "Meshes: waiting for Houdini / ZBrush / Blender exports";

  assetTable.innerHTML = assets.map((asset) => `
    <div class="asset-row">
      <strong>${asset.name}</strong>
      <span>${asset.biome || "Mesh"} · pos ${asset.position?.join(", ") || "0, 0, 0"} · ${asset.fbx ? "FBX linked" : "FBX missing"}</span>
    </div>
  `).join("");
}

async function fileExists(path) {
  try {
    const response = await fetch(path, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

async function renderTerrainStatus() {
  const sources = [
    assetUrl("/Assets/TerrainPipeline/ExternalTerrainExports/Houdini/base_height_1025.png"),
    assetUrl("/Assets/TerrainPipeline/ExternalTerrainExports/Gaea/base_height_1025.png"),
    assetUrl("/Assets/TerrainPipeline/ExternalTerrainExports/WorldCreator/base_height_1025.png"),
    assetUrl("/Assets/TerrainPipeline/ExternalTerrainExports/WorldMachine/base_height_1025.png")
  ];
  const ready = await Promise.all(sources.map(fileExists));
  const index = ready.findIndex(Boolean);
  const labels = ["Houdini", "Gaea", "World Creator", "World Machine"];
  terrainStatus.textContent = index >= 0
    ? `Terrain source: ${labels[index]} heightmap found`
    : "Terrain source: pending Houdini terrain export on Mac";
  terrainStatus.className = index >= 0 ? "status ready" : "status warning";
}

async function renderToolStatus(houdiniAssetCount) {
  let data = null;
  try {
    const response = await fetch(assetUrl("/Assets/TerrainPipeline/ImportReports/tool_install_status.json"), { cache: "no-store" });
    data = response.ok ? await response.json() : null;
  } catch {
    data = null;
  }

  const tools = data?.tools ?? [];
  const installed = tools.filter((tool) => tool.state === "installed");
  const downloaded = tools.filter((tool) => tool.state === "downloaded");
  const houdini = tools.find((tool) => tool.name === "Houdini");

  if (houdiniAssetCount > 0) {
    houdiniStatus.textContent = `Houdini: ${houdiniAssetCount} generated procedural chunk(s) imported`;
    houdiniStatus.className = "status ready";
  } else if (houdini?.state === "needs-license") {
    houdiniStatus.textContent = "Houdini: installed, waiting for local SideFX license activation";
    houdiniStatus.className = "status warning";
  } else if (houdini?.state === "installed") {
    houdiniStatus.textContent = "Houdini: installed, ready for procedural chunk export";
    houdiniStatus.className = "status ready";
  } else {
    houdiniStatus.textContent = "Houdini: waiting for installation";
    houdiniStatus.className = "status warning";
  }

  installStatus.textContent = `Tools: ${installed.length} installed · ${downloaded.length} installer/download found`;
  installStatus.className = downloaded.length > 0 ? "status warning" : "status ready";

  toolTable.innerHTML = tools.map((tool) => `
    <div class="asset-row">
      <strong>${tool.name} · ${tool.state}</strong>
      <span>${tool.role}</span>
      <span>${tool.platformNote}</span>
      <span>${tool.nextAction}</span>
    </div>
  `).join("");
}

async function renderPreflight() {
  let data = null;
  try {
    const response = await fetch(preflightPath, { cache: "no-store" });
    data = response.ok ? await response.json() : null;
  } catch {
    data = null;
  }

  const gates = data?.gates ?? [];
  if (gates.length === 0) {
    gateTable.innerHTML = `
      <div class="asset-row">
        <strong>Preflight report missing</strong>
        <span>Run Tools/FantasyWorldPipeline/run_preflight.sh.</span>
      </div>
    `;
    return;
  }

  gateTable.innerHTML = gates.map((gate) => `
    <div class="gate-row ${gate.state}">
      <div>
        <strong>${gate.name}</strong>
        <span>${gate.summary}</span>
      </div>
      <em>${gate.state}</em>
      <span>${gate.evidence}</span>
      <span>${gate.nextAction}</span>
    </div>
  `).join("");
}

function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0
  ];
}

function mat4LookAt(eye, center, up) {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return [
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1
  ];
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }
  return shader;
}

function createProgram(gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, `
    attribute vec3 a_position;
    attribute vec3 a_color;
    uniform mat4 u_projection;
    uniform mat4 u_view;
    varying vec3 v_color;
    varying float v_depth;
    void main() {
      vec4 world = vec4(a_position, 1.0);
      vec4 view = u_view * world;
      gl_Position = u_projection * view;
      v_color = a_color;
      v_depth = clamp((-view.z - 2.5) / 8.0, 0.0, 1.0);
    }
  `);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 v_color;
    varying float v_depth;
    void main() {
      vec3 fog = vec3(0.05, 0.045, 0.07);
      gl_FragColor = vec4(mix(v_color, fog, v_depth * 0.45), 1.0);
    }
  `);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
  }
  return program;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = `${src}?v=${Date.now()}`;
  });
}

function buildTerrainMesh(image) {
  const grid = 145;
  const sample = document.createElement("canvas");
  sample.width = grid;
  sample.height = grid;
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
  sampleCtx.drawImage(image, 0, 0, grid, grid);
  const pixels = sampleCtx.getImageData(0, 0, grid, grid).data;
  const heights = new Float32Array(grid * grid);
  for (let i = 0; i < heights.length; i += 1) {
    heights[i] = pixels[i * 4] / 255;
  }

  const positions = [];
  const colors = [];
  const indices = [];
  for (let z = 0; z < grid; z += 1) {
    for (let x = 0; x < grid; x += 1) {
      const i = z * grid + x;
      const h = heights[i];
      const xm = Math.max(0, x - 1);
      const xp = Math.min(grid - 1, x + 1);
      const zm = Math.max(0, z - 1);
      const zp = Math.min(grid - 1, z + 1);
      const slope = Math.abs(heights[z * grid + xp] - heights[z * grid + xm]) + Math.abs(heights[zp * grid + x] - heights[zm * grid + x]);
      const px = (x / (grid - 1) - 0.5) * 6.5;
      const pz = (z / (grid - 1) - 0.5) * 6.5;
      const py = h * 1.95 - 0.25;
      positions.push(px, py, pz);

      let color;
      if (h > 0.76) {
        color = [0.70, 0.76, 0.80];
      } else if (slope > 0.11 || h > 0.58) {
        color = [0.32, 0.31, 0.29];
      } else if (h < 0.22) {
        color = [0.20, 0.15, 0.10];
      } else {
        color = [0.16, 0.31, 0.16];
      }
      const shade = Math.max(0.48, Math.min(1.18, 1.02 - slope * 2.6 + h * 0.16));
      colors.push(color[0] * shade, color[1] * shade, color[2] * shade);
    }
  }

  for (let z = 0; z < grid - 1; z += 1) {
    for (let x = 0; x < grid - 1; x += 1) {
      const a = z * grid + x;
      const b = a + 1;
      const c = a + grid;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices),
    heights,
    grid
  };
}

function previewX(worldX) {
  return (worldX / 1000) * 6.5;
}

function previewZ(worldZ) {
  return (worldZ / 1000) * 6.5;
}

function sampleTerrainHeight(mesh, worldX, worldZ) {
  const u = Math.max(0, Math.min(1, (worldX + 500) / 1000));
  const v = Math.max(0, Math.min(1, (worldZ + 500) / 1000));
  const x = u * (mesh.grid - 1);
  const z = v * (mesh.grid - 1);
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const x1 = Math.min(mesh.grid - 1, x0 + 1);
  const z1 = Math.min(mesh.grid - 1, z0 + 1);
  const tx = x - x0;
  const tz = z - z0;
  const h00 = mesh.heights[z0 * mesh.grid + x0];
  const h10 = mesh.heights[z0 * mesh.grid + x1];
  const h01 = mesh.heights[z1 * mesh.grid + x0];
  const h11 = mesh.heights[z1 * mesh.grid + x1];
  const h0 = h00 * (1 - tx) + h10 * tx;
  const h1 = h01 * (1 - tx) + h11 * tx;
  return ((h0 * (1 - tz) + h1 * tz) * 1.95) - 0.25;
}

function addBox(target, center, size, color) {
  const start = target.positions.length / 3;
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size.map((value) => value * 0.5);
  const verts = [
    [cx - sx, cy - sy, cz - sz], [cx + sx, cy - sy, cz - sz], [cx + sx, cy + sy, cz - sz], [cx - sx, cy + sy, cz - sz],
    [cx - sx, cy - sy, cz + sz], [cx + sx, cy - sy, cz + sz], [cx + sx, cy + sy, cz + sz], [cx - sx, cy + sy, cz + sz]
  ];
  const faces = [
    [0, 1, 2], [0, 2, 3],
    [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1],
    [1, 5, 6], [1, 6, 2],
    [2, 6, 7], [2, 7, 3],
    [3, 7, 4], [3, 4, 0]
  ];
  verts.forEach((vertex, index) => {
    const shade = index >= 4 ? 0.86 : 1.0;
    target.positions.push(...vertex);
    target.colors.push(color[0] * shade, color[1] * shade, color[2] * shade);
  });
  faces.forEach((face) => target.indices.push(start + face[0], start + face[1], start + face[2]));
}

function addRockColumn(target, center, height, radius, color, seed = 0) {
  const start = target.positions.length / 3;
  const segments = 9;
  const [cx, baseY, cz] = center;
  target.positions.push(cx, baseY + height, cz);
  target.colors.push(color[0] * 1.14, color[1] * 1.14, color[2] * 1.14);
  for (let ring = 0; ring < 2; ring += 1) {
    const y = ring === 0 ? baseY : baseY + height * 0.10;
    const localRadius = ring === 0 ? radius * 1.10 : radius;
    for (let i = 0; i < segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2;
      const wobble = 0.78 + Math.sin(i * 1.73 + seed) * 0.12 + Math.cos(i * 2.41 + seed) * 0.10;
      target.positions.push(cx + Math.cos(angle) * localRadius * wobble, y, cz + Math.sin(angle) * localRadius * wobble);
      const shade = 0.62 + (i % 3) * 0.09;
      target.colors.push(color[0] * shade, color[1] * shade, color[2] * shade);
    }
  }
  const top = start;
  const lower = start + 1;
  const upper = start + 1 + segments;
  for (let i = 0; i < segments; i += 1) {
    const next = (i + 1) % segments;
    target.indices.push(top, upper + i, upper + next);
    target.indices.push(lower + i, lower + next, upper + i);
    target.indices.push(upper + i, lower + next, upper + next);
  }
}

function addHoudiniPreviewChunks(mesh, houdiniAssets) {
  const target = {
    positions: Array.from(mesh.positions),
    colors: Array.from(mesh.colors),
    indices: Array.from(mesh.indices)
  };
  const rock = [0.48, 0.38, 0.28];
  const ember = [0.82, 0.39, 0.17];
  const shadow = [0.18, 0.15, 0.13];

  houdiniAssets.forEach((asset) => {
    const position = asset.position || [0, 0, 0];
    const x = previewX(position[0]);
    const z = previewZ(position[2]);
    const y = sampleTerrainHeight(mesh, position[0], position[2]) + 0.04;

    if (asset.name.includes("CliffWall")) {
      for (let i = 0; i < 7; i += 1) {
        addRockColumn(target, [x + (i - 3) * 0.17, y, z + Math.sin(i) * 0.08], 0.72 + (i % 3) * 0.15, 0.10 + (i % 2) * 0.03, rock, i * 2.1);
      }
      addBox(target, [x, y + 0.08, z + 0.14], [1.36, 0.18, 0.13], shadow);
    } else if (asset.name.includes("CaveEntrance")) {
      addRockColumn(target, [x - 0.22, y, z], 0.56, 0.10, rock, 4);
      addRockColumn(target, [x + 0.22, y, z], 0.60, 0.11, rock, 7);
      addBox(target, [x, y + 0.56, z], [0.70, 0.17, 0.24], rock);
      addBox(target, [x, y + 0.20, z - 0.02], [0.28, 0.36, 0.12], shadow);
    } else if (asset.name.includes("CanyonSegment")) {
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 5; i += 1) {
          addRockColumn(target, [x + side * 0.35, y, z + (i - 2) * 0.20], 0.34 + i * 0.05, 0.08, i % 2 ? ember : rock, i + side * 12);
        }
      }
      addBox(target, [x, y + 0.02, z], [0.26, 0.06, 1.02], shadow);
    }
  });

  return {
    positions: new Float32Array(target.positions),
    colors: new Float32Array(target.colors),
    indices: new Uint16Array(target.indices),
    grid: mesh.grid,
    heights: mesh.heights
  };
}

async function initTerrain3d(houdiniAssets = []) {
  if (!terrainCanvas) {
    return;
  }
  const gl = terrainCanvas.getContext("webgl", { antialias: true });
  if (!gl) {
    terrain3dStatus.textContent = "WebGL unavailable";
    return;
  }

  let image;
  try {
    image = await loadImage(houdiniHeightmapPath);
  } catch {
    terrain3dStatus.textContent = "Waiting for Houdini heightmap";
    return;
  }

  const terrainMesh = buildTerrainMesh(image);
  const mesh = addHoudiniPreviewChunks(terrainMesh, houdiniAssets);
  const program = createProgram(gl);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.colors, gl.STATIC_DRAW);
  const colorLocation = gl.getAttribLocation(program, "a_color");
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

  const projectionLocation = gl.getUniformLocation(program, "u_projection");
  const viewLocation = gl.getUniformLocation(program, "u_view");

  let yaw = 0.74;
  let pitch = 0.58;
  let radius = 6.9;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  terrainCanvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    terrainCanvas.setPointerCapture(event.pointerId);
  });
  terrainCanvas.addEventListener("pointerup", () => { dragging = false; });
  terrainCanvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    yaw += (event.clientX - lastX) * 0.006;
    pitch = Math.max(0.20, Math.min(1.18, pitch + (event.clientY - lastY) * 0.004));
    lastX = event.clientX;
    lastY = event.clientY;
  });
  terrainCanvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    radius = Math.max(4.2, Math.min(11.0, radius + event.deltaY * 0.006));
  }, { passive: false });

  terrain3dStatus.textContent = `Terrain + ${houdiniAssets.length} Houdini chunk(s) · drag to orbit · wheel to zoom`;

  function resize() {
    const rect = terrainCanvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (terrainCanvas.width !== width || terrainCanvas.height !== height) {
      terrainCanvas.width = width;
      terrainCanvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    return width / height;
  }

  function render() {
    const aspect = resize();
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.05, 0.045, 0.07, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const eye = [
      Math.sin(yaw) * Math.cos(pitch) * radius,
      Math.sin(pitch) * radius + 1.2,
      Math.cos(yaw) * Math.cos(pitch) * radius
    ];
    gl.uniformMatrix4fv(projectionLocation, false, new Float32Array(mat4Perspective(Math.PI / 4, aspect, 0.1, 60)));
    gl.uniformMatrix4fv(viewLocation, false, new Float32Array(mat4LookAt(eye, [0, 0.58, 0], [0, 1, 0])));
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
  }
  render();
}

async function main() {
  renderRoles();
  let layout = null;
  let houdiniData = null;
  try {
    const response = await fetch(layoutPath, { cache: "no-store" });
    layout = response.ok ? await response.json() : null;
  } catch {
    layout = null;
  }
  try {
    const response = await fetch(houdiniGeneratedPath, { cache: "no-store" });
    houdiniData = response.ok ? await response.json() : null;
  } catch {
    houdiniData = null;
  }

  const houdiniAssets = (houdiniData?.assets ?? []).map((asset, index) => ({
    name: asset.name,
    biome: `Houdini ${asset.role}`,
    fbx: asset.fbx,
    position: asset.name.includes("CliffWall") ? [-80, 28, -410] : asset.name.includes("CaveEntrance") ? [115, 22, -335] : [225 + index * 16, 24, 70 + index * 24]
  }));

  drawAssets(layout, houdiniAssets);
  renderAssets(layout, houdiniAssets);
  await renderTerrainStatus();
  await renderToolStatus(houdiniAssets.length);
  await renderPreflight();
  await initTerrain3d(houdiniAssets);
}

main();
