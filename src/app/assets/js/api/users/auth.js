document.addEventListener("DOMContentLoaded", () => {
  const client = window.supabase.createClient(
    'https://eriuicbzxamnusosnwjb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaXVpY2J6eGFtbnVzb3Nud2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNTkzNTMsImV4cCI6MjA1OTYzNTM1M30.zvjROUxji1NSlkUfW8O8QmtWbvaMsQ_YbACbk_1MvP0'
  );

  // --- LOGIN ---
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.style.display = "none";
    const email = document.getElementById("loginEmail").value.trim();
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
    } else {
      window.location.href = "inicio.html";
    }
  });

    // --- REGISTRO ---
  const signupForm = document.getElementById("signupForm");
  const signupError = document.getElementById("signupError");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    signupError.style.display = "none";
    
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const passwordConfirm = document.getElementById("signupPasswordConfirm").value;
    const nombre = document.getElementById("signupNombre").value.trim(); 
    
    // Verificar que las contraseñas coinciden
    if (password !== passwordConfirm) {
      signupError.innerText = "Las contraseñas no coinciden.";
      signupError.style.display = "block";
      return;
    }

    try {
      // Registrarse en Supabase Auth
      const { data, error } = await client.auth.signUp({ email, password });

      if (error) {
        signupError.innerText = error.message;
        signupError.style.display = "block";
      } else {
        alert("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");
        
        // Fecha actual para fechaRegistro
        const fechaRegistro = new Date().toISOString().split('T')[0]; 

        // Sincronizar la información del nuevo usuario en la tabla 'usuarios'
        const { user } = data;
        const { error: insertError } = await client
          .from('usuarios')
          .insert([
            {
              id: user.id,  
              nombre: nombre, 
              email: user.email,
              fechaRegistro: fechaRegistro 
            }
          ])
          .select('*');  

        if (insertError) {
          signupError.innerText = "Hubo un error al guardar la información del usuario en la tabla 'usuarios'.";
          signupError.style.display = "block";
        } else {
          console.log("Datos del usuario insertados en la tabla 'usuarios':", data);
        }

        // Cierra el modal de registro
        const modal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
        modal.hide();
      }
    } catch (err) {
      signupError.innerText = "Hubo un error inesperado.";
      signupError.style.display = "block";
      console.error("Error inesperado en signUp:", err);
    }
  });
});