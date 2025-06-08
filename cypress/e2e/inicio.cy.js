describe('TFG Isaac - Página inicial en Vercel', () => {
  it('Carga correctamente la página de inicio', () => {
    cy.visit('https://tfg-isaac.vercel.app');
    cy.contains('¡Bienvenido a la aplicación!');
    cy.get('button').contains('Iniciar Sesión').should('exist');
    cy.get('button').contains('Crear Cuenta').should('exist');
  });

  it('Abre el modal de login al pulsar el botón', () => {
    cy.visit('https://tfg-isaac.vercel.app');
    cy.get('button').contains('Iniciar Sesión').click();
    cy.get('#loginModal').should('be.visible');
  });

  it('Abre el modal de registro al pulsar el botón', () => {
    cy.visit('https://tfg-isaac.vercel.app');
    cy.get('button').contains('Crear Cuenta').click();
    cy.get('#signupModal').should('be.visible');
  });
});
