// Single source of truth for the module sequence.
// Adding a new module: add an entry here, create <dir>/index.html + app.js,
// and add a nav card on the landing page. Progress strips update automatically.
export const MODULES = [
  {
    id: "01-ellipse-reflection",
    num: 1,
    title: "Ellipse Reflection",
    tag: "Predict",
    blurb: "Hero demo: why rays from one focus hit the other."
  },
  {
    id: "02-ellipse-construction",
    num: 2,
    title: "Ellipse Construction",
    tag: "Build",
    blurb: "String-and-pins model with live distance sum."
  },
  {
    id: "03-eccentricity",
    num: 3,
    title: "Eccentricity",
    tag: "Morph",
    blurb: "Slide from circle to elongated ellipse with reflection behavior."
  },
  {
    id: "04-parabola-reflection",
    num: 4,
    title: "Parabola Reflection",
    tag: "Toggle",
    blurb: "Parallel rays converge to focus; reverse mode emits parallel rays."
  },
  {
    id: "05-hyperbola-reflection",
    num: 5,
    title: "Hyperbola Reflection",
    tag: "Probe",
    blurb: "Divergent sibling and telescope-inspired dual-mirror path."
  },
  {
    id: "06-conic-family",
    num: 6,
    title: "Conic Family",
    tag: "Unify",
    blurb: "Unified focus-directrix eccentricity model and cone slicer narrative.",
    labelSuffix: " — capstone"
  }
];

export function getModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}

// Fills a <nav class="progress-strip" data-module="<id>"> placeholder so every
// page shares one definition of the sequence.
export function mountProgressStrip(currentId, target) {
  const host = target || document.querySelector(".progress-strip");
  if (!host) return null;

  const current = getModule(currentId);
  const label = document.createElement("span");
  label.className = "progress-label";
  label.textContent = current
    ? `Module ${current.num} of ${MODULES.length}${current.labelSuffix || ""}`
    : `Modules 1–${MODULES.length}`;

  const dots = document.createElement("span");
  dots.className = "progress-dots";
  for (const mod of MODULES) {
    const a = document.createElement("a");
    a.className = "progress-dot";
    a.href = `../${mod.id}/index.html`;
    a.textContent = String(mod.num);
    if (mod.id === currentId) {
      a.setAttribute("aria-current", "page");
      a.setAttribute("aria-label", `Module ${mod.num}: ${mod.title}, current page`);
    } else {
      a.setAttribute("aria-label", `Module ${mod.num}: ${mod.title}`);
    }
    dots.appendChild(a);
  }

  host.replaceChildren(label, dots);
  return host;
}
