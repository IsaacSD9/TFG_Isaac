document.addEventListener("DOMContentLoaded", () => {
  const clienteSupabase = supabase; 
  const app = document.getElementById("app");

  const diasSemanaOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  let currentMonth = new Date().getMonth(); 
  let currentYear = new Date().getFullYear();

  let profesorId = null;
  let fechasClasesProfesor = []; 
  let clasesProfesor = [];       

  function obtenerNombreDia(fechaString) {
    const fecha = new Date(fechaString);
    const diaIndex = fecha.getDay(); 
    return diasSemanaOrden[(diaIndex + 6) % 7]; 
  }

  async function cargarDatosProfesor() {
    const { data: { user }, error: authError } = await clienteSupabase.auth.getUser();
    if (authError || !user) {
      console.error("Error autenticación o profesor no logueado:", authError);
      return false;
    }
    profesorId = user.id;

    const { data, error } = await clienteSupabase
      .from("clases")
      .select(`
        id,
        nombre,
        modalidad,
        fechas_clase,
        horaInicio,
        horaFin,
        url,
        plataforma
      `)
      .eq("profesor_id", profesorId);

    if (error) {
      console.error("Error cargando clases del profesor:", error);
      return false;
    }

    clasesProfesor = data.filter(c => c.fechas_clase && Array.isArray(c.fechas_clase));

    const fechasSet = new Set();
    clasesProfesor.forEach(clase => {
      clase.fechas_clase.forEach(f => fechasSet.add(f));
    });
    fechasClasesProfesor = Array.from(fechasSet);

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
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const offset = firstDay === 0 ? 6 : firstDay - 1;
    let html = '';

    for (let i = 0; i < offset; i++) {
      html += `<div class="date blank"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const fechaActualStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const tieneClase = fechasClasesProfesor.includes(fechaActualStr);
      html += `<div class="date${tieneClase ? ' con-clase' : ''}" data-fecha="${fechaActualStr}">${day}</div>`;
    }

    return html;
  }

  function mostrarInfoDia(fecha) {
    const clasesDelDia = clasesProfesor.filter(clase =>
      Array.isArray(clase.fechas_clase) && clase.fechas_clase.includes(fecha)
    );

    if (clasesDelDia.length === 0) {
      return `<p>No impartes clases este día.</p>`;
    }

    return `
      <h3>Clases para ${fecha} (${obtenerNombreDia(fecha)})</h3>
      <ul class="list-group">
        ${clasesDelDia.map(c => `
          <li class="list-group-item">
            <strong>${c.nombre}</strong> (${c.modalidad})<br/>
            Horario: ${c.horaInicio} - ${c.horaFin}<br/>
            ${c.modalidad.toLowerCase() === 'online' 
              ? `<a href="${c.url}" target="_blank">Ir a la clase</a>` 
              : ''}
          </li>
        `).join('')}
      </ul>
    `;
  }

  async function renderCalendarPage() {
    const cargado = await cargarDatosProfesor();
    if (!cargado) {
      app.innerHTML = `<p class="text-danger">Error cargando datos del profesor. Asegúrate de estar autenticado.</p>`;
      return;
    }

    app.innerHTML = `
      <div id="calendar-profesor-card" class="scale-grande">
        <h2><i class="bi bi-calendar3 me-2"></i> CALENDARIO DE CLASES</h2>
        <div class="calendar-header mb-3 d-flex align-items-center gap-3">
          <button id="prev-month-prof" class="btn btn-outline-primary btn-sm">«</button>
          <span id="mes-anio-prof" class="fs-5 fw-semibold">${getMonthName(currentMonth)} ${currentYear}</span>
          <button id="next-month-prof" class="btn btn-outline-primary btn-sm">»</button>
        </div>
        <div id="calendar-prof" class="d-grid grid-cols-7 gap-3 mb-3">
          ${renderDays()}
          ${renderDates(currentMonth, currentYear)}
        </div>
        <!-- El contenedor de info-dia se inicia oculto -->
        <div id="info-dia-prof" class="p-4 border rounded bg-light text-dark oculto"></div>
      </div>
    `;

    const infoDiv = document.getElementById("info-dia-prof");
    infoDiv.style.display = "none";

    document.getElementById("prev-month-prof").addEventListener("click", () => {
      if (currentMonth === 0) {
        currentMonth = 11;
        currentYear--;
      } else {
        currentMonth--;
      }
      renderCalendarPage();
    });

    document.getElementById("next-month-prof").addEventListener("click", () => {
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
        // Al hacer clic: mostramos y rellenamos la caja de info
        infoDiv.innerHTML = mostrarInfoDia(fecha);
        infoDiv.style.display = "block";
      });
    });
  }

  renderCalendarPage();
});