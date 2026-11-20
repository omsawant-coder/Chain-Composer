(() => {
  const form = document.querySelector("#composition-form");
  const fileInput = document.querySelector("#text-file");
  const dropZone = document.querySelector("#drop-zone");
  const fileDetails = document.querySelector("#file-details");
  const fileName = document.querySelector("#file-name");
  const fileSize = document.querySelector("#file-size");
  const removeFile = document.querySelector("#remove-file");
  const countInput = document.querySelector("#word-count");
  const decrement = document.querySelector("#decrement");
  const increment = document.querySelector("#increment");
  const generateButton = document.querySelector("#generate-button");
  const resultSection = document.querySelector("#result-section");
  const composition = document.querySelector("#composition-text");
  const toastRegion = document.querySelector("#toast-region");
  let selectedFile = null;
  let isSubmitting = false;

  const iconCopy = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></svg>';

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = message;
    toastRegion.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => toast.remove(), 180);
    }, 2600);
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function setFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt")) {
      showToast("Please choose a .txt file.", "error");
      fileInput.value = "";
      return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    fileDetails.hidden = false;
    dropZone.classList.add("has-file");
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = "";
    fileDetails.hidden = true;
    dropZone.classList.remove("has-file");
  }

  fileInput?.addEventListener("change", () => setFile(fileInput.files[0]));
  removeFile?.addEventListener("click", clearFile);

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone?.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("is-dragging");
    });
  });
  dropZone?.addEventListener("drop", (event) => setFile(event.dataTransfer.files[0]));
  dropZone?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  decrement?.addEventListener("click", () => {
    countInput.value = String(Math.max(1, Number(countInput.value || 1) - 10));
  });
  increment?.addEventListener("click", () => {
    countInput.value = String(Math.min(1000, Number(countInput.value || 0) + 10));
  });

  async function generate(event) {
    event?.preventDefault();
    if (isSubmitting) return;

    if (!selectedFile) {
      showToast("Choose a text file to begin.", "error");
      dropZone?.focus();
      return;
    }
    const count = Number(countInput.value);
    if (!Number.isInteger(count) || count < 1 || count > 1000) {
      showToast("Choose a word count between 1 and 1000.", "error");
      countInput.focus();
      return;
    }

    isSubmitting = true;
    generateButton.disabled = true;
    generateButton.classList.add("is-loading");
    generateButton.querySelector(".button-label").textContent = "Composing...";

    const body = new FormData();
    body.append("text_file", selectedFile);
    body.append("word_count", String(count));

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Generation failed.");
      renderResult(payload);
      showToast("Composition generated.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      isSubmitting = false;
      generateButton.disabled = false;
      generateButton.classList.remove("is-loading");
      generateButton.querySelector(".button-label").textContent = "Generate Composition";
    }
  }

  function renderResult(payload) {
    composition.value = payload.result;
    composition.textContent = payload.result;
    document.querySelector("#result-empty").hidden = true;
    resultSection.hidden = false;
    document.querySelector("#word-metric").textContent = payload.metrics.words;
    document.querySelector("#character-metric").textContent = payload.metrics.characters;
    document.querySelector("#unique-metric").textContent = payload.metrics.unique_words;
    document.querySelector("#time-metric").textContent = `${payload.metrics.generation_time_ms} ms`;
    drawTransitions(payload.transitions);
    window.setTimeout(() => resultSection.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  form?.addEventListener("submit", generate);

  document.querySelector("#copy-button")?.addEventListener("click", async () => {
    if (!composition.value) return;
    try {
      await navigator.clipboard.writeText(composition.value);
      showToast("Composition copied.");
    } catch {
      composition.select();
      document.execCommand("copy");
      showToast("Composition copied.");
    }
  });

  document.querySelector("#download-button")?.addEventListener("click", async () => {
    if (!composition.value) return;
    const body = new FormData();
    body.append("generated_text", composition.value);
    const response = await fetch("/download", { method: "POST", body });
    if (!response.ok) {
      showToast("Unable to download the composition.", "error");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "generated_output.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Download started.");
  });

  document.querySelector("#regenerate-button")?.addEventListener("click", generate);
  document.querySelector("#clear-button")?.addEventListener("click", () => {
    composition.value = "";
    composition.textContent = "";
    resultSection.hidden = true;
    document.querySelector("#result-empty").hidden = false;
    showToast("Result cleared.");
  });

  function drawTransitions(transitions) {
    const svg = document.querySelector("#chain-visualization");
    if (!svg || !transitions) return;
    const words = Object.keys(transitions).slice(0, 8);
    if (!words.length) return;
    const width = 760;
    const height = 270;
    const positions = [
      [90, 135], [230, 58], [230, 212], [390, 135],
      [530, 58], [530, 212], [670, 135], [390, 240],
    ];
    let markup = '<defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#aab0d8"/></marker></defs>';

    words.forEach((word, index) => {
      const [x, y] = positions[index];
      const nextNodes = (transitions[word] || []).slice(0, 2);
      nextNodes.forEach((next) => {
        const targetIndex = words.indexOf(next.word);
        if (targetIndex >= 0) {
          const [tx, ty] = positions[targetIndex];
          markup += `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" class="chain-line" marker-end="url(#arrowhead)"/>`;
        }
      });
    });
    words.forEach((word, index) => {
      const [x, y] = positions[index];
      const outgoing = transitions[word] || [];
      const title = outgoing.length
        ? outgoing.map((item) => `${item.word}: ${item.probability ?? item.weight}%`).join(", ")
        : "No outgoing transition";
      markup += `<g class="chain-node" tabindex="0" role="img" aria-label="${word}. ${title}"><circle cx="${x}" cy="${y}" r="42"/><text x="${x}" y="${y + 5}" text-anchor="middle">${word}</text><title>${word}: ${title}</title></g>`;
    });
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = markup;
  }

  if (composition?.value) {
    document.querySelector("#result-empty").hidden = true;
    resultSection.hidden = false;
  }
})();
