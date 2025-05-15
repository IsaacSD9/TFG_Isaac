$(async function() {
  const clienteSupabase = supabase;

  // Días de la semana para mostrar en orden
  const diasSemanaOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Plantilla principal con contenedores por día
  const plantillaAlumnos = () => `
    <div class="container-fluid px-0">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="titulo-horario">Horario de Clases</h2>
        <div class="btn-group" role="group" aria-label="Filtro modalidad">
          <button id="boton-presencial" class="btn btn-outline-primary active" type="button">Presenciales</button>
          <button id="boton-online" class="btn btn-outline-primary" type="button">Online</button>
        </div>
      </div>
      <div id="dias-container" class="dias-container">
        ${diasSemanaOrden.map(dia => `
          <section class="dia-semana" data-dia="${dia}">
            <h3 class="dia-titulo">${dia}</h3>
            <div class="lista-clases-dia"></div>
          </section>
        `).join('')}
      </div>
    </div>
  `;

  $('#clases-alumnos-container').html(plantillaAlumnos());

  const cartaPresencial = clase => `
    <div class="card-clase">
      <h5>${clase.nombre}</h5>
      <div class="grupo">Grupo: ${clase.grupo}</div>
      <div class="detalle-clase"><strong>Horario:</strong> <span>${clase.horaInicio} - ${clase.horaFin}</span></div>
      <span class="badge-modalidad badge-presencial">Presencial</span>
    </div>
  `;

  const cartaOnline = clase => `
    <div class="card-clase">
      <h5>${clase.nombre}</h5>
      <div class="grupo">Grupo: ${clase.grupo}</div>
      <div class="detalle-clase"><strong>Horario:</strong> <span>${clase.horaInicio} - ${clase.horaFin}</span></div>
      <div class="detalle-clase"><strong>Plataforma:</strong> <span>${clase.plataforma}</span></div>
      <a href="${clase.url}" target="_blank" class="link-clase">Ir a la clase</a>
      <span class="badge-modalidad badge-online">Online</span>
    </div>
  `;

  let listadoClases = [];
  let modalidadActual = 'presencial';

  function mostrarClases() {
    // Limpio todas las listas por día
    $('.lista-clases-dia').empty();

    // Filtro clases por modalidad
    const clasesFiltradas = listadoClases.filter(c => (c.modalidad || '').toLowerCase() === modalidadActual);

    if (clasesFiltradas.length === 0) {
      $('#dias-container').html('<p class="text-muted texto-no-clases">No hay clases disponibles para esta modalidad.</p>');
      return;
    }

    // Por cada día, mostrar las clases que correspondan
    diasSemanaOrden.forEach(dia => {
      const contenedorDia = $(`section[data-dia="${dia}"] .lista-clases-dia`);
      const clasesDia = clasesFiltradas.filter(c => c.diasSemana.includes(dia));

      if (clasesDia.length === 0) {
        contenedorDia.html('<p class="texto-no-clases">No hay clases este día.</p>');
        return;
      }

      // Ordenar por hora inicio
      clasesDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

      clasesDia.forEach(clase => {
        const card = modalidadActual === 'presencial' ? cartaPresencial(clase) : cartaOnline(clase);
        contenedorDia.append(card);
      });
    });
  }

  $('#clases-alumnos-container').on('click', '#boton-presencial', () => {
    modalidadActual = 'presencial';
    $('#boton-presencial').addClass('active');
    $('#boton-online').removeClass('active');
    mostrarClases();
  });

  $('#clases-alumnos-container').on('click', '#boton-online', () => {
    modalidadActual = 'online';
    $('#boton-online').addClass('active');
    $('#boton-presencial').removeClass('active');
    mostrarClases();
  });

  async function cargarClases() {
    const { data, error } = await clienteSupabase
      .from('clases')
      .select('*')
      .order('horaInicio', { ascending: true });

    if (error) {
      console.error(error);
      $('#dias-container').html('<p class="text-danger">Error cargando las clases.</p>');
      return;
    }

    listadoClases = data.map(c => ({
      ...c,
      diasSemana: Array.isArray(c.diasSemana) ? c.diasSemana : (c.diasSemana ? c.diasSemana.split(',').map(d => d.trim()) : [])
    }));

    mostrarClases();
  }

  await cargarClases();
});
