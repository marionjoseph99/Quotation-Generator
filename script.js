// Simple vanilla JS version of the quotation generator
const SERVICE_OPTIONS = [
  "3D Modeling",
  "Architectural Planning",
  "Interior Design",
  "Rendering (Still Images)",
  "Rendering (Animation/Walkthrough)",
  "Presentation Board Layout",
  "Drafting / 2D CAD",
  "2D CAD Elevation",
  "2D CAD Section",
  "2D CAD Roof Plan",
  "2D CAD RCP",
  "Site Development Plan",
  "Conceptual Design",
  "As-built Drawings",
  "Custom / Other",
];

const data = {
  quotationNumber: "012-26",
  items: [],
  customerName: "",
  issuedDate: new Date().toISOString().split('T')[0],
  dueDate: "",
  deliverables: "- All Required Files",
  note: "All prices are subject to change based on the final scope of work, budget, client specifications, and any additional tasks that may arise during the course of the project. Prices are negotiable depending on the project's requirements and budget.",
  paymentDetails:
    "A 50% down payment is required before starting the project. The remaining balance must be settled upon completion of the project.\n\nG-CASH: 09158748995 - Marjo P.\nGoTyme: 012507358498",
  confidentiality:
    "Upon receiving this quotation, both parties agree that all project files, visuals, and outputs will remain confidential and used solely for the purposes outlined. The designer will not share, publish, or reuse any materials without the client's written consent. Credit and authorship will remain with the client, and no part of the project will be shown publicly unless allowed by both parties. This agreement holds unless modified in writing.",
  termsAndConditions: 
    "1. Payment & Reservation\n" +
    "• Down Payment (DP): 50% is required before work starts.\n" +
    "• Installment Option: If full 50% isn't possible, pay 30% to start and 20% shortly after to keep your slot.\n" +
    "• Slot Reservation: DP confirms your slot. Projects are first-come, first-served.\n" +
    "• Priority Queue: Paid DP clients are prioritized during high workload.\n" +
    "• Final Settlement: Remaining balance is due before release of final high-resolution files.\n\n" +
    "2. Service Fees & Quality\n" +
    "• Rush Orders: Faster-than-agreed turnaround adds a 400 PHP rush fee.\n" +
    "• Flexible Discounting: Discounts beyond 40% of the original quote may result in a \"Simplified Quality\" output.\n" +
    "• Revision Policy: Includes 2 minor revision rounds. Major changes or extra revisions are billed separately.",
  downpaymentPercent: 50,
};

const uiState = {
  showTerms: false,
  history: [],
  historyIndex: -1,
  revisionVersion: "1.0",
  showQuotation: true,
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getDueStatus(dueDateStr) {
  if (!dueDateStr) return { text: "", color: "text-slate-500", bgColor: "bg-slate-100" };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(dueDateStr + "T00:00:00");
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""}`, color: "text-red-700", bgColor: "bg-red-100" };
  } else if (diffDays === 0) {
    return { text: "Due Today", color: "text-amber-700", bgColor: "bg-amber-100" };
  } else {
    return { text: `Due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`, color: "text-green-700", bgColor: "bg-green-100" };
  }
}

function saveHistory() {
  // Keep only up to 20 history states to avoid memory bloat
  uiState.history = uiState.history.slice(0, uiState.historyIndex + 1);
  uiState.history.push(JSON.parse(JSON.stringify(data)));
  uiState.historyIndex = uiState.history.length - 1;
  if (uiState.history.length > 20) {
    uiState.history.shift();
    uiState.historyIndex--;
  }
}

function undo() {
  if (uiState.historyIndex > 0) {
    uiState.historyIndex--;
    Object.assign(data, JSON.parse(JSON.stringify(uiState.history[uiState.historyIndex])));
    render();
  }
}

function redo() {
  if (uiState.historyIndex < uiState.history.length - 1) {
    uiState.historyIndex++;
    Object.assign(data, JSON.parse(JSON.stringify(uiState.history[uiState.historyIndex])));
    render();
  }
}

function saveAsPng() {
  const quoteElement = document.getElementById("quotation-print-area");
  if (quoteElement) {
    html2canvas(quoteElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: true,
      allowTaint: true,
    }).then(canvas => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL("image/png");
      const safeCustomerName = (data.customerName || 'quotation').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${safeCustomerName}_${data.quotationNumber}.png`;
      a.click();
    });
  }
}

