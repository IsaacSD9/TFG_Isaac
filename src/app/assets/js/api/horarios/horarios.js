document.addEventListener("DOMContentLoaded", () => {
  const clienteSupabase = supabase;
  const app = document.getElementById("app");

  const diasSemanaOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  let currentMonth = new Date().getMonth(); // 0-11
  let currentYear = new Date().getFullYear();

  let usuarioId = null;
  let fechasClasesUsuario = []; // Array con todas las fechas de clases del usuario (strings yyyy-mm-dd)
  let clasesUsuario = []; // Array de objetos clase con fechas_clase

  function obtenerNombreDia(fechaString) {
    const fecha = new Date(fechaString);
    const diaIndex = fecha.getDay(); // 0=Domingo ... 6=Sábado
    return diasSemanaOrden[(diaIndex + 6) % 7];
  }

  async function cargarDatosUsuario() {
    const {
      data: { user },
      error: authError
    } = await clienteSupabase.auth.getUser();

    if (authError || !user) {
      console.error("Error autenticación o usuario no logueado:", authError);
      return false;
    }
    usuarioId = user.id;

    const { data, error } = await clienteSupabase
      .from("inscripciones")
      .select(`
        clases (
          id,
          nombre,
          modalidad,
          fechas_clase,
          horaInicio,
          horaFin,
          url,
          plataforma
        )
      `)
      .eq("alumno_id", usuarioId)
      .eq("estado", "ACTIVA");

    if (error) {
      console.error("Error cargando inscripciones:", error);
      return false;
    }

    clasesUsuario = data.map(insc => insc.clases).filter(c => c);

    // Extraer fechas únicas
    const fechasSet = new Set();
    clasesUsuario.forEach(clase => {
      if (Array.isArray(clase.fechas_clase)) {
        clase.fechas_clase.forEach(f => fechasSet.add(f));
      }
    });
    fechasClasesUsuario = Array.from(fechasSet);

    return true;
  }

  function getMonthName(monthIndex) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[monthIndex];
  }

  function renderDays() {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.map(day => `<div class="day">${day}</div>`).join('');
  }

  function renderDates(month, year) {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const offset = firstDay === 0 ? 6 : firstDay - 1;
    let html = '';

    for (let i = 0; i < offset; i++) {
      html += `<div class="date blank"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const fechaActualStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const tieneClase = fechasClasesUsuario.includes(fechaActualStr);

      html += `<div class="date${tieneClase ? ' con-clase' : ''}" data-fecha="${fechaActualStr}">${day}</div>`;
    }

    return html;
  }

  function mostrarInfoDia(fecha) {
    const clasesDelDia = clasesUsuario.filter(clase => 
      Array.isArray(clase.fechas_clase) && clase.fechas_clase.includes(fecha)
    );

    if (clasesDelDia.length === 0) {
      return `<p>No tienes clases este día.</p>`;
    }

    return `
      <h3>Clases para ${fecha} (${obtenerNombreDia(fecha)})</h3>
      <ul class="list-group">
        ${clasesDelDia.map(c => `
          <li class="list-group-item">
            <strong>${c.nombre}</strong> (${c.modalidad})<br/>
            Horario: ${c.horaInicio} - ${c.horaFin} <br/>
            ${c.modalidad.toLowerCase() === 'online' ? `<a href="${c.url}" target="_blank">Ir a la clase</a>` : ''}
          </li>
        `).join('')}
      </ul>
    `;
  }

  async function renderCalendarPage() {
    const cargado = await cargarDatosUsuario();
    if (!cargado) {
      app.innerHTML = `<p class="text-danger">Error cargando datos del usuario. Asegúrate de estar autenticado.</p>`;
      return;
    }

    app.innerHTML = `
      <div id="calendar-card">
        <h2><i class="bi bi-calendar3 me-2"></i>Calendario</h2>
        <div class="calendar-header mb-3 d-flex align-items-center gap-3">
          <button id="prev-month" class="btn btn-outline-primary btn-sm">«</button>
          <span id="mes-anio" class="fs-5 fw-semibold">${getMonthName(currentMonth)} ${currentYear}</span>
          <button id="next-month" class="btn btn-outline-primary btn-sm">»</button>
        </div>
        <div id="calendar" class="d-grid grid-cols-7 gap-2 mb-3">
          ${renderDays()}
          ${renderDates(currentMonth, currentYear)}
        </div>
        <div id="info-dia" class="p-3 border rounded bg-light text-dark"></div>
      </div>
    `;

    document.getElementById("prev-month").addEventListener("click", () => {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
      renderCalendarPage();
    });

    document.getElementById("next-month").addEventListener("click", () => {
      if (currentMonth === 11) {
        currentMonth = 0;
        currentYear++;
      } else {
        currentMonth++;
      }
      renderCalendarPage();
    });

    document.querySelectorAll(".date.con-clase").forEach(div => {
      div.style.cursor = 'pointer';
      div.addEventListener("click", () => {
        const fecha = div.getAttribute("data-fecha");
        const infoDiv = document.getElementById("info-dia");
        infoDiv.innerHTML = mostrarInfoDia(fecha);
      });
    });
  }

  renderCalendarPage();
});
