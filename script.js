import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

const TABLAS = {
  operaciones: [
    [0.1,0.5],[0.2,0.6],[0.3,0.7],[0.4,0.8],[0.5,0.9],[0.6,1.0],[0.7,1.2],[0.8,1.4],[0.9,1.5],[1.0,1.7],
    [1.1,1.8],[1.2,2.0],[1.3,2.2],[1.4,2.3],[1.5,2.5],[1.6,2.7],[1.7,2.8],[1.8,3.0],[1.9,3.2],[2.0,3.4],
    [2.1,3.5],[2.2,3.6],[2.3,3.8],[2.4,3.9],[2.5,4.0],[2.6,4.1],[2.7,4.2],[2.8,4.3],[2.9,4.4],[3.0,4.5],
    [3.1,4.7],[3.2,4.9],[3.3,5.0],[3.4,5.1],[3.5,5.2],[3.6,5.5],[3.7,5.6],[3.8,5.7],[3.9,5.8],[4.0,5.9],
    [4.1,6.0],[4.2,6.2],[4.3,6.4],[4.4,6.5],[4.5,6.7],[4.6,6.9],[4.7,7.0],[4.8,7.2],[4.9,7.4],[5.0,7.5],
    [5.1,7.6],[5.2,7.6],[5.3,7.7],[5.4,7.7],[5.5,7.8],[5.6,7.8],[5.7,7.9],[5.8,7.9],[5.9,8.0],[6.0,8.0]
  ],
  entrenamiento: [
    [0.1,0.5],[0.2,0.6],[0.3,0.7],[0.4,0.8],[0.5,1.0],[0.6,1.2],[0.7,1.4],[0.8,1.6],[0.9,1.8],[1.0,2.0],
    [1.1,2.2],[1.2,2.4],[1.3,2.6],[1.4,2.8],[1.5,3.0],[1.6,3.2],[1.7,3.4],[1.8,3.6],[1.9,3.8],[2.0,4.0],
    [2.1,4.1],[2.2,4.2],[2.3,4.3],[2.4,4.4],[2.5,4.5],[2.6,4.6],[2.7,4.7],[2.8,4.8],[2.9,4.9],[3.0,5.0],
    [3.1,5.1],[3.2,5.2],[3.3,5.3],[3.4,5.4],[3.5,5.5],[3.6,5.6],[3.7,5.7],[3.8,5.8],[3.9,5.9],[4.0,6.0]
  ],
  mantenimiento: [
    [0.1,0.5],[0.2,0.6],[0.3,0.7],[0.4,0.8],[0.5,1.0],[0.6,1.2],[0.7,1.4],[0.8,1.6],[0.9,1.8],[1.0,2.0],
    [1.1,2.2],[1.2,2.4],[1.3,2.6],[1.4,2.8],[1.5,3.0],[1.6,3.2],[1.7,3.4],[1.8,3.6],[1.9,3.8],[2.0,4.0],
    [2.1,4.2],[2.2,4.4],[2.3,4.6],[2.4,4.8],[2.5,5.0],[2.6,5.2],[2.7,5.4],[2.8,5.6],[2.9,5.8],[3.0,6.0],
    [3.1,6.1],[3.2,6.2],[3.3,6.3],[3.6,6.6],[3.7,6.7],[3.8,6.8],[3.9,6.9],[4.0,7.0],
    [4.1,7.1],[4.2,7.2],[4.3,7.3],[4.4,7.4],[4.5,7.5],[4.6,7.6],[4.7,7.7],[4.8,7.8],[4.9,7.9],[5.0,8.0]
  ]
};

const NOMBRES_TIPO = {
  operaciones: "Operaciones",
  entrenamiento: "Entrenamiento",
  mantenimiento: "Mantenimiento"
};

const state = {
  perfil: null,
  resultadosBase: [],
  filtros: [],
  resultadoSeleccionado: null
};

