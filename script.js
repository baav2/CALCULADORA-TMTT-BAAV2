import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, serverTimestamp
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
  resultadoSeleccionado: null,
  organizador: null
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
  else if (modulo === "vuelos") renderVuelosGuardados();
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
  abrirOrganizador(state.resultadoSeleccionado);
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
        <div class="saved-actions">
          <button class="btn-small" data-use-saved="${i}">USAR COMBINACIÓN</button>
          ${state.perfil?.rol === "admin" ? `<button class="btn-danger" data-delete-combo="${x.id}">ELIMINAR</button>` : ""}
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-use-saved]").forEach(btn => {
      btn.addEventListener("click", () => {
        const x = items[Number(btn.dataset.useSaved)];
        state.resultadoSeleccionado = {
          tipo:x.tipo, tmTotal:x.tmTotal, ttTotal:x.ttTotal,
          tms:x.tms || [], tts:x.tts || [],
          restricciones:{activas:false,noIniciarAntes:null,noFinalizarDespues:null}
        };
        abrirOrganizador(state.resultadoSeleccionado);
      });
    });

    list.querySelectorAll("[data-delete-combo]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (state.perfil?.rol !== "admin") return;
        const ok = confirm("¿Seguro que desea eliminar esta combinación guardada?");
        if (!ok) return;
        try {
          await deleteDoc(doc(db, "combinaciones", btn.dataset.deleteCombo));
          await cargarGuardadas();
        } catch (e) {
          console.error(e);
          alert("No fue posible eliminar la combinación.");
        }
      });
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = `<div class="notice error">No fue posible consultar las combinaciones guardadas.</div>`;
  }
}


/* =========================================================
   ORGANIZADOR DE TIEMPOS
   ========================================================= */

function abrirOrganizador(combo) {
  const piernas = (combo.piernasDetalle && combo.piernasDetalle.length)
    ? combo.piernasDetalle.map((p, i) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}-${Math.random()}`,
        tm: Number(p.tm),
        tt: Number(p.tt),
        tmMin: Number(p.tmMin ?? minutosPracticos(p.tm).slice(-1)[0]),
        ttMin: Number(p.ttMin ?? minutosPracticos(p.tt).slice(-1)[0]),
        inicioTT: p.inicioTT || "",
        inicioTM: p.inicioTM || "",
        finTM: p.finTM || "",
        finTT: p.finTT || "",
        rutaDe: p.rutaDe || "",
        rutaA: p.rutaA || "",
        observacion: p.observacion || "",
        bloqueada: false
      }))
    : combo.tms.map((tm, i) => {
        const tt = combo.tts[i];
        const tmOps = minutosPracticos(tm);
        const ttOps = minutosPracticos(tt);
        return {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}-${Math.random()}`,
          tm,
          tt,
          tmMin: tmOps[tmOps.length - 1],
          ttMin: ttOps[ttOps.length - 1],
          inicioTT: "",
          inicioTM: "",
          finTM: "",
          finTT: "",
          rutaDe: "",
          rutaA: "",
          observacion: "",
          bloqueada: false
        };
      });

  state.organizador = {
    tipo: combo.tipo,
    tmTotal: combo.tmTotal,
    ttTotal: combo.ttTotal,
    restricciones: combo.restricciones || {activas:false,noIniciarAntes:null,noFinalizarDespues:null},
    inicioGeneral: combo.inicioGeneral || piernas[0]?.inicioTT || "",
    vueloOrigenId: combo.vueloOrigenId || null,
    piernas
  };

  renderOrganizador();
}

