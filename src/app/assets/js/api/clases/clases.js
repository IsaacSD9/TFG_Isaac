
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
     <!-- ======== Sección: Generar Examen ======== -->
      <div class="card mb-4">
        <div class="card-header"><h5 class="mb-0">Generar Examen Tipo Test</h5></div>
        <div class="card-body">
          <div class="mb-3">
            <label for="campo-texto-examen" class="form-label">Pega aquí el texto (temario) del PDF:</label>
            <textarea class="form-control" id="campo-texto-examen" rows="5" placeholder="Introduce el texto copiado del PDF..."></textarea>
          </div>
          <button id="boton-generar-examen" class="btn btn-success">Generar Examen</button>
          <div id="resultado-examen" class="mt-3" style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: .25rem; display: none;"></div>
        </div>
      </div>
      <!-- ======== Fin Sección: Generar Examen ======== -->

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
            <div class="row g-3 mt-3">
              <div class="col-12">
                <label class="form-label">Subir material (PDF/video)</label>
                <input type="file" class="form-control" id="campo-material-file" accept=".pdf,video/*" />
              </div>
              <div class="col-12">
                <label class="form-label">O URL externa</label>
                <input type="url" class="form-control" id="campo-material-url" placeholder="https://..." />
              </div>
            </div>
            <!-- Sección para mostrar materiales existentes en edición -->
            <div class="col-12 mt-4">
              <label class="form-label">Materiales existentes</label>
              <ul id="lista-materiales-existentes" class="list-group">
                <!-- Se rellenará dinámicamente -->
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" id="boton-guardar" class="btn btn-primary">Guardar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Asistencia -->
    <div class="modal fade" id="modal-asistencia" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow">
          <div class="modal-header">
            <h5 class="modal-title">Tomar Asistencia</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="asistencia-clase-id">
            <ul id="lista-alumnos-asistencia" class="list-group">
              <!-- Se rellenará dinámicamente -->
            </ul>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" id="boton-guardar-asistencia" class="btn btn-primary">Guardar Asistencia</button>
          </div>
        </div>
      </div>
    </div>
    
  `;

  // Render del módulo
  $('#clases-container').html(plantillaModulo());

  // 1) Lógica para “Generar Examen”
  // ============================
 $('#boton-generar-examen').click(async () => {
  const texto = $('#campo-texto-examen').val().trim();
  if (!texto) {
    alert('Por favor, pega el texto del temario antes de generar el examen.');
    return;
  }

  $('#boton-generar-examen').prop('disabled', true).text('Generando...');
  $('#resultado-examen').hide().text('');

  try {
    // IMPORTANTE: la ruta es "/api/generar_examen"
    const respuesta = await fetch('https://tfg-isaac.vercel.app/api/generar_examen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto })
    });

    // Leer el texto bruto para depurar (en desarrollo puedes hacer console.log)
    const raw = await respuesta.text();
    console.log('Raw response:', raw);

    if (!respuesta.ok) {
      // Intentar parsear JSON de error (si lo hubiera)
      let msgError = `Error ${respuesta.status}`;
      try {
        const errJson = JSON.parse(raw);
        msgError = errJson.error || JSON.stringify(errJson);
      } catch {
        msgError = raw || msgError;
      }
      alert('Hubo un error al generar el examen: ' + msgError);
      return;
    }

    // Parsear el JSON exitoso
    let cuerpo;
    try {
      cuerpo = JSON.parse(raw);
    } catch (e) {
      alert('El servidor respondió sin JSON válido.');
      console.error('Error al parsear JSON:', e, 'Raw:', raw);
      return;
    }

    if (!cuerpo.examen) {
      alert('El servidor no devolvió el campo “examen”.');
      console.error('JSON recibido sin “examen”: ', cuerpo);
      return;
    }

    // Mostrar el examen en pantalla
    $('#resultado-examen')
      .text(cuerpo.examen)
      .show();
  } catch (err) {
    console.error('Error en fetch():', err);
    alert('Error de red o servidor al generar el examen.');
  } finally {
    $('#boton-generar-examen').prop('disabled', false).text('Generar Examen');
  }
});


  // Función para convertir fechas a nombres únicos de días
  const fechasAFormatoDias = fechas => {
    if (!Array.isArray(fechas) || fechas.length === 0) return '';
    const diasUnicos = [...new Set(fechas.map(f => obtenerNombreDia(f)))];
    return diasUnicos.join(', ');
  };

  // Funciones para filas, ahora incluyendo materiales
  const filaPresencial = clase => {
    const collapseId = `detalle-${clase.id}`;
    const listaMat = (clase.materiales || []).map(m => `
      <li>
        <a href="${m.url}" target="_blank">
          ${m.tipo === 'enlace' ? m.url : m.nombre}
        </a>
        <small class="text-muted"> (${new Date(m.creado).toLocaleString()})</small>
      </li>
    `).join('') || '<li class="text-muted">Sin materiales</li>';

    return `
      <tr data-id="${clase.id}">
        <td class="d-md-none align-middle">
          <button class="btn p-0 toggle-btn collapsed" type="button"
            data-bs-toggle="collapse" data-bs-target="#${collapseId}"
            aria-expanded="false" aria-controls="${collapseId}">
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
          <button class="btn btn-sm btn-outline-success asistencia-clase">Asistencia</button>
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
            <li><strong>Materiales:</strong></li>
            ${listaMat}
          </ul>
        </td>
      </tr>
    `;
  };

  const filaOnline = clase => {
    const collapseId = `detalle-online-${clase.id}`;
    const listaMat = (clase.materiales || []).map(m => `
      <li>
        <a href="${m.url}" target="_blank">
          ${m.tipo === 'enlace' ? m.url : m.nombre}
        </a>
        <small class="text-muted"> (${new Date(m.creado).toLocaleString()})</small>
      </li>
    `).join('') || '<li class="text-muted">Sin materiales</li>';

    return `
      <tr data-id="${clase.id}">
        <td class="d-md-none align-middle">
          <button class="btn p-0 toggle-btn collapsed" type="button"
            data-bs-toggle="collapse" data-bs-target="#${collapseId}"
            aria-expanded="false" aria-controls="${collapseId}">
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
          <button class="btn btn-sm btn-outline-success asistencia-clase">Asistencia</button>
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
            <li><strong>Materiales:</strong></li>
            ${listaMat}
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
    // Limpiar lista de materiales existentes
    $('#lista-materiales-existentes').empty();
    elementoModal.querySelector('.modal-titulo').textContent = 'Agregar Clase';
    modalClase.show();
  });

  // Guardar o actualizar en Supabase (con profesor_id y JSONB materiales)
  $('#boton-guardar').click(async () => {
    const idExistente    = $('#campo-id').val();
    const fechasArray    = ($('#campo-fechasClase').val() || '')
                            .split(',')
                            .map(f => f.trim())
                            .filter(f => f);
    const datosClaseBase = {
      nombre:       $('#campo-nombre').val(),
      grupo:        $('#campo-grupo').val(),
      modalidad:    $('#campo-modalidad').val().toUpperCase(),
      fechas_clase: fechasArray,
      horaInicio:   $('#campo-horaInicio').val(),
      horaFin:      $('#campo-horaFin').val(),
      url:          $('#campo-url').val(),
      plataforma:   $('#campo-plataforma').val(),
      profesor_id:  userId
    };

    // Paso 1: insertar o actualizar y traer id + JSONB materiales
    let { data: claseDB, error: errClase } = idExistente
      ? await clienteSupabase
          .from('clases')
          .update(datosClaseBase)
          .eq('id', idExistente)
          .select('id, materiales')
          .single()
      : await clienteSupabase
          .from('clases')
          .insert([datosClaseBase])
          .select('id, materiales')
          .single();

    if (errClase) {
      console.error(errClase);
      return;
    }
    const claseId     = claseDB.id;
    let materialesArr = claseDB.materiales || [];

    // Paso 2: filtrar materiales eliminados según lista en DOM
    const keptIdx = $('#lista-materiales-existentes li').map((_, li) => $(li).data('idx')).get();
    materialesArr = materialesArr.filter((_, i) => keptIdx.includes(i));

    // Paso 3: subir fichero si existe
    const fileInput = document.getElementById('campo-material-file');
    if (fileInput.files.length) {
      const file = fileInput.files[0];
      const ext  = file.name.split('.').pop();
      const path = `clase_${claseId}/${Date.now()}.${ext}`;
      const { error: upErr } = await clienteSupabase
        .storage.from('materiales').upload(path, file);
      if (!upErr) {
        const { data: urlData } = await clienteSupabase
          .storage.from('materiales').getPublicUrl(path);
        materialesArr.push({
          nombre: file.name,
          url:    urlData.publicUrl,
          tipo:   ext === 'pdf' ? 'pdf' : 'video',
          creado: new Date().toISOString()
        });
      } else {
        console.error('Error subida:', upErr);
      }
    }

    // Paso 4: añadir URL externa si existe
    const enlace = $('#campo-material-url').val().trim();
    if (enlace) {
      materialesArr.push({
        nombre: enlace,
        url:    enlace,
        tipo:   'enlace',
        creado: new Date().toISOString()
      });
    }

    // Paso 5: actualizar solo el campo JSONB materiales
    const { error: errUpd } = await clienteSupabase
      .from('clases')
      .update({ materiales: materialesArr })
      .eq('id', claseId);
    if (errUpd) console.error(errUpd);

    // Refrescar listado y cerrar modal
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

    // Limpiar y cargar los materiales existentes
    const $listaMat = $('#lista-materiales-existentes').empty();
    (clase.materiales || []).forEach((m, idx) => {
      const nombre = m.tipo === 'enlace' ? m.url : m.nombre;
      const $li = $(`
        <li class="list-group-item d-flex justify-content-between align-items-center" data-idx="${idx}">
          <div>
            <a href="${m.url}" target="_blank">${nombre}</a>
          </div>
          <button class="btn btn-sm btn-danger btn-eliminar-material" type="button">Eliminar</button>
        </li>
      `);
      $listaMat.append($li);
    });

    elementoModal.querySelector('.modal-titulo').textContent = 'Editar Clase';
    modalClase.show();
  });

  // Eliminar material en edición
  $('#lista-materiales-existentes').on('click', '.btn-eliminar-material', function() {
    $(this).closest('li').attr('data-borrar', 'true').remove();
  });

  // Eliminar clase
  $('#clases-container').on('click', '.eliminar-clase', async function() {
    const idFila = $(this).closest('tr').data('id');
    await clienteSupabase
      .from('clases')
      .delete()
      .eq('id', idFila);
    await cargarClases();
  });

  const elementoModalAsis = document.getElementById('modal-asistencia');
  const modalAsistencia   = new bootstrap.Modal(elementoModalAsis);

  // Handler asistencia (igual que antes)
  $('#clases-container').on('click', '.asistencia-clase', async function() {
    const claseId = $(this).closest('tr').data('id');
    $('#asistencia-clase-id').val(claseId);
    $('#lista-alumnos-asistencia').empty();

    const hoyStr = new Date().toISOString().split('T')[0];

    const { data: inscripciones } = await clienteSupabase
      .from('inscripciones')
      .select(`
        alumno_id,
        alumnos (
          numeromatricula,
          usuarios ( nombre )
        )
      `)
      .eq('clase_id', claseId)
      .eq('estado', 'ACTIVA');

    const { data: asistenciasPrev } = await clienteSupabase
      .from('asistencias')
      .select('alumno_id, estado')
      .eq('clase_id', claseId)
      .eq('fecha', hoyStr);

    inscripciones.forEach(({ alumno_id, alumnos }) => {
      const nombre = alumnos.usuarios.nombre;
      const mat    = alumnos.numeromatricula;
      const registroPrevio = asistenciasPrev.find(a => a.alumno_id === alumno_id);
      const marcado = registroPrevio && registroPrevio.estado === 'asistió';

      $('#lista-alumnos-asistencia').append(`
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>${nombre}</strong> <small class="text-muted">(${mat})</small>
          </div>
          <input 
            type="checkbox" 
            class="form-check-input alumno-asiste" 
            data-alumno="${alumno_id}"
            ${marcado ? 'checked' : ''}
          >
        </li>
      `);
    });

    modalAsistencia.show();
  });

  // Guardar asistencia (UPSERT)
  $('#boton-guardar-asistencia').click(async () => {
    const claseId = $('#asistencia-clase-id').val();
    const hoyStr  = new Date().toISOString().split('T')[0];

    const registros = $('.alumno-asiste').map((_, cb) => ({
      alumno_id:      $(cb).data('alumno'),
      clase_id:       claseId,
      fecha:          hoyStr,
      estado:         cb.checked ? 'asistió' : 'ausente',
      registrada_por: userId
    })).get();

    await clienteSupabase
      .from('asistencias')
      .upsert(registros, { onConflict: ['alumno_id', 'clase_id', 'fecha'] });

    modalAsistencia.hide();
  });

  // Cargar clases (incluye JSONB materiales)
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