const $ = (id) => document.getElementById(id);
const loginView = $("loginView");
const appView = $("appView");
const loginForm = $("loginForm");
const loginMessage = $("loginMessage");
const btnSalir = $("btnSalir");
const workspace = $("workspace");
const workspaceTitle = $("workspaceTitle");
const workspaceContent = $("workspaceContent");
const btnCerrarModulo = $("btnCerrarModulo");
const userBadge = $("userBadge");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const cedula = $("cedula").value.trim();
  const correo = $("correo").value.trim().toLowerCase();

  if (!cedula || !correo) {
    loginMessage.textContent = "Ingrese cédula y correo institucional.";
    return;
  }

  loginMessage.textContent = "Validando acceso...";

  try {
    const credencial = await signInWithEmailAndPassword(auth, correo, cedula);
    const uid = credencial.user.uid;
    const snapUsuario = await getDoc(doc(db, "usuarios", uid));

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

    state.perfil = {
      uid,
      correo: credencial.user.email,
      nombre: datos.nombre || "",
      rol: datos.rol || "usuario"
    };

    aplicarPermisos();
    await registrarAcceso();
    mostrarSistema();
  } catch (error) {
    console.error(error);
    loginMessage.textContent = error.code === "auth/too-many-requests"
      ? "Demasiados intentos. Intente nuevamente más tarde."
      : "Correo o cédula incorrectos, o acceso no autorizado.";
  }
});

async function registrarAcceso() {
  try {
    await addDoc(collection(db, "accesos"), {
      uid: state.perfil.uid,
      correo: state.perfil.correo,
      nombre: state.perfil.nombre,
      rol: state.perfil.rol,
      fechaHora: serverTimestamp()
    });
  } catch (e) {
    console.error("Registro de acceso:", e);
  }
}

function aplicarPermisos() {
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", state.perfil?.rol !== "admin");
  });
  userBadge.textContent = state.perfil?.nombre
    ? `${state.perfil.nombre} · ${state.perfil.rol.toUpperCase()}`
    : state.perfil?.rol?.toUpperCase() || "";
}

function mostrarSistema() {
  loginMessage.textContent = "";
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
}

function mostrarLogin() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
  workspace.classList.add("hidden");
  state.perfil = null;
}

btnSalir.addEventListener("click", async () => {
  await signOut(auth);
  loginForm.reset();
  mostrarLogin();
});

onAuthStateChanged(auth, async (usuario) => {
  if (!usuario) {
    mostrarLogin();
    return;
  }
  if (state.perfil) return;

  try {
    const snap = await getDoc(doc(db, "usuarios", usuario.uid));
    if (!snap.exists() || snap.data().activo !== true) {
      await signOut(auth);
      return;
    }
    const d = snap.data();
    state.perfil = {
      uid: usuario.uid, correo: usuario.email,
      nombre: d.nombre || "", rol: d.rol || "usuario"
    };
    aplicarPermisos();
    mostrarSistema();
  } catch (e) {
    console.error(e);
    await signOut(auth);
  }
});

document.querySelectorAll(".module-card").forEach(card => {
  card.addEventListener("click", () => abrirModulo(card.dataset.module));
});

