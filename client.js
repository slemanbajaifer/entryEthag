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

function getFileExtension(fileName) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function buildStoredFileName(label, originalName, index = null) {
  const extension = getFileExtension(originalName);
  const safeLabel = sanitizeFileName(label);
  const suffix = index !== null ? `_${index}` : "";
  return extension ? `${safeLabel}${suffix}.${extension}` : `${safeLabel}${suffix}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("customerName").value.trim();
  const idNumber = document.getElementById("customerIdNumber").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const emailAddress = document.getElementById("emailAddress").value.trim();
  const birthDate = document.getElementById("birthDate").value;
  const qualificationLevel = document.getElementById("qualificationLevel").value;
  const specialization = document.getElementById("specialization").value.trim();
  const declarationAccepted = document.getElementById("declaration").checked;

  const identityFile = document.getElementById("identityFile").files[0];
  const qualificationFile = document.getElementById("qualificationFile").files[0];
  const extraFiles = Array.from(document.getElementById("extraFiles").files);

  if (!name || !qualificationLevel || !identityFile || !declarationAccepted) {
    setStatus("أكملي الاسم والمؤهل والهوية والموافقة على الإقرار.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("جارٍ رفع الملفات...");

  try {
    const user = await ensureAnonymousUser();

    const filesToUpload = [
      {
        file: identityFile,
        label: "هوية",
        storedName: buildStoredFileName("هوية", identityFile.name)
      }
    ];

    if (qualificationFile) {
      filesToUpload.push({
        file: qualificationFile,
        label: "آخر_مؤهل_دراسي",
        storedName: buildStoredFileName("آخر_مؤهل_دراسي", qualificationFile.name)
      });
    }

    extraFiles.forEach((file, index) => {
      filesToUpload.push({
        file,
        label: "مرفق_إضافي",
        storedName: buildStoredFileName("مرفق_إضافي", file.name, index + 1)
      });
    });

    const customerRef = await addDoc(collection(db, "customers"), {
      name,
      idNumber: idNumber || "",
      phoneNumber: phoneNumber || "",
      emailAddress: emailAddress || "",
      birthDate: birthDate || "",
      qualificationLevel,
      specialization: specialization || "",
      declarationAccepted: true,
      createdAt: serverTimestamp(),
      createdByUid: user.uid,
      filesCount: filesToUpload.length
    });

    for (const item of filesToUpload) {
      const filePath = `uploads/${user.uid}/${customerRef.id}/${item.storedName}`;
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
        fileName: item.storedName,
        originalFileName: item.file.name,
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
