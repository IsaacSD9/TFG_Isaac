// assets/js/api/users/auth.js
document.addEventListener("DOMContentLoaded", () => {
  const client = window.supabase.createClient(
    'https://eriuicbzxamnusosnwjb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaXVpY2J6eGFtbnVzb3Nud2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTkzNTMsImV4cCI6MjA1OTYzNTM1M30.zvjROUxji1NSlkUfW8O8QmtWbvaMsQ_YbACbk_1MvP0'
  );

  // Toggle campos numeromatricula / especialidad
  const signupRole       = document.getElementById("signupRole");
  const numMatWrap       = document.getElementById("signupNumeromatriculaWrapper");
  const especialidadWrap = document.getElementById("signupEspecialidadWrapper");
  signupRole.addEventListener("change", () => {
    if (signupRole.value === "alumno") {
      numMatWrap.style.display = "block";
      especialidadWrap.style.display = "none";
    } else if (signupRole.value === "profesor") {
      numMatWrap.style.display = "none";
      especialidadWrap.style.display = "block";
    } else {
      numMatWrap.style.display = "none";
      especialidadWrap.style.display = "none";
    }
  });

  // --- LOGIN ---
  const loginForm  = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.style.display = "none";

    const email    = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      let msg = "Ha ocurrido un error.";
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        msg = "Correo o contraseña incorrectos. Intenta nuevamente.";
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
        msg = "Debes confirmar tu correo electrónico antes de iniciar sesión.";
      }
      loginError.innerText = msg;
      loginError.style.display = "block";
      return;
    }

    // Login exitoso: detectamos rol desde BD
    const user = data.user;
    let role = null;

    const { data: alumno } = await client
      .from('alumnos')
      .select('id')
      .eq('id', user.id)
      .single();
    if (alumno) {
      role = 'alumno';
    } else {
      const { data: profe } = await client
        .from('profesores')
        .select('id')
        .eq('id', user.id)
        .single();
      role = profe ? 'profesor' : 'invitado';
    }

    // Guardar en localStorage
    localStorage.setItem('user', JSON.stringify({ id: user.id, role }));
    window.location.href = "inicio.html";
  });

  // --- REGISTRO ---
  const signupForm  = document.getElementById("signupForm");
  const signupError = document.getElementById("signupError");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    signupError.style.display = "none";

    const email            = document.getElementById("signupEmail").value.trim();
    const nombre           = document.getElementById("signupNombre").value.trim();
    const roleVal          = document.getElementById("signupRole").value;
    const numeromatricula  = document.getElementById("signupNumeromatricula").value.trim();
    const especialidad     = document.getElementById("signupEspecialidad").value.trim();
    const password         = document.getElementById("signupPassword").value;
    const passwordConfirm  = document.getElementById("signupPasswordConfirm").value;

    // Validaciones
    if (password !== passwordConfirm) {
      signupError.innerText = "Las contraseñas no coinciden.";
      signupError.style.display = "block";
      return;
    }
    if (!roleVal) {
      signupError.innerText = "Debes seleccionar si eres alumno o profesor.";
      signupError.style.display = "block";
      return;
    }
    if (roleVal === "alumno" && !numeromatricula) {
      signupError.innerText = "Debes indicar tu número de matrícula.";
      signupError.style.display = "block";
      return;
    }
    if (roleVal === "profesor" && !especialidad) {
      signupError.innerText = "Debes indicar tu especialidad.";
      signupError.style.display = "block";
      return;
    }

    try {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) {
        signupError.innerText = error.message;
        signupError.style.display = "block";
        return;
      }

      alert("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");
      const { user } = data;
      const fechaRegistro = new Date().toISOString().split('T')[0];

      // 1) Insertar en 'usuarios'
      const { error: errUsr } = await client
        .from('usuarios')
        .insert([{ id: user.id, nombre, email: user.email, fechaRegistro }]);
      if (errUsr) {
        signupError.innerText = "Error al guardar en 'usuarios'.";
        signupError.style.display = "block";
        return;
      }

      // 2) Insertar en tabla específica
      if (roleVal === "alumno") {
        const { error: errAl } = await client
          .from('alumnos')
          .insert([{ id: user.id, numeromatricula }]);
        if (errAl) console.error("Error guardando alumno:", errAl);
      } else {
        const { error: errPr } = await client
          .from('profesores')
          .insert([{ id: user.id, especialidad }]);
        if (errPr) console.error("Error guardando profesor:", errPr);
      }

      // 3) Cerrar modal
      bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();

    } catch (err) {
      signupError.innerText = "Hubo un error inesperado.";
      signupError.style.display = "block";
      console.error("Error inesperado en signUp:", err);
    }
  });
});