function renderOrganizador() {
  const o = state.organizador;
  if (!o) return;

  workspaceTitle.textContent = "Organizar tiempos";
  workspace.classList.remove("hidden");

  const r = o.restricciones || {};
  const restriccionesTexto = !r.activas
    ? "Sin restricciones"
    : [
        r.noIniciarAntes ? `No iniciar antes de ${r.noIniciarAntes}` : "",
        r.noFinalizarDespues ? `No finalizar después de ${r.noFinalizarDespues}` : ""
      ].filter(Boolean).join(" · ") || "Restricciones activadas";

  workspaceContent.innerHTML = `
    <section class="panel organizer-head">
      <div class="organizer-title-row">
        <div>
          <span class="workspace-kicker">COMBINACIÓN SELECCIONADA</span>
          <h4 class="panel-title">${NOMBRES_TIPO[o.tipo]} · TM ${fmt(o.tmTotal)} · TT ${fmt(o.ttTotal)}</h4>
          <p class="panel-subtitle">${o.piernas.map(p => fmt(p.tm)).join(" + ")}</p>
        </div>
        <div class="organizer-head-actions">
          <button id="btnVolverCalc" class="btn-secondary">VOLVER A CALCULADORA</button>
          <button id="btnResumenFinal" class="btn-primary">VER RESUMEN</button>
        </div>
      </div>

      <div class="organizer-settings">
        <div class="field">
          <label>INICIO TT PRIMERA PIERNA</label>
          <input id="inicioGeneral" type="time" step="300" value="${o.inicioGeneral}">
          <div class="field-help">Usted determina la hora inicial. El sistema organiza las demás.</div>
        </div>
        <div class="organizer-rule">
          <span>INTERVALO AUTOMÁTICO</span>
          <strong>10 MIN</strong>
          <small>mínimo entre fin TT e inicio TT siguiente</small>
        </div>
        <div class="organizer-rule">
          <span>RESTRICCIONES</span>
          <strong>${restriccionesTexto}</strong>
          <small>se validan sin impedir la edición manual</small>
        </div>
      </div>

      <div id="validacionGeneral"></div>
    </section>

    <section class="panel" style="margin-top:18px">
      <div class="organizer-instructions">
        <div>
          <h4 class="panel-title">Orden de piernas y horarios</h4>
          <p class="panel-subtitle">Puede subir, bajar, bloquear o editar. Los cambios automáticos nunca modifican las piernas anteriores.</p>
        </div>
      </div>

      <div id="legsContainer" class="legs-container"></div>
    </section>

    <section id="finalSummaryPanel" class="panel hidden" style="margin-top:18px"></section>
  `;

  $("inicioGeneral").addEventListener("change", () => {
    o.inicioGeneral = $("inicioGeneral").value;
    if (o.inicioGeneral) {
      o.piernas[0].inicioTT = o.inicioGeneral;
      recalcularDesde(0, true);
    }
    renderPiernas();
  });

  $("btnVolverCalc").addEventListener("click", renderCalculadora);
  $("btnResumenFinal").addEventListener("click", mostrarResumenFinal);

  renderPiernas();
  setTimeout(() => workspace.scrollIntoView({behavior:"smooth",block:"start"}), 30);
}

function renderPiernas() {
  const o = state.organizador;
  const cont = $("legsContainer");
  if (!o || !cont) return;

  cont.innerHTML = o.piernas.map((p, i) => {
    const tmOpts = minutosPracticos(p.tm);
    const ttOpts = minutosPracticos(p.tt);
    const errores = validarPierna(i);
    const estado = errores.length ? "warn" : (p.inicioTT ? "ok" : "pending");
    const estadoTexto = errores.length ? `${errores.length} alerta${errores.length === 1 ? "" : "s"}` : (p.inicioTT ? "Correcta" : "Pendiente");

    return `
      <article class="leg-card ${p.bloqueada ? "locked" : ""}" data-leg-id="${p.id}">
        <div class="leg-top">
          <div class="leg-number">${i + 1}</div>
          <div class="leg-main">
            <div class="leg-metrics">
              <span>TM <strong>${fmt(p.tm)}</strong></span>
              <span>TT <strong>${fmt(p.tt)}</strong></span>
            </div>
            <div class="leg-status ${estado}">${estadoTexto}</div>
          </div>

          <div class="leg-order-actions">
            <button class="icon-btn" data-up="${i}" ${i===0 || p.bloqueada ? "disabled" : ""} title="Subir pierna">↑</button>
            <button class="icon-btn" data-down="${i}" ${i===o.piernas.length-1 || p.bloqueada ? "disabled" : ""} title="Bajar pierna">↓</button>
            <button class="icon-btn lock-btn" data-lock="${i}" title="${p.bloqueada ? "Desbloquear" : "Bloquear"}">${p.bloqueada ? "🔒" : "🔓"}</button>
          </div>
        </div>

        <div class="duration-row">
          <div class="field compact">
            <label>DURACIÓN PRÁCTICA TT</label>
            ${duracionControl(`ttDur-${i}`, ttOpts, p.ttMin)}
          </div>
          <div class="field compact">
            <label>DURACIÓN PRÁCTICA TM</label>
            ${duracionControl(`tmDur-${i}`, tmOpts, p.tmMin)}
          </div>
        </div>

        <div class="time-grid">
          ${timeControl(i, "inicioTT", "INICIO TT", p.inicioTT)}
          ${timeControl(i, "inicioTM", "INICIO TM", p.inicioTM)}
          ${timeControl(i, "finTM", "TÉRMINO TM", p.finTM)}
          ${timeControl(i, "finTT", "TÉRMINO TT", p.finTT)}
        </div>

        <div class="route-block">
          <div class="route-title">RUTA</div>
          <div class="route-grid">
            <div class="field compact">
              <label>DE</label>
              <input type="text" data-route-index="${i}" data-route-field="rutaDe"
                     value="${escapeHtml(p.rutaDe || "")}"
                     placeholder="Ej. Tolemaida, SKTI, punto táctico...">
            </div>
            <div class="field compact">
              <label>A</label>
              <input type="text" data-route-index="${i}" data-route-field="rutaA"
                     value="${escapeHtml(p.rutaA || "")}"
                     placeholder="Ej. Popayán, SKPP, punto táctico...">
            </div>
          </div>
        </div>

        <div class="field observation-field">
          <label>OBSERVACIONES DE LA PIERNA</label>
          <textarea data-observation-index="${i}" placeholder="Escriba libremente lo realizado en esta pierna...">${escapeHtml(p.observacion || "")}</textarea>
        </div>

        <div class="leg-actions">
          <button class="btn-small" data-recalc="${i}">REORGANIZAR DESDE AQUÍ</button>
          <button class="btn-small" data-auto="${i}">RESTABLECER AUTOMÁTICO</button>
        </div>

        ${errores.length ? `<div class="leg-errors">${errores.map(e => `<div>⚠ ${e}</div>`).join("")}</div>` : ""}
      </article>
    `;
  }).join("");

  enlazarPiernas();
  renderValidacionGeneral();
}

