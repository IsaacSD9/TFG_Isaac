$(async function() {
  // Instancia de Supabase (definida en navbar.js)
  const clienteSupabase = supabase;

  // Obtener usuario autenticado
  const {
    data: { user },
    error: authError
  } = await clienteSupabase.auth.getUser();
  if (authError) {
    console.error('Error de autenticación:', authError);
    return;
  }
  const userId = user.id;

  // Días en español para conversión
  const diasSemanaOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  function obtenerNombreDia(fechaString) {
    const fecha = new Date(fechaString);
    const diaIndex = fecha.getDay(); // 0=Domingo ... 6=Sábado
    return diasSemanaOrden[(diaIndex + 6) % 7]; // Ajusta para que lunes sea índice 0
  }

  // Plantilla HTML del módulo
  const plantillaModulo = () => `
    <div class="container-fluid px-0">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h2 class="mb-3 mb-md-0">Gestión de Clases</h2>
        <button id="boton-agregar" class="btn btn-primary">Agregar Clase</button>
      </div>
      <div class="btn-group w-100 mb-3" role="group">
        <button id="boton-presencial" class="btn btn-outline-primary active">Presenciales</button>
        <button id="boton-online"     class="btn btn-outline-primary">Online</button>
      </div>

      <div id="seccion-presencial">
        <div class="card mb-4">
          <div class="card-header"><h5 class="mb-0">Clases Presenciales</h5></div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table mb-0" id="tabla-presencial">
                <thead class="table-light">
                  <tr>
                    <th class="d-md-none"></th>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th class="d-none d-md-table-cell">Grupo</th>
                    <th class="d-none d-md-table-cell">Días</th>
                    <th class="d-none d-md-table-cell">Inicio</th>
                    <th class="d-none d-md-table-cell">Fin</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div id="seccion-online" class="d-none">
        <div class="card mb-4">
          <div class="card-header"><h5 class="mb-0">Clases Online</h5></div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table mb-0" id="tabla-online">
                <thead class="table-light">
                  <tr>
                    <th class="d-md-none"></th>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th class="d-none d-md-table-cell">Grupo</th>
                    <th class="d-none d-md-table-cell">Días</th>
                    <th class="d-none d-md-table-cell">Inicio</th>
                    <th class="d-none d-md-table-cell">Fin</th>
                    <th class="d-none d-md-table-cell">URL</th>
                    <th class="d-none d-md-table-cell">Plataforma</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Agregar/Editar -->
    <div class="modal fade" id="modal-clase" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-titulo">Agregar Clase</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="formulario-clase" class="row g-3">
              <input type="hidden" id="campo-id" />
              <div class="col-12">
                <label class="form-label">Modalidad</label>
                <select class="form-select" id="campo-modalidad">
                  <option value="Presencial">Presencial</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-control" id="campo-nombre" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Grupo</label>
                <input type="text" class="form-control" id="campo-grupo" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Fechas de Clase (YYYY-MM-DD separadas por coma)</label>
                <input type="text" class="form-control" id="campo-fechasClase" placeholder="2025-05-20,2025-05-22" required />
              </div>
              <div class="col-md-3">
                <label class="form-label">Hora Inicio</label>
                <input type="time" class="form-control" id="campo-horaInicio" required />
              </div>
              <div class="col-md-3">
                <label class="form-label">Hora Fin</label>
                <input type="time" class="form-control" id="campo-horaFin" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">URL de la Clase</label>
                <input type="url" class="form-control" id="campo-url" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Plataforma</label>
                <input type="text" class="form-control" id="campo-plataforma" />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" id="boton-guardar" class="btn btn-primary">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render del módulo
  $('#clases-container').html(plantillaModulo());

  // Función para convertir fechas a nombres únicos de días
  const fechasAFormatoDias = fechas => {
    if (!Array.isArray(fechas) || fechas.length === 0) return '';
    const diasUnicos = [...new Set(fechas.map(f => obtenerNombreDia(f)))];
    return diasUnicos.join(', ');
  };

  // Funciones para filas
  const filaPresencial = clase => {
    const collapseId = `detalle-${clase.id}`;
    return `
      <tr data-id="${clase.id}">
        <td class="d-md-none align-middle">
          <button
            class="btn p-0 toggle-btn collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#${collapseId}"
            aria-expanded="false"
            aria-controls="${collapseId}"
          >
            <i class="bi bi-chevron-down"></i>
          </button>
        </td>
        <td>${clase.id}</td>
        <td>${clase.nombre}</td>
        <td class="d-none d-md-table-cell">${clase.grupo}</td>
        <td class="d-none d-md-table-cell">${fechasAFormatoDias(clase.fechas_clase)}</td>
        <td class="d-none d-md-table-cell">${clase.horaInicio}</td>
        <td class="d-none d-md-table-cell">${clase.horaFin}</td>
        <td>
          <button class="btn btn-sm btn-outline-warning editar-clase">Editar</button>
          <button class="btn btn-sm btn-outline-danger eliminar-clase">Eliminar</button>
        </td>
      </tr>
      <tr id="${collapseId}" class="collapse">
        <td colspan="8">
          <ul class="list-unstyled mb-0">
            <li><strong>Grupo:</strong> ${clase.grupo}</li>
            <li><strong>Días:</strong> ${fechasAFormatoDias(clase.fechas_clase)}</li>
            <li><strong>Inicio:</strong> ${clase.horaInicio}</li>
            <li><strong>Fin:</strong> ${clase.horaFin}</li>
          </ul>
        </td>
      </tr>
    `;
  };

  const filaOnline = clase => {
    const collapseId = `detalle-online-${clase.id}`;
    return `
      <tr data-id="${clase.id}">
        <td class="d-md-none align-middle">
          <button
            class="btn p-0 toggle-btn collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#${collapseId}"
            aria-expanded="false"
            aria-controls="${collapseId}"
          >
            <i class="bi bi-chevron-down"></i>
          </button>
        </td>
        <td>${clase.id}</td>
        <td>${clase.nombre}</td>
        <td class="d-none d-md-table-cell">${clase.grupo}</td>
        <td class="d-none d-md-table-cell">${fechasAFormatoDias(clase.fechas_clase)}</td>
        <td class="d-none d-md-table-cell">${clase.horaInicio}</td>
        <td class="d-none d-md-table-cell">${clase.horaFin}</td>
        <td class="d-none d-md-table-cell"><a href="${clase.url}" target="_blank">Ver</a></td>
        <td class="d-none d-md-table-cell">${clase.plataforma}</td>
        <td>
          <button class="btn btn-sm btn-outline-warning editar-clase">Editar</button>
          <button class="btn btn-sm btn-outline-danger eliminar-clase">Eliminar</button>
        </td>
      </tr>
      <tr id="${collapseId}" class="collapse">
        <td colspan="10">
          <ul class="list-unstyled mb-0">
            <li><strong>Grupo:</strong> ${clase.grupo}</li>
            <li><strong>Días:</strong> ${fechasAFormatoDias(clase.fechas_clase)}</li>
            <li><strong>Inicio:</strong> ${clase.horaInicio}</li>
            <li><strong>Fin:</strong> ${clase.horaFin}</li>
            <li><strong>URL:</strong> <a href="${clase.url}" target="_blank">Ver</a></li>
            <li><strong>Plataforma:</strong> ${clase.plataforma}</li>
          </ul>
        </td>
      </tr>
    `;
  };

  let listadoClases = [];
  const elementoModal = document.getElementById('modal-clase');
  const modalClase    = new bootstrap.Modal(elementoModal);

  // Mostrar según modalidad
  function mostrarClases() {
    $('#tabla-presencial tbody, #tabla-online tbody').empty();
    listadoClases.forEach(c => {
      const tipo = (c.modalidad || '').toLowerCase();
      if (tipo === 'presencial') {
        $('#tabla-presencial tbody').append(filaPresencial(c));
      } else if (tipo === 'online') {
        $('#tabla-online tbody').append(filaOnline(c));
      }
    });
  }

  // Alternar vista
  $('#boton-presencial').click(() => {
    $('#seccion-online').addClass('d-none');
    $('#seccion-presencial').removeClass('d-none');
    $('#boton-presencial').addClass('active');
    $('#boton-online').removeClass('active');
  });
  $('#boton-online').click(() => {
    $('#seccion-presencial').addClass('d-none');
    $('#seccion-online').removeClass('d-none');
    $('#boton-online').addClass('active');
    $('#boton-presencial').removeClass('active');
  });

  // Abrir modal para agregar
  $('#boton-agregar').click(() => {
    $('#formulario-clase')[0].reset();
    $('#campo-id').val('');
    elementoModal.querySelector('.modal-titulo').textContent = 'Agregar Clase';
    modalClase.show();
  });

  // Guardar o actualizar en Supabase (con profesor_id)
  $('#boton-guardar').click(async () => {
    const idExistente = $('#campo-id').val();

    // Parseamos las fechas del input, limpiando espacios
    const fechasTexto = $('#campo-fechasClase').val();
    const fechasArray = fechasTexto.split(',').map(f => f.trim()).filter(f => f);

    const datosClase = {
      nombre:      $('#campo-nombre').val(),
      grupo:       $('#campo-grupo').val(),
      modalidad:   $('#campo-modalidad').val().toUpperCase(),
      fechas_clase: fechasArray,
      horaInicio:  $('#campo-horaInicio').val(),
      horaFin:     $('#campo-horaFin').val(),
      url:         $('#campo-url').val(),
      plataforma:  $('#campo-plataforma').val(),
      profesor_id: userId
    };

    if (idExistente) {
      await clienteSupabase
        .from('clases')
        .update(datosClase)
        .eq('id', idExistente);
    } else {
      await clienteSupabase
        .from('clases')
        .insert([datosClase])
        .select('*');
    }
    await cargarClases();
    modalClase.hide();
  });

  // Editar
  $('#clases-container').on('click', '.editar-clase', function() {
    const idFila = $(this).closest('tr').data('id');
    const clase  = listadoClases.find(x => x.id == idFila);
    $('#campo-id').val(clase.id);
    $('#campo-modalidad').val(
      clase.modalidad.charAt(0).toUpperCase() + clase.modalidad.slice(1).toLowerCase()
    );
    $('#campo-nombre').val(clase.nombre);
    $('#campo-grupo').val(clase.grupo);
    $('#campo-fechasClase').val(clase.fechas_clase ? clase.fechas_clase.join(',') : '');
    $('#campo-horaInicio').val(clase.horaInicio);
    $('#campo-horaFin').val(clase.horaFin);
    $('#campo-url').val(clase.url);
    $('#campo-plataforma').val(clase.plataforma);
    elementoModal.querySelector('.modal-titulo').textContent = 'Editar Clase';
    modalClase.show();
  });

  // Eliminar
  $('#clases-container').on('click', '.eliminar-clase', async function() {
    const idFila = $(this).closest('tr').data('id');
    await clienteSupabase
      .from('clases')
      .delete()
      .eq('id', idFila);
    await cargarClases();
  });

  // Cargar clases filtradas por profesor_id
  async function cargarClases() {
    const { data, error } = await clienteSupabase
      .from('clases')
      .select('*')
      .eq('profesor_id', userId)
      .order('nombre', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    listadoClases = data;
    mostrarClases();
  }

  // Inicializar
  await cargarClases();
});