btnCerrarModulo.addEventListener("click", () => {
  workspace.classList.add("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
});

function abrirModulo(modulo) {
  workspace.classList.remove("hidden");

  if (modulo === "calculadora") renderCalculadora();
  else if (modulo === "guardadas") renderGuardadas();
  else if (modulo === "usuarios") renderPlaceholder("Administrar usuarios", "Este módulo será el siguiente bloque administrativo que construiremos.");
  else if (modulo === "accesos") renderPlaceholder("Registro de accesos", "Los accesos ya se están registrando. En la siguiente versión haremos la consulta visual para administradores.");

  setTimeout(() => workspace.scrollIntoView({behavior:"smooth", block:"start"}), 30);
}

function renderPlaceholder(titulo, texto) {
  workspaceTitle.textContent = titulo;
  workspaceContent.innerHTML = `<div class="placeholder"><strong>${titulo}</strong><p>${texto}</p></div>`;
}

function renderCalculadora() {
  workspaceTitle.textContent = "Calculadora TM–TT";
  workspaceContent.innerHTML = `
    <div class="calculator-grid">
      <section class="panel">
        <h4 class="panel-title">Configuración del cálculo</h4>
        <p class="panel-subtitle">Seleccione el tipo de vuelo y el modo de búsqueda.</p>

        <div class="field full">
          <label>TIPO DE VUELO</label>
          <div class="segmented">
            <input type="radio" name="tipoVuelo" id="tipoOp" value="operaciones" checked><label for="tipoOp">OPERACIONES</label>
            <input type="radio" name="tipoVuelo" id="tipoEnt" value="entrenamiento"><label for="tipoEnt">ENTRENAMIENTO</label>
            <input type="radio" name="tipoVuelo" id="tipoMant" value="mantenimiento"><label for="tipoMant">MANTENIMIENTO</label>
          </div>
        </div>

        <div class="field full">
          <label>MODO DE CÁLCULO</label>
          <div class="segmented two">
            <input type="radio" name="modo" id="modoTM" value="TM" checked><label for="modoTM">MODO TM</label>
            <input type="radio" name="modo" id="modoTT" value="TT"><label for="modoTT">MODO TT</label>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label id="lblObjetivo">TM OBJETIVO</label>
            <input id="valorObjetivo" type="number" min="0.1" step="0.1" value="4.3">
          </div>
          <div class="field">
            <label id="lblComplementario">TT MÁXIMO</label>
            <input id="limiteComplementario" type="number" min="0" step="0.1" value="8.0">
          </div>
          <div class="field">
            <label>NÚMERO DE PIERNAS</label>
            <select id="numPiernas">
              <option value="1">1</option><option value="2">2</option><option value="3">3</option>
              <option value="4">4</option><option value="5" selected>5</option>
            </select>
          </div>
          <div class="field">
            <label>MÁXIMO DE 0,1</label>
            <select id="max01">
              <option value="0">0</option><option value="1">1</option><option value="2" selected>2</option>
              <option value="3">3</option><option value="4">4</option><option value="5">5</option>
            </select>
          </div>
          <div class="field">
            <label>RESULTADOS A MOSTRAR</label>
            <input id="maxResultados" type="number" min="1" max="500" value="50">
          </div>
          <div class="field" id="ttMinField">
            <label>TT MÍNIMO (OPCIONAL)</label>
            <input id="ttMinimo" type="number" min="0" step="0.1" value="0">
          </div>
        </div>

        <div class="action-row">
          <button id="btnGenerar" class="btn-primary">GENERAR COMBINACIONES</button>
          <button id="btnLimpiarCalc" class="btn-secondary">LIMPIAR</button>
        </div>
        <div id="calcMessage"></div>
      </section>

      <section class="panel">
        <h4 class="panel-title">Restricciones horarias</h4>
        <p class="panel-subtitle">Se aplicarán posteriormente al organizar los horarios de la combinación seleccionada.</p>

        <div class="segmented two">
          <input type="radio" name="restriccionModo" id="sinRest" value="sin" checked><label for="sinRest">SIN RESTRICCIONES</label>
          <input type="radio" name="restriccionModo" id="conRest" value="con"><label for="conRest">CON RESTRICCIONES</label>
        </div>

        <div id="restriccionesDetalle" class="hidden">
          <label class="check-row">
            <input id="usarInicioMin" type="checkbox">
            <span>No iniciar antes de</span>
          </label>
          <div class="field restriction-time">
            <input id="horaInicioMin" type="time" disabled>
          </div>

          <label class="check-row">
            <input id="usarFinMax" type="checkbox">
            <span>No finalizar después de</span>
          </label>
          <div class="field restriction-time">
            <input id="horaFinMax" type="time" disabled>
          </div>
        </div>

        <div class="notice info">
          Puede activar solo una restricción o las dos. Si selecciona <b>Sin restricciones</b>, ninguna se aplicará.
        </div>
      </section>
    </div>

    <section id="filterPanel" class="panel hidden" style="margin-top:18px">
      <h4 class="panel-title">Filtro de tiempos específicos</h4>
      <p class="panel-subtitle">Filtre los resultados antes de escoger la combinación que desea organizar.</p>

      <div class="filter-builder">
        <div class="field">
          <label>TM</label>
          <select id="filtroTM"></select>
        </div>
        <div class="field">
          <label>CONDICIÓN</label>
          <select id="filtroCondicion">
            <option value="contiene">Debe contener</option>
            <option value="noContiene">No debe contener</option>
            <option value="exacto">Cantidad exacta</option>
            <option value="minimo">Cantidad mínima</option>
            <option value="maximo">Cantidad máxima</option>
          </select>
        </div>
        <div class="field">
          <label>CANTIDAD</label>
          <input id="filtroCantidad" type="number" min="0" max="5" value="1">
        </div>
        <button id="btnAgregarFiltro" class="btn-secondary filter-add">AGREGAR FILTRO</button>
      </div>

      <div id="filtrosActivos" class="filter-list"></div>
      <div class="action-row">
        <button id="btnQuitarFiltros" class="btn-secondary">QUITAR TODOS LOS FILTROS</button>
      </div>
    </section>

    <section id="resultsPanel" class="panel hidden" style="margin-top:18px">
      <div class="results-toolbar">
        <h4>Combinaciones encontradas</h4>
        <span id="resultsCount" class="results-count"></span>
      </div>
      <div id="resultsSummary" class="summary-strip"></div>
      <div id="resultsContainer" style="margin-top:14px"></div>
    </section>
  `;

  enlazarCalculadora();
}

function enlazarCalculadora() {
  document.querySelectorAll('input[name="modo"]').forEach(el => el.addEventListener("change", actualizarModo));
  document.querySelectorAll('input[name="restriccionModo"]').forEach(el => el.addEventListener("change", actualizarRestricciones));
  $("usarInicioMin").addEventListener("change", e => $("horaInicioMin").disabled = !e.target.checked);
  $("usarFinMax").addEventListener("change", e => $("horaFinMax").disabled = !e.target.checked);
  $("btnGenerar").addEventListener("click", generarDesdeFormulario);
  $("btnLimpiarCalc").addEventListener("click", renderCalculadora);
  $("btnAgregarFiltro").addEventListener("click", agregarFiltro);
  $("btnQuitarFiltros").addEventListener("click", () => {
    state.filtros = [];
    renderFiltros();
    renderResultados();
  });
  $("filtroCondicion").addEventListener("change", actualizarCantidadFiltro);
  actualizarModo();
  actualizarRestricciones();
}

function actualizarModo() {
  const modo = document.querySelector('input[name="modo"]:checked').value;
  const objetivo = $("valorObjetivo");
  const comp = $("limiteComplementario");
  const ttMinField = $("ttMinField");

  if (modo === "TM") {
    $("lblObjetivo").textContent = "TM OBJETIVO";
    $("lblComplementario").textContent = "TT MÁXIMO";
    objetivo.value = objetivo.value || "4.3";
    comp.value = "8.0";
    ttMinField.classList.remove("hidden");
  } else {
    $("lblObjetivo").textContent = "TT OBJETIVO";
    $("lblComplementario").textContent = "TM MÁXIMO";
    objetivo.value = "8.0";
    comp.value = "8.0";
    ttMinField.classList.add("hidden");
  }
}

function actualizarRestricciones() {
  const con = document.querySelector('input[name="restriccionModo"]:checked').value === "con";
  $("restriccionesDetalle").classList.toggle("hidden", !con);
  if (!con) {
    $("usarInicioMin").checked = false;
    $("usarFinMax").checked = false;
    $("horaInicioMin").disabled = true;
    $("horaFinMax").disabled = true;
    $("horaInicioMin").value = "";
    $("horaFinMax").value = "";
  }
}

function actualizarCantidadFiltro() {
  const c = $("filtroCondicion").value;
  const input = $("filtroCantidad");
  const usaCantidad = ["exacto","minimo","maximo"].includes(c);
  input.disabled = !usaCantidad;
  if (!usaCantidad) input.value = "1";
}

function generarDesdeFormulario() {
  const tipo = document.querySelector('input[name="tipoVuelo"]:checked').value;
  const modo = document.querySelector('input[name="modo"]:checked').value;
  const objetivo = parseFloat($("valorObjetivo").value);
  const complementario = parseFloat($("limiteComplementario").value || "999");
  const piernas = parseInt($("numPiernas").value, 10);
  const max01 = parseInt($("max01").value, 10);
  const maxResultados = Math.min(500, Math.max(1, parseInt($("maxResultados").value || "50", 10)));
  const ttMinimo = modo === "TM" ? parseFloat($("ttMinimo").value || "0") : 0;

  if (!Number.isFinite(objetivo) || objetivo <= 0) {
    mostrarCalcMensaje("Ingrese un valor objetivo válido.", "error");
    return;
  }

  mostrarCalcMensaje("Calculando combinaciones únicas...", "info");

  const tabla = TABLAS[tipo];
  const resultados = buscarCombinaciones({
    tabla, modo, objetivo, complementario, piernas, max01, ttMinimo
  });

  if (modo === "TM") {
    resultados.sort((a,b) => (b.ttTotal - a.ttTotal) || (a.tmTotal - b.tmTotal) || compararArrays(a.tms,b.tms));
  } else {
    resultados.sort((a,b) => (a.tmTotal - b.tmTotal) || (b.ttTotal - a.ttTotal) || compararArrays(a.tms,b.tms));
  }

  state.resultadosBase = resultados.slice(0, maxResultados);
  state.filtros = [];

  cargarOpcionesFiltro(tipo);
  $("filterPanel").classList.remove("hidden");
  $("resultsPanel").classList.remove("hidden");

  if (resultados.length === 0) {
    mostrarCalcMensaje("No se encontraron combinaciones con estos criterios.", "warn");
  } else {
    const cortado = resultados.length > maxResultados;
    mostrarCalcMensaje(
      cortado
        ? `Se encontraron ${resultados.length} combinaciones. Se muestran las primeras ${maxResultados}.`
        : `Se encontraron ${resultados.length} combinaciones únicas.`,
      "ok"
    );
  }

  renderFiltros();
  renderResultados();
  $("resultsPanel").scrollIntoView({behavior:"smooth", block:"start"});
}

function buscarCombinaciones({tabla, modo, objetivo, complementario, piernas, max01, ttMinimo}) {
  const objetivo10 = Math.round(objetivo * 10);
  const comp10 = Math.round(complementario * 10);
  const ttMin10 = Math.round(ttMinimo * 10);
  const datos = tabla.map(([tm,tt]) => ({tm,tt,tm10:Math.round(tm*10),tt10:Math.round(tt*10)}));

  const out = [];
  const actual = [];

  function rec(inicio, depth, sumTM10, sumTT10, count01) {
    if (depth === piernas) {
      if (count01 > max01) return;

      const coincide = modo === "TM"
        ? (sumTM10 === objetivo10 && sumTT10 <= comp10 && sumTT10 >= ttMin10)
        : (sumTT10 === objetivo10 && sumTM10 <= comp10);

      if (coincide) {
        out.push({
          tms: actual.map(x => x.tm),
          tts: actual.map(x => x.tt),
          tmTotal: sumTM10 / 10,
          ttTotal: sumTT10 / 10
        });
      }
      return;
    }

    const restantes = piernas - depth;

    for (let i = inicio; i < datos.length; i++) {
      const d = datos[i];
      const nuevo01 = count01 + (d.tm10 === 1 ? 1 : 0);
      if (nuevo01 > max01) continue;

      const newTM = sumTM10 + d.tm10;
      const newTT = sumTT10 + d.tt10;

      if (modo === "TM") {
        if (newTM > objetivo10 || newTT > comp10) continue;
        const minTMPosible = newTM + (restantes - 1) * datos[i].tm10;
        if (minTMPosible > objetivo10) break;
      } else {
        if (newTT > objetivo10 || newTM > comp10) continue;
        const minTTPosible = newTT + (restantes - 1) * datos[i].tt10;
        if (minTTPosible > objetivo10) break;
      }

      actual.push(d);
      rec(i, depth + 1, newTM, newTT, nuevo01);
      actual.pop();
    }
  }

  rec(0,0,0,0,0);
  return out;
}

function compararArrays(a,b) {
  for (let i=0;i<Math.min(a.length,b.length);i++) {
    if (a[i] !== b[i]) return a[i]-b[i];
  }
  return a.length-b.length;
}

function mostrarCalcMensaje(texto, tipo) {
  $("calcMessage").innerHTML = texto ? `<div class="notice ${tipo}">${texto}</div>` : "";
}

function cargarOpcionesFiltro(tipo) {
  $("filtroTM").innerHTML = TABLAS[tipo]
    .map(([tm]) => `<option value="${tm}">${fmt(tm)}</option>`).join("");
  actualizarCantidadFiltro();
}

function agregarFiltro() {
  const tm = parseFloat($("filtroTM").value);
  const condicion = $("filtroCondicion").value;
  const cantidad = parseInt($("filtroCantidad").value || "1",10);

  state.filtros.push({tm, condicion, cantidad});
  renderFiltros();
  renderResultados();
}

function renderFiltros() {
  const cont = $("filtrosActivos");
  if (!cont) return;

  const labels = {
    contiene:"Contiene", noContiene:"No contiene",
    exacto:"Exactamente", minimo:"Mínimo", maximo:"Máximo"
  };

  cont.innerHTML = state.filtros.map((f,i) => {
    const cantidad = ["exacto","minimo","maximo"].includes(f.condicion) ? ` ${f.cantidad}×` : "";
    return `<span class="filter-chip">${labels[f.condicion]}${cantidad} TM ${fmt(f.tm)}
      <button data-remove-filter="${i}" title="Quitar">×</button></span>`;
  }).join("");

  cont.querySelectorAll("[data-remove-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.filtros.splice(Number(btn.dataset.removeFilter),1);
      renderFiltros();
      renderResultados();
    });
  });
}