function duracionControl(id, options, selected) {
  if (options.length === 1) {
    return `<div class="duration-static">${formatearMinutos(options[0])}</div>`;
  }
  return `<select id="${id}">
    ${options.map(m => `<option value="${m}" ${m===selected ? "selected" : ""}>${formatearMinutos(m)}</option>`).join("")}
  </select>`;
}

function timeControl(i, campo, label, value) {
  return `
    <div class="field compact">
      <label>${label}</label>
      <input type="time" step="300" data-time-index="${i}" data-time-field="${campo}" value="${value || ""}">
    </div>
  `;
}

function enlazarPiernas() {
  const o = state.organizador;

  document.querySelectorAll("[data-up]").forEach(btn => {
    btn.addEventListener("click", () => moverPierna(Number(btn.dataset.up), -1));
  });
  document.querySelectorAll("[data-down]").forEach(btn => {
    btn.addEventListener("click", () => moverPierna(Number(btn.dataset.down), 1));
  });
  document.querySelectorAll("[data-lock]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.lock);
      o.piernas[i].bloqueada = !o.piernas[i].bloqueada;
      renderPiernas();
    });
  });

  document.querySelectorAll("[data-recalc]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.recalc);
      recalcularDesde(i, true);
      renderPiernas();
    });
  });

  document.querySelectorAll("[data-auto]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.auto);
      const p = o.piernas[i];
      p.tmMin = minutosPracticos(p.tm).slice(-1)[0];
      p.ttMin = minutosPracticos(p.tt).slice(-1)[0];
      if (i === 0 && o.inicioGeneral) p.inicioTT = o.inicioGeneral;
      recalcularDesde(i, true);
      renderPiernas();
    });
  });

  document.querySelectorAll("[data-route-index]").forEach(input => {
    input.addEventListener("input", () => {
      const i = Number(input.dataset.routeIndex);
      const campo = input.dataset.routeField;
      o.piernas[i][campo] = input.value;
    });
  });

  document.querySelectorAll("[data-observation-index]").forEach(textarea => {
    textarea.addEventListener("input", () => {
      const i = Number(textarea.dataset.observationIndex);
      o.piernas[i].observacion = textarea.value;
    });
  });

  document.querySelectorAll("[data-time-index]").forEach(input => {
    input.addEventListener("change", () => {
      const i = Number(input.dataset.timeIndex);
      const campo = input.dataset.timeField;
      const p = o.piernas[i];
      p[campo] = input.value;

      // Si se modifica Inicio TT, se reorganiza esa pierna y las siguientes.
      // Las anteriores quedan intactas.
      if (campo === "inicioTT" && input.value) {
        if (i === 0) {
          o.inicioGeneral = input.value;
          $("inicioGeneral").value = input.value;
        }
        recalcularDesde(i, true);
      }
      renderPiernas();
    });
  });

  o.piernas.forEach((p, i) => {
    const ttSel = $(`ttDur-${i}`);
    if (ttSel) {
      ttSel.addEventListener("change", () => {
        p.ttMin = Number(ttSel.value);
        recalcularDesde(i, true);
        renderPiernas();
      });
    }
    const tmSel = $(`tmDur-${i}`);
    if (tmSel) {
      tmSel.addEventListener("change", () => {
        p.tmMin = Number(tmSel.value);
        recalcularDesde(i, true);
        renderPiernas();
      });
    }
  });
}

