import { auth, db, storage, serverTimestamp } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const form = document.getElementById("uploadForm");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");

async function ensureAnonymousUser() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser;
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("customerName").value.trim();
  const idNumber = document.getElementById("customerIdNumber").value.trim();
  const qualificationLevel = document.getElementById("qualificationLevel").value;
  const identityFile = document.getElementById("identityFile").files[0];
  const qualificationFile = document.getElementById("qualificationFile").files[0];
  const extraFiles = Array.from(document.getElementById("extraFiles").files);

  if (!name || !qualificationLevel || !identityFile) {
    setStatus("اكتب الاسم، واختر المؤهل الدراسي، وأرفق الهوية.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("جارٍ رفع الملفات...");

  try {
    const user = await ensureAnonymousUser();

    const filesToUpload = [
      { file: identityFile, label: "هوية" }
    ];

    if (qualificationFile) {
      filesToUpload.push({ file: qualificationFile, label: "شهادة مؤهل" });
    }

    for (const file of extraFiles) {
      filesToUpload.push({ file, label: "مرفق إضافي" });
    }

    const customerRef = await addDoc(collection(db, "customers"), {
      name,
      idNumber: idNumber || "",
      qualificationLevel,
      createdAt: serverTimestamp(),
      createdByUid: user.uid,
      filesCount: filesToUpload.length
    });

    for (const item of filesToUpload) {
      const safeName = sanitizeFileName(item.file.name);
      const filePath = `uploads/${user.uid}/${customerRef.id}/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, item.file, {
        contentType: item.file.type,
        customMetadata: {
          customerId: customerRef.id,
          uploadedBy: user.uid,
          customerName: name,
          fileLabel: item.label
        }
      });

      await addDoc(collection(db, "customers", customerRef.id, "files"), {
        fileName: item.file.name,
        fileType: item.label,
        mimeType: item.file.type || "unknown",
        size: item.file.size,
        storagePath: filePath,
        uploadedAt: serverTimestamp(),
        uploadedByUid: user.uid
      });
    }

    setStatus("تم رفع الملفات بنجاح ✅", "success");
    form.reset();
  } catch (error) {
    console.error(error);
    setStatus(`حدث خطأ أثناء الرفع: ${error.message}`, "error");
  } finally {
    submitBtn.disabled = false;
  }
});