function aplicarFiltros(resultados) {
  return resultados.filter(r => state.filtros.every(f => {
    const count = r.tms.filter(x => Math.abs(x-f.tm) < 0.0001).length;
    if (f.condicion === "contiene") return count >= 1;
    if (f.condicion === "noContiene") return count === 0;
    if (f.condicion === "exacto") return count === f.cantidad;
    if (f.condicion === "minimo") return count >= f.cantidad;
    if (f.condicion === "maximo") return count <= f.cantidad;
    return true;
  }));
}

function renderResultados() {
  const cont = $("resultsContainer");
  if (!cont) return;

  const lista = aplicarFiltros(state.resultadosBase);
  $("resultsCount").textContent = `${lista.length} resultado${lista.length === 1 ? "" : "s"}`;

  if (state.resultadosBase.length) {
    const primero = lista[0] || state.resultadosBase[0];
    $("resultsSummary").innerHTML = `
      <div class="summary-box"><span>RESULTADOS BASE</span><strong>${state.resultadosBase.length}</strong></div>
      <div class="summary-box"><span>FILTRADOS</span><strong>${lista.length}</strong></div>
      <div class="summary-box"><span>MEJOR TM</span><strong>${fmt(primero.tmTotal)}</strong></div>
      <div class="summary-box"><span>MEJOR TT</span><strong>${fmt(primero.ttTotal)}</strong></div>
    `;
  } else $("resultsSummary").innerHTML = "";

  if (!lista.length) {
    cont.innerHTML = `<div class="empty-state">No hay resultados que cumplan los filtros actuales.</div>`;
    return;
  }

  cont.innerHTML = `
    <div class="results-wrap">
      <table class="results-table">
        <thead>
          <tr><th>#</th><th>PIERNAS TM</th><th>TM TOTAL</th><th>TT TOTAL</th><th>TT POR PIERNA</th><th>ACCIONES</th></tr>
        </thead>
        <tbody>
          ${lista.map((r,i) => `
            <tr>
              <td>${i+1}</td>
              <td class="combo">${r.tms.map(fmt).join(" + ")}</td>
              <td class="metric">${fmt(r.tmTotal)}</td>
              <td class="metric">${fmt(r.ttTotal)}</td>
              <td>${r.tts.map(fmt).join(" + ")}</td>
              <td>
                <div style="display:flex;gap:6px;white-space:nowrap">
                  <button class="btn-small" data-select="${encodeURIComponent(JSON.stringify(r))}">SELECCIONAR</button>
                  <button class="btn-small" data-save="${encodeURIComponent(JSON.stringify(r))}">GUARDAR</button>
                </div>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  cont.querySelectorAll("[data-select]").forEach(btn => {
    btn.addEventListener("click", () => seleccionarCombinacion(JSON.parse(decodeURIComponent(btn.dataset.select))));
  });
  cont.querySelectorAll("[data-save]").forEach(btn => {
    btn.addEventListener("click", () => guardarCombinacion(JSON.parse(decodeURIComponent(btn.dataset.save)), btn));
  });
}

