function renderProfilePage() {
  const html = `
    <div class="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
      <div class="card p-5 shadow-lg rounded-4 bg-white text-dark" style="max-width: 500px; width: 100%;">
        <h2 class="mb-4 text-center">
          <i class="bi bi-person-circle me-2"></i>Mi Perfil
        </h2>
        <div id="perfilInfo">
          <p><strong>Nombre:</strong> <span id="perfilNombre">Cargando...</span></p>
          <p><strong>Email:</strong> <span id="perfilEmail">Cargando...</span></p>
          <p><strong>ID de Usuario:</strong> <span id="perfilUID">Cargando...</span></p>
          <p><strong>Fecha de registro:</strong> <span id="perfilRegistro">Cargando...</span></p>
          <p id="campoRolSpecific" style="display: none;">
            <strong id="perfilLabelRol"></strong>
            <span id="perfilValorRol">Cargando...</span>
          </p>
          <p><strong>Último acceso:</strong> <span id="perfilLastLogin">Cargando...</span></p>
        </div>

        <div id="editarCampos" class="mt-3" style="display: none;">
          <div class="mb-3">
            <label>Nombre:</label>
            <input type="text" class="form-control" id="inputNombre">
          </div>
          <div id="campoExtra"></div>
          <button id="guardarBtn" class="btn btn-success rounded-pill w-100">Guardar cambios</button>
        </div>

        <div class="d-grid mt-4">
          <button id="editarBtn" class="btn btn-primary rounded-pill mb-2">
            <i class="bi bi-pencil-square me-1"></i> Editar perfil
          </button>
          <button id="logoutBtn" class="btn btn-danger rounded-pill">
            <i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("app").innerHTML = html;
}

let globalUserId = null;
let globalRole = null;
let globalValorExtra = null;


async function get_profile() {
  const clienteSupabase = supabase;

  renderProfilePage(); 

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await clienteSupabase.auth.signOut();
    window.location.href = "index.html";
  });

  const { data: { session } } = await clienteSupabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;
  globalUserId = user.id;

  document.getElementById("perfilEmail").innerText = user.email;
  document.getElementById("perfilUID").innerText = user.id;
  document.getElementById("perfilLastLogin").innerText = new Date(user.last_sign_in_at).toLocaleString();

  const { role } = JSON.parse(localStorage.getItem('user') || '{}');
  globalRole = role;

  const { data: usuario, error: errUsr } = await clienteSupabase
    .from('usuarios')
    .select('nombre, fechaRegistro')
    .eq('id', user.id)
    .single();

  if (errUsr) {
    console.error('Error cargando datos de usuarios:', errUsr);
  } else {
    document.getElementById("perfilNombre").innerText = usuario.nombre;
    document.getElementById("perfilRegistro").innerText = new Date(usuario.fechaRegistro).toLocaleDateString();
    document.getElementById("inputNombre").value = usuario.nombre;
  }

  let label = '', valor = '';
  if (role === 'alumno') {
    const { data: al, error: errAl } = await clienteSupabase
      .from('alumnos')
      .select('numeromatricula')
      .eq('id', user.id)
      .single();
    if (al && !errAl) {
      label = 'Número de matrícula:';
      valor = al.numeromatricula;
    }
  } else if (role === 'profesor') {
    const { data: pr, error: errPr } = await clienteSupabase
      .from('profesores')
      .select('especialidad')
      .eq('id', user.id)
      .single();
    if (pr && !errPr) {
      label = 'Especialidad:';
      valor = pr.especialidad;
    }
  }

  if (label) {
    document.getElementById('perfilLabelRol').innerText = label;
    document.getElementById('perfilValorRol').innerText = valor;
    globalValorExtra = valor;
    const campoExtraHtml = `
      <div class="mb-3">
        <label>${label}</label>
        <input type="text" class="form-control" id="inputExtra" value="${valor}">
      </div>
    `;
    document.getElementById('campoExtra').innerHTML = campoExtraHtml;
    document.getElementById('campoRolSpecific').style.display = 'block';
  }

  // Activar botón de editar
  document.getElementById("editarBtn").addEventListener("click", () => {
    document.getElementById("editarCampos").style.display = 'block';
  });

  document.getElementById("guardarBtn").addEventListener("click", async () => {
    await guardarCambios();
  });
}

async function guardarCambios() {
  const clienteSupabase = supabase;

  const nuevoNombre = document.getElementById("inputNombre").value.trim();
  const nuevoExtra = document.getElementById("inputExtra").value.trim();

  // Actualizar tabla usuarios (nombre)
  const { error: errorUser } = await clienteSupabase
    .from('usuarios')
    .update({ nombre: nuevoNombre })
    .eq('id', globalUserId);

  if (errorUser) {
    console.error('Error actualizando nombre:', errorUser);
    alert('Error al actualizar el nombre');
    return;
  }

  // Actualizar tabla alumnos o profesores
  if (globalRole === 'alumno') {
    const { error: errorAlumno } = await clienteSupabase
      .from('alumnos')
      .update({ numeromatricula: nuevoExtra })
      .eq('id', globalUserId);

    if (errorAlumno) {
      console.error('Error actualizando matrícula:', errorAlumno);
      alert('Error al actualizar la matrícula');
      return;
    }
  } else if (globalRole === 'profesor') {
    const { error: errorProfesor } = await clienteSupabase
      .from('profesores')
      .update({ especialidad: nuevoExtra })
      .eq('id', globalUserId);

    if (errorProfesor) {
      console.error('Error actualizando especialidad:', errorProfesor);
      alert('Error al actualizar la especialidad');
      return;
    }
  }

  alert('Datos actualizados correctamente.');
  await get_profile();
}


document.addEventListener("DOMContentLoaded", () => {
  get_profile();
});

