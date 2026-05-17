# Cruise Explorer Product and Testing Roadmap

This project is evolving from an administrative cruise data application into a multi-cruise-line platform with role-based passenger and admin experiences.

The roadmap should be implemented in order so the foundation stays stable as the product grows.

## 1. Stabilize Testing Around the Expanded Cruise Data Model

Current focus.

The sailing and itinerary data is now foundational. Before adding customers and bookings, automated tests should protect the shape and business rules of:

```text
cruise line -> ship -> sailing -> itinerary day -> activity schedule
```

Quality gates should verify:

- every ship has a current working port
- every ship has exactly five sailings
- every ship has exactly one long repositioning sailing
- every sailing has departure and arrival ports
- every itinerary length matches the sailing day count
- every itinerary day has a port or `At Sea` status
- every itinerary day has scheduled activities
- every scheduled activity has display-ready time and activity text

Primary test added for this step:

```text
tests/unit/data/cruiseSeedData.test.js
```

## 2. Complete Admin CRUD for the Expanded Cruise Model

Admin users should eventually manage all cruise data:

- cruise lines
- ships
- sailings
- itinerary days
- activity schedules

The current app already supports cruise line and ship CRUD. Next admin expansion should add create, update, and delete workflows for sailings, itinerary days, and activity schedules.

Testing focus:

- controller/unit tests for validation and error paths
- integration tests for database persistence and cascade behavior
- Cypress tests for admin CRUD workflows
- Playwright mobile checks for responsive admin workflows

## 3. Add Customers and Bookings

The next major data model should connect customers to bookings and bookings to specific sailings.

Recommended relationship:

```text
customers
  -> booking_passengers
  -> bookings
  -> sailings
  -> ships
  -> cruise_lines
```

Core future tables:

```text
customers
bookings
booking_passengers
```

The key relationship should be:

```text
bookings.sailingId -> sailings.id
```

Testing focus:

- booking-to-sailing referential integrity
- multi-passenger booking support
- booking number uniqueness
- customer visibility rules
- no cross-booking data leakage

## 4. Add Role-Aware App Modes

The app should eventually support three major user modes:

```text
Admin
Passenger Group
Passenger
```

Expected visibility:

- Admin: full CRUD and full data visibility
- Passenger Group: group-level booking and sailing information without private passenger details
- Passenger: group information plus that passenger's own private details

Testing focus:

- authorization unit tests
- route/API permission tests
- Cypress role-based visibility tests
- Playwright mobile passenger journey tests

## 5. Add Multi-Cruise-Line Branding

The app should remain a multi-cruise-line platform, while adapting the experience when a cruise line is selected.

Future cruise line branding fields may include:

```text
brandPrimaryColor
brandSecondaryColor
logoUrl
heroImageUrl
themeName
```

Testing focus:

- selected cruise line applies expected branding
- fallback branding is used when branding fields are missing
- accessibility contrast remains acceptable
- branding does not leak between selected cruise lines

## 6. Mature the Pipeline and Quality Reporting

The project already has Jest, Cypress, Playwright, k6, Lighthouse, coverage, CI, and GitHub Pages reporting.

Future pipeline improvements should include:

- JUnit reports
- Cypress artifacts
- Playwright traces and videos in CI
- accessibility testing with axe
- API schema validation
- database migration checks
- test summary markdown in GitHub Actions
- executive quality dashboard improvements

## Guiding Principle

Each product feature should include matching automated tests at the correct layer before moving to the next roadmap step.