function exportQuotation() {
  const exportData = { data, revisionVersion: uiState.revisionVersion };
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeCustomerName = (data.customerName || 'quotation').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `quotation-${safeCustomerName}-v${uiState.revisionVersion}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importQuotation() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        Object.assign(data, imported.data);
        uiState.revisionVersion = imported.revisionVersion || "1.0";
        saveHistory();
        render();
        alert("Quotation imported successfully!");
      } catch (err) {
        alert("Error importing file: " + err.message);
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

function totals() {
  const total = data.items.reduce((sum, item) => sum + item.qty * item.cost, 0);
  const downpayment = total * (Number(data.downpaymentPercent) / 100 || 0);
  return { total, downpayment };
}

function render(focusInfo) {
  const { total, downpayment } = totals();
  const app = document.getElementById("app");
  if (!app) return;

  // Enforce light theme
  document.documentElement.style.colorScheme = 'light';
  document.body.style.backgroundColor = '#f1f5f9';

  const validServices = data.items.map(i => i.service).filter(Boolean);
  const generatedScopeText = validServices.length > 0 
    ? "This service includes:\n• " + validServices.join("\n• ")
    : "No services selected.";

  const itemsForms =
    data.items
      .map(
        (item) => `
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group" data-id="${item.id}">
          <button class="remove-item absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200" title="Remove row">
            ✕
          </button>
          <div class="mb-3">
            <label class="block text-xs font-medium text-slate-500 mb-1">Service Description</label>
            <input type="text" class="item-service w-full p-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-amber-500" value="${item.service}" placeholder="Enter service description..." />
          </div>
          <div class="mb-3">
            <label class="block text-xs font-medium text-slate-500 mb-1">Notes (Optional)</label>
            <input type="text" class="item-notes w-full p-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-amber-500" value="${item.notes || ""}" placeholder="e.g., 2 revisions included..." />
          </div>
          <div class="flex gap-3 items-end">
            <div class="w-1/3">
              <label class="block text-xs font-medium text-slate-500 mb-1">Area / Qty</label>
              <input type="text" inputmode="decimal" class="item-qty w-full p-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-amber-500" value="${item._qtyStr !== undefined ? item._qtyStr : item.qty}" />
            </div>
            <div class="w-1/3">
              <label class="block text-xs font-medium text-slate-500 mb-1">Cost / qty (₱)</label>
              <input type="text" inputmode="decimal" class="item-cost w-full p-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-amber-500" value="${item._costStr !== undefined ? item._costStr : item.cost}" />
            </div>
            <div class="w-1/3 bg-slate-100/80 p-2 rounded-md border border-slate-200 flex flex-col justify-center h-[38px]">
              <span class="block text-[9px] font-semibold text-slate-400 uppercase leading-none mb-0.5">Item Total</span>
              <span class="text-xs font-bold text-slate-700 leading-none truncate">${formatCurrency(item.qty * item.cost)}</span>
            </div>
          </div>
        </div>`
      )
      .join("");

  const itemsRows =
    data.items.length > 0
      ? data.items
          .map(
            (item, index) => `
          <tr class="${index % 2 === 0 ? "bg-white" : "bg-slate-50"}">
            <td class="px-3 py-2 font-medium text-slate-800">${item.service || "-"}</td>
            <td class="px-3 py-2 text-center text-slate-600">${item.qty}</td>
            <td class="px-3 py-2 text-right text-slate-600">${formatCurrency(item.cost)}</td>
            <td class="px-3 py-2 text-right font-bold text-slate-800 bg-slate-50/50">${formatCurrency(
              item.qty * item.cost
            )}</td>
          </tr>`
          )
          .join("")
      : `<tr><td colspan="4" class="px-5 py-8 text-center text-slate-400 italic">No services added yet.</td></tr>`;

  app.innerHTML = `
    <div class="flex flex-col xl:flex-row gap-8">
      <div class="w-full xl:w-[450px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-auto xl:h-[calc(100vh-4rem)] sticky top-8 print:hidden">
        <div class="bg-amber-50 text-slate-900 p-6 flex flex-col gap-5 shrink-0 border-b border-amber-200">
          <div class="flex flex-col gap-3">
            <h2 class="text-xl font-bold text-slate-900">Quotation Setup</h2>
            <div class="flex gap-2 flex-wrap">
              <button id="copy-img-btn" class="flex-1 min-w-max bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex justify-center items-center gap-2">Copy Image</button>
              <button id="save-png-btn" class="flex-1 min-w-max bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">Save as PNG</button>
              <button id="print-btn" class="flex-1 min-w-max bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">Print / PDF</button>
              <button id="toggle-quote-btn" class="flex-1 min-w-max bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm" title="Toggle quotation view">${uiState.showQuotation ? 'Hide' : 'Show'}</button>
              <button id="undo-btn" class="flex-1 min-w-max bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm" title="Undo">↶</button>
              <button id="redo-btn" class="flex-1 min-w-max bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm" title="Redo">↷</button>
              <button id="export-btn" class="flex-1 min-w-max bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm">Save</button>
              <button id="import-btn" class="flex-1 min-w-max bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg font-semibold transition-colors text-sm">Load</button>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 flex justify-between items-center border border-amber-200 shadow-sm">
            <div>
              <p class="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Grand Total</p>
              <p class="text-2xl font-bold text-amber-600">${formatCurrency(total)}</p>
            </div>
            <div class="text-right">
              <p class="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Downpayment (${data.downpaymentPercent}%)</p>
              <p class="text-lg font-bold text-slate-900">${formatCurrency(downpayment)}</p>
            </div>
          </div>
        </div>
        <div class="p-6 overflow-y-auto flex-1 space-y-8">
          <div class="space-y-4">
            <h3 class="font-semibold text-slate-400 uppercase tracking-wider text-xs">Document Info</h3>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Quotation No.</label>
              <input type="text" name="quotationNumber" value="${data.quotationNumber}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
              <input type="text" name="customerName" value="${data.customerName}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Issued Date</label>
              <input type="date" name="issuedDate" value="${data.issuedDate}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input type="date" name="dueDate" value="${data.dueDate}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Scope of Service</label>
              <textarea readonly rows="3" class="w-full p-2.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg outline-none resize-none cursor-not-allowed text-sm">${generatedScopeText}</textarea>
            </div>
          </div>
          <hr class="border-slate-100" />
          <div class="space-y-4">
            <h3 class="font-semibold text-slate-400 uppercase tracking-wider text-xs">Services</h3>
            <div class="space-y-3" id="items-forms">${itemsForms}</div>
            <button id="add-item" class="w-full text-amber-600 hover:text-amber-700 text-sm font-medium flex justify-center items-center gap-1 py-2 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">＋ Add Row</button>
            <div class="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
              <span class="text-sm font-medium text-blue-900">Downpayment %</span>
              <div class="flex items-center gap-2">
                <input type="text" inputmode="numeric" name="downpaymentPercent" value="${data.downpaymentPercent}" class="w-16 p-1 text-center bg-white border border-blue-200 rounded-md text-sm outline-none focus:border-amber-500" />
                <span class="text-sm font-bold text-blue-900">%</span>
              </div>
            </div>
          </div>
          <hr class="border-slate-100" />
          <div class="space-y-4 pb-8">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-slate-400 uppercase tracking-wider text-xs">Terms & Notes</h3>
              <button id="toggle-terms" class="text-sm font-semibold text-amber-700 hover:text-amber-600 underline">
                ${uiState.showTerms ? "Hide editor" : "Show editor"}
              </button>
            </div>

            ${uiState.showTerms
              ? `
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Deliverables</label>
                  <textarea name="deliverables" rows="2" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none resize-none text-sm">${data.deliverables}</textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Payment Details</label>
                  <textarea name="paymentDetails" rows="4" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none resize-none text-sm">${data.paymentDetails}</textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">General Notes</label>
                  <textarea name="note" rows="4" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none resize-none text-sm">${data.note}</textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Terms and Conditions</label>
                  <textarea name="termsAndConditions" rows="8" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none resize-none text-sm">${data.termsAndConditions}</textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1">Confidentiality Notice</label>
                  <textarea name="confidentiality" rows="4" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none resize-none text-sm">${data.confidentiality}</textarea>
                </div>
              `
              : `<p class="text-sm text-slate-500 italic">Terms & Notes editor is hidden. Click "Show editor" to edit these fields.</p>`}
          </div>
        </div>
      </div>

  <div class="flex-1 flex justify-center items-start print:w-full print:m-0 print:block" style="display: ${uiState.showQuotation ? 'flex' : 'none'}">
        <div id="quotation-print-area" class="bg-white w-full max-w-[210mm] min-h-fit h-auto shadow-2xl print:shadow-none print:w-[210mm] print:h-auto flex flex-col relative box-border mx-auto overflow-hidden text-slate-800">
          <div class="h-3 w-full bg-amber-500"></div>
          <div class="p-8 flex-1 flex flex-col">
            <header class="flex items-end justify-between gap-4 pb-4 border-b border-slate-300 mb-5">
              <div class="flex items-center gap-4 max-w-lg">
                <img src="logo.png" alt="Logo" class="h-16 w-auto object-contain object-left" />
                <div class="pl-3 border-l-2 border-amber-500 py-0.5">
                  <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    Your trusted partner for quality<br />
                    architectural commission.
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <h1 class="text-3xl font-black text-[#2c328a] tracking-tighter uppercase">Quotation</h1>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ref</span>
                  <span class="text-sm font-bold text-[#2c328a]">${data.quotationNumber}</span>
                </div>
              </div>
            </header>

            <div class="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h3 class="text-[#2c328a] font-bold text-xs uppercase mb-2 tracking-wider">Customer Profile</h3>
              <div class="grid grid-cols-3 gap-4 text-[10px]">
                <div>
                  <span class="text-slate-500 font-semibold uppercase tracking-wider">Customer</span>
                  <p class="text-slate-800 font-medium">${data.customerName || "—"}</p>
                </div>
                <div>
                  <span class="text-slate-500 font-semibold uppercase tracking-wider">Issued</span>
                  <p class="text-slate-800 font-medium">${formatDate(data.issuedDate) || "—"}</p>
                </div>
                <div class="flex flex-col justify-between">
                  <span class="text-slate-500 font-semibold uppercase tracking-wider">Due Date</span>
                  <div class="flex items-center gap-2">
                    <p class="text-slate-800 font-medium">${formatDate(data.dueDate) || "—"}</p>
                    ${data.dueDate ? `<span class="${getDueStatus(data.dueDate).bgColor} ${getDueStatus(data.dueDate).color} text-[9px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">${getDueStatus(data.dueDate).text}</span>` : ""}
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-5 grid grid-cols-2 gap-4 items-stretch">
              <div class="w-full bg-[#f8f9fc] p-4 rounded-xl border-l-4 border-[#2c328a] flex flex-col justify-between">
                <div>
                  <h3 class="text-[#2c328a] font-bold text-xs uppercase mb-1.5">Scope of Service</h3>
                  <p class="text-slate-700 text-[11px] whitespace-pre-wrap leading-tight">${generatedScopeText}</p>
                </div>
                <p class="text-red-500 italic mt-2 text-[9px] font-semibold">* Any task not mentioned in the scope is subject to additional cost.</p>
              </div>

              <div class="w-full flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full">
                <div class="flex-1 flex flex-col justify-center px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div class="flex justify-between items-center w-full">
                    <span class="font-bold text-[#2c328a] text-xs uppercase tracking-wide">Downpayment (${data.downpaymentPercent}%)</span>
                    <span class="font-bold text-sm text-slate-800">${formatCurrency(downpayment)}</span>
                  </div>
                </div>
                <div class="flex-1 flex flex-col justify-center px-4 py-3 bg-amber-500 text-white">
                  <div class="flex justify-between items-center w-full">
                    <span class="font-extrabold text-lg tracking-widest uppercase">Total</span>
                    <span class="font-extrabold text-xl">${formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-5 rounded-xl overflow-hidden border border-[#2c328a]/20 shadow-sm">
              <table class="w-full text-[11px] text-left">
                <thead class="bg-[#2c328a] text-white font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th class="px-3 py-2.5 w-5/12">Service</th>
                    <th class="px-3 py-2.5 text-center w-2/12">Area/Qty</th>
                    <th class="px-3 py-2.5 text-right w-2/12">Cost / Qty</th>
                    <th class="px-3 py-2.5 text-right w-3/12 bg-black/10">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">${itemsRows}</tbody>
              </table>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-5 border-t border-slate-200 pt-5">
              <div>
                <div class="flex items-center gap-1.5 mb-2">
                  <span class="font-bold text-blue-600 text-xs">01</span>
                  <h4 class="font-bold text-blue-600 text-xs uppercase">Deliverables</h4>
                </div>
                <p class="text-slate-600 text-[10px] whitespace-pre-wrap leading-tight">${data.deliverables}</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 mb-2">
                  <span class="font-bold text-amber-600 text-xs">02</span>
                  <h4 class="font-bold text-amber-600 text-xs uppercase">Notes</h4>
                </div>
                <p class="text-slate-600 text-[10px] whitespace-pre-wrap leading-tight italic">${data.note}</p>
              </div>
              <div>
                <div class="flex items-center gap-1.5 mb-2">
                  <span class="font-bold text-green-600 text-xs">03</span>
                  <h4 class="font-bold text-green-600 text-xs uppercase">Payment Details</h4>
                </div>
                <p class="text-slate-700 text-[10px] whitespace-pre-wrap leading-tight font-medium">${data.paymentDetails}</p>
              </div>
            </div>

            <div class="mb-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
              <h4 class="font-bold text-[#2c328a] text-xs uppercase mb-3 tracking-wider">Terms and Condition</h4>
              <p class="text-slate-700 text-[10px] whitespace-pre-wrap leading-tight max-w-full columns-2 gap-6 space-y-2">${
                // A quick hack to bold lines that look like headers/labels in the T&C plain text
                data.termsAndConditions
                  .replace(/^(\d+\.\s.*)$/gm, '<strong class="block mt-2 mb-0.5 text-[11px] text-[#2c328a] break-inside-avoid">$1</strong>')
                  .replace(/^(•\s.*?):/gm, '<strong>$1:</strong>')
                  .replace(/\n\n/g, '\n') // Remove default double newlines to condense height further
              }</p>
            </div>

            <div class="bg-[#2c328a] text-white p-4 rounded-xl text-[9px] leading-tight relative overflow-hidden">
              <div class="absolute -right-4 -top-12 opacity-10 text-9xl">!</div>
              <p class="font-bold text-amber-400 mb-1 uppercase tracking-wider text-[10px]">Confidentiality & Agreement Notice</p>
              <p class="text-blue-100/90 pr-8">${data.confidentiality}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  wireEvents();
  restoreFocus(focusInfo);
}

function wireEvents() {
  const app = document.getElementById("app");
  if (!app) return;

  const undoBtn = app.querySelector("#undo-btn");
  if (undoBtn) {
    undoBtn.addEventListener("click", undo);
  }

  const redoBtn = app.querySelector("#redo-btn");
  if (redoBtn) {
    redoBtn.addEventListener("click", redo);
  }

  const savePngBtn = app.querySelector("#save-png-btn");
  if (savePngBtn) {
    savePngBtn.addEventListener("click", saveAsPng);
  }

  const exportBtn = app.querySelector("#export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportQuotation);
  }

  const importBtn = app.querySelector("#import-btn");
  if (importBtn) {
    importBtn.addEventListener("click", importQuotation);
  }

  const toggleQuoteBtn = app.querySelector("#toggle-quote-btn");
  if (toggleQuoteBtn) {
    toggleQuoteBtn.addEventListener("click", () => {
      uiState.showQuotation = !uiState.showQuotation;
      render();
    });
  }

  app.querySelectorAll("input[name], textarea[name]").forEach((el) => {
    el.addEventListener("input", (e) => {
      const focusInfo = captureFocus(e.target);
      const { name, value } = e.target;
      data[name] = value;
      saveHistory();
      render(focusInfo);
    });
  });

  const addBtn = app.querySelector("#add-item");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      data.items.push({ id: Date.now(), service: "", qty: 1, cost: 0 });
      render();
      // Auto-scroll to the newly added row
      setTimeout(() => {
        const itemsForms = app.querySelector("#items-forms");
        if (itemsForms) {
          const lastRow = itemsForms.lastElementChild;
          if (lastRow) {
            lastRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }
      }, 100);
    });
  }

  const printBtn = app.querySelector("#print-btn");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  const copyImgBtn = app.querySelector("#copy-img-btn");
  if (copyImgBtn) {
    copyImgBtn.addEventListener("click", async () => {
      try {
        const oldText = copyImgBtn.innerText;
        copyImgBtn.innerText = "Copying...";
        copyImgBtn.disabled = true;

        const captureArea = document.getElementById("quotation-print-area");
        if (!captureArea) return;

        // Temporarily adjust styles for a clean capture, especially if scrolling is involved.
        const originalShadow = captureArea.style.boxShadow;
        captureArea.style.boxShadow = "none";
        
        const canvas = await html2canvas(captureArea, {
          scale: 2, // higher resolution
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false
        });

        captureArea.style.boxShadow = originalShadow;

        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error("Failed to generate blob from canvas");
            return;
          }
          if (navigator.clipboard && navigator.clipboard.write) {
            try {
              const item = new ClipboardItem({ "image/png": blob });
              await navigator.clipboard.write([item]);
              copyImgBtn.innerText = "Copied!";
            } catch (clipboardError) {
              console.error("Clipboard API failed:", clipboardError);
              alert("Could not copy directly to clipboard. Your browser might not support writing images directly, or requires HTTPS.");
              copyImgBtn.innerText = "Failed";
            }
          }
          
          setTimeout(() => {
            copyImgBtn.disabled = false;
            copyImgBtn.innerText = oldText;
          }, 2000);
        }, "image/png");

      } catch (err) {
        console.error("Error capturing image:", err);
        alert("An error occurred while copying the image.");
        copyImgBtn.disabled = false;
        copyImgBtn.innerText = "Copy Image";
      }
    });
  }

  const toggleTerms = app.querySelector("#toggle-terms");
  if (toggleTerms) {
    toggleTerms.addEventListener("click", () => {
      uiState.showTerms = !uiState.showTerms;
      render();
    });
  }

  app.querySelectorAll("#items-forms > div").forEach((row) => {
    const id = Number(row.getAttribute("data-id"));
    const serviceSel = row.querySelector(".item-service");
    const qtyInput = row.querySelector(".item-qty");
    const costInput = row.querySelector(".item-cost");
    const removeBtn = row.querySelector(".remove-item");

    if (serviceSel) {
      serviceSel.addEventListener("change", (e) => {
        const focusInfo = captureFocus(e.target);
        const item = data.items.find((i) => i.id === id);
        if (item) item.service = e.target.value;
        render(focusInfo);
      });
    }
    if (qtyInput) {
      qtyInput.addEventListener("input", (e) => {
        const focusInfo = captureFocus(e.target);
        const item = data.items.find((i) => i.id === id);
        if (item) {
          item._qtyStr = e.target.value;
          item.qty = parseFloat(e.target.value) || 0;
        }
        saveHistory();
        render(focusInfo);
      });
    }
    if (costInput) {
      costInput.addEventListener("input", (e) => {
        const focusInfo = captureFocus(e.target);
        const item = data.items.find((i) => i.id === id);
        if (item) {
          item._costStr = e.target.value;
          item.cost = parseFloat(e.target.value) || 0;
        }
        saveHistory();
        render(focusInfo);
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        data.items = data.items.filter((i) => i.id !== id);
        saveHistory();
        render();
      });
    }

    const notesInput = row.querySelector(".item-notes");
    if (notesInput) {
      notesInput.addEventListener("input", (e) => {
        const focusInfo = captureFocus(e.target);
        const item = data.items.find((i) => i.id === id);
        if (item) item.notes = e.target.value;
        saveHistory();
        render(focusInfo);
      });
    }
  });
}

