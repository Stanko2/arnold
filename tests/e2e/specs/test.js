// https://docs.cypress.io/api/introduction/api.html
import 'cypress-file-upload'

describe('HomePage', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('h1', 'Vitaj v Arnoldovi')
  })
  it('Should upload zip file', () => {
    cy.fixture('riesenia-81.zip').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent: fileContent.toString(),
        fileName: 'riesenia-81.zip',
        mimeType: 'application/zip'
      });
      cy.get('.btn').should('be.disabled')

    });
  })
  it('Should show categories', () => {
    cy.get('.list-group').should('have.length', 8)
  })
})
