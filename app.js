// Lista inicial por defecto con encoding limpio de acentos
const feriadosDefecto = [
  { fecha: "2026-01-01", motivo: "Año Nuevo" },
  { fecha: "2026-05-01", motivo: "Día del Trabajo" },
  { fecha: "2026-05-25", motivo: "Revolución de Mayo" },
  { fecha: "2026-06-20", motivo: "Paso a la Inmortalidad del Gral. Belgrano" },
  { fecha: "2026-07-09", motivo: "Día de la Independencia" },
  { fecha: "2026-11-30", motivo: "Aniversario de Andrés Guacurarí (Misiones)" },
  { fecha: "2026-12-25", motivo: "Navidad" }
];

let feriadosMisiones = [];

document.addEventListener("DOMContentLoaded", function() {
  const guardados = localStorage.getItem("feriados_misiones");
  if (guardados) {
    try {
      feriadosMisiones = JSON.parse(guardados);
    } catch(e) {
      feriadosMisiones = feriadosDefecto;
    }
  } else {
    feriadosMisiones = feriadosDefecto;
  }
  renderizarListaInhabiles();
});

function guardarEnLocalStorage() {
  localStorage.setItem("feriados_misiones", JSON.stringify(feriadosMisiones));
}

function toggleMenuInhabiles() {
  const menu = document.getElementById("menuInhabiles");
  if (menu) menu.classList.toggle("hidden");
}

function renderizarListaInhabiles() {
  const ul = document.getElementById("listaInhabiles");
  if (!ul) return;

  ul.innerHTML = "";
  feriadosMisiones.sort((a, b) => a.fecha.localeCompare(b.fecha));

  feriadosMisiones.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center bg-white p-2 rounded-md border border-slate-200 shadow-sm";
    
    const partes = item.fecha.split("-");
    const fechaFmt = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : item.fecha;

    li.innerHTML = `
      <span class="truncate pr-2"><strong>${fechaFmt}</strong> - ${item.motivo}</span>
      <button onclick="eliminarInhabil(${index})" class="text-rose-600 hover:bg-rose-50 rounded p-1 font-bold">✕</button>
    `;
    ul.appendChild(li);
  });
}

function agregarInhabil() {
  const inputFecha = document.getElementById("nuevaFechaInhabil");
  const inputMotivo = document.getElementById("nuevoMotivoInhabil");

  if (!inputFecha || !inputFecha.value) {
    alert("Por favor selecciona una fecha válida.");
    return;
  }

  const fecha = inputFecha.value;
  const motivo = inputMotivo.value.trim() || "Inhábil Local";

  if (feriadosMisiones.some(f => f.fecha === fecha)) {
    alert("Esta fecha ya fue registrada.");
    return;
  }

  feriadosMisiones.push({ fecha, motivo });
  guardarEnLocalStorage();
  renderizarListaInhabiles();

  inputFecha.value = "";
  inputMotivo.value = "";
}

function eliminarInhabil(index) {
  feriadosMisiones.splice(index, 1);
  guardarEnLocalStorage();
  renderizarListaInhabiles();
}

function esDiaHabil(fecha) {
  const diaSemana = fecha.getDay(); // 0: Domingo, 6: Sábado
  if (diaSemana === 0 || diaSemana === 6) return false;

  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;

  return !feriadosMisiones.some(f => f.fecha === isoDate);
}

function obtenerMotivoInhabil(fecha) {
  const diaSemana = fecha.getDay();
  if (diaSemana === 0) return "Domingo";
  if (diaSemana === 6) return "Sábado";

  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;

  const feriado = feriadosMisiones.find(f => f.fecha === isoDate);
  return feriado ? feriado.motivo : null;
}

function calcularVencimiento() {
  const inputFechaVal = document.getElementById("fechaNotificacion").value;
  const diasVal = document.getElementById("diasPlazo").value;
  const tipoPlazo = document.getElementById("tipoPlazo").value;

  if (!inputFechaVal) {
    alert("Por favor ingresa la fecha de notificación.");
    return;
  }

  let dias = parseInt(diasVal);
  if (isNaN(dias) || dias <= 0) {
    alert("Ingresa una cantidad de días válida.");
    return;
  }

  const partes = inputFechaVal.split("-");
  let fechaCursor = new Date(partes[0], partes[1] - 1, partes[2]);
  
  // El cómputo inicia el día hábil siguiente a la notificación (Art. 156 CPCCCyF Misiones)
  fechaCursor.setDate(fechaCursor.getDate() + 1);

  const diasInhabilesDescartados = [];

  if (tipoPlazo === "habiles") {
    while (dias > 0) {
      if (esDiaHabil(fechaCursor)) {
        dias--;
      } else {
        const motivo = obtenerMotivoInhabil(fechaCursor);
        const fmtFecha = fechaCursor.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        diasInhabilesDescartados.push(`${fmtFecha} (${motivo})`);
      }

      if (dias > 0) {
        fechaCursor.setDate(fechaCursor.getDate() + 1);
      }
    }
  } else {
    fechaCursor.setDate(fechaCursor.getDate() + (dias - 1));

    while (!esDiaHabil(fechaCursor)) {
      const motivo = obtenerMotivoInhabil(fechaCursor);
      const fmtFecha = fechaCursor.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
      diasInhabilesDescartados.push(`Prorrogado por ${fmtFecha} (${motivo})`);
      
      fechaCursor.setDate(fechaCursor.getDate() + 1);
    }
  }

  // Plazo de gracia (primeras 2 horas del día hábil posterior al vencimiento)
  let fechaGracia = new Date(fechaCursor);
  do {
    fechaGracia.setDate(fechaGracia.getDate() + 1);
  } while (!esDiaHabil(fechaGracia));

  const fmt = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  
  document.getElementById("txtVencimiento").innerText = 
    `Vencimiento: ${fechaCursor.toLocaleDateString('es-AR', fmt)}`;
  
  document.getElementById("txtGracia").innerText = 
    `Plazo de Gracia (primeras 2 hs): ${fechaGracia.toLocaleDateString('es-AR', fmt)}`;

  const divInhabiles = document.getElementById("txtInhabiles");
  if (diasInhabilesDescartados.length > 0) {
    divInhabiles.innerHTML = "<strong>Días no hábiles detectados:</strong><br>" + 
      diasInhabilesDescartados.join(", ");
    divInhabiles.classList.remove("hidden");
  } else {
    divInhabiles.classList.add("hidden");
  }

  document.getElementById("resultado").classList.remove("hidden");
// Registro del Service Worker para PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("Service Worker registrado con éxito:", reg.scope))
      .catch((err) => console.log("Error al registrar el Service Worker:", err));
  });
}
}