function captureFocus(el) {
  if (!el) return null;
  
  let sStart = null;
  let sEnd = null;
  try {
    if (el.type !== 'number' && typeof el.selectionStart === 'number') {
      sStart = el.selectionStart;
      sEnd = el.selectionEnd;
    }
  } catch (e) {
    // Ignore input types that don't support selection
  }

  const info = {
    selectionStart: sStart,
    selectionEnd: sEnd,
  };

  if (el.name) {
    info.name = el.name;
  }

  const row = el.closest("[data-id]");
  if (row) {
    info.itemId = Number(row.getAttribute("data-id"));
    if (el.classList.contains("item-qty")) info.field = "item-qty";
    if (el.classList.contains("item-cost")) info.field = "item-cost";
    if (el.classList.contains("item-service")) info.field = "item-service";
  }

  return info;
}

function restoreFocus(info) {
  if (!info) return;

  let selector = null;
  if (info.itemId && info.field) {
    selector = `#items-forms [data-id="${info.itemId}"] .${info.field}`;
  } else if (info.name) {
    selector = `[name="${info.name}"]`;
  }

  if (!selector) return;

  const target = document.querySelector(selector);
  if (target) {
    target.focus();
    const len = typeof target.value === "string" ? target.value.length : 0;
    const selStart = info.selectionStart !== null ? info.selectionStart : len;
    const selEnd = info.selectionEnd !== null ? info.selectionEnd : len;
    if (target.setSelectionRange && target.type !== "number") {
      try {
        const start = Math.min(selStart, len);
        const end = Math.min(selEnd, len);
        target.setSelectionRange(start, end);
      } catch (e) {
        // Ignore if unsupported
      }
    }
  }
}

render();
saveHistory();
