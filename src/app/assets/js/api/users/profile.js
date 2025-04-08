function renderProfilePage() {
  const html = `
    <div class="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
      <div class="card p-5 shadow-lg rounded-4 bg-white text-dark" style="max-width: 500px; width: 100%;">
        <h2 class="mb-4 text-center">
          <i class="bi bi-person-circle me-2"></i>Mi Perfil
        </h2>
        <div id="perfilInfo">
          <p><strong>Email:</strong> <span id="perfilEmail">Cargando...</span></p>
          <p><strong>ID de Usuario:</strong> <span id="perfilUID">Cargando...</span></p>
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

function get_profile() {
  const supabase = window.supabase.createClient(
    'https://eriuicbzxamnusosnwjb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaXVpY2J6eGFtbnVzb3Nud2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTkzNTMsImV4cCI6MjA1OTYzNTM1M30.zvjROUxji1NSlkUfW8O8QmtWbvaMsQ_YbACbk_1MvP0'
  );

  (async () => {
    renderProfilePage(); // Renderiza el HTML primero

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "index.html";
      return;
    }

    const user = session.user;
    document.getElementById("perfilEmail").innerText = user.email;
    document.getElementById("perfilUID").innerText = user.id;
    document.getElementById("perfilLastLogin").innerText = new Date(user.last_sign_in_at).toLocaleString();

    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
  })();
}

get_profile(); // Ejecutar al cargar