function moverPierna(index, delta) {
  const o = state.organizador;
  const target = index + delta;
  if (target < 0 || target >= o.piernas.length) return;
  if (o.piernas[index].bloqueada || o.piernas[target].bloqueada) return;

  const inicioRecalc = Math.min(index, target);
  [o.piernas[index], o.piernas[target]] = [o.piernas[target], o.piernas[index]];

  if (inicioRecalc === 0 && o.inicioGeneral) {
    o.piernas[0].inicioTT = o.inicioGeneral;
  }
  recalcularDesde(inicioRecalc, true);
  renderPiernas();
}

function recalcularDesde(inicio, conservarInicioActual = true) {
  const o = state.organizador;
  if (!o) return;

  for (let i = inicio; i < o.piernas.length; i++) {
    const p = o.piernas[i];

    // Una pierna bloqueada conserva todas sus horas.
    if (p.bloqueada) continue;

    let inicioTT;
    if (i === 0) {
      inicioTT = conservarInicioActual && p.inicioTT ? p.inicioTT : o.inicioGeneral;
    } else if (i === inicio && conservarInicioActual && p.inicioTT) {
      inicioTT = p.inicioTT;
    } else {
      const anterior = o.piernas[i - 1];
      if (!anterior.finTT) {
        limpiarHorasDesde(i);
        return;
      }
      inicioTT = minutosAHora(horaAMinutos(anterior.finTT) + 10);
    }

    if (!inicioTT) {
      limpiarHorasDesde(i);
      return;
    }

    p.inicioTT = inicioTT;

    const inicioMin = horaAMinutos(p.inicioTT);
    const finTTMin = inicioMin + p.ttMin;

    if (finTTMin >= 24 * 60) {
      p.finTT = minutosAHora(finTTMin);
    } else {
      p.finTT = minutosAHora(finTTMin);
    }

    const espacio = Math.max(0, p.ttMin - p.tmMin);
    let margenInicio = Math.round((espacio / 2) / 5) * 5;
    margenInicio = Math.max(0, Math.min(espacio, margenInicio));

    const inicioTMMin = inicioMin + margenInicio;
    p.inicioTM = minutosAHora(inicioTMMin);
    p.finTM = minutosAHora(inicioTMMin + p.tmMin);
  }
}

function limpiarHorasDesde(inicio) {
  const o = state.organizador;
  for (let i = inicio; i < o.piernas.length; i++) {
    if (o.piernas[i].bloqueada) continue;
    o.piernas[i].inicioTT = "";
    o.piernas[i].inicioTM = "";
    o.piernas[i].finTM = "";
    o.piernas[i].finTT = "";
  }
}

function minutosPracticos(valor) {
  const v10 = Math.round(Number(valor) * 10);
  const base = Math.floor(Number(valor) * 12 + 1e-9) * 5;
  const decima = ((v10 % 10) + 10) % 10;

  // En .5 y en horas completas ustedes manejan dos posibilidades:
  // ej. 0,5 => 25/30; 1,0 => 55/60; 1,5 => 85/90.
  if ((decima === 5 || decima === 0) && base >= 5) {
    return [base - 5, base];
  }
  return [base];
}

