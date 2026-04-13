import { EMPLOYEE_EMAIL, auth, db, storage } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getDownloadURL,
  ref
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const customersList = document.getElementById("customersList");
const filesList = document.getElementById("filesList");
const selectedCustomer = document.getElementById("selectedCustomer");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");

let customersCache = [];
let activeCustomerId = null;

function setLoginStatus(message, type = "") {
  loginStatus.textContent = message;
  loginStatus.className = `status ${type}`.trim();
}

function formatDate(value) {
  if (!value?.toDate) return "غير محدد";
  return value.toDate().toLocaleString("ar-SA");
}

function formatBytes(bytes = 0) {
  if (!bytes) return "0 بايت";
  const sizes = ["بايت", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const number = bytes / Math.pow(1024, i);
  return `${number.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

async function loadCustomers() {
  const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  customersCache = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  renderCustomers(customersCache);
}

function renderCustomers(customers) {
  customersList.innerHTML = "";

  if (customers.length === 0) {
    customersList.innerHTML = '<div class="empty-state">لا توجد بيانات حتى الآن</div>';
    return;
  }

  customers.forEach((customer) => {
    const item = document.createElement("div");
    item.className = `folder-item ${customer.id === activeCustomerId ? "active" : ""}`;
    item.innerHTML = `
      <div class="folder-title">📁 ${customer.name}</div>
      <div class="meta">الهوية/الطلب: ${customer.idNumber || "—"}</div>
      <div class="meta">المؤهل: ${customer.qualificationLevel || "—"}</div>
      <div class="meta">عدد الملفات: ${customer.filesCount || 0}</div>
      <div class="meta">تاريخ الرفع: ${formatDate(customer.createdAt)}</div>
    `;
    item.addEventListener("click", () => loadFiles(customer));
    customersList.appendChild(item);
  });
}

async function loadFiles(customer) {
  activeCustomerId = customer.id;
  renderCustomers(filterCustomers(searchInput.value));
  selectedCustomer.textContent = `العميل: ${customer.name} | المؤهل: ${customer.qualificationLevel || "—"}`;

  const snapshot = await getDocs(query(collection(db, "customers", customer.id, "files"), orderBy("uploadedAt", "desc")));
  filesList.className = "file-list";
  filesList.innerHTML = "";

  if (snapshot.empty) {
    filesList.className = "file-list empty-state";
    filesList.textContent = "لا توجد ملفات لهذا العميل";
    return;
  }

  for (const docSnap of snapshot.docs) {
    const file = docSnap.data();
    let downloadURL = "#";
    let disabledAttr = "";
    let note = "";

    try {
      downloadURL = await getDownloadURL(ref(storage, file.storagePath));
    } catch (error) {
      console.error(error);
      disabledAttr = 'aria-disabled="true"';
      note = '<div class="meta">تعذر إنشاء رابط الملف</div>';
    }

    const item = document.createElement("div");
    item.className = "file-item";
    item.innerHTML = `
      <div class="file-title">📄 ${file.fileName}</div>
      <div class="meta">النوع: ${file.fileType || "غير معروف"}</div>
      <div class="meta">الحجم: ${formatBytes(file.size)}</div>
      <div class="meta">تاريخ الرفع: ${formatDate(file.uploadedAt)}</div>
      ${note}
      <div class="file-actions">
        <a href="${downloadURL}" target="_blank" rel="noopener noreferrer" ${disabledAttr}>فتح</a>
        <a href="${downloadURL}" download ${disabledAttr}>تنزيل</a>
      </div>
    `;
    filesList.appendChild(item);
  }
}

function filterCustomers(term) {
  const value = term.trim().toLowerCase();
  if (!value) return customersCache;
  return customersCache.filter((customer) => {
    const haystack = `${customer.name || ""} ${customer.idNumber || ""} ${customer.qualificationLevel || ""}`.toLowerCase();
    return haystack.includes(value);
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (email.toLowerCase() !== EMPLOYEE_EMAIL.toLowerCase()) {
    setLoginStatus("هذا البريد غير مصرح له بالدخول.", "error");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    setLoginStatus("");
  } catch (error) {
    console.error(error);
    setLoginStatus("فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.", "error");
  }
});

searchInput.addEventListener("input", () => {
  renderCustomers(filterCustomers(searchInput.value));
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  const isEmployee = user && !user.isAnonymous && user.email?.toLowerCase() === EMPLOYEE_EMAIL.toLowerCase();

  if (isEmployee) {
    loginCard.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await loadCustomers();
  } else {
    dashboard.classList.add("hidden");
    loginCard.classList.remove("hidden");
    customersList.innerHTML = "";
    filesList.className = "file-list empty-state";
    filesList.textContent = "لا توجد ملفات معروضة الآن";
    selectedCustomer.textContent = "اختر عميلًا من القائمة";
    activeCustomerId = null;
  }
});