function seleccionarCombinacion(r) {
  const tipo = document.querySelector('input[name="tipoVuelo"]:checked').value;
  state.resultadoSeleccionado = {
    ...r,
    tipo,
    restricciones: leerRestricciones()
  };

  $("resultsContainer").insertAdjacentHTML("afterbegin", `
    <div class="notice ok" id="selectedNotice">
      <b>Combinación seleccionada:</b> ${r.tms.map(fmt).join(" + ")}
      · TM ${fmt(r.tmTotal)} · TT ${fmt(r.ttTotal)}.
      <br>El siguiente módulo será <b>Organizar tiempos</b>, donde podrá ordenar las piernas y calcular las horas automáticamente.
    </div>
  `);
}

function leerRestricciones() {
  const con = document.querySelector('input[name="restriccionModo"]:checked').value === "con";
  return {
    activas: con,
    noIniciarAntes: con && $("usarInicioMin").checked ? $("horaInicioMin").value : null,
    noFinalizarDespues: con && $("usarFinMax").checked ? $("horaFinMax").value : null
  };
}

async function guardarCombinacion(r, btn) {
  const tipo = document.querySelector('input[name="tipoVuelo"]:checked').value;
  const key = `${tipo}_tm${toKey(r.tmTotal)}_tt${toKey(r.ttTotal)}`;
  const ref = doc(db, "combinaciones", key);

  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = "GUARDANDO...";

  try {
    const existente = await getDoc(ref);
    if (existente.exists()) {
      btn.textContent = "YA EXISTE";
      setTimeout(() => {btn.textContent = original; btn.disabled = false;}, 1800);
      return;
    }

    await setDoc(ref, {
      tipo,
      tipoNombre: NOMBRES_TIPO[tipo],
      tmTotal: r.tmTotal,
      ttTotal: r.ttTotal,
      piernas: r.tms.length,
      tms: r.tms,
      tts: r.tts,
      creadoPorUid: state.perfil.uid,
      creadoPorCorreo: state.perfil.correo,
      creadoEn: serverTimestamp()
    });

    btn.textContent = "GUARDADA";
    setTimeout(() => {btn.textContent = original; btn.disabled = false;}, 1800);
  } catch (e) {
    console.error(e);
    btn.textContent = "ERROR";
    setTimeout(() => {btn.textContent = original; btn.disabled = false;}, 1800);
  }
}