function horaAMinutos(hora) {
  if (!hora || !/^\d{2}:\d{2}$/.test(hora)) return NaN;
  const [h,m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function minutosAHora(minutos) {
  let m = ((Math.round(minutos) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}

function diferenciaMinutos(inicio, fin) {
  const a = horaAMinutos(inicio);
  const b = horaAMinutos(fin);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
  return b >= a ? b - a : (1440 - a) + b;
}

function formatearMinutos(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return `${h} h ${String(m).padStart(2,"0")} min`;
}

function validarPierna(i) {
  const o = state.organizador;
  const p = o.piernas[i];
  const errores = [];

  if (!p.inicioTT || !p.inicioTM || !p.finTM || !p.finTT) return errores;

  const campos = [
    ["Inicio TT", p.inicioTT],
    ["Inicio TM", p.inicioTM],
    ["Término TM", p.finTM],
    ["Término TT", p.finTT]
  ];

  campos.forEach(([nombre,hora]) => {
    const min = horaAMinutos(hora);
    if (Number.isFinite(min) && min % 5 !== 0) {
      errores.push(`${nombre} no está en intervalo de 5 minutos.`);
    }
  });

  const durTT = diferenciaMinutos(p.inicioTT, p.finTT);
  const durTM = diferenciaMinutos(p.inicioTM, p.finTM);
  const ttPermitidos = minutosPracticos(p.tt);
  const tmPermitidos = minutosPracticos(p.tm);

  if (!ttPermitidos.includes(durTT)) {
    errores.push(`Duración TT ${durTT} min no corresponde a TT ${fmt(p.tt)} (${ttPermitidos.map(formatearMinutos).join(" o ")}).`);
  }
  if (!tmPermitidos.includes(durTM)) {
    errores.push(`Duración TM ${durTM} min no corresponde a TM ${fmt(p.tm)} (${tmPermitidos.map(formatearMinutos).join(" o ")}).`);
  }

  const baseTT = horaAMinutos(p.inicioTT);
  const relInicioTM = diferenciaMinutos(p.inicioTT, p.inicioTM);
  const relFinTM = diferenciaMinutos(p.inicioTT, p.finTM);

  if (relInicioTM > durTT || relFinTM > durTT || diferenciaMinutos(p.inicioTM,p.finTM) > durTT) {
    errores.push("El bloque TM quedó por fuera del TT.");
  }

  if (i > 0) {
    const ant = o.piernas[i - 1];
    if (ant.finTT && p.inicioTT) {
      const intervalo = diferenciaMinutos(ant.finTT, p.inicioTT);
      if (intervalo < 10) {
        errores.push(`Intervalo con la pierna anterior: ${intervalo} min. Mínimo requerido: 10 min.`);
      }
    }
  }

  const r = o.restricciones || {};
  if (r.activas && r.noIniciarAntes) {
    if (horaAMinutos(p.inicioTT) < horaAMinutos(r.noIniciarAntes)) {
      errores.push(`Inicio TT anterior a la restricción ${r.noIniciarAntes}.`);
    }
  }
  if (r.activas && r.noFinalizarDespues) {
    if (horaAMinutos(p.finTT) > horaAMinutos(r.noFinalizarDespues)) {
      const exceso = horaAMinutos(p.finTT) - horaAMinutos(r.noFinalizarDespues);
      errores.push(`Término TT excede ${r.noFinalizarDespues} en ${exceso} min.`);
    }
  }

  return errores;
}

function renderValidacionGeneral() {
  const cont = $("validacionGeneral");
  const o = state.organizador;
  if (!cont || !o) return;

  const conHoras = o.piernas.filter(p => p.inicioTT && p.finTT).length;
  if (!conHoras) {
    cont.innerHTML = `<div class="notice info">Ingrese la hora de Inicio TT de la primera pierna para organizar automáticamente.</div>`;
    return;
  }

  const errores = o.piernas.flatMap((_,i) => validarPierna(i).map(e => ({i,e})));

  if (!errores.length && conHoras === o.piernas.length) {
    cont.innerHTML = `<div class="notice ok"><b>✓ Organización válida.</b> Todos los tiempos cumplen las reglas actuales.</div>`;
  } else if (errores.length) {
    cont.innerHTML = `<div class="notice warn"><b>⚠ ${errores.length} inconsistencia${errores.length===1?"":"s"}.</b> Revise las piernas marcadas.</div>`;
  } else {
    cont.innerHTML = `<div class="notice info">Organización incompleta. Faltan horarios por calcular.</div>`;
  }
}

function mostrarResumenFinal() {
  const o = state.organizador;
  const panel = $("finalSummaryPanel");
  if (!o || !panel) return;

  const errores = o.piernas.flatMap((_,i) => validarPierna(i));
  const completas = o.piernas.every(p => p.inicioTT && p.inicioTM && p.finTM && p.finTT);

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="results-toolbar">
      <div>
        <h4>Resumen final</h4>
        <span class="results-count">${NOMBRES_TIPO[o.tipo]} · TM ${fmt(o.tmTotal)} · TT ${fmt(o.ttTotal)}</span>
      </div>
      <div class="summary-actions">
        <button id="btnGuardarVuelo" class="btn-secondary">GUARDAR VUELO</button>
        <button id="btnCopiarResumen" class="btn-primary">COPIAR DATOS</button>
      </div>
    </div>

    ${!completas ? `<div class="notice warn">La organización todavía está incompleta.</div>` : ""}
    ${errores.length ? `<div class="notice warn">Hay ${errores.length} inconsistencia${errores.length===1?"":"s"}. Puede revisar el resumen, pero conviene corregirlas antes de usarlo.</div>` : `<div class="notice ok">✓ Organización válida.</div>`}

    <div class="results-wrap" style="margin-top:14px">
      <table class="results-table">
        <thead>
          <tr>
            <th>PIERNA</th><th>RUTA</th><th>TM</th><th>TT</th><th>INICIO TT</th>
            <th>INICIO TM</th><th>TÉRMINO TM</th><th>TÉRMINO TT</th><th>OBSERVACIONES</th>
          </tr>
        </thead>
        <tbody>
          ${o.piernas.map((p,i) => `
            <tr>
              <td>${i+1}</td>
              <td class="route-cell">${escapeHtml(p.rutaDe || "—")} → ${escapeHtml(p.rutaA || "—")}</td>
              <td class="metric">${fmt(p.tm)}</td><td class="metric">${fmt(p.tt)}</td>
              <td>${p.inicioTT || "—"}</td><td>${p.inicioTM || "—"}</td>
              <td>${p.finTM || "—"}</td><td>${p.finTT || "—"}</td>
              <td class="observation-cell">${escapeHtml(p.observacion || "—")}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  $("btnCopiarResumen").addEventListener("click", copiarResumen);
  $("btnGuardarVuelo").addEventListener("click", guardarVueloCompleto);
  panel.scrollIntoView({behavior:"smooth",block:"start"});
}

async function copiarResumen() {
  const o = state.organizador;
  const lineas = [
    `TIPO: ${NOMBRES_TIPO[o.tipo]}`,
    `TM TOTAL: ${fmt(o.tmTotal)}`,
    `TT TOTAL: ${fmt(o.ttTotal)}`,
    ""
  ];

  o.piernas.forEach((p,i) => {
    lineas.push(
      `PIERNA ${i+1} | Ruta ${p.rutaDe || "—"} → ${p.rutaA || "—"} | TM ${fmt(p.tm)} | TT ${fmt(p.tt)} | Inicio TT ${p.inicioTT || "—"} | Inicio TM ${p.inicioTM || "—"} | Término TM ${p.finTM || "—"} | Término TT ${p.finTT || "—"} | Observaciones: ${p.observacion || "—"}`
    );
  });

  try {
    await navigator.clipboard.writeText(lineas.join("\n"));
    const btn = $("btnCopiarResumen");
    if (btn) {
      const t = btn.textContent;
      btn.textContent = "COPIADO";
      setTimeout(() => btn.textContent = t, 1500);
    }
  } catch {
    alert("No fue posible copiar automáticamente. Puede seleccionar los datos del resumen.");
  }
}



/* =========================================================
   V5 · VUELOS GUARDADOS / OBSERVACIONES / ELIMINAR
   ========================================================= */

async function guardarVueloCompleto() {
  const o = state.organizador;
  if (!o || !state.perfil) return;

  const completas = o.piernas.every(p => p.inicioTT && p.inicioTM && p.finTM && p.finTT);
  const errores = o.piernas.flatMap((_, i) => validarPierna(i));

  if (!completas) {
    alert("La organización está incompleta. Complete todas las horas antes de guardar el vuelo.");
    return;
  }

  if (errores.length) {
    const continuar = confirm(`La organización tiene ${errores.length} inconsistencia(s). ¿Desea guardarla de todas formas?`);
    if (!continuar) return;
  }

  const btn = $("btnGuardarVuelo");
  const original = btn?.textContent || "GUARDAR VUELO";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "GUARDANDO...";
  }

  try {
    const ref = await addDoc(collection(db, "vuelos"), {
      tipo: o.tipo,
      tipoNombre: NOMBRES_TIPO[o.tipo],
      tmTotal: o.tmTotal,
      ttTotal: o.ttTotal,
      inicioGeneral: o.inicioGeneral || o.piernas[0]?.inicioTT || "",
      restricciones: o.restricciones || {activas:false,noIniciarAntes:null,noFinalizarDespues:null},
      valido: errores.length === 0,
      numeroInconsistencias: errores.length,
      piernas: o.piernas.map((p, i) => ({
        numero: i + 1,
        tm: p.tm,
        tt: p.tt,
        tmMin: p.tmMin,
        ttMin: p.ttMin,
        inicioTT: p.inicioTT,
        inicioTM: p.inicioTM,
        finTM: p.finTM,
        finTT: p.finTT,
        rutaDe: p.rutaDe || "",
        rutaA: p.rutaA || "",
        observacion: p.observacion || ""
      })),
      creadoPorUid: state.perfil.uid,
      creadoPorCorreo: state.perfil.correo,
      creadoPorNombre: state.perfil.nombre || "",
      creadoEn: serverTimestamp()
    });

    o.vueloOrigenId = ref.id;
    if (btn) btn.textContent = "VUELO GUARDADO";
    setTimeout(() => {
      if (btn) {
        btn.textContent = original;
        btn.disabled = false;
      }
    }, 1800);
  } catch (e) {
    console.error(e);
    if (btn) {
      btn.textContent = "ERROR";
      btn.disabled = false;
    }
    alert("No fue posible guardar el vuelo. Revise las reglas de Firestore.");
  }
}

async function renderVuelosGuardados() {
  workspaceTitle.textContent = "Vuelos guardados";
  workspaceContent.innerHTML = `
    <section class="panel">
      <h4 class="panel-title">Historial de vuelos organizados</h4>
      <p class="panel-subtitle">Aquí se conserva el resumen completo: orden, TM/TT, horarios y observaciones de cada pierna.</p>

      <div class="saved-filters">
        <div class="field">
          <label>TIPO</label>
          <select id="flightTipo">
            <option value="">Todos</option>
            <option value="operaciones">Operaciones</option>
            <option value="entrenamiento">Entrenamiento</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>
        <div class="field"><label>TM TOTAL</label><input id="flightTM" type="number" step="0.1" placeholder="Ej. 4.3"></div>
        <div class="field"><label>TT TOTAL</label><input id="flightTT" type="number" step="0.1" placeholder="Ej. 8.0"></div>
        <button id="btnBuscarVuelos" class="btn-primary">BUSCAR</button>
      </div>

      <div id="flightsList"><div class="empty-state">Cargando vuelos...</div></div>
    </section>
  `;

  $("btnBuscarVuelos").addEventListener("click", cargarVuelosGuardados);
  await cargarVuelosGuardados();
}

async function cargarVuelosGuardados() {
  const list = $("flightsList");
  if (!list) return;
  list.innerHTML = `<div class="empty-state">Consultando...</div>`;

  try {
    const snap = await getDocs(collection(db, "vuelos"));
    let items = snap.docs.map(d => ({id:d.id, ...d.data()}));

    const tipo = $("flightTipo").value;
    const tm = parseFloat($("flightTM").value);
    const tt = parseFloat($("flightTT").value);

    if (tipo) items = items.filter(x => x.tipo === tipo);
    if (Number.isFinite(tm)) items = items.filter(x => Math.abs(Number(x.tmTotal) - tm) < .001);
    if (Number.isFinite(tt)) items = items.filter(x => Math.abs(Number(x.ttTotal) - tt) < .001);

    items.sort((a,b) => timestampMillis(b.creadoEn) - timestampMillis(a.creadoEn));

    if (!items.length) {
      list.innerHTML = `<div class="empty-state">No hay vuelos guardados para esos criterios.</div>`;
      return;
    }

    list.innerHTML = items.map((x,i) => {
      const fecha = formatearTimestamp(x.creadoEn);
      const obs = (x.piernas || []).filter(p => p.observacion).length;
      return `
        <div class="flight-card">
          <div class="flight-card-main">
            <div class="flight-badges">
              <span class="flight-badge">${escapeHtml(x.tipoNombre || NOMBRES_TIPO[x.tipo] || x.tipo)}</span>
              <span class="flight-badge ${x.valido === false ? "bad" : "good"}">${x.valido === false ? "CON ALERTAS" : "VÁLIDO"}</span>
            </div>
            <h4>TM ${fmt(x.tmTotal)} · TT ${fmt(x.ttTotal)} · ${(x.piernas || []).length} piernas</h4>
            <p>${fecha}${x.creadoPorNombre ? ` · ${escapeHtml(x.creadoPorNombre)}` : ""}</p>
            <p>${obs} pierna${obs===1?"":"s"} con observaciones</p>
          </div>
          <div class="saved-actions">
            <button class="btn-small" data-view-flight="${i}">VER RESUMEN</button>
            <button class="btn-small" data-duplicate-flight="${i}">DUPLICAR / USAR COMO BASE</button>
            ${state.perfil?.rol === "admin" ? `<button class="btn-danger" data-delete-flight="${x.id}">ELIMINAR</button>` : ""}
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll("[data-view-flight]").forEach(btn => {
      btn.addEventListener("click", () => mostrarVueloGuardado(items[Number(btn.dataset.viewFlight)]));
    });

    list.querySelectorAll("[data-duplicate-flight]").forEach(btn => {
      btn.addEventListener("click", () => usarVueloComoBase(items[Number(btn.dataset.duplicateFlight)]));
    });

    list.querySelectorAll("[data-delete-flight]").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (state.perfil?.rol !== "admin") return;
        if (!confirm("¿Seguro que desea eliminar este vuelo guardado? Esta acción no se puede deshacer.")) return;
        try {
          await deleteDoc(doc(db, "vuelos", btn.dataset.deleteFlight));
          await cargarVuelosGuardados();
        } catch (e) {
          console.error(e);
          alert("No fue posible eliminar el vuelo.");
        }
      });
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = `<div class="notice error">No fue posible consultar los vuelos guardados. Revise las reglas de Firestore.</div>`;
  }
}

function mostrarVueloGuardado(vuelo) {
  const list = $("flightsList");
  if (!list) return;

  const r = vuelo.restricciones || {};
  const restricciones = !r.activas
    ? "Sin restricciones"
    : [
        r.noIniciarAntes ? `No iniciar antes de ${r.noIniciarAntes}` : "",
        r.noFinalizarDespues ? `No finalizar después de ${r.noFinalizarDespues}` : ""
      ].filter(Boolean).join(" · ") || "Restricciones activas";

  const id = `flight-detail-${vuelo.id}`;
  document.getElementById(id)?.remove();

  list.insertAdjacentHTML("afterbegin", `
    <section id="${id}" class="flight-detail">
      <div class="results-toolbar">
        <div>
          <h4>Resumen guardado</h4>
          <span class="results-count">${escapeHtml(vuelo.tipoNombre || NOMBRES_TIPO[vuelo.tipo] || vuelo.tipo)} · TM ${fmt(vuelo.tmTotal)} · TT ${fmt(vuelo.ttTotal)}</span>
        </div>
        <button class="btn-outline" data-close-flight-detail="${id}">CERRAR RESUMEN</button>
      </div>

      <div class="notice ${vuelo.valido === false ? "warn" : "ok"}">
        ${vuelo.valido === false ? `Guardado con ${vuelo.numeroInconsistencias || 0} inconsistencia(s).` : "✓ Organización guardada como válida."}
        · ${escapeHtml(restricciones)}
      </div>

      <div class="results-wrap" style="margin-top:14px">
        <table class="results-table">
          <thead>
            <tr><th>PIERNA</th><th>RUTA</th><th>TM</th><th>TT</th><th>INICIO TT</th><th>INICIO TM</th><th>TÉRMINO TM</th><th>TÉRMINO TT</th><th>OBSERVACIONES</th></tr>
          </thead>
          <tbody>
            ${(vuelo.piernas || []).map((p,i) => `
              <tr>
                <td>${i+1}</td>
                <td class="route-cell">${escapeHtml(p.rutaDe || "—")} → ${escapeHtml(p.rutaA || "—")}</td>
                <td class="metric">${fmt(p.tm)}</td><td class="metric">${fmt(p.tt)}</td>
                <td>${escapeHtml(p.inicioTT || "—")}</td><td>${escapeHtml(p.inicioTM || "—")}</td>
                <td>${escapeHtml(p.finTM || "—")}</td><td>${escapeHtml(p.finTT || "—")}</td>
                <td class="observation-cell">${escapeHtml(p.observacion || "—")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `);

  list.querySelector(`[data-close-flight-detail="${id}"]`)?.addEventListener("click", () => {
    document.getElementById(id)?.remove();
  });
}

function usarVueloComoBase(vuelo) {
  const detalle = (vuelo.piernas || []).map(p => ({
    tm: Number(p.tm),
    tt: Number(p.tt),
    tmMin: Number(p.tmMin),
    ttMin: Number(p.ttMin),
    inicioTT: p.inicioTT || "",
    inicioTM: p.inicioTM || "",
    finTM: p.finTM || "",
    finTT: p.finTT || "",
    rutaDe: p.rutaDe || "",
    rutaA: p.rutaA || "",
    observacion: p.observacion || ""
  }));

  abrirOrganizador({
    tipo: vuelo.tipo,
    tmTotal: Number(vuelo.tmTotal),
    ttTotal: Number(vuelo.ttTotal),
    tms: detalle.map(p => p.tm),
    tts: detalle.map(p => p.tt),
    piernasDetalle: detalle,
    inicioGeneral: vuelo.inicioGeneral || detalle[0]?.inicioTT || "",
    restricciones: vuelo.restricciones || {activas:false,noIniciarAntes:null,noFinalizarDespues:null},
    vueloOrigenId: vuelo.id
  });
}

function timestampMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

function formatearTimestamp(ts) {
  const ms = timestampMillis(ts);
  if (!ms) return "Fecha no disponible";
  return new Date(ms).toLocaleString("es-CO", {
    year:"numeric", month:"2-digit", day:"2-digit",
    hour:"2-digit", minute:"2-digit", hour12:false
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function fmt(v) {
  return Number(v).toFixed(1).replace(".",",");
}
