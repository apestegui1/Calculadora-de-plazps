// --- MANEJO DE REGISTROS GUARDADOS ---
let ultCalculo = null;
let registrosGuardados = JSON.parse(localStorage.getItem("registros_plazos_misiones")) || [];

// Modificar o asegurar que la función de cálculo guarde el último estado calculado
const calcularVencimientoOriginal = window.calcularVencimiento;
window.calcularVencimiento = function() {
  const fechaNotif = document.getElementById("fechaNotificacion").value;
  const dias = parseInt(document.getElementById("diasPlazo").value);
  const tipo = document.getElementById("tipoPlazo").value;
  const persona = document.getElementById("nombrePersona").value.trim();

  if (!fechaNotif || isNaN(dias)) {
    alert("Por favor completa la fecha y los días de plazo.");
    return;
  }

  // Ejecutar el cálculo standard
  if (typeof calcularVencimientoOriginal === "function") {
    calcularVencimientoOriginal();
  }

  // Capturar los textos resultantes para guardar
  const txtVenc = document.getElementById("txtVencimiento").innerText;
  const txtGracia = document.getElementById("txtGracia").innerText;

  ultCalculo = {
    persona: persona || "Sin especificar",
    fechaNotif,
    dias: `${dias} (${tipo === 'habiles' ? 'Hábiles' : 'Corridos'})`,
    vencimiento: txtVenc,
    gracia: txtGracia
  };

  // Mostrar el botón para guardar
  document.getElementById("btnGuardar").classList.remove("hidden");
};

function guardarRegistro() {
  if (!ultCalculo) return;

  registrosGuardados.push({
    id: Date.now(),
    ...ultCalculo
  });

  localStorage.setItem("registros_plazos_misiones", JSON.stringify(registrosGuardados));
  renderizarGuardados();
  
  // Limpiar/Ocultar botón tras guardar
  document.getElementById("btnGuardar").classList.add("hidden");
  alert("Vencimiento guardado correctamente.");
}

function eliminarRegistro(id) {
  if (confirm("¿Deseas eliminar este registro guardado?")) {
    registrosGuardados = registrosGuardados.filter(item => item.id !== id);
    localStorage.setItem("registros_plazos_misiones", JSON.stringify(registrosGuardados));
    renderizarGuardados();
  }
}

function renderizarGuardados() {
  const tbody = document.getElementById("tablaGuardados");
  const filtro = document.getElementById("filtroNombre").value.toLowerCase();
  tbody.innerHTML = "";

  const filtrados = registrosGuardados.filter(item => 
    item.persona.toLowerCase().includes(filtro)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">No hay registros guardados.</td></tr>`;
    return;
  }

  filtrados.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="p-2.5 font-semibold text-slate-900">${item.persona}</td>
      <td class="p-2.5">${item.fechaNotif}</td>
      <td class="p-2.5">${item.dias}</td>
      <td class="p-2.5 font-bold text-blue-700">${item.vencimiento}</td>
      <td class="p-2.5 text-amber-700">${item.gracia}</td>
      <td class="p-2.5 text-center">
        <button onclick="eliminarRegistro(${item.id})" class="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded bg-rose-50 hover:bg-rose-100">
          ✕
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Cargar la tabla al iniciar
document.addEventListener("DOMContentLoaded", renderizarGuardados);
