declare namespace Cypress {
  interface Chainable {
    login(): Chainable<void>;
  }
}

Cypress.Commands.add('login', () => {
  cy.visit('/login');
  cy.get('button').contains('Login as Admin (Demo)').click();
});
