# 🚢 Cruise Explorer

## Full-Stack Cruise Management Platform & SQA Engineering Portfolio

![Cruise CI](https://img.shields.io/github/actions/workflow/status/JayG67/cruise/node.js.yml?branch=main&label=Cruise%20CI)
![Production](https://img.shields.io/badge/production-live-00b894)
![Demo](https://img.shields.io/badge/demo-role--aware-0984e3)
![Accessibility](https://img.shields.io/badge/accessibility-tested-6c5ce7)
![Playwright](https://img.shields.io/badge/playwright-mobile%20%2B%20responsive-2d3436)
![Cypress](https://img.shields.io/badge/cypress-e2e-17202C)
![Jest](https://img.shields.io/badge/jest-unit%20%2B%20integration-C21325)
![Performance](https://img.shields.io/badge/performance-smoke%20tested-orange)
![Coverage](https://img.shields.io/badge/testing-expanded%20coverage-success)

---

## 🔗 Live Links

- **Production application:** https://cruise-explorer.onrender.com/
- **Quality dashboard:** https://jayg67.github.io/cruise/
- **GitHub repository:** https://github.com/JayG67/cruise

---

# 📖 Overview

Cruise Explorer is a portfolio-grade full-stack cruise management platform designed to demonstrate:

- Enterprise-style frontend engineering
- API development and validation
- Real-world SQA engineering practices
- Accessibility-first UI design
- Mobile and responsive testing
- End-to-end workflow automation
- CI-oriented project engineering
- Production deployment practices

The project evolved far beyond a simple cruise lookup application and now includes:

- Role-aware booking dashboards
- Admin operations management
- Customer and booking management workflows
- Passenger self-service functionality
- Responsive fleet browsing
- Searchable operational datasets
- Progressive disclosure UI patterns
- Accessibility and negative-path testing

This repository is intentionally engineered like a professional production application rather than a tutorial project.

---

# ✨ Current Feature Set

## 🌊 Cruise Fleet Explorer

- Browse cruise lines
- View ships by cruise line
- Browse sailings by ship
- Explore itinerary details
- View port schedules and activities
- Responsive mobile-first layouts

## 👤 Role-Aware Demo System

Switch application behavior instantly between:

- Admin users
- Passenger users
- Group leader users

The role-aware system changes:

- Booking visibility
- Passenger visibility
- Administrative access
- Editing permissions
- Dashboard content

## 🛠️ Admin Operations Dashboard

The admin experience now includes:

- Search-first operational workflow
- Progressive disclosure data panels
- Show / hide customer tables
- Show / hide booking tables
- Search across:
  - Customers
  - Bookings
  - Ships
  - Routes
  - Loyalty IDs
  - Booking status
  - Cabin numbers
  - Passenger names
- Scrollable enterprise-style data tables
- Inline editing workflows
- Customer update workflows
- Booking update workflows
- Mobile-safe responsive table handling

## 🧳 Passenger Experience

Passenger roles can:

- View only authorized bookings
- See visible passengers per booking
- Access role-specific dashboards
- Update profile information
- View sailing and cabin details

## 📱 Responsive Engineering

The application includes dedicated responsive validation for:

- Desktop Chrome
- Desktop Safari
- Mobile Chrome
- Mobile Safari
- Tablet layouts

Layouts are continuously tested for:

- Horizontal overflow
- Touch target usability
- Viewport containment
- Responsive table behavior
- Mobile accessibility

---

# 🧪 Testing Philosophy

Testing is treated as a first-class engineering concern.

The project intentionally demonstrates:

- SQA leadership mindset
- Defensive engineering
- Regression prevention
- Negative-path validation
- Accessibility validation
- Responsive quality verification
- Enterprise workflow testing

---

# ✅ Test Coverage

## Unit Testing — Jest

Covers:

- Controllers
- Validation middleware
- Security behavior
- Accessibility safeguards
- Static portfolio quality gates
- Cruise seed data integrity
- Role-aware rendering logic
- Progressive disclosure controls
- Hidden-state verification
- Negative-path assertions

Examples:

- Verifying panels are hidden when they should not exist
- Verifying admin controls disappear for passenger roles
- Verifying search behavior with empty results
- Verifying accessible ARIA attributes remain present

---

## 🌐 End-to-End Testing — Cypress

Cypress validates:

- Role switching workflows
- Admin dashboard workflows
- Search filtering
- Show/hide panel functionality
- Inline editing
- Customer updates
- Booking updates
- Scrollable table behavior
- Negative UI states
- Permission isolation

The project intentionally contains both:

- Positive-path tests
- Negative-path tests

to better demonstrate production-quality SQA engineering.

---

## 📲 Mobile & Responsive Testing — Playwright

Dedicated Playwright suites validate:

- Mobile usability
- Responsive layouts
- Touch interactions
- Cross-device workflows
- Overflow prevention
- Role dashboard usability
- Admin workflow responsiveness

---

## ⚡ Performance & Lighthouse Validation

Automated quality checks include:

- Lighthouse CI
- Performance smoke tests
- Responsive rendering checks
- Accessibility validation

---

# 🧱 Technical Stack

## Frontend

- Vanilla JavaScript
- HTML5
- CSS3
- Responsive design patterns
- Accessibility-first architecture

## Backend

- Node.js
- Express
- REST APIs

## Database / ORM

- PostgreSQL
- Drizzle ORM

## Testing

- Jest
- Cypress
- Playwright
- Lighthouse CI

## Deployment

- Render
- GitHub Actions

---

# 🧩 Architecture Highlights

## Progressive Disclosure UI

The admin dashboard intentionally avoids rendering massive operational datasets immediately.

Instead:

- Search functionality is always available
- Large customer and booking tables stay collapsed by default
- Admin users explicitly open only the datasets they need
- Toggle controls dynamically switch between:
  - Show All Customers
  - Hide Customers
  - Show All Bookings
  - Hide Bookings

This approach improves:

- Performance
- Usability
- Mobile responsiveness
- Operational scalability

---

## Accessibility Engineering

Accessibility is built into the UI architecture rather than added afterward.

Examples include:

- ARIA-expanded state management
- ARIA-hidden validation
- Semantic tables
- Accessible labels
- Live status regions
- Keyboard-friendly controls
- Screen-reader-aware messaging

Accessibility safeguards are enforced through automated tests.

---

# 🚀 Local Development

## Install dependencies

```bash
npm install
```

## Start the application

```bash
npm start
```

## Run full test suite

```bash
npm run test:all
```

---

# 🧪 Available Test Commands

## Unit tests

```bash
npm run unitTests
```

## Coverage

```bash
npm run coverage
```

## Integration tests

```bash
npm run integrationTests
```

## Cypress UI tests

```bash
npm run uiTests
```

## Playwright mobile suite

```bash
npm run playwright:mobile:local
```

## Playwright responsive suite

```bash
npm run playwright:responsive:local
```

## Performance smoke tests

```bash
npm run perf:smoke:local
```

## Lighthouse CI

```bash
npm run lighthouse:ci:local
```

---

# 🎯 Portfolio Goals

This project is intentionally designed to showcase:

- Senior-level SQA thinking
- Full-stack engineering capability
- API validation practices
- Test automation architecture
- Frontend engineering quality
- Accessibility engineering
- Responsive engineering
- CI-oriented development workflows
- Enterprise-style operational UI design

The repository evolves continuously as new engineering concepts, workflows, and testing strategies are implemented.

---

# 📌 Repository Philosophy

This repository is treated like an actively evolving production system.

New functionality is expected to include:

- Expanded automated testing
- Negative-path coverage
- Accessibility validation
- Responsive verification
- Regression prevention
- CI stability

The goal is not simply to add features.

The goal is to demonstrate disciplined engineering.

---

# 👨‍💻 Author

**Jay Gallagher**

Senior SQA / Automation Engineering Portfolio Project

