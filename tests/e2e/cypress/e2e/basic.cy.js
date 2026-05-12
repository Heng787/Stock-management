/* global describe, it, expect, cy */
describe('Baseline', () => {
  it('should pass a simple assertion', () => {
    expect(true).to.equal(true);
  });

  it('should visit the login page', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('h1').should('exist');
  });
});
