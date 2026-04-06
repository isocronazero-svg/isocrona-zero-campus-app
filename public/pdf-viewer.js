import * as pdfjsLib from "/vendor/pdfjs/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.mjs";

const params = new URLSearchParams(window.location.search);
const source = params.get("src") || "";
const name = params.get("name") || "Documento PDF";

const viewerTitle = document.getElementById("viewerTitle");
const viewerDownload = document.getElementById("viewerDownload");
const viewerState = document.getElementById("viewerState");
const viewerPages = document.getElementById("viewerPages");

viewerTitle.textContent = name;
viewerDownload.href = source;
viewerDownload.download = name;

async function renderPdf() {
  if (!source) {
    viewerState.textContent = "No se ha indicado ningun documento para visualizar.";
    return;
  }

  try {
    const response = await fetch(source, { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error("No se ha podido cargar el documento.");
    }
    const pdfBuffer = await response.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBuffer
    });
    const pdf = await loadingTask.promise;
    viewerState.hidden = true;
    viewerPages.hidden = false;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.35 });
      const pageCard = document.createElement("section");
      pageCard.className = "viewer-page";

      const meta = document.createElement("p");
      meta.className = "viewer-page-meta";
      meta.textContent = `Pagina ${pageNumber} de ${pdf.numPages}`;

      const canvas = document.createElement("canvas");
      canvas.className = "viewer-canvas";
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      pageCard.appendChild(meta);
      pageCard.appendChild(canvas);
      viewerPages.appendChild(pageCard);

      await page.render({
        canvasContext: context,
        viewport
      }).promise;
    }
  } catch (error) {
    viewerState.textContent = "No se ha podido renderizar el PDF en el visor interno.";
    console.error(error);
  }
}

renderPdf();
