describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display the login page correctly', () => {
    cy.get('h1').should('contain', 'StockFlow');
    cy.get('button').contains('Sign In').should('be.visible');
  });

  it('should login successfully using the Demo button', () => {
    // Click the demo login button
    cy.get('button').contains('Login as Admin (Demo)').click();

    // Verify loading state and redirection with a longer timeout
    cy.url({ timeout: 10000 }).should('eq', 'http://localhost:5173/');
    cy.get('header').should('contain', 'Dashboard');
  });

  it('should show error message on invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('.error-msg', { timeout: 6000 }).should('be.visible')
      .and('contain', 'Invalid');
  });

  it('should allow logout from the dashboard', () => {
    // Login first
    cy.get('button').contains('Login as Admin (Demo)').click();
    
    // Find logout button in sidebar - wait for dashboard to load
    cy.get('header', { timeout: 10000 }).should('contain', 'Dashboard');
    cy.get('button').contains('Sign Out').click();

    // Verify back on login page
    cy.url().should('include', '/login');
  });
});
