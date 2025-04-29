$(async function() {
  // Reutilizo la instancia definida en navbar.js
  const clienteSupabase = supabase;

  // Plantilla de la interfaz
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
                    <th>ID</th><th>Nombre</th><th>Grupo</th><th>Días</th>
                    <th>Inicio</th><th>Fin</th><th>URL</th><th>Plataforma</th><th>Acciones</th>
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
                    <th>ID</th><th>Nombre</th><th>Grupo</th><th>Días</th>
                    <th>Inicio</th><th>Fin</th><th>URL</th><th>Plataforma</th><th>Acciones</th>
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
                <label class="form-label">Días de Semana</label>
                <select class="form-select" id="campo-diasSemana" multiple required>
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
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
                <input type="url" class="form-control" id="campo-url" required />
              </div>
              <div class="col-md-6">
                <label class="form-label">Plataforma</label>
                <input type="text" class="form-control" id="campo-plataforma" required />
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

  $('#clases-container').html(plantillaModulo());

  // Filas de la tabla
  const filaClase = clase => `
    <tr data-id="${clase.id}">
      <td>${clase.id}</td>
      <td>${clase.nombre}</td>
      <td>${clase.grupo}</td>
      <td>${clase.diasSemana}</td>
      <td>${clase.horaInicio}</td>
      <td>${clase.horaFin}</td>
      <td><a href="${clase.url_clase}" target="_blank">Ver</a></td>
      <td>${clase.plataforma}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning editar-clase">Editar</button>
        <button class="btn btn-sm btn-outline-danger eliminar-clase">Eliminar</button>
      </td>
    </tr>
  `;

  let listadoClases = [];
  const elementoModal = document.getElementById('modal-clase');
  const modalClase    = new bootstrap.Modal(elementoModal);

  // Pintar tablas según modalidad
  function mostrarClases() {
    $('#tabla-presencial tbody, #tabla-online tbody').empty();
    listadoClases.forEach(c => {
      const tipo = (c.modalidad || '').toLowerCase();
      if (tipo === 'presencial')   $('#tabla-presencial tbody').append(filaClase(c));
      else if (tipo === 'online')  $('#tabla-online tbody').append(filaClase(c));
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

  // Abrir formulario para nueva clase
  $('#boton-agregar').click(() => {
    $('#formulario-clase')[0].reset();
    $('#campo-id').val('');
    elementoModal.querySelector('.modal-titulo').textContent = 'Agregar Clase';
    modalClase.show();
  });

  // Guardar o actualizar en Supabase
  $('#boton-guardar').click(async () => {
    const idExistente = $('#campo-id').val();
    const datosClase = {
      nombre:     $('#campo-nombre').val(),
      grupo:      $('#campo-grupo').val(),
      modalidad:  $('#campo-modalidad').val().toUpperCase(),
      diasSemana: $('#campo-diasSemana').val(), // Array de días
      horaInicio: $('#campo-horaInicio').val(),
      horaFin:    $('#campo-horaFin').val(),
      url:  $('#campo-url').val(),
      plataforma: $('#campo-plataforma').val()
    };
    console.log(datosClase);
    
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

  // Editar registro
  $('#clases-container').on('click', '.editar-clase', function() {
    const idFila = $(this).closest('tr').data('id');
    const clase   = listadoClases.find(x => x.id == idFila);
    $('#campo-id').val(clase.id);
    const modalidad = clase.modalidad.charAt(0).toUpperCase() + clase.modalidad.slice(1).toLowerCase(); 
    $('#campo-modalidad').val(modalidad);    $('#campo-nombre').val(clase.nombre);
    $('#campo-grupo').val(clase.grupo);
    $('#campo-diasSemana').val(clase.diasSemana); // Asignar el array de días
    $('#campo-horaInicio').val(clase.horaInicio);
    $('#campo-horaFin').val(clase.horaFin);
    $('#campo-url').val(clase.url);
    $('#campo-plataforma').val(clase.plataforma);
    elementoModal.querySelector('.modal-titulo').textContent = 'Editar Clase';
    modalClase.show();
  });

  // Eliminar registro
  $('#clases-container').on('click', '.eliminar-clase', async function() {
    const idFila = $(this).closest('tr').data('id');
    await clienteSupabase
      .from('clases')
      .delete()
      .eq('id', idFila);
    await cargarClases();
  });

  // Obtener datos de Supabase
  async function cargarClases() {
    const { data, error } = await clienteSupabase
      .from('clases')
      .select('*')
      .order('nombre', { ascending: false });
    if (error) return console.error(error);
    listadoClases = data;
    mostrarClases();
  }

  // Inicializar listado
  await cargarClases();
});
