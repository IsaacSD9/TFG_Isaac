describe('TFG Isaac - Pantalla de Inicio con login simulado', () => {

  beforeEach(() => {
    const usuario = { 
      id: "ea329647-b2db-47da-abba-3480fbde0866",
      rol: "profesor"
    };

    // Primero visitamos una URL cualquiera para tener acceso al window
    cy.visit('https://tfg-isaac.vercel.app', { failOnStatusCode: false });

    // Inyectamos el localStorage manualmente DESPUÉS
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify(usuario));
    });

    // Y ahora sí, visitamos la página protegida
    cy.visit('https://tfg-isaac.vercel.app/inicio.html');
  });

  it('Carga correctamente la Pantalla de Inicio', () => {
    cy.get('.dashboard-cards .card-option').should('have.length', 4);
    cy.contains('Clases').should('exist');
    cy.contains('Horarios').should('exist');
    cy.contains('Mensajería').should('exist');
    cy.contains('Perfil').should('exist');
  });

});
