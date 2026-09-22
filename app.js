// --- BASE DE DATOS Y CONFIGURACIÓN INICIAL ---
let inhábilesPersonalizados = JSON.parse(localStorage.getItem("inhabiles_misiones")) || [
  "2026-01-01", "2026-01-06", "2026-03-24", "2026-04-02", "2026-05-01", 
  "2026-05-25", "2026-06-20", "2026-07-09", "2026-11-20", "2026-12-25"
];

let ultCalculo = null;
let registrosGuardados = JSON.parse(localStorage.getItem("registros_plazos_misiones")) || [];

// --- FUNCIONES DE CÁLCULO DE VENCIMIENTO ---
function esInhabil(fechaISO) {
  return inhábilesPersonalizados.includes(fechaISO);
}

function calcularVencimiento() {
  const inputFecha = document.getElementById("fechaNotificacion").value;
  const diasPlazo = parseInt(document.getElementById("diasPlazo").value);
  const tipoPlazo = document.getElementById("tipoPlazo").value;
  const persona = document.getElementById("nombrePersona").value.trim();

  if (!inputFecha || isNaN(diasPlazo) || diasPlazo < 1) {
    alert("Por favor completa la fecha de notificación y un plazo válido.");
    return;
  }

  // Parsear fecha evitando desfasaje de zona horaria
  const partes = inputFecha.split("-");
  let fechaActual = new Date(partes[0], partes[1] - 1, partes[2]);

  let diasContados = 0;
  let inhábilesEncontrados = [];

  // El cómputo empieza al día siguiente de la notificación
  fechaActual.setDate(fechaActual.getDate() + 1);

  while (diasContados < diasPlazo) {
    const isoFecha = fechaActual.toISOString().split("T")[0];
    const esFinde = fechaActual.getDay() === 0 || fechaActual.getDay() === 6;
    const esFeriado = esInhabil(isoFecha);

    if (tipoPlazo === "habiles") {
      if (!esFinde && !esFeriado) {
        diasContados++;
      } else {
        const razon = esFinde ? "Fin de semana" : "Inhábil/Feria";
        inhábilesEncontrados.push(`${fechaActual.toLocaleDateString('es-AR')} (${razon})`);
      }
    } else { // Días Corridos
      diasContados++;
      if (esFinde || esFeriado) {
        const razon = esFinde ? "Fin de semana" : "Inhábil/Feria";
        inhábilesEncontrados.push(`${fechaActual.toLocaleDateString('es-AR')} (${razon})`);
      }
    }

    if (diasContados < diasPlazo) {
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
  }

  // Si el día de vencimiento de un plazo corrido cae en día inhábil, se prorroga al siguiente día hábil
  if (tipoPlazo === "corridos") {
    let isoFecha = fechaActual.toISOString().split("T")[0];
    while (fechaActual.getDay() === 0 || fechaActual.getDay() === 6 || esInhabil(isoFecha)) {
      fechaActual.setDate(fechaActual.getDate() + 1);
      isoFecha = fechaActual.toISOString().split("T")[0];
    }
  }

  // Formatear resultados
  const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const strVencimiento = fechaActual.toLocaleDateString('es-AR', opcionesFecha);

  // Calcular Plazo de Gracia (Primeras 2 horas del día hábil posterior)
  let fechaGracia = new Date(fechaActual);
  fechaGracia.setDate(fechaGracia.getDate() + 1);
  let isoGracia = fechaGracia.toISOString().split("T")[0];
  
  while (fechaGracia.getDay() === 0 || fechaGracia.getDay() === 6 || esInhabil(isoGracia)) {
    fechaGracia.setDate(fechaGracia.getDate() + 1);
    isoGracia = fechaGracia.toISOString().split("T")[0];
  }
  const strGracia = fechaGracia.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'numeric' });

  // Mostrar resultados en pantalla
  document.getElementById("txtVencimiento").innerText = `Vence: ${strVencimiento}`;
  document.getElementById("txtGracia").innerText = `⏰ Plazo de gracia (2 hs): ${strGracia} (primeras 2 hs de despacho)`;
  document.getElementById("resultado").classList.remove("hidden");

  // Mostrar detalle de días no contados
  const divInhabiles = document.getElementById("txtInhabiles");
  if (inhábilesEncontrados.length > 0) {
    divInhabiles.innerHTML = `<strong>Días no contados/intermedios:</strong><br>` + inhábilesEncontrados.slice(0, 5).join("<br>") + (inhábilesEncontrados.length > 5 ? `<br>...y ${inhábilesEncontrados.length - 5} más.` : '');
    divInhabiles.classList.remove("hidden");
  } else {
    divInhabiles.classList.add("hidden");
  }

  // Guardar estado para el botón de guardar (guardamos fechaISO de vencimiento para comparar colores)
  ultCalculo = {
    persona: persona || "Sin especificar",
    fechaNotif: `${partes[2]}/${partes[1]}/${partes[0]}`,
    dias: `${diasPlazo} (${tipoPlazo === 'habiles' ? 'Hábiles' : 'Corridos'})`,
    vencimiento: strVencimiento,
    fechaVencimientoISO: fechaActual.toISOString().split("T")[0],
    gracia: strGracia
  };

  document.getElementById("btnGuardar").classList.remove("hidden");
}

