document.addEventListener("DOMContentLoaded", () => {
  const client = window.supabase.createClient(
    'https://eriuicbzxamnusosnwjb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaXVpY2J6eGFtbnVzb3Nud2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTkzNTMsImV4cCI6MjA1OTYzNTM1M30.zvjROUxji1NSlkUfW8O8QmtWbvaMsQ_YbACbk_1MvP0'
  );

  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Oculta errores anteriores
    errorBox.style.display = "none";
    errorBox.innerText = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Mostramos el mensaje de error dentro del formulario
        errorBox.innerText = error.message || "Error desconocido al iniciar sesión.";
        errorBox.style.display = "block";
        return; // 🔁 Importante: salir si hay error
      }

      // Si no hay error, continuamos
      window.location.href = "inicio.html";

    } catch (err) {
      // Por si hay otro error inesperado
      errorBox.innerText = "Hubo un error inesperado.";
      errorBox.style.display = "block";
      console.error("Error inesperado:", err);
    }
  });
});
