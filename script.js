// Contraseña de administrador (cámbiala aquí antes de subir a GitHub)
const ADMIN_PASSWORD = "jairo2026";
const STORAGE_KEY = "cv_jairo_data_v2";

let isEditing = false;

// Proyectos por defecto (se guardan/actualizan en localStorage y al exportar HTML)
const DEFAULT_PROJECTS = [
  {
    id: "proj-1",
    title: "DOMO PropTech",
    desc: "Plataforma colaborativa de alquiler de vivienda en el Valle de Aburrá con mapas interactivos.",
    tags: ["SQL Server", "ASP.NET", "Leaflet"],
    url: "https://github.com/Jairo-Narvaez"
  },
  {
    id: "proj-2",
    title: "TiendaOnline Full Stack",
    desc: "Sistema de gestión de clientes y catálogo con arquitectura cliente-servidor.",
    tags: ["Blazor", "EF Core", "C#"],
    url: "https://github.com/Jairo-Narvaez"
  },
  {
    id: "proj-3",
    title: "Sistema Cafetería SENA",
    desc: "Análisis de requerimientos, diagramas UML y modelado de procesos.",
    tags: ["UML", "SRS", "SQL"],
    url: "https://github.com/Jairo-Narvaez"
  }
];

let projectsList = [...DEFAULT_PROJECTS];

// Elementos DOM
const btnEditMode = document.getElementById("btnEditMode");
const btnExportHtml = document.getElementById("btnExportHtml");
const btnTheme = document.getElementById("btnTheme");
const btnPrint = document.getElementById("btnPrint");
const btnChangePhoto = document.getElementById("btnChangePhoto");
const profilePhoto = document.getElementById("profilePhoto");
const projectsGrid = document.getElementById("projectsGrid");
const btnAddProject = document.getElementById("btnAddProject");
const toast = document.getElementById("toast");

// Modales
const passwordModal = document.getElementById("passwordModal");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const btnCancelModal = document.getElementById("btnCancelModal");
const btnConfirmPassword = document.getElementById("btnConfirmPassword");

const projectModal = document.getElementById("projectModal");
const projTitleInput = document.getElementById("projTitleInput");
const projDescInput = document.getElementById("projDescInput");
const projTagsInput = document.getElementById("projTagsInput");
const projUrlInput = document.getElementById("projUrlInput");
const btnCancelProject = document.getElementById("btnCancelProject");
const btnSaveProject = document.getElementById("btnSaveProject");

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add("hidden"), 2500);
}

// 1. Renderizar Heatmap de GitHub
function renderHeatmap() {
  const container = document.getElementById("githubHeatmap");
  if (!container || container.children.length > 0) return;

  const levels = ["", "lvl-2", "lvl-3", "lvl-4"];
  for (let i = 0; i < 64; i++) {
    const cell = document.createElement("span");
    const randomLvl = levels[Math.floor(Math.random() * levels.length)];
    if (randomLvl) cell.classList.add(randomLvl);
    container.appendChild(cell);
  }
}

// 2. Renderizar Proyectos (solo muestra botón eliminar si isEditing === true)
function renderProjects() {
  projectsGrid.innerHTML = "";

  projectsList.forEach((proj, idx) => {
    const article = document.createElement("article");
    article.className = "project-item";

    // Botón eliminar solo se crea en el DOM si el administrador está autenticado
    if (isEditing) {
      const delBtn = document.createElement("button");
      delBtn.className = "delete-project-btn admin-only";
      delBtn.title = "Eliminar proyecto";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", () => {
        if (!isEditing) return; // Protección adicional
        projectsList = projectsList.filter((item) => item.id !== proj.id);
        saveCurrentData();
        renderProjects();
        showToast("Proyecto eliminado");
      });
      article.appendChild(delBtn);
    }

    const preview = document.createElement("div");
    preview.className = `project-preview preview-${idx % 3}`;
    preview.innerHTML = `
      <span>${proj.title}</span>
      <a href="${proj.url || '#'}" target="_blank" rel="noopener" class="ext-icon" title="Abrir proyecto">↗</a>
    `;

    const titleEl = document.createElement("h3");
    titleEl.textContent = proj.title;

    const descEl = document.createElement("p");
    descEl.textContent = proj.desc;

    // Permite editar texto inline solo cuando isEditing está activo
    if (isEditing) {
      titleEl.classList.add("editable");
      descEl.classList.add("editable");
      titleEl.setAttribute("contenteditable", "true");
      descEl.setAttribute("contenteditable", "true");
      titleEl.addEventListener("input", () => {
        proj.title = titleEl.textContent.trim();
        preview.querySelector("span").textContent = proj.title;
        saveCurrentData();
      });
      descEl.addEventListener("input", () => {
        proj.desc = descEl.textContent.trim();
        saveCurrentData();
      });
    }

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "tags";
    proj.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      tagsWrap.appendChild(span);
    });

    article.append(preview, titleEl, descEl, tagsWrap);
    projectsGrid.appendChild(article);
  });
}

// 3. Cargar y Guardar datos en localStorage
function loadSavedData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    renderProjects();
    return;
  }

  const data = JSON.parse(saved);
  document.querySelectorAll(".editable[data-key]").forEach((el) => {
    const key = el.dataset.key;
    if (key && data[key]) {
      el.textContent = data[key];
    }
  });

  if (data.photoUrl) profilePhoto.src = data.photoUrl;
  if (Array.isArray(data.projects)) projectsList = data.projects;

  syncMailLink();
  renderProjects();
}

function saveCurrentData() {
  const data = {};
  document.querySelectorAll(".editable[data-key]").forEach((el) => {
    const key = el.dataset.key;
    if (key) data[key] = el.textContent.trim();
  });
  data.photoUrl = profilePhoto.src;
  data.projects = projectsList;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  syncMailLink();
}

