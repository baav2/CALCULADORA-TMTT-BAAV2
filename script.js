import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCljVTlc1a_d6bb565l-cGyW0OYCmzyPW4",
  authDomain: "calculadora-tmtt-baav2.firebaseapp.com",
  projectId: "calculadora-tmtt-baav2",
  storageBucket: "calculadora-tmtt-baav2.firebasestorage.app",
  messagingSenderId: "308275431473",
  appId: "1:308275431473:web:247295641d425971d36d10",
  measurementId: "G-ZQT3J1F3X8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const btnSalir = document.getElementById("btnSalir");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const cedula = document.getElementById("cedula").value.trim();
  const correo = document.getElementById("correo").value.trim().toLowerCase();

  if (!cedula || !correo) {
    loginMessage.textContent = "Ingrese cédula y correo institucional.";
    return;
  }

  loginMessage.textContent = "Validando acceso...";

  try {
    const credencial = await signInWithEmailAndPassword(auth, correo, cedula);
    const uid = credencial.user.uid;
    const refUsuario = doc(db, "usuarios", uid);
    const snapUsuario = await getDoc(refUsuario);

    if (!snapUsuario.exists()) {
      await signOut(auth);
      loginMessage.textContent = "Usuario no autorizado.";
      return;
    }

    const datos = snapUsuario.data();
    if (datos.activo !== true) {
      await signOut(auth);
      loginMessage.textContent = "Este usuario se encuentra inactivo.";
      return;
    }

    document.querySelectorAll(".admin-only").forEach(el => {
      el.classList.toggle("hidden", datos.rol !== "admin");
    });

    await addDoc(collection(db, "accesos"), {
      uid,
      correo: credencial.user.email,
      nombre: datos.nombre || "",
      rol: datos.rol || "usuario",
      fechaHora: serverTimestamp()
    });

    loginMessage.textContent = "";
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    loginMessage.textContent = "Correo o cédula incorrectos, o acceso no autorizado.";
  }
});

btnSalir.addEventListener("click", async () => {
  await signOut(auth);
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
  loginForm.reset();
});

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) return;
  try {
    const snap = await getDoc(doc(db, "usuarios", usuario.uid));
    if (!snap.exists() || snap.data().activo !== true) {
      await signOut(auth);
      return;
    }
    const datos = snap.data();
    document.querySelectorAll(".admin-only").forEach(el => {
      el.classList.toggle("hidden", datos.rol !== "admin");
    });
    loginView.classList.add("hidden");
    appView.classList.remove("hidden");
  } catch (e) {
    console.error(e);
  }
});
