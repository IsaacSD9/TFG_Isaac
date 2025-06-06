$(async function() {
  const clienteSupabase = supabase;

  const diasSemanaOrden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  function obtenerNombreDia(fechaString) {
    const fecha = new Date(fechaString);
    const diaIndex = fecha.getDay(); // 0 = domingo, 1 = lunes, ...
    return diasSemanaOrden[(diaIndex + 6) % 7]; // Ajustamos para que 0 = domingo quede al final
  }

  const plantillaAlumnos = () => `
    <div class="container-fluid px-0">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="titulo-horario">PANEL DE CLASES</h2>
        <div class="text-center">
          <button id="btn-ver-inscritas" class="btn btn-primary me-2 mb-2">Mis Clases</button>
          <button id="btn-ver-todas" class="btn btn-secondary mb-2">Todas las Clases</button>
        </div>
      </div>
      <div class="btn-group mb-3" role="group" aria-label="Filtro modalidad">
        <button id="boton-presencial" class="btn btn-outline-primary active" type="button">Presenciales</button>
        <button id="boton-online" class="btn btn-outline-primary" type="button">Online</button>
      </div>

      <div id="dias-container" class="dias-container">
        ${diasSemanaOrden.map(dia => `
          <section class="dia-semana" data-dia="${dia}">
            <h3 class="dia-titulo">${dia}</h3>
            <div class="lista-clases-dia"></div>
          </section>
        `).join('')}
      </div>

      <div id="todas-clases-container" style="display:none;">
        <h3>Todas las Clases Disponibles</h3>
        <div id="lista-todas-clases"></div>
      </div>
    </div>

    <!-- Modal para mostrar el resumen -->
<div class="modal fade" id="modal-resumen" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content shadow">
      <div class="modal-header">
        <h5 class="modal-title">Resumen del Material</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" id="resumen-modal-body">
        <!-- Aquí se mostrará el resumen generado -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
      </div>
    </div>
  </div>
</div>

  `;

  $('#clases-alumnos-container').html(plantillaAlumnos());

  // Ahora las cartas incluyen los materiales descargables
  const cartaPresencial = clase => {
  const listaMat = (clase.materiales || []).map(m => `
    <div class="material-item">
      <a class="material-link" 
         href="${m.url}" 
         download="${m.nombre}" 
         target="_blank">
        ${m.nombre}
      </a>
      ${m.tipo === 'pdf' ? `
        <button class="btn btn-sm btn-success btn-generar-resumen-pdf" data-url="${m.url}" style="margin-left: .5rem;">
          Generar Resumen
        </button>
        <div id="resumen-pdf-${m.nombre}" class="resumen-pdf" style="display:none;"></div>` : ''}
    </div>
  `).join('') 
    || `<span class="text-muted d-block">Sin materiales</span>`;

  return `
    <div class="card-clase mb-3">
      <h5>${clase.nombre}</h5>
      <div class="grupo">Grupo: ${clase.grupo}</div>
      <div class="detalle-clase">
        <strong>Horario:</strong> 
        <span>${clase.horaInicio} - ${clase.horaFin}</span>
      </div>
      <span class="badge-modalidad badge-presencial">Presencial</span>
      <div class="detalle-clase mt-2">
        <strong>Materiales:</strong>
        <div class="materiales-container">
          ${listaMat}
        </div>
      </div>
    </div>
  `;
};

const cartaOnline = clase => {
  const listaMat = (clase.materiales || []).map(m => `
    <div class="material-item">
      <a class="material-link" 
         href="${m.url}" 
         download="${m.nombre}" 
         target="_blank">
        ${m.nombre}
      </a>
      ${m.tipo === 'pdf' ? `
        <button class="btn btn-sm btn-success btn-generar-resumen-pdf" data-url="${m.url}" style="margin-left: .5rem;">
          Generar Resumen
        </button>
        <div id="resumen-pdf-${m.nombre}" class="resumen-pdf" style="display:none;"></div>` : ''}
    </div>
  `).join('') 
    || `<span class="text-muted d-block">Sin materiales</span>`;

  return `
    <div class="card-clase mb-3">
      <h5>${clase.nombre}</h5>
      <div class="grupo">Grupo: ${clase.grupo}</div>
      <div class="detalle-clase">
        <strong>Horario:</strong> 
        <span>${clase.horaInicio} - ${clase.horaFin}</span>
      </div>
      <div class="detalle-clase">
        <strong>Plataforma:</strong> 
        <span>${clase.plataforma}</span>
      </div>
      <a href="${clase.url}" target="_blank" class="link-clase">Ir a la clase</a>
      <span class="badge-modalidad badge-online">Online</span>
      <div class="detalle-clase mt-2">
        <strong>Materiales:</strong>
        <div class="materiales-container">
          ${listaMat}
        </div>
      </div>
    </div>
  `;
};

  let listadoClases = [];
  let listadoInscritas = [];
  let modalidadActual = 'presencial';

  // Extraer todo el texto de un PDF usando PDF.js
async function extraerTextoDePDF(urlPdf) {
  try {
    // Descargamos el PDF como un ArrayBuffer
    const response = await fetch(urlPdf);
    if (!response.ok) throw new Error(`No se pudo descargar el PDF: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();

    // Cargamos el PDF en PDF.js
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let textoCompleto = '';
    // Recorremos página por página y extraemos el texto
    for (let página = 1; página <= pdf.numPages; página++) {
      const páginaObj = await pdf.getPage(página);
      const contenido = await páginaObj.getTextContent();
      // Cada item en contenido.items tiene .str con el fragmento de texto
      const líneas = contenido.items.map(item => item.str).join(' ');
      textoCompleto += líneas + '\n\n';
    }
    return textoCompleto.trim();
  } catch (err) {
    console.error('Error extrayendo texto del PDF:', err);
    throw err;
  }
}

  // Manejar clic en “Generar Resumen” de cada PDF
$('#clases-alumnos-container').on('click', '.btn-generar-resumen-pdf', async function() {
  const urlPdf = $(this).data('url');
  $(this).prop('disabled', true).text('Extrayendo PDF...');

  try {
    // Extraer texto del PDF
    const textoDelPdf = await extraerTextoDePDF(urlPdf);
    if (!textoDelPdf) {
      alert('No se pudo extraer texto del PDF o está vacío.');
      return;
    }

    // Llamar a la API de generar resumen con ese texto
    $(this).text('Generando resumen...');
    const respuesta = await fetch('https://tfg-isaac.vercel.app/api/generar_resumen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: textoDelPdf })
    });

    const raw = await respuesta.text();
    if (!respuesta.ok) {
      let msgError = `Error ${respuesta.status}`;
      try {
        const errJson = JSON.parse(raw);
        msgError = errJson.error || JSON.stringify(errJson);
      } catch {
        msgError = raw || msgError;
      }
      alert('Hubo un error al generar el resumen: ' + msgError);
      return;
    }

    let cuerpo;
    try {
      cuerpo = JSON.parse(raw);
    } catch (e) {
      alert('El servidor respondió sin JSON válido.');
      console.error('Error al parsear JSON:', e, 'Raw:', raw);
      return;
    }

    if (!cuerpo.resumen) {
      alert('El servidor no devolvió el campo “resumen”.');
      console.error('JSON recibido sin “resumen”: ', cuerpo);
      return;
    }

    // Mostrar el resumen en el modal
    $('#resumen-modal-body').text(cuerpo.resumen).show();

    // Abrir el modal
    const modal = new bootstrap.Modal(document.getElementById('modal-resumen'));
    modal.show();

  } catch (err) {
    console.error('Error al procesar PDF o al generar resumen:', err);
    alert('Ocurrió un error: ' + err.message);
  } finally {
    $(this).prop('disabled', false).text('Generar Resumen');
  }
});


  function mostrarClasesInscritas() {
    $('#todas-clases-container').hide();
    $('#dias-container').show();

    $('.lista-clases-dia').empty();

    const clasesFiltradas = listadoInscritas.filter(c => (c.modalidad || '').toLowerCase() === modalidadActual);

    if (clasesFiltradas.length === 0) {
      $('#dias-container').html('<p class="text-muted texto-no-clases">No hay clases disponibles para esta modalidad.</p>');
      return;
    }

    diasSemanaOrden.forEach(dia => {
      const contenedorDia = $(`section[data-dia="${dia}"] .lista-clases-dia`);
      const clasesDia = clasesFiltradas.filter(c => c.diasSemana.includes(dia));

      if (clasesDia.length === 0) {
        contenedorDia.html('<p class="texto-no-clases">No hay clases este día.</p>');
        return;
      }

      clasesDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

      clasesDia.forEach(clase => {
        const card = modalidadActual === 'presencial'
          ? cartaPresencial(clase)
          : cartaOnline(clase);
        contenedorDia.append(card);
      });
    });
  }

  function mostrarTodasClases() {
    $('#dias-container').hide();
    $('#todas-clases-container').show();

    $('#lista-todas-clases').empty();

    const clasesFiltradas = listadoClases.filter(c => (c.modalidad || '').toLowerCase() === modalidadActual);

    if (clasesFiltradas.length === 0) {
      $('#lista-todas-clases').html('<p class="text-muted">No hay clases disponibles para esta modalidad.</p>');
      return;
    }

    clasesFiltradas.forEach(clase => {
      const yaInscrito = listadoInscritas.some(ci => ci.id === clase.id);

      const boton = yaInscrito
        ? `<button class="btn btn-secondary" disabled>Inscrito</button>`
        : `<button class="btn btn-primary btn-inscribirse" data-id="${clase.id}">Inscribirse</button>`;

      const card = `
        <div class="card-clase mb-3 shadow-sm" >
          <h5>${clase.nombre}</h5>
          <div class="grupo">Grupo: ${clase.grupo}</div>
          <div class="detalle-clase"><strong>Modalidad:</strong> <span>${clase.modalidad}</span></div>
          <div class="detalle-clase"><strong>Horario:</strong> <span>${clase.horaInicio} - ${clase.horaFin}</span></div>
          ${boton}
        </div>
      `;
      $('#lista-todas-clases').append(card);
    });
  }

  $('#clases-alumnos-container').on('click', '#boton-presencial', () => {
    modalidadActual = 'presencial';
    $('#boton-presencial').addClass('active');
    $('#boton-online').removeClass('active');
    mostrarClasesInscritas();
  });

  $('#clases-alumnos-container').on('click', '#boton-online', () => {
    modalidadActual = 'online';
    $('#boton-online').addClass('active');
    $('#boton-presencial').removeClass('active');
    mostrarClasesInscritas();
  });

  $('#clases-alumnos-container').on('click', '#btn-ver-inscritas', () => {
    $('#btn-ver-inscritas').addClass('btn-primary').removeClass('btn-secondary');
    $('#btn-ver-todas').addClass('btn-secondary').removeClass('btn-primary');
    mostrarClasesInscritas();
  });

  $('#clases-alumnos-container').on('click', '#btn-ver-todas', () => {
    $('#btn-ver-todas').addClass('btn-primary').removeClass('btn-secondary');
    $('#btn-ver-inscritas').addClass('btn-secondary').removeClass('btn-primary');
    mostrarTodasClases();
  });

  $('#clases-alumnos-container').on('click', '.btn-inscribirse', async function() {
    const claseId = $(this).data('id');
    const alumno = JSON.parse(localStorage.getItem('user'));
    if (!alumno) {
      alert('No estás autenticado.');
      return;
    }

    const { data, error } = await clienteSupabase
      .from('inscripciones')
      .insert([{ alumno_id: alumno.id, clase_id: claseId, estado: 'ACTIVA', fechainscripcion: new Date().toISOString() }]);

    if (error) {
      console.error(error);
      alert('Error al inscribirse.');
      return;
    }

    alert('Inscripción realizada con éxito.');
    await cargarInscripciones();
    mostrarClasesInscritas();
  });

  async function cargarInscripciones() {
    const alumno = JSON.parse(localStorage.getItem('user'));
    if (!alumno) return;

    const { data, error } = await clienteSupabase
      .from('inscripciones')
      .select(`
        clase_id,
        clases (
          id,
          nombre,
          grupo,
          modalidad,
          fechas_clase,
          horaInicio,
          horaFin,
          url,
          plataforma,
          profesor_id,
          materiales
        )
      `)
      .eq('alumno_id', alumno.id)
      .eq('estado', 'ACTIVA');

    if (error) {
      console.error(error);
      $('#dias-container').html('<p class="text-danger">Error cargando las clases.</p>');
      return;
    }

    listadoInscritas = data.map(inscripcion => {
      const clase = inscripcion.clases;
      const diasSemana = Array.isArray(clase.fechas_clase)
        ? clase.fechas_clase.map(fechaStr => obtenerNombreDia(fechaStr))
        : [];

      return {
        ...clase,
        diasSemana
      };
    });
  }

  async function cargarTodasClases() {
    const { data, error } = await clienteSupabase
      .from('clases')
      .select('*, materiales')
      .order('horaInicio', { ascending: true });

    if (error) {
      console.error(error);
      $('#lista-todas-clases').html('<p class="text-danger">Error cargando las clases.</p>');
      return;
    }

    listadoClases = data.map(clase => {
      const diasSemana = Array.isArray(clase.fechas_clase)
        ? clase.fechas_clase.map(fechaStr => obtenerNombreDia(fechaStr))
        : [];

      return {
        ...clase,
        diasSemana
      };
    });
  }

  // Carga inicial
  await cargarInscripciones();
  await cargarTodasClases();
  mostrarClasesInscritas();
});
