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
        <div class="d-grid mt-4">
          <button id="logoutBtn" class="btn btn-danger rounded-pill">
            <i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("app").innerHTML = html;
}


async function get_profile() {
    const clienteSupabase = supabase;

  renderProfilePage(); 

 // Logout
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    console.log("HOLA");
    
    await clienteSupabase.auth.signOut();
    window.location.href = "index.html";
  });

  // Obtener sesión
  const { data: { session } } = await clienteSupabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return;
  }

  // Cargar datos básicos de auth
  const user = session.user;
  document.getElementById("perfilEmail").innerText     = user.email;
  document.getElementById("perfilUID").innerText       = user.id;
  document.getElementById("perfilLastLogin").innerText = 
    new Date(user.last_sign_in_at).toLocaleString();

  // Leer rol del localStorage (lo guardaste en el login)
  const { role } = JSON.parse(localStorage.getItem('user') || '{}');

  // Traer de 'usuarios' nombre y fechaRegistro
  const { data: usuario, error: errUsr } = await clienteSupabase
    .from('usuarios')
    .select('nombre, fechaRegistro')
    .eq('id', user.id)
    .single();

  if (errUsr) {
    console.error('Error cargando datos de usuarios:', errUsr);
  } else {
    document.getElementById("perfilNombre").innerText     = usuario.nombre;
    document.getElementById("perfilRegistro").innerText   = 
      new Date(usuario.fechaRegistro).toLocaleDateString();
  }

  // Según el rol, traer matrícula o especialidad
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

  // Inyectar ese campo (si existe)
  if (label) {
    const cont = document.getElementById('campoRolSpecific');
    document.getElementById('perfilLabelRol').innerText = label;
    document.getElementById('perfilValorRol').innerText = valor;
    cont.style.display = 'block';
  }

 
}

document.addEventListener("DOMContentLoaded", () => {
  get_profile();
});