function toKey(v) {
  return Math.round(v*10).toString().padStart(2,"0");
}

async function renderGuardadas() {
  workspaceTitle.textContent = "Combinaciones guardadas";
  workspaceContent.innerHTML = `
    <section class="panel">
      <h4 class="panel-title">Consulta de combinaciones</h4>
      <p class="panel-subtitle">El sistema conserva una sola combinación base por Tipo de vuelo + TM total + TT total.</p>
      <div class="saved-filters">
        <div class="field">
          <label>TIPO</label>
          <select id="savedTipo"><option value="">Todos</option><option value="operaciones">Operaciones</option><option value="entrenamiento">Entrenamiento</option><option value="mantenimiento">Mantenimiento</option></select>
        </div>
        <div class="field"><label>TM TOTAL</label><input id="savedTM" type="number" step="0.1" placeholder="Ej. 4.3"></div>
        <div class="field"><label>TT TOTAL</label><input id="savedTT" type="number" step="0.1" placeholder="Ej. 8.0"></div>
        <button id="btnBuscarGuardadas" class="btn-primary">BUSCAR</button>
      </div>
      <div id="savedList"><div class="empty-state">Cargando combinaciones...</div></div>
    </section>
  `;

  $("btnBuscarGuardadas").addEventListener("click", cargarGuardadas);
  await cargarGuardadas();
}

