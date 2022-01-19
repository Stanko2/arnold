// https://docs.cypress.io/api/introduction/api.html
import 'cypress-file-upload'

describe('HomePage', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('h1', 'Vitaj v Arnoldovi')
  })
  it('Should upload zip file', () => {
    cy.get('#mainInput').attachFile('riesenia-104.zip');
    cy.get('#backupInput').attachFile('Backup_1642603883251.json')
    cy.get(':nth-child(3) > .btn').click();
    cy.get('body > div > div > button').should('be.disabled')
  })
  it('Should show categories', () => {
    cy.get('.list-group-item').should('have.length', 7)
  })
  it('Should select a category', () => {
    cy.get('body > div > div > div:nth-child(4) > div > div:nth-child(2)').click();
    cy.get('.active').should('have.length', 1);
    cy.get('body > div > div > div:nth-child(4) > div > div:nth-child(5)').click();
    cy.get('.active').should('have.length', 2);
    cy.get('body > div > div > div:nth-child(4) > p').should('include.text', '2').should('include.text', '6');
  })
  it('Should enable start button', () => {
    cy.get('body > div > div > button').should('not.be.disabled').click();
  })
})
