export const selectors = {
  navigation: {
    home: '[data-cy="home-section"]',
    primaryNav: '[data-cy="primary-navigation"]',
    brandLink: '[data-cy="brand-link"]',
    stacksLink: '[data-cy="nav-stacks-link"]',
    cruiseLinesLink: '[data-cy="nav-cruise-lines-link"]',
    aboutLink: '[data-cy="nav-about-link"]'
  },
  hero: {
    actions: '[data-cy="hero-actions"]',
    vanillaButton: '[data-cy="stack-vanilla-button"]',
    nodeButton: '[data-cy="stack-node-button"]',
    reactButton: '[data-cy="stack-react-button"]',
    stackCard: '[data-cy="stack-card"]'
  },
  createCruiseLine: {
    panel: '[data-cy="create-cruise-line-panel"]',
    form: '[data-cy="create-cruise-line-form"]',
    nameInput: '[data-cy="create-cruise-line-name-input"]',
    countryInput: '[data-cy="create-cruise-line-country-input"]',
    websiteInput: '[data-cy="create-cruise-line-website-input"]',
    shipInputsContainer: '[data-cy="create-cruise-line-ship-inputs"]',
    shipNameInput: '[data-cy="create-cruise-line-ship-name-input"]',
    addShipButton: '[data-cy="add-ship-input-button"]',
    removeShipButton: '[data-cy="remove-ship-input-button"]',
    submitButton: '[data-cy="create-cruise-line-submit-button"]',
    resetButton: '[data-cy="create-cruise-line-reset-button"]',
    message: '[data-cy="create-cruise-line-message"]'
  },
  cruiseLines: {
    section: '[data-cy="cruise-lines-section"]',
    searchInput: '[data-cy="cruise-search-input"]',
    statusMessage: '[data-cy="cruise-status-message"]',
    grid: '[data-cy="cruise-grid"]',
    card: '[data-cy="cruise-card"]',
    emptyMessage: '[data-cy="cruise-empty-message"]',
    websiteLink: '[data-cy="cruise-website-link"]',
    viewShipsButton: '[data-cy="view-ships-button"]'
  },
  ships: {
    panel: '[data-cy="ships-panel"]',
    title: '[data-cy="ships-title"]',
    grid: '[data-cy="ships-grid"]',
    card: '[data-cy="ship-card"]',
    emptyMessage: '[data-cy="ships-empty-message"]',
    loadingMessage: '[data-cy="ships-loading-message"]'
  },
  testPanel: {
    panel: '[data-cy="sqa-test-panel"]',
    healthCheckButton: '[data-cy="health-check-button"]',
    reloadDataButton: '[data-cy="reload-data-button"]',
    uiSmokeTestButton: '[data-cy="ui-smoke-test-button"]',
    clearOutputButton: '[data-cy="clear-test-output-button"]',
    output: '[data-cy="test-output"]'
  }
}
