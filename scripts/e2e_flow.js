const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001";
const base = new URL(baseUrl);
const APP_TIME_ZONE = "Asia/Jakarta";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formBody(data) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    body.set(key, String(value ?? ""));
  }
  return body;
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesText(html, value) {
  return visibleText(html).toLowerCase().includes(String(value).toLowerCase());
}

function assertNoRawLabels(html, context) {
  const text = visibleText(html);
  const rawLabels = ["INITIAL_WORK", "REVISION_REQUESTED", "REVISI_DIKEMBALIKAN", "READY_TEST", "JSON_TEMPLATE", "PROJECT_LUAR"];
  const found = rawLabels.filter((label) => text.includes(label));
  assert(found.length === 0, `${context} exposes raw labels: ${found.join(", ")}`);
}

function localUrl(value) {
  const url = new URL(value, baseUrl);
  if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.port === base.port) {
    url.protocol = base.protocol;
    url.host = base.host;
  }
  return url.toString();
}

function localLocation(value) {
  if (!value) return value;
  const url = new URL(value, baseUrl);
  if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.port === base.port) {
    return `${url.pathname}${url.search}`;
  }
  return value;
}

function jakartaDateInputValue(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(value);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

class Client {
  constructor(label) {
    this.label = label;
    this.cookie = "";
  }

  async request(path, options = {}) {
    const url = localUrl(path);
    const headers = { ...(options.headers ?? {}) };
    if (this.cookie) headers.cookie = this.cookie;

    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
      redirect: options.redirect ?? "manual"
    });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const nextCookie = setCookie.split(";")[0];
      this.cookie = this.cookie ? `${this.cookie}; ${nextCookie}` : nextCookie;
    }

    return response;
  }

  async login(username, password) {
    const response = await this.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: formBody({ username, password })
    });
    assert(response.status === 303, `${this.label} login should redirect, got ${response.status}`);
    assert(this.cookie.includes("alfath_session="), `${this.label} login did not set session cookie`);
    return localLocation(response.headers.get("location"));
  }

  async get(path) {
    const response = await this.request(path, { redirect: "manual" });
    const html = await response.text();
    assert(response.status === 200, `${this.label} GET ${path} expected 200, got ${response.status}`);
    return html;
  }

  async post(path, data) {
    const response = await this.request(path, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: formBody(data)
    });
    assert(response.status === 303, `${this.label} POST ${path} expected 303, got ${response.status}`);
    return localLocation(response.headers.get("location"));
  }
}

async function verifyNotification(client, location, title, waNumber) {
  assert(location?.startsWith("/notifications/whatsapp"), `Expected notification redirect, got ${location}`);
  const html = await client.get(location);
  const text = visibleText(html);
  assert(text.includes(title), `Notification missing title: ${title}`);
  assert(text.includes("Pesan tetap dikirim manual"), "Notification missing manual-send note");
  assert(html.includes(`https://wa.me/${waNumber}`), `Notification missing wa.me/${waNumber}`);
  return html;
}

