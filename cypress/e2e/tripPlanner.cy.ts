describe("trip planner", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/tripPlanner");
  });

  it("works", () => {
    cy.contains("Trip Planner");
    cy.get('[data-test="departure-stop-select"]').select("Ashmont");
    cy.get('[data-test="arrival-stop-select"]').select("Arlington");
    cy.get('[data-test="trip-submit"]').click();

    cy.contains("Red Line");
    cy.contains("Transfer at Park Street");
    cy.contains("Green Line B");
  });

  it("disables submit until stops are selected", () => {
    cy.get('[data-test="trip-submit"]').should("be.disabled");
    cy.get('[data-test="departure-stop-select"]').select("Ashmont");
    cy.get('[data-test="trip-submit"]').should("be.disabled");
    cy.get('[data-test="arrival-stop-select"]').select("Arlington");
    cy.get('[data-test="trip-submit"]').should("be.enabled");
  });
});
