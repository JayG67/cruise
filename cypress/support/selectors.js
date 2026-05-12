export const selectors = {
  navigation: {
    home: '[data-cy="home-section"]',
    primaryNav: '[data-cy="primary-navigation"]',
    brandLink: '[data-cy="brand-link"]',
    dashboardLink: '[data-cy="nav-dashboard-link"]',
    sqaControlsLink: '[data-cy="nav-sqa-controls-link"]',
    cruiseLinesLink: '[data-cy="nav-cruise-lines-link"]',
    aboutLink: '[data-cy="nav-about-link"]'
  },
  hero: {
    dashboard: '[data-cy="dashboard-hero"]',
    ctaRow: '[data-cy="hero-cta-row"]',
    viewCruiseLinesLink: '[data-cy="hero-view-cruise-lines-link"]',
    addCruiseLineLink: '[data-cy="hero-add-cruise-line-link"]',
    summaryCard: '[data-cy="dashboard-summary-card"]',
    liveDemoSummary: '[data-cy="summary-item-live-demo"]',
    databaseSummary: '[data-cy="summary-item-database"]',
    testingSummary: '[data-cy="summary-item-testing"]',
    crudSummary: '[data-cy="summary-item-crud"]'
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
    viewShipsButton: '[data-cy="view-ships-button"]',
    updateButton: '[data-cy="update-cruise-line-button"]',
    deleteButton: '[data-cy="delete-cruise-line-button"]'
  },

  updateCruiseLine: {
    panel: '[data-cy="update-cruise-line-panel"]',
    form: '[data-cy="update-cruise-line-form"]',
    idInput: '[data-cy="update-cruise-line-id-input"]',
    nameInput: '[data-cy="update-cruise-line-name-input"]',
    countryInput: '[data-cy="update-cruise-line-country-input"]',
    websiteInput: '[data-cy="update-cruise-line-website-input"]',
    shipInputsContainer: '[data-cy="update-cruise-line-ship-inputs"]',
    shipNameInput: '[data-cy="update-cruise-line-ship-name-input"]',
    existingShipRow: '[data-cy="existing-update-ship-row"]',
    newShipRow: '[data-cy="new-update-ship-row"]',
    noShipsMessage: '[data-cy="update-no-ships-message"]',
    loadingMessage: '[data-cy="update-ships-loading-message"]',
    addShipButton: '[data-cy="add-update-ship-input-button"]',
    removeShipButton: '[data-cy="remove-update-ship-input-button"]',
    deleteShipButton: '[data-cy="delete-update-ship-button"]',
    submitButton: '[data-cy="update-cruise-line-submit-button"]',
    cancelButton: '[data-cy="update-cruise-line-cancel-button"]',
    message: '[data-cy="update-cruise-line-message"]'
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