async function main() {
  const stamp = Date.now().toString().slice(-6);
  const productName = `QA Full Flow ${stamp}`;
  const draftProductName = `QA Draft Flow ${stamp}`;
  const editedDraftProductName = `QA Draft Edited ${stamp}`;
  const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const deadline = jakartaDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const andi = new Client("advertiser");
  const budi = new Client("cc");
  const admin = new Client("admin");

  const steps = [];
  await andi.login("andi", "advertiser123");
  steps.push("advertiser login");

  const draftLocation = await andi.post("/api/request-drafts/save", {
    requestType: "CONTENT",
    productName: draftProductName,
    videoAmount: 0,
    imageAmount: 0,
    useFrame: "",
    postPlatform: "",
    rawOrReferenceLinks: "",
    angle: "Draft angle awal",
    hook: "",
    deadlineAt: "",
    additionalNotes: "Draft boleh belum lengkap."
  });
  const draftUrl = new URL(draftLocation, baseUrl);
  const draftId = draftUrl.pathname.split("/").filter(Boolean).at(-1);
  assert(draftId, "Draft redirect missing id");
  const draftHtml = await andi.get(draftLocation);
  assert(visibleText(draftHtml).includes("Draft tersimpan"), "Draft page missing saved badge");
  assert(visibleText(draftHtml).includes("Kirim Request"), "Draft detail missing submit action");

  await andi.post("/api/request-drafts/save", {
    draftId,
    requestType: "CONTENT",
    productName: draftProductName,
    videoAmount: 1,
    imageAmount: 0,
    useFrame: "BEBAS_CREATOR",
    postPlatform: "META",
    rawOrReferenceLinks: `drive.google.com/${draftProductName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-ref`,
    angle: "Draft angle final",
    hook: "Draft hook final",
    deadlineAt: deadline,
    additionalNotes: "Draft lengkap siap dikirim."
  });
  const draftSubmitLocation = await andi.post(`/api/request-drafts/${draftId}/submit`, {});
  const pendingTaskId = new URL(draftSubmitLocation, baseUrl).searchParams.get("id");
  assert(pendingTaskId, "Draft submit redirect missing request id");
  const draftSuccessHtml = await andi.get(draftSubmitLocation);
  assert(visibleText(draftSuccessHtml).includes("Task sudah masuk"), "Draft submit success page did not render");

  const editHtml = await andi.get(`/requests/${pendingTaskId}/edit`);
  assert(visibleText(editHtml).includes("Simpan Perubahan"), "Pending request edit page missing save action");
  assert(visibleText(editHtml).includes("Hapus Request"), "Pending request edit page missing delete action");
  const updateLocation = await andi.post(`/api/requests/${pendingTaskId}/update`, {
    productName: editedDraftProductName,
    videoAmount: 1,
    imageAmount: 1,
    useFrame: "YA",
    postPlatform: "TIKTOK",
    rawOrReferenceLinks: `drive.google.com/${editedDraftProductName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-ref`,
    angle: "Edited pending angle",
    hook: "Edited pending hook",
    deadlineAt: deadline,
    additionalNotes: "Pending request berhasil diedit."
  });
  assert(updateLocation === `/tasks/${pendingTaskId}`, `Pending update redirect mismatch: ${updateLocation}`);
  const editedPendingHtml = await andi.get(updateLocation);
  assert(includesText(editedPendingHtml, editedDraftProductName), "Edited pending task missing updated product name");
  assert(visibleText(editedPendingHtml).includes("Edit Request"), "Edited pending task missing edit link");
  const deleteLocation = await andi.post(`/api/requests/${pendingTaskId}/delete`, {});
  assert(deleteLocation === "/tasks", `Pending delete redirect mismatch: ${deleteLocation}`);
  const deletedTask = await prisma.workRequest.findUnique({ where: { id: pendingTaskId } });
  const deletedDraft = await prisma.requestDraft.findUnique({ where: { id: draftId } });
  assert(!deletedTask, "Pending request should be deleted");
  assert(!deletedDraft, "Draft should be deleted after submit");
  steps.push("draft save/continue/submit and pending edit/delete verified");

  const requestLocation = await andi.post("/api/requests/content", {
    productName,
    videoAmount: 1,
    imageAmount: 1,
    useFrame: "BEBAS_CREATOR",
    postPlatform: "META",
    rawOrReferenceLinks: `drive.google.com/${slug}-ref`,
    angle: "QA full flow angle",
    hook: "QA full flow hook",
    deadlineAt: deadline,
    additionalNotes: "QA E2E content request."
  });
  const taskId = new URL(requestLocation, baseUrl).searchParams.get("id");
  assert(taskId, "Created request redirect missing id");
  const successHtml = await andi.get(requestLocation);
  assert(visibleText(successHtml).includes("Task sudah masuk"), "Request success page did not render");
  steps.push(`request created ${taskId}`);

  await budi.login("budi", "cc123");
  steps.push("cc login");
  await budi.get(`/tasks/${taskId}`);
  await budi.post(`/api/tasks/${taskId}/start`, {});
  const submitLocation = await budi.post(`/api/tasks/${taskId}/submit`, {
    videoLinks: `drive.google.com/${slug}-video-awal`,
    imageLinks: `drive.google.com/${slug}-image-awal`,
    additionalLinks: `drive.google.com/${slug}-bundle-awal`,
    note: "QA submit awal selesai."
  });
  await verifyNotification(budi, submitLocation, "Task selesai disubmit", "628111222333");
  steps.push("cc submit -> wa advertiser");

  await andi.get(`/review/${taskId}`);
  const revisionLocation = await andi.post(`/api/review/${taskId}/revision`, {
    revisionNote: "QA revisi: opening problem perlu lebih jelas."
  });
  await verifyNotification(andi, revisionLocation, "Permintaan revisi", "628222333444");
  steps.push("advertiser revision request -> wa cc");

  await budi.get(`/tasks/${taskId}`);
  const returnLocation = await budi.post(`/api/tasks/${taskId}/return-revision`, {
    returnNote: "QA pertanyaan: problem opening hard atau soft?"
  });
  await verifyNotification(budi, returnLocation, "Revisi dikembalikan CC", "628111222333");
  steps.push("cc return revision -> wa advertiser");

  await andi.get(`/review/${taskId}`);
  const clarifyLocation = await andi.post(`/api/review/${taskId}/clarify`, {
    clarificationNote: "QA klarifikasi: hard problem agitation di 3 detik pertama."
  });
  assert(clarifyLocation === `/review/${taskId}`, `Clarify redirect mismatch: ${clarifyLocation}`);
  steps.push("advertiser clarification");

  await budi.post(`/api/tasks/${taskId}/start`, {});
  const revisionSubmitLocation = await budi.post(`/api/tasks/${taskId}/submit`, {
    videoLinks: `drive.google.com/${slug}-video-revisi`,
    imageLinks: `drive.google.com/${slug}-image-revisi`,
    additionalLinks: `drive.google.com/${slug}-bundle-revisi`,
    note: "QA submit revisi selesai."
  });
  await verifyNotification(budi, revisionSubmitLocation, "Task selesai disubmit", "628111222333");
  steps.push("cc revision submit -> wa advertiser");

  await andi.get(`/review/${taskId}`);
  const accLocation = await andi.post(`/api/review/${taskId}/acc`, {});
  await verifyNotification(andi, accLocation, "Task ACC / beres", "628222333444");
  steps.push("advertiser acc -> wa cc");

  const taskHtml = await andi.get(`/tasks/${taskId}`);
  const taskText = visibleText(taskHtml);
  assertNoRawLabels(taskHtml, "Task detail");
  assert(taskText.includes("Durasi kerja"), "Task detail missing duration panel");
  assert(taskText.includes("Beres"), "Task detail missing final Beres status");
  assert(!taskText.includes("INITIAL_WORK"), "Task detail exposes INITIAL_WORK");
  assert(!taskText.includes("REVISION_REQUESTED"), "Task detail exposes REVISION_REQUESTED");
  steps.push("task detail duration and labels verified");

  const bankHtml = await andi.get(`/bank-konten?product=${slug}`);
  assertNoRawLabels(bankHtml, "Bank Konten");
  assert(includesText(bankHtml, productName), "Bank Konten missing QA product");
  steps.push("bank konten verified");

  const materialsHtml = await andi.get(`/materials?product=${slug}`);
  assertNoRawLabels(materialsHtml, "Materials");
  assert(includesText(materialsHtml, productName), "Materials missing QA product");
  assert(materialsHtml.includes(`https://drive.google.com/${slug}-ref`), "Materials external href not normalized");
  steps.push("materials verified");

  const reportsHtml = await andi.get("/reports");
  assertNoRawLabels(reportsHtml, "Reports");
  assert(visibleText(reportsHtml).includes("Status performa asset"), "Reports overview missing chart section");
  steps.push("reports verified");

  await admin.login("admin", "admin123");
  const teamHtml = await admin.get("/team");
  assertNoRawLabels(teamHtml, "Team");
  const teamText = visibleText(teamHtml);
  assert(teamText.includes("WhatsApp"), "Team page missing WhatsApp column");
  assert(teamText.includes("628111222333"), "Team page missing advertiser WhatsApp");
  steps.push("admin team whatsapp verified");

  const settingsHtml = await andi.get("/settings");
  assertNoRawLabels(settingsHtml, "Settings");
  assert(settingsHtml.includes('name="whatsappNumber"'), "Settings missing whatsappNumber input");
  steps.push("settings whatsapp field verified");

  const task = await prisma.workRequest.findUnique({
    where: { id: taskId },
    include: {
      timeLogs: true,
      submissions: true,
      bankItems: true,
      materials: true,
      reviewLogs: true
    }
  });
  assert(task?.status === "BERES", `Expected final status BERES, got ${task?.status}`);
  assert(task.timeLogs.filter((log) => log.durationSeconds !== null).length >= 2, "Expected at least two finished time logs");
  assert(task.submissions.length >= 2, "Expected initial and revision submissions");
  assert(task.bankItems.length === 2, `Expected 2 bank items from final revision, got ${task.bankItems.length}`);
  assert(task.materials.length >= 3, `Expected materials from request/submissions, got ${task.materials.length}`);
  assert(task.reviewLogs.some((log) => log.decision === "CLARIFICATION"), "Expected clarification review log");
  steps.push("database final state verified");

  console.log(JSON.stringify({ taskId, productName, steps }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
