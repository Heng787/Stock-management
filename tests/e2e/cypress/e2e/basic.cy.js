describe('Baseline', () => {
  it('should pass a simple assertion', () => {
    expect(true).to.be.true;
  });

  it('should visit the login page', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('h1').should('exist');
  });
});