async function cargarGuardadas() {
  const list = $("savedList");
  if (!list) return;
  list.innerHTML = `<div class="empty-state">Consultando...</div>`;

  try {
    const snap = await getDocs(collection(db, "combinaciones"));
    let items = snap.docs.map(d => ({id:d.id, ...d.data()}));

    const tipo = $("savedTipo").value;
    const tm = parseFloat($("savedTM").value);
    const tt = parseFloat($("savedTT").value);

    if (tipo) items = items.filter(x => x.tipo === tipo);
    if (Number.isFinite(tm)) items = items.filter(x => Math.abs(x.tmTotal - tm) < .001);
    if (Number.isFinite(tt)) items = items.filter(x => Math.abs(x.ttTotal - tt) < .001);

    items.sort((a,b) => (a.tmTotal-b.tmTotal) || (a.ttTotal-b.ttTotal));

    if (!items.length) {
      list.innerHTML = `<div class="empty-state">No hay combinaciones guardadas para esos criterios.</div>`;
      return;
    }

    list.innerHTML = items.map((x,i) => `
      <div class="saved-card">
        <div>
          <h4>${x.tipoNombre || NOMBRES_TIPO[x.tipo] || x.tipo} · TM ${fmt(x.tmTotal)} · TT ${fmt(x.ttTotal)}</h4>
          <p class="saved-combo">${(x.tms||[]).map(fmt).join(" + ")}</p>
          <p>${x.piernas || (x.tms||[]).length} piernas</p>
        </div>
        <button class="btn-small" data-use-saved="${i}">USAR COMBINACIÓN</button>
      </div>
    `).join("");

    list.querySelectorAll("[data-use-saved]").forEach(btn => {
      btn.addEventListener("click", () => {
        const x = items[Number(btn.dataset.useSaved)];
        state.resultadoSeleccionado = {
          tipo:x.tipo, tmTotal:x.tmTotal, ttTotal:x.ttTotal,
          tms:x.tms || [], tts:x.tts || [], restricciones:{activas:false,noIniciarAntes:null,noFinalizarDespues:null}
        };
        list.insertAdjacentHTML("afterbegin", `<div class="notice ok"><b>Combinación preparada.</b> En la siguiente versión se abrirá directamente el organizador de horarios.</div>`);
      });
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = `<div class="notice error">No fue posible consultar las combinaciones guardadas.</div>`;
  }
}

function fmt(v) {
  return Number(v).toFixed(1).replace(".",",");
}
