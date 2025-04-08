document.addEventListener("DOMContentLoaded", () => {
  const client = window.supabase.createClient(
    'https://eriuicbzxamnusosnwjb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaXVpY2J6eGFtbnVzb3Nud2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTkzNTMsImV4cCI6MjA1OTYzNTM1M30.zvjROUxji1NSlkUfW8O8QmtWbvaMsQ_YbACbk_1MvP0'
  );

  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

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
        // Personalizar mensaje de error
        let customMessage = "Ha ocurrido un error.";

        // Puedes inspeccionar el contenido de error.message
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          customMessage = "Correo o contraseña incorrectos. Intenta nuevamente.";
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          customMessage = "Debes confirmar tu correo electrónico antes de iniciar sesión.";
        }

        errorBox.innerText = customMessage;
        errorBox.style.display = "block";
        return;
      }

      window.location.href = "inicio.html";

    } catch (err) {
      errorBox.innerText = "Hubo un error inesperado.";
      errorBox.style.display = "block";
      console.error("Error inesperado:", err);
    }
  });
});
