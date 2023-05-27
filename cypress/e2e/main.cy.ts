describe("transit explorer", () => {
  it("loads the site", () => {
    cy.visit("http://localhost:3000");
  });

  it("can navigate to the different pages", () => {
    cy.visit("http://localhost:3000");
    cy.get('[data-test="nav-link-route-list"]').click();
    cy.contains("Routes");

    cy.visit("http://localhost:3000");
    cy.get('[data-test="nav-link-trip-planner"]').click();
    cy.contains("Trip Planner");
  });
});
