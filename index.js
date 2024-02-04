const dataColumns = {
  name: "NAMES",
  total_milk: "total milk",
  rate: "rate",
  bill: "bill",
  pending: "pending",
  final: "final",
};
const printBtn = document.querySelector("#printBtn");
const printBtnText = printBtn.querySelector("#btnTxt");
const printBtnSpinner = printBtn.querySelector("#btnLoading");
const fileInput = document.querySelector("#xlFile");
const datePicker = document.querySelector("#datePicker");

const date = new Date();
enableState(true);
fileInput.addEventListener("change", handleFileAsync, false);

function enableState(disabled = false) {
  printBtn.disabled = disabled;
  printBtnSpinner.classList.add("visually-hidden");
  printBtnText.classList.remove("visually-hidden");
}

function loadingState() {
  printBtn.disabled = true;
  printBtnSpinner.classList.remove("visually-hidden");
  printBtnText.classList.add("visually-hidden");
}
async function handleFileAsync(e) {
  const file = e.target.files[0];
  if (!file) return;
  loadingState();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const billData = XLSX.utils.sheet_to_json(worksheet);
  const invoiceMonth = new Date(datePicker.value).toLocaleDateString("en-US", { year: "numeric", month: "short" });
  const invoiceListHtml = document.querySelector("#contentToPrint2");

  billData.forEach((element) => {
    const invoiceHtmlElement = document.createElement("div");
    invoiceHtmlElement.classList.add("invoice", "border", "border-1", "p-0", "col-5", "m-3");
    const nameHtmlElement = generateTextDiv(element[dataColumns.name], ["name"]);
    const dateHtmlElement = generateTextDiv(invoiceMonth, ["date"], true);
    const milkQtHtmlElement = generateTextDiv("Total milk", ["border-bottom-0", "text-end", "milk_lbl"]);
    const milkQtValHtmlElement = generateTextDiv(`${element[dataColumns.total_milk]} ltr`, ["border-bottom-0", "milk_amt"]);
    const milkRateHtmlElement = generateTextDiv("Rate", ["border-top-0", "text-end", "rate_lbl"]);
    const milkRateValHtmlElement = generateTextDiv(`₹ ${element[dataColumns.rate]}`, ["border-top-0", "rate_amt"]);
    const billTxtHtmlElement = generateTextDiv("Bill", ["border-bottom-0", "text-end", "bill_lbl"]);
    const billValHtmlElement = generateTextDiv(`₹ ${element[dataColumns.bill]}`, ["border-bottom-0", "bill_amt"]);
    const pendingTxtHtmlElement = generateTextDiv("Due amount", ["border-top-0", "text-end", "pending_lbl"]);
    const pendingValHtmlElement = generateTextDiv(`₹ ${element[dataColumns.pending]}`, ["border-top-0", "pending_amt"]);
    const totalTxtHtmlElement = generateTextDiv("Total", ["text-end", "total_lbl"], true);
    const totalValHtmlElement = generateTextDiv(`₹ ${element[dataColumns.final]}`, ["total_amt"], true);

    invoiceHtmlElement.append(
      nameHtmlElement,
      dateHtmlElement,
      milkQtHtmlElement,
      milkQtValHtmlElement,
      milkRateHtmlElement,
      milkRateValHtmlElement,
      billTxtHtmlElement,
      billValHtmlElement,
      pendingTxtHtmlElement,
      pendingValHtmlElement,
      totalTxtHtmlElement,
      totalValHtmlElement
    );
    invoiceListHtml.append(invoiceHtmlElement);
  });

  enableState();
  printBtn.addEventListener("click", () => generatePdf(invoiceListHtml), { once: true });
}

function generatePdf(invoiceListHtml) {
  html2pdf()
    .set({
      margin: [1, 5],
      filename: `Milk_Invoice_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.pdf`,
      pagebreak: { avoid: ".invoice" },
      jsPDF: {
        orientation: "p",
        format: "a4",
      },
    })
    .from(invoiceListHtml)
    .save();

  fileInput.value = "";
}

function generateTextDiv(content = "", classList = [], bold = false) {
  const textElement = document.createTextNode(content);
  const boldTextelement = bold && document.createElement("strong");
  bold && boldTextelement.append(textElement);
  const divElement = document.createElement("div");
  divElement.appendChild(bold ? boldTextelement : textElement);
  divElement.classList.add("p-2", "border", "border-1", ...classList);
  return divElement;
}

