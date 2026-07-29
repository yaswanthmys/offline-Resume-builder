(function () {
  "use strict";

  const STORAGE_KEY = "offline-resume-builder-v1";
  const optionalSections = [
    "Experience",
    "Projects",
    "Certificates",
    "Achievements",
    "Languages",
    "Links",
    "Interests",
    "References",
    "Publications",
    "Volunteer Work",
  ];

  const state = loadState();
  let currentStep = 0;

  const steps = [
    {
      id: "personal",
      title: "Personal details",
      hint: "Add the contact details recruiters and ATS systems expect. Extra details can be labels, links, portfolio pages, or anything else.",
      render: renderPersonal,
    },
    {
      id: "education",
      title: "Education",
      hint: "Keep entries clear and searchable: degree, institution, location, dates, and relevant results or coursework.",
      render: renderEducation,
    },
    {
      id: "skills",
      title: "Skills",
      hint: "Use plain keywords grouped by category. This helps both humans and ATS parsers.",
      render: renderSkills,
    },
    {
      id: "sections",
      title: "Additional info",
      hint: "Pick the sections that match your background. You can keep the resume to one page or allow a second page.",
      render: renderSectionPicker,
    },
    {
      id: "details",
      title: "Section details",
      hint: "Fill only the sections you selected. Strong bullets work best when they start with action and show scope, tools, or impact.",
      render: renderOptionalDetails,
    },
    {
      id: "finish",
      title: "Review and export",
      hint: "Check the preview, save your draft, then export as PDF or DOCX. Everything runs locally in this browser.",
      render: renderFinish,
    },
  ];

  const form = document.getElementById("builderForm");
  const stepsEl = document.getElementById("steps");
  const stepTitle = document.getElementById("stepTitle");
  const stepHint = document.getElementById("stepHint");
  const stepKicker = document.getElementById("stepKicker");
  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const preview = document.getElementById("resumePreview");
  const pageCountLabel = document.getElementById("pageCountLabel");

  document.getElementById("saveDraftBtn").addEventListener("click", () => {
    persistState();
    showToast("Draft saved on this device.");
  });

  document.getElementById("clearDraftBtn").addEventListener("click", () => {
    if (!confirm("Clear all resume data from this browser?")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  document.getElementById("printPdfBtn").addEventListener("click", () => {
    persistState();
    window.print();
  });

  document.getElementById("downloadDocxBtn").addEventListener("click", () => {
    persistState();
    downloadDocx();
  });

  backBtn.addEventListener("click", () => {
    syncForm();
    currentStep = Math.max(0, currentStep - 1);
    render();
  });

  nextBtn.addEventListener("click", () => {
    if (!form.reportValidity()) return;
    syncForm();
    currentStep = Math.min(steps.length - 1, currentStep + 1);
    render();
  });

  form.addEventListener("input", () => {
    syncForm();
    renderPreview();
  });

  form.addEventListener("change", () => {
    syncForm();
    renderPreview();
  });

  render();

  function initialState() {
    return {
      personal: {
        name: "",
        phone: "",
        email: "",
        address: "",
        github: "",
        linkedin: "",
        extras: [],
      },
      education: [blankEducation()],
      skills: [{ category: "Technical Skills", items: "" }],
      selectedSections: ["Projects", "Experience"],
      optional: {},
    };
  }

  function blankEducation() {
    return {
      degree: "",
      institution: "",
      location: "",
      start: "",
      end: "",
      details: "",
    };
  }

  function blankGeneric(section) {
    return {
      title: "",
      subtitle: "",
      location: "",
      start: "",
      end: "",
      details: "",
      url: section === "Links" ? "" : undefined,
    };
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return stored ? mergeDefaults(initialState(), stored) : initialState();
    } catch (error) {
      return initialState();
    }
  }

  function mergeDefaults(base, saved) {
    return {
      ...base,
      ...saved,
      personal: { ...base.personal, ...(saved.personal || {}) },
      education: saved.education && saved.education.length ? saved.education : base.education,
      skills: saved.skills && saved.skills.length ? saved.skills : base.skills,
      selectedSections: saved.selectedSections || base.selectedSections,
      optional: saved.optional || base.optional,
    };
  }

  function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function render() {
    const step = steps[currentStep];
    document.body.dataset.step = step.id;
    stepKicker.textContent = `Step ${currentStep + 1} of ${steps.length}`;
    stepTitle.textContent = step.title;
    stepHint.textContent = step.hint;
    form.innerHTML = "";
    step.render();
    renderSteps();
    renderPreview();
    backBtn.disabled = currentStep === 0;
    nextBtn.textContent = currentStep === steps.length - 1 ? "Save Draft" : "Next";
  }

  function renderSteps() {
    stepsEl.innerHTML = steps
      .map((step, index) => {
        const status = index === currentStep ? "active" : index < currentStep ? "done" : "";
        return `<li class="step ${status}"><span class="step-index">${index < currentStep ? "✓" : index + 1}</span><span>${escapeHtml(step.title)}</span></li>`;
      })
      .join("");
  }

  function renderPersonal() {
    form.appendChild(
      elementFromHtml(`
        <div class="form-grid">
          ${field("Full name", "personal.name", state.personal.name, "text", true)}
          ${field("Phone number", "personal.phone", state.personal.phone, "tel", true)}
          ${field("Email", "personal.email", state.personal.email, "email", true)}
          ${field("Address", "personal.address", state.personal.address, "text", true)}
          ${field("GitHub", "personal.github", state.personal.github, "url")}
          ${field("LinkedIn", "personal.linkedin", state.personal.linkedin, "url")}
        </div>
      `)
    );

    const list = repeatList("Extra details", state.personal.extras, (item, index) => `
      <div class="form-grid">
        ${field("Label", `personal.extras.${index}.label`, item.label || "", "text")}
        ${field("Value or link", `personal.extras.${index}.value`, item.value || "", "text")}
      </div>
    `);
    form.appendChild(list);
    addRepeaterButtons(list, () => state.personal.extras.push({ label: "", value: "" }), state.personal.extras);
  }

  function renderEducation() {
    const list = repeatList("Education entries", state.education, (item, index) => `
      <div class="form-grid">
        ${field("Degree / qualification", `education.${index}.degree`, item.degree, "text", true)}
        ${field("Institution", `education.${index}.institution`, item.institution, "text", true)}
        ${field("Location", `education.${index}.location`, item.location)}
        ${field("Dates", `education.${index}.end`, item.end, "text", false, "Example: 2022 - 2026")}
        ${textarea("Relevant details", `education.${index}.details`, item.details, "CGPA, coursework, honors, activities")}
      </div>
    `);
    form.appendChild(list);
    addRepeaterButtons(list, () => state.education.push(blankEducation()), state.education);
  }

  function renderSkills() {
    const list = repeatList("Skill groups", state.skills, (item, index) => `
      <div class="form-grid">
        ${field("Category", `skills.${index}.category`, item.category, "text", true)}
        ${textarea("Skills", `skills.${index}.items`, item.items, "Comma-separated keywords", true)}
      </div>
    `);
    form.appendChild(list);
    addRepeaterButtons(list, () => state.skills.push({ category: "", items: "" }), state.skills);
  }

  function renderSectionPicker() {
    const selectedSummary = document.createElement("div");
    selectedSummary.className = "selected-summary";
    selectedSummary.innerHTML = state.selectedSections.length
      ? state.selectedSections.map((section) => `<button class="selected-chip" type="button" data-section="${escapeAttr(section)}">${escapeHtml(section)} ×</button>`).join("")
      : `<span>No extra sections selected yet.</span>`;
    form.appendChild(selectedSummary);

    const wrapper = document.createElement("div");
    wrapper.className = "checkbox-grid";
    wrapper.innerHTML = optionalSections
      .map((section) => `
        <label class="option-tile ${state.selectedSections.includes(section) ? "picked" : ""}">
          <input type="checkbox" name="selectedSections" value="${escapeHtml(section)}" ${state.selectedSections.includes(section) ? "checked" : ""}>
          <span>${escapeHtml(section)}</span>
        </label>
      `)
      .join("");
    form.appendChild(wrapper);

    selectedSummary.querySelectorAll(".selected-chip").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedSections = state.selectedSections.filter((section) => section !== button.dataset.section);
        render();
      });
    });

    const pageField = elementFromHtml(`
      <div class="field full">
        <label for="pageTarget">Resume length preference</label>
        <select id="pageTarget" name="pageTarget">
          <option value="1" ${state.pageTarget !== "2" ? "selected" : ""}>Target 1 page</option>
          <option value="2" ${state.pageTarget === "2" ? "selected" : ""}>Allow up to 2 pages</option>
        </select>
      </div>
    `);
    form.appendChild(pageField);
  }

  function renderOptionalDetails() {
    if (!state.selectedSections.length) {
      form.appendChild(elementFromHtml(`<p class="muted-copy">No optional sections selected.</p>`));
      return;
    }

    state.selectedSections.forEach((section) => {
      if (!state.optional[section]) state.optional[section] = [blankGeneric(section)];
      const list = repeatList(section, state.optional[section], (item, index) => optionalEntryFields(section, item, index));
      form.appendChild(list);
      addRepeaterButtons(list, () => state.optional[section].push(blankGeneric(section)), state.optional[section]);
    });
  }

  function renderFinish() {
    form.appendChild(
      elementFromHtml(`
        <div class="entry-card">
          <p><strong>ATS checklist</strong></p>
          <ul class="resume-list">
            <li>Single-column A4 portrait layout with plain headings.</li>
            <li>Text-based content, no images, icons, tables, or decorative columns in the resume itself.</li>
            <li>Mostly black and gray with one subtle accent line.</li>
            <li>PDF via print dialog and editable DOCX export.</li>
          </ul>
        </div>
      `)
    );
  }

  function optionalEntryFields(section, item, index) {
    if (section === "Languages") {
      return `<div class="form-grid">${field("Language", `optional.${section}.${index}.title`, item.title)}${field("Proficiency", `optional.${section}.${index}.subtitle`, item.subtitle)}</div>`;
    }

    if (section === "Interests") {
      return `<div class="form-grid">${textarea("Interests", `optional.${section}.${index}.details`, item.details, "Example: Technical writing, open-source, chess")}</div>`;
    }

    if (section === "References") {
      return `<div class="form-grid">${field("Name", `optional.${section}.${index}.title`, item.title)}${field("Role / company", `optional.${section}.${index}.subtitle`, item.subtitle)}${field("Contact", `optional.${section}.${index}.details`, item.details)}</div>`;
    }

    const firstLabel = section === "Links" ? "Label" : "Title";
    return `
      <div class="form-grid">
        ${field(firstLabel, `optional.${section}.${index}.title`, item.title)}
        ${field("Organization / context", `optional.${section}.${index}.subtitle`, item.subtitle)}
        ${field("Location", `optional.${section}.${index}.location`, item.location)}
        ${field("Dates", `optional.${section}.${index}.end`, item.end)}
        ${section === "Links" ? field("URL", `optional.${section}.${index}.url`, item.url || "", "url") : ""}
        ${textarea("Details / bullets", `optional.${section}.${index}.details`, item.details, "One bullet per line")}
      </div>
    `;
  }

  function field(label, name, value = "", type = "text", required = false, placeholder = "") {
    return `
      <div class="field">
        <label for="${cssId(name)}">${escapeHtml(label)}</label>
        <input id="${cssId(name)}" name="${escapeHtml(name)}" type="${type}" value="${escapeAttr(value)}" ${required ? "required" : ""} placeholder="${escapeAttr(placeholder)}">
      </div>
    `;
  }

  function textarea(label, name, value = "", placeholder = "", required = false) {
    return `
      <div class="field full">
        <label for="${cssId(name)}">${escapeHtml(label)}</label>
        <textarea id="${cssId(name)}" name="${escapeHtml(name)}" ${required ? "required" : ""} placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || "")}</textarea>
      </div>
    `;
  }

  function repeatList(title, items, renderer) {
    const wrapper = document.createElement("section");
    wrapper.className = "repeat-list";
    wrapper.innerHTML = `<div class="entry-header"><span class="group-title">${escapeHtml(title)}</span></div>`;
    items.forEach((item, index) => {
      const card = elementFromHtml(`
        <div class="entry-card" data-index="${index}">
          <div class="entry-header">
            <strong>${escapeHtml(title)} ${items.length > 1 ? index + 1 : ""}</strong>
            <button class="link-button remove-entry" type="button" data-index="${index}">Remove</button>
          </div>
          ${renderer(item, index)}
        </div>
      `);
      wrapper.appendChild(card);
    });
    return wrapper;
  }

  function addRepeaterButtons(wrapper, addFn, collection) {
    const addButton = document.createElement("button");
    addButton.className = "secondary-button";
    addButton.type = "button";
    addButton.textContent = "+ Add";
    addButton.addEventListener("click", () => {
      syncForm();
      addFn();
      render();
    });
    wrapper.appendChild(addButton);

    wrapper.querySelectorAll(".remove-entry").forEach((button) => {
      button.addEventListener("click", () => {
        syncForm();
        collection.splice(Number(button.dataset.index), 1);
        if (!collection.length) collection.push({});
        render();
      });
    });
  }

  function syncForm() {
    const data = new FormData(form);

    if (steps[currentStep].id === "sections") {
      state.selectedSections = data.getAll("selectedSections");
      state.pageTarget = data.get("pageTarget") || "1";
      state.selectedSections.forEach((section) => {
        if (!state.optional[section]) state.optional[section] = [blankGeneric(section)];
      });
      return;
    }

    for (const [name, value] of data.entries()) {
      setPath(state, name, value.trim());
    }
  }

  function setPath(target, path, value) {
    const parts = path.split(".");
    let cursor = target;
    parts.forEach((part, index) => {
      const key = Number.isInteger(Number(part)) && part !== "" ? Number(part) : part;
      if (index === parts.length - 1) {
        cursor[key] = value;
        return;
      }
      if (cursor[key] === undefined) cursor[key] = {};
      cursor = cursor[key];
    });
  }

  function renderPreview() {
    const sectionsHtml = [
      educationHtml(),
      skillsHtml(),
      ...state.selectedSections.map(optionalSectionHtml),
    ].join("");

    preview.innerHTML = `
      <header class="resume-header">
        <h2>${escapeHtml(state.personal.name || "Your Name")}</h2>
        <div class="contact-line">${contactItems().map((item) => `<span>${item}</span>`).join("<span>|</span>")}</div>
      </header>
      ${sectionsHtml}
    `;

    const pages = Math.max(1, Math.ceil(preview.scrollHeight / preview.clientHeight));
    const target = state.pageTarget === "2" ? "2 pages allowed" : "1 page target";
    pageCountLabel.textContent = `${target} · preview about ${pages} page${pages > 1 ? "s" : ""}`;
  }

  function contactItems() {
    const items = [];
    addText(items, state.personal.phone);
    addText(items, state.personal.email);
    addText(items, state.personal.address);
    addLink(items, "GitHub", state.personal.github);
    addLink(items, "LinkedIn", state.personal.linkedin);
    state.personal.extras.forEach((extra) => addText(items, [extra.label, extra.value].filter(Boolean).join(": ")));
    return items;
  }

  function addText(items, value) {
    if (value) items.push(escapeHtml(value));
  }

  function addLink(items, label, url) {
    if (!url) return;
    items.push(`<a href="${escapeAttr(url)}">${escapeHtml(label)}</a>`);
  }

  function educationHtml() {
    const entries = state.education.filter((item) => item.degree || item.institution || item.details);
    if (!entries.length) return "";
    return sectionHtml("Education", entries.map((item) => `
      <div class="resume-item">
        <div class="resume-row"><span>${escapeHtml(item.degree)}</span><span>${escapeHtml(item.end)}</span></div>
        <div class="resume-subrow"><span>${escapeHtml(item.institution)}</span><span>${escapeHtml(item.location)}</span></div>
        ${detailsHtml(item.details)}
      </div>
    `).join(""));
  }

  function skillsHtml() {
    const entries = state.skills.filter((item) => item.category || item.items);
    if (!entries.length) return "";
    return sectionHtml("Skills", `<ul class="skill-list">${entries.map((item) => `<li><strong>${escapeHtml(item.category)}:</strong> ${escapeHtml(item.items)}</li>`).join("")}</ul>`);
  }

  function optionalSectionHtml(section) {
    const entries = (state.optional[section] || []).filter((item) => item.title || item.subtitle || item.details || item.url);
    if (!entries.length) return "";

    if (section === "Languages") {
      return sectionHtml(section, entries.map((item) => `<div class="resume-item"><strong>${escapeHtml(item.title)}</strong>${item.subtitle ? ` - ${escapeHtml(item.subtitle)}` : ""}</div>`).join(""));
    }

    if (section === "Interests") {
      return sectionHtml(section, `<p>${escapeHtml(entries.map((item) => item.details).filter(Boolean).join(", "))}</p>`);
    }

    return sectionHtml(section, entries.map((item) => `
      <div class="resume-item">
        <div class="resume-row"><span>${entryTitle(section, item)}</span><span>${escapeHtml(item.end || "")}</span></div>
        <div class="resume-subrow"><span>${escapeHtml(item.subtitle || "")}</span><span>${escapeHtml(item.location || "")}</span></div>
        ${detailsHtml(item.details)}
      </div>
    `).join(""));
  }

  function entryTitle(section, item) {
    if (section === "Links" && item.url) {
      return `<a href="${escapeAttr(item.url)}">${escapeHtml(item.title || item.url)}</a>`;
    }
    return escapeHtml(item.title || "");
  }

  function sectionHtml(title, body) {
    return `<section class="resume-section"><h3>${escapeHtml(title)}</h3>${body}</section>`;
  }

  function detailsHtml(text) {
    if (!text) return "";
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1) {
      return `<ul class="resume-list">${lines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s*/, ""))}</li>`).join("")}</ul>`;
    }
    return `<p>${escapeHtml(lines[0] || "")}</p>`;
  }

  function downloadDocx() {
    const filename = slugify(state.personal.name || "resume") + ".docx";
    const documentXml = buildDocumentXml();
    const files = {
      "[Content_Types].xml": contentTypesXml(),
      "_rels/.rels": relsXml(),
      "word/document.xml": documentXml,
      "word/styles.xml": stylesXml(),
    };
    const blob = new Blob([createZip(files)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function buildDocumentXml() {
    const body = [];
    body.push(paragraph(state.personal.name || "Your Name", "Title"));
    body.push(paragraph(contactItemsText().join(" | "), "Contact"));
    body.push(sectionDocx("Education"));
    state.education.filter((item) => item.degree || item.institution || item.details).forEach((item) => {
      body.push(paragraph([item.degree, item.end].filter(Boolean).join(" - "), "Strong"));
      body.push(paragraph([item.institution, item.location].filter(Boolean).join(", "), "Italic"));
      body.push(...bulletParagraphs(item.details));
    });
    body.push(sectionDocx("Skills"));
    state.skills.filter((item) => item.category || item.items).forEach((item) => body.push(paragraph(`${item.category}: ${item.items}`)));

    state.selectedSections.forEach((section) => {
      const entries = (state.optional[section] || []).filter((item) => item.title || item.subtitle || item.details || item.url);
      if (!entries.length) return;
      body.push(sectionDocx(section));
      entries.forEach((item) => {
        body.push(paragraph([item.title || item.url, item.end].filter(Boolean).join(" - "), "Strong"));
        const context = [item.subtitle, item.location].filter(Boolean).join(", ");
        if (context) body.push(paragraph(context, "Italic"));
        body.push(...bulletParagraphs(item.details));
      });
    });

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  }

  function sectionDocx(text) {
    return paragraph(text.toUpperCase(), "Heading");
  }

  function bulletParagraphs(text) {
    if (!text) return [];
    return text.split(/\n+/).map((line) => line.trim().replace(/^[-*]\s*/, "")).filter(Boolean).map((line) => paragraph(line, "Bullet"));
  }

  function paragraph(text, style = "") {
    const escaped = escapeXml(text || "");
    const runStyle = style === "Strong" ? "<w:rPr><w:b/></w:rPr>" : style === "Italic" ? "<w:rPr><w:i/><w:color w:val=\"4B5563\"/></w:rPr>" : "";
    const pStyle = style && !["Strong", "Italic"].includes(style) ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
    const bullet = style === "Bullet" ? "<w:pPr><w:ind w:left=\"360\" w:hanging=\"180\"/></w:pPr>" : pStyle;
    return `<w:p>${bullet}<w:r>${runStyle}<w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
  }

  function contactItemsText() {
    const extras = state.personal.extras.map((extra) => [extra.label, extra.value].filter(Boolean).join(": ")).filter(Boolean);
    return [state.personal.phone, state.personal.email, state.personal.address, state.personal.github, state.personal.linkedin, ...extras].filter(Boolean);
  }

  function contentTypesXml() {
    return `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
  }

  function relsXml() {
    return `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  }

  function stylesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="52"/><w:font w:ascii="Arial"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Contact"><w:name w:val="Contact"/><w:rPr><w:sz w:val="19"/><w:color w:val="404852"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading"><w:name w:val="Heading"/><w:pPr><w:spacing w:before="180" w:after="60"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="111827"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Bullet"><w:name w:val="Bullet"/><w:rPr><w:sz w:val="20"/></w:rPr></w:style></w:styles>`;
  }

  function createZip(files) {
    const encoder = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;

    Object.entries(files).forEach(([name, content]) => {
      const nameBytes = encoder.encode(name);
      const data = encoder.encode(content);
      const crc = crc32(data);
      const local = concatBytes(
        u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data
      );
      chunks.push(local);
      central.push(concatBytes(
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes
      ));
      offset += local.length;
    });

    const centralStart = offset;
    const centralBytes = concatBytes(...central);
    const end = concatBytes(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(centralBytes.length), u32(centralStart), u16(0));
    return concatBytes(...chunks, centralBytes, end);
  }

  function crc32(data) {
    let crc = -1;
    for (let i = 0; i < data.length; i += 1) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  const crcTable = Array.from({ length: 256 }, (_, index) => {
    let c = index;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });

  function u16(value) {
    return new Uint8Array([value & 255, (value >>> 8) & 255]);
  }

  function u32(value) {
    return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
  }

  function concatBytes(...arrays) {
    const total = arrays.reduce((sum, item) => sum + item.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    arrays.forEach((item) => {
      result.set(item, offset);
      offset += item.length;
    });
    return result;
  }

  function elementFromHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function cssId(value) {
    return value.replace(/[^a-z0-9]+/gi, "-");
  }

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "resume";
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function escapeXml(value) {
    return String(value || "").replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char]));
  }
})();
