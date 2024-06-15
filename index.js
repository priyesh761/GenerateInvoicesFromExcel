const dataColumns = {
  name: "names",
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
const qrInput = document.querySelector("#qrCode");
const datePicker = document.querySelector("#datePicker");
const invoiceListHtml = document.querySelector("#contentToPrint");
let qrCodeDataUrl = undefined;

const date = new Date();
enableState(true);
fileInput.addEventListener("change", handleFileAsync, false);
qrInput.addEventListener("change", handleQrInput);

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

async function handleQrInput(e) {
  const qrFile = e.target.files[0];
  if (!qrFile) return;

  const qrFileReader = new FileReader();
  qrFileReader.addEventListener("load", () => {
    qrCodeDataUrl = qrFileReader.result;
    fileInput.value = "";
  });
  qrFileReader.readAsDataURL(qrFile);
}

async function handleFileAsync(e) {
  const file = e.target.files[0];
  if (!file) return;
  loadingState();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const billData = XLSX.utils.sheet_to_json(worksheet);

  generateBillPage(billData).reduce((result, billPage) => {
    result.appendChild(billPage);
    return result;
  }, invoiceListHtml);
  enableState();
  printBtn.addEventListener("click", () => generatePdf(invoiceListHtml), { once: true });
}

function generateBillPage(billPageData) {
  return billPageData
    .map((billData) => generateBill(billData))
    .reduce((result, item, index) => {
      const pageIndex = Math.floor(index / 8);
      if (!result[pageIndex]) {
        const page = document.createElement("div");
        page.classList.add("invoice-page");
        result[pageIndex] = page;
      }
      result[pageIndex].append(item);
      return result;
    }, []);
}

function generateBill(billData) {
  const invoiceMonth = new Date(datePicker.value).toLocaleDateString("en-US", { year: "numeric", month: "short" });

  const invoiceHtmlElement = document.createElement("div");
  invoiceHtmlElement.classList.add("invoice", "border", "border-1", "p-0", "m-2");
  const nameHtmlElement = generateTextDiv(comparePropertyCaseInsensitive(billData, dataColumns.name), ["name"], true);
  const dateHtmlElement = generateTextDiv(invoiceMonth, ["date", "text-danger"], true);
  const milkQtHtmlElement = generateTextDiv("Total milk", ["border-bottom-0", "text-end", "milk_lbl"]);
  const milkQtValHtmlElement = generateTextDiv(`${comparePropertyCaseInsensitive(billData, dataColumns.total_milk)} ltr`, [
    "border-bottom-0",
    "milk_amt",
  ]);
  const milkRateHtmlElement = generateTextDiv("Rate", ["border-top-0", "text-end", "rate_lbl"]);
  const milkRateValHtmlElement = generateTextDiv(`₹ ${comparePropertyCaseInsensitive(billData, dataColumns.rate)}`, [
    "border-top-0",
    "rate_amt",
  ]);
  const billTxtHtmlElement = generateTextDiv("Bill", ["border-bottom-0", "text-end", "bill_lbl"]);
  const billValHtmlElement = generateTextDiv(`₹ ${comparePropertyCaseInsensitive(billData, dataColumns.bill)}`, [
    "border-bottom-0",
    "bill_amt",
  ]);
  const pendingTxtHtmlElement = generateTextDiv("Due amount", ["border-top-0", "text-end", "pending_lbl"]);
  const pendingValHtmlElement = generateTextDiv(`₹ ${comparePropertyCaseInsensitive(billData, dataColumns.pending)}`, [
    "border-top-0",
    "pending_amt",
  ]);
  const totalTxtHtmlElement = generateTextDiv("Total", ["text-end", "total_lbl"], true);
  const totalValHtmlElement = generateTextDiv(
    `₹ ${comparePropertyCaseInsensitive(billData, dataColumns.final)}`,
    ["total_amt", "text-danger"],
    true
  );

  const qrCodeImgTag = document.createElement("img");
  qrCodeImgTag.classList.add("qr_code");
  qrCodeImgTag.src = qrCodeDataUrl ?? "#";

  const invoiceElements = [
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
    totalValHtmlElement,
    qrCodeDataUrl && qrCodeImgTag,
  ].filter(Boolean);

  invoiceHtmlElement.append(...invoiceElements);
  return invoiceHtmlElement;
}

async function generatePdf(invoiceListHtml) {
  loadingState();
  await html2pdf()
    .set({
      margin: [1, 5],
      filename: `Milk_Invoice_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.pdf`,
      pagebreak: { avoid: ".invoice-page" },
      jsPDF: {
        orientation: "p",
        format: "a4",
      },
    })
    .from(invoiceListHtml)
    .save();

  qrInput.value = "";
  fileInput.value = "";
  datePicker.value = "";
  enableState();
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

function comparePropertyCaseInsensitive(obj, key) {
  const keyValue = Object.keys(obj).find((currentKey) => currentKey.toLowerCase() === key.toLowerCase());
  return keyValue && obj[keyValue];
}
