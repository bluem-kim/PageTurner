import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

const REPORT_FILE_NAME = "PageTurnerAnalyticsReport.pdf";

const normalizePdfFileName = (name) => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return REPORT_FILE_NAME;
  return /\.pdf$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderTable = (section) => {
  const headers = Array.isArray(section?.headers) ? section.headers : [];
  const rows = Array.isArray(section?.rows) ? section.rows : [];

  const headHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyHtml = rows.length
    ? rows
        .map((row) => {
          const cells = (Array.isArray(row) ? row : [row]).map(
            (cell) => `<td>${escapeHtml(cell)}</td>`
          );
          return `<tr>${cells.join("")}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${Math.max(headers.length, 1)}">No data</td></tr>`;

  return `<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
};

const renderBarGraph = (graphTitle, points = []) => {
  const max = Math.max(...points.map((point) => Number(point?.value || 0)), 0);
  if (!points.length) return "";

  const rows = points
    .map((point) => {
      const value = Number(point?.value || 0);
      const width = max > 0 ? Math.max((value / max) * 100, 6) : 6;
      return `
        <div class="bar-row">
          <div class="bar-head">
            <span>${escapeHtml(point?.label || "Unknown")}</span>
            <span>${escapeHtml(point?.displayValue ?? value)}</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
        </div>
      `;
    })
    .join("");

  return `<h3>${escapeHtml(graphTitle || "Graph")}</h3><div>${rows}</div>`;
};

export const buildAnalyticsPdfHtml = ({ title, summaryLines = [], sections = [] }) => {
  const generatedAt = new Date().toLocaleString("en-PH");

  const summaryHtml = summaryLines.length
    ? `<div class="kpi">${summaryLines
        .map(
          (line) =>
            `<p><strong>${escapeHtml(line?.label || "")}</strong> ${escapeHtml(line?.value || "")}</p>`
        )
        .join("")}</div>`
    : "";

  const sectionsHtml = sections
    .map((section) => {
      const graphHtml = Array.isArray(section?.graphData)
        ? renderBarGraph(section?.graphTitle, section.graphData)
        : "";

      return `
        <section>
          <h2>${escapeHtml(section?.title || "Section")}</h2>
          ${graphHtml}
          ${renderTable(section)}
        </section>
      `;
    })
    .join("");

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #243447; }
          h1 { margin: 0 0 4px; color: #0b3954; }
          h2 { margin: 20px 0 8px; color: #1f8a70; }
          h3 { margin: 10px 0 6px; color: #415a77; font-size: 13px; }
          p.meta { margin: 0 0 12px; color: #556; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #d6dde4; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #eef4f8; }
          .kpi { background: #f5fbff; border: 1px solid #d6e7f5; padding: 10px; margin-top: 10px; }
          .kpi p { margin: 4px 0; font-size: 12px; }
          .bar-row { margin-bottom: 8px; }
          .bar-head { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px; }
          .bar-track { height: 8px; border-radius: 999px; background: #d8e8f2; overflow: hidden; }
          .bar-fill { height: 8px; background: #1f8a70; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title || "PageTurnerAnalyticsReport")}</h1>
        <p class="meta">Generated: ${escapeHtml(generatedAt)}</p>
        ${summaryHtml}
        ${sectionsHtml}
      </body>
    </html>
  `;
};

export const buildListPdfHtml = ({ title, summaryLines = [], headers = [], rows = [] }) => {
  const generatedAt = new Date().toLocaleString("en-PH");
  const section = {
    headers,
    rows,
  };

  const summaryHtml = summaryLines.length
    ? `<div class="kpi">${summaryLines
        .map(
          (line) =>
            `<p><strong>${escapeHtml(line?.label || "")}</strong> ${escapeHtml(line?.value || "")}</p>`
        )
        .join("")}</div>`
    : "";

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #243447; }
          h1 { margin: 0 0 4px; color: #0b3954; }
          p.meta { margin: 0 0 12px; color: #556; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #d6dde4; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #eef4f8; }
          .kpi { background: #f5fbff; border: 1px solid #d6e7f5; padding: 10px; margin-top: 10px; }
          .kpi p { margin: 4px 0; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title || "PageTurner Report")}</h1>
        <p class="meta">Generated: ${escapeHtml(generatedAt)}</p>
        ${summaryHtml}
        ${renderTable(section)}
      </body>
    </html>
  `;
};

export const exportPdfFromHtml = async (
  html,
  { fileName = REPORT_FILE_NAME, dialogTitle = "Export PDF report" } = {}
) => {
  const file = await Print.printToFileAsync({ html });
  const targetUri = `${FileSystem.documentDirectory}${normalizePdfFileName(fileName)}`;

  await FileSystem.deleteAsync(targetUri, { idempotent: true });
  await FileSystem.copyAsync({ from: file.uri, to: targetUri });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(targetUri, {
      mimeType: "application/pdf",
      dialogTitle,
      UTI: "com.adobe.pdf",
    });
  }

  return { uri: targetUri, shared: canShare };
};

export { REPORT_FILE_NAME };