// --- GESTIÓN Y RENDERIZADO DE REGISTROS GUARDADOS ---
function guardarRegistro() {
  if (!ultCalculo) return;

  registrosGuardados.push({
    id: Date.now(),
    ...ultCalculo
  });

  localStorage.setItem("registros_plazos_misiones", JSON.stringify(registrosGuardados));
  renderizarGuardados();
  document.getElementById("btnGuardar").classList.add("hidden");
}

function eliminarRegistro(id) {
  if (confirm("¿Deseas eliminar este registro guardado?")) {
    registrosGuardados = registrosGuardados.filter(item => item.id !== id);
    localStorage.setItem("registros_plazos_misiones", JSON.stringify(registrosGuardados));
    renderizarGuardados();
  }
}

// Función auxiliar para determinar la clase del color según los días faltantes
function obtenerEstiloVencimiento(fechaVencISO) {
  if (!fechaVencISO) {
    return "bg-slate-100 text-slate-800 border-slate-300";
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const partes = fechaVencISO.split("-");
  const venc = new Date(partes[0], partes[1] - 1, partes[2]);
  venc.setHours(0, 0, 0, 0);

  const diferenciaMs = venc - hoy;
  const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

  if (diasRestantes < 5) {
    // Menos de 5 días o ya vencido -> ROJO
    return "bg-red-100 text-red-800 border-red-300 font-bold";
  } else if (diasRestantes >= 5 && diasRestantes <= 15) {
    // De 5 a 15 días -> AMARILLO / NARANJA
    return "bg-amber-100 text-amber-800 border-amber-300 font-semibold";
  } else {
    // Más de 15 días -> VERDE
    return "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium";
  }
}

function renderizarGuardados() {
  const tbody = document.getElementById("tablaGuardados");
  if (!tbody) return;

  const filtroInput = document.getElementById("filtroNombre");
  const filtro = filtroInput ? filtroInput.value.toLowerCase() : "";
  tbody.innerHTML = "";

  const filtrados = registrosGuardados.filter(item => 
    item.persona.toLowerCase().includes(filtro)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">No hay registros guardados.</td></tr>`;
    return;
  }

  filtrados.forEach(item => {
    const estiloClase = obtenerEstiloVencimiento(item.fechaVencimientoISO);
    
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
    tr.innerHTML = `
      <td class="p-2.5 font-semibold text-slate-900">${item.persona}</td>
      <td class="p-2.5">${item.fechaNotif}</td>
      <td class="p-2.5">${item.dias}</td>
      <td class="p-2.5">
        <span class="inline-block px-2.5 py-1 rounded-md border text-xs ${estiloClase}">
          ${item.vencimiento}
        </span>
      </td>
      <td class="p-2.5 text-amber-800">${item.gracia}</td>
      <td class="p-2.5 text-center">
        <button onclick="eliminarRegistro(${item.id})" class="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded bg-rose-50 hover:bg-rose-100">
          ✕
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- GESTIÓN DE CALENDARIO INHÁBIL ---
function toggleMenuInhabiles() {
  const menu = document.getElementById("menuInhabiles");
  menu.classList.toggle("hidden");
  renderListaInhabiles();
}

function agregarInhabil() {
  const fecha = document.getElementById("nuevaFechaInhabil").value;
  if (!fecha) return;

  if (!inhábilesPersonalizados.includes(fecha)) {
    inhábilesPersonalizados.push(fecha);
    localStorage.setItem("inhabiles_misiones", JSON.stringify(inhábilesPersonalizados));
    renderListaInhabiles();
    document.getElementById("nuevaFechaInhabil").value = "";
    document.getElementById("nuevoMotivoInhabil").value = "";
  }
}

function eliminarInhabil(fecha) {
  inhábilesPersonalizados = inhábilesPersonalizados.filter(f => f !== fecha);
  localStorage.setItem("inhabiles_misiones", JSON.stringify(inhábilesPersonalizados));
  renderListaInhabiles();
}

function renderListaInhabiles() {
  const lista = document.getElementById("listaInhabiles");
  if (!lista) return;

  lista.innerHTML = "";
  inhábilesPersonalizados.sort().forEach(fecha => {
    const partes = fecha.split("-");
    const fechaFmt = `${partes[2]}/${partes[1]}/${partes[0]}`;
    const li = document.createElement("li");
    li.className = "flex justify-between items-center bg-white p-2 rounded border border-slate-200";
    li.innerHTML = `
      <span>📅 ${fechaFmt}</span>
      <button onclick="eliminarInhabil('${fecha}')" class="text-rose-600 font-bold hover:text-rose-800 px-1">✕</button>
    `;
    lista.appendChild(li);
  });
}

// --- REGISTRO DE PWA Y CARGA INICIAL ---
document.addEventListener("DOMContentLoaded", () => {
  renderizarGuardados();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("Service Worker activo"))
      .catch((err) => console.log("Error de SW:", err));
  });
}
