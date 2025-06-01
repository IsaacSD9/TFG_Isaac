document.addEventListener("DOMContentLoaded", () => {
  // Configura cliente Supabase
  const clienteSupabase = supabase;
  let userId = null;
  let currentChatId = null;
  let currentChatEmail = '';

  $(async function () {
    // Autenticación
    const { data: { user }, error: authError } = await clienteSupabase.auth.getUser();
    if (authError || !user) {
      $('#app').html('<p class="text-center mt-5 text-danger">Error de autenticación. Inicia sesión de nuevo.</p>');
      return;
    }

    userId = user.id;

    // Renderizar interfaz principal
    $('#app').html(renderMensajePage());

    // Cargar lista de chats
    await loadConversations(userId);

    // Iniciar nuevo chat escribiendo correo
    $('#startChatForm').on('submit', async function (e) {
      e.preventDefault();
      const email = $('#destinatarioEmail').val().trim().toLowerCase();
      if (!email) {
        alert('Introduce el correo del destinatario.');
        return;
      }
      // Buscar usuario por email
      const { data: users, error: userError } = await clienteSupabase
        .from('users_extended_view')
        .select('id,email')
        .eq('email', email)
        .limit(1)
        .single();
      if (userError || !users) {
        alert('Usuario no encontrado.');
        return;
      }
      const destinatarioId = users.id;
      const destinatarioEmail = users.email;
      // Añadir al listado si no existe
      if (!$('#chatList').find(`[data-id="${destinatarioId}"]`).length) {
        $('#chatList').prepend(
          `<a href="#" class="list-group-item list-group-item-action" data-id="${destinatarioId}" data-email="${destinatarioEmail}">${destinatarioEmail}</a>`
        );
        bindChatClick();
      }
      // Seleccionar el chat
      $(`#chatList [data-id="${destinatarioId}"]`).trigger('click');
      $('#destinatarioEmail').val('');
    });

    // Enviar mensaje en chat activo
    $('#formMensaje').on('submit', async function (e) {
      e.preventDefault();
      const mensaje = $('#mensajeContent').val().trim();
      if (!currentChatId) {
        alert('Selecciona un chat primero.');
        return;
      }
      if (!mensaje) return;

      const { error } = await clienteSupabase.from('mensajes').insert([
        { emisor_id: userId, destinatario_id: currentChatId, mensaje }
      ]);
      if (error) {
        console.error('Error al enviar mensaje:', error);
        alert('Error al enviar mensaje.');
      } else {
        $('#mensajeContent').val('');
        await loadConversation(userId, currentChatId);
      }
    });
  });

  // Construye la interfaz con lista de chats y panel de mensajes
  function renderMensajePage() {
    return `
      <div class="container my-5">
        <h2 class="titulo-mensajes"><i class="bi bi-chat-dots-fill me-2"></i>Mensajes</h2>
        <div class="row gx-4">
          <div class="col-12 col-md-4 mb-4">
            <div class="card-mensajes">
              <div class="card-header">Chats</div>
              <div class="card-body p-0">
                <div id="chatList" class="list-group text-white"></div>
              </div>
            </div>
            <div class="card-mensajes mt-4">
              <div class="card-header">Nuevo chat</div>
              <div class="card-body">
                <form id="startChatForm">
                  <div class="mb-3">
                    <label for="destinatarioEmail" class="form-label">Correo destinatario</label>
                    <input type="email" id="destinatarioEmail" class="form-control" placeholder="correo@ejemplo.com" required>
                  </div>
                  <button type="submit" class="btn">Iniciar chat</button>
                </form>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-8 d-flex flex-column">
            <div class="card-mensajes flex-grow-1 d-flex flex-column">
              <div class="card-header" id="chatHeader">Selecciona un chat</div>
              <div class="card-body flex-grow-1" id="mensajeList">No hay chat seleccionado.</div>
              <div class="card-body">
                <form id="formMensaje" class="d-flex">
                  <input type="text" id="mensajeContent" class="form-control me-2" placeholder="Escribe un mensaje..." autocomplete="off" disabled required>
                  <button type="submit" class="btn" disabled>Enviar</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Cargar lista de chats
  async function loadConversations(currentUserId) {
    const { data: msgs, error } = await clienteSupabase.from('mensajes')
      .select(`emisor_id, destinatario_id, emisor:emisor_id (email), destinatario:destinatario_id (email)`)
      .or(`emisor_id.eq.${currentUserId},destinatario_id.eq.${currentUserId}`)
      .order('fecha_envio', { ascending: false });
    if (error) return $('#chatList').html('<div class="text-center text-danger py-3">Error al cargar chats</div>');

    const chatsMap = {};
    msgs.forEach(msg => {
      const partnerId = msg.emisor_id === currentUserId ? msg.destinatario_id : msg.emisor_id;
      const partnerEmail = msg.emisor_id === currentUserId ? msg.destinatario.email : msg.emisor.email;
      if (!chatsMap[partnerId]) chatsMap[partnerId] = partnerEmail;
    });

    const listHtml = Object.entries(chatsMap)
      .map(([id, email]) => `<a href="#" class="list-group-item list-group-item-action" data-id="${id}" data-email="${email}">${email}</a>`)
      .join('') || '<div class="text-center text-muted py-3">Sin conversaciones</div>';
    $('#chatList').html(listHtml);
    bindChatClick();
  }

  // Asigna clic a cada chat
  function bindChatClick() {
    $('#chatList .list-group-item').off('click').on('click', async function () {
      $('#chatList .active').removeClass('active');
      $(this).addClass('active');
      currentChatId = $(this).data('id');
      currentChatEmail = $(this).data('email');
      $('#chatHeader').text(`Chat con ${currentChatEmail}`);
      $('#mensajeContent, #formMensaje button').prop('disabled', false);
      await loadConversation(userId, currentChatId);
    });
  }

  // Cargar mensajes de un chat
  async function loadConversation(currentUserId, otherUserId) {
    $('#mensajeList').html('<p class="text-center text-muted">Cargando mensajes...</p>');
    const { data, error } = await clienteSupabase.from('mensajes')
      .select(`*, emisor:emisor_id (email), destinatario:destinatario_id (email)`)
      .or(`and(emisor_id.eq.${currentUserId},destinatario_id.eq.${otherUserId}),` +
           `and(emisor_id.eq.${otherUserId},destinatario_id.eq.${currentUserId})`)
      .order('fecha_envio', { ascending: true });
    if (error) return $('#mensajeList').html('<p class="text-danger">Error al cargar mensajes.</p>');
    if (!data.length) return $('#mensajeList').html('<p class="text-muted">No hay mensajes en este chat.</p>');

    const html = data.map(msg => {
      const isOutgoing = msg.emisor_id === currentUserId;
      const bubbleClass = isOutgoing ? 'mensaje-outgoing' : 'mensaje-incoming';
      return `
        <div class="d-flex mb-2 ${isOutgoing ? 'justify-content-end' : 'justify-content-start'}">
          <div class="p-2 rounded-3 ${bubbleClass}" style="max-width: 75%;">
            <div class="mensaje-body">${msg.mensaje}</div>
            <div class="text-end small text-muted">${new Date(msg.fecha_envio).toLocaleTimeString()}</div>
          </div>
        </div>
      `;
    }).join('');

    $('#mensajeList').html(html);
    setTimeout(() => { const list = document.getElementById('mensajeList'); list.scrollTop = list.scrollHeight; }, 50);
  }
});