function syncMailLink() {
  const emailText = document.getElementById("contactEmail").textContent.trim();
  const mailLink = document.getElementById("mailActionLink");
  if (mailLink && emailText) mailLink.href = `mailto:${emailText}`;

  const waText = document.getElementById("contactWhatsapp")?.textContent.replace(/\D/g, "");
  const waLink = document.getElementById("whatsappActionLink");
  if (waLink && waText) waLink.href = `https://wa.me/${waText}`;
}

// 4. Activar / Desactivar modo edición protegido
function setEditState(enable) {
  isEditing = enable;
  document.body.classList.toggle("editing-active", enable);

  document.querySelectorAll(".editable[data-key]").forEach((el) => {
    el.setAttribute("contenteditable", enable ? "true" : "false");
  });

  document.querySelectorAll(".admin-only").forEach((el) => {
    el.classList.toggle("hidden", !enable);
  });

  btnExportHtml.classList.toggle("hidden", !enable);
  btnEditMode.textContent = enable ? "✅ Guardar y bloquear" : "🔒 Editar datos";

  if (!enable) {
    saveCurrentData();
    showToast("Cambios guardados y bloqueados");
  } else {
    showToast("Modo edición desbloqueado");
  }

  renderProjects();
}

// Autenticación con contraseña
btnEditMode.addEventListener("click", () => {
  if (isEditing) {
    setEditState(false);
  } else {
    passwordInput.value = "";
    passwordError.classList.add("hidden");
    passwordModal.classList.remove("hidden");
    passwordInput.focus();
  }
});

btnCancelModal.addEventListener("click", () => passwordModal.classList.add("hidden"));

function verifyPassword() {
  if (passwordInput.value === ADMIN_PASSWORD) {
    passwordModal.classList.add("hidden");
    setEditState(true);
  } else {
    passwordError.classList.remove("hidden");
  }
}

btnConfirmPassword.addEventListener("click", verifyPassword);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") verifyPassword();
});

// 5. Agregar nuevo proyecto (solo si isEditing === true)
btnAddProject.addEventListener("click", () => {
  if (!isEditing) return;
  projTitleInput.value = "";
  projDescInput.value = "";
  projTagsInput.value = "";
  projUrlInput.value = "https://github.com/Jairo-Narvaez";
  projectModal.classList.remove("hidden");
  projTitleInput.focus();
});

btnCancelProject.addEventListener("click", () => projectModal.classList.add("hidden"));

btnSaveProject.addEventListener("click", () => {
  if (!isEditing) return; // Bloqueo de seguridad
  const title = projTitleInput.value.trim();
  const desc = projDescInput.value.trim();
  if (!title || !desc) {
    showToast("Completa título y descripción");
    return;
  }

  const tags = projTagsInput.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  projectsList.push({
    id: "proj-" + Date.now(),
    title,
    desc,
    tags: tags.length ? tags : ["Web"],
    url: projUrlInput.value.trim() || "https://github.com/Jairo-Narvaez"
  });

  saveCurrentData();
  renderProjects();
  projectModal.classList.add("hidden");
  showToast("Proyecto agregado");
});

// Cambiar foto
btnChangePhoto.addEventListener("click", () => {
  if (!isEditing) return;
  const newUrl = prompt("Pega la URL de tu foto (o ruta relativa como img/foto.jpg):", profilePhoto.src);
  if (newUrl && newUrl.trim() !== "") {
    profilePhoto.src = newUrl.trim();
    saveCurrentData();
  }
});

// 6. Copiar datos de contacto (disponible para todos los visitantes)
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const targetId = btn.dataset.copyTarget;
    const text = document.getElementById(targetId)?.textContent.trim();
    if (!text) return;

    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = "✅";
    showToast(`Copiado: ${text}`);
    setTimeout(() => (btn.textContent = original), 1500);
  });
});

document.getElementById("btnCopyAllContact").addEventListener("click", async () => {
  const wa = document.getElementById("contactWhatsapp").textContent.trim();
  const email = document.getElementById("contactEmail").textContent.trim();
  const loc = document.getElementById("contactLocation").textContent.trim();
  const gh = document.getElementById("contactGithub").textContent.trim();
  const fullContact = `Jairo Chiran\nWhatsApp: ${wa}\nCorreo: ${email}\nUbicación: ${loc}\nGitHub: ${gh}`;

  await navigator.clipboard.writeText(fullContact);
  showToast("Todos los datos de contacto copiados");
});

// 7. Exportar HTML actualizado para GitHub Pages (sin controles de admin)
btnExportHtml.addEventListener("click", () => {
  setEditState(false);

  const docClone = document.documentElement.cloneNode(true);
  docClone.querySelector("body").classList.remove("editing-active");
  docClone.querySelectorAll(".editable").forEach((el) => el.removeAttribute("contenteditable"));
  docClone.querySelectorAll(".admin-only, .delete-project-btn").forEach((el) => el.classList.add("hidden"));
  docClone.querySelector("#btnExportHtml").classList.add("hidden");
  docClone.querySelector("#passwordModal").classList.add("hidden");
  docClone.querySelector("#projectModal").classList.add("hidden");
  docClone.querySelector("#toast").classList.add("hidden");

  const finalHtml = "<!DOCTYPE html>\n" + docClone.outerHTML;
  const blob = new Blob([finalHtml], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "index.html";
  link.click();
});

// Tema e impresión/PDF
btnTheme.addEventListener("click", () => {
  const html = document.documentElement;
  const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  btnTheme.textContent = next === "dark" ? "☀️" : "🌙";
});

btnPrint.addEventListener("click", () => window.print());

// Inicializar
renderHeatmap();
loadSavedData();