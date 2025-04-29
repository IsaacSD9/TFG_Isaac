const supabase = window.supabase.createClient(
  'https://eriuicbzxamnusosnwjb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaXVpY2J6eGFtbnVzb3Nud2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTkzNTMsImV4cCI6MjA1OTYzNTM1M30.zvjROUxji1NSlkUfW8O8QmtWbvaMsQ_YbACbk_1MvP0'
);

$(async function() {
  // Obtener la sesión
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "/index.html";
    return;
  }

  const user = session.user;

  // HTML de la barra de navegación
  const navbarHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top bg-dark rounded shadow px-3 mb-4">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Panel</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse justify-content-between" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="/inicio.html">Inicio</a></li>
            <li class="nav-item"><a class="nav-link" href="/profile/profile.html">Perfil</a></li>
            <li class="nav-item"><a class="nav-link" href="/configuracion.html">Configuración</a></li>
          </ul>
          <div class="d-flex align-items-center text-white">
            <span class="me-3 small">${user.email}</span>
            <button id="logoutBtn" class="btn btn-outline-danger btn-sm">
              <i class="bi bi-box-arrow-right me-1"></i>Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
    <!-- Espaciador para compensar altura + margin -->
    <div style="height: 100px;"></div>
  `;

  // Insertar la barra en el contenedor
  $('#navbar-container').html(navbarHTML);

  // Manejar el click de logout
  $('#logoutBtn').on('click', async function() {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
});