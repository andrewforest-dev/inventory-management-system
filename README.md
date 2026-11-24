
# Inventory Management System

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Status](https://img.shields.io/badge/Status-In_Development-orange)

## Project Overview

Inventory Pro is a web-based inventory management
application designed to help small businesses manage
products, stock levels and inventory information.

The project focuses on software development
fundamentals, CRUD operations, data persistence,
business logic and responsive interface design.

## Business Problem

Small businesses often manage inventory manually
using spreadsheets or physical records.

This can lead to inconsistent information,
stock shortages and difficulties tracking products.

Inventory Pro aims to provide a centralized
interface for local inventory management.

## Planned Features

- Product registration.
- Product editing and deletion.
- Product search and category filtering.
- Stock level monitoring.
- Low stock and out-of-stock alerts.
- Inventory value calculation.
- Dashboard with dynamic statistics.
- Data persistence using LocalStorage.
- Form validation.
- Duplicate SKU prevention.
- CSV export.
- Responsive user interface.
- Automated unit testing.
- Continuous integration with GitHub Actions.
- Public deployment with GitHub Pages.

## CRUD Operations

| Operation | Description |
|---|---|
| Create | Register new products |
| Read | Display and search products |
| Update | Edit product information |
| Delete | Remove products from inventory |

## Product Data Model

| Field | Data Type | Required |
|---|---|---|
| ID | String | Yes |
| SKU | String | Yes |
| Product name | String | Yes |
| Category | String | Yes |
| Unit cost | Number | Yes |
| Quantity | Integer | Yes |
| Created at | Date | Automatic |
| Updated at | Date | Automatic |

## Business Rules

- Product SKU must be unique.
- Product name cannot be empty.
- Unit cost must be greater than or equal to zero.
- Stock quantity must be a non-negative integer.
- Products with zero units are out of stock.
- Products with 1 to 4 units have low stock.
- Products with 5 or more units are in stock.

## Dashboard Metrics

- Total registered products.
- Total inventory units.
- Total inventory value in COP.
- Low-stock products.
- Out-of-stock products.

## Software Architecture

The application separates responsibilities
into three main layers:

### Presentation Layer

HTML5, CSS3 and responsive dashboard components.

### Business Logic Layer

JavaScript functions for CRUD operations,
validation, filtering and inventory calculations.

### Data Layer

LocalStorage and JSON for browser-based
data persistence.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- JavaScript DOM API
- LocalStorage API
- JSON
- Node.js for automated testing
- Git and GitHub
- GitHub Actions
- GitHub Pages

## Planned Project Structure

    inventory-management-system/
    ├── .github/
    │   └── workflows/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── inventory.js
    │   ├── storage.js
    │   └── app.js
    ├── tests/
    │   └── inventory.test.js
    ├── index.html
    └── README.md

## Learning Objectives

- Implement CRUD operations.
- Apply software architecture principles.
- Develop reusable JavaScript functions.
- Validate user input and business rules.
- Manage persistent data.
- Process and filter information.
- Implement automated software testing.
- Build professional administrative interfaces.
- Deploy a functional web application.

## Development Status

In development.

The initial version will use browser-based
data persistence.

A centralized database, authentication and
multi-user functionality are outside the
scope of this initial version.

## Future Improvements

- REST API integration.
- Node.js and Express backend.
- MySQL database.
- User authentication.
- Role-based access control.
- Inventory movement history.
- Advanced reporting.

## Author

Andrés Devia | Andrew Forest

Web Developer | Software Development Student | UX/UI Designer

- Portfolio: https://andrewforest.com
- GitHub: https://github.com/andrewforest-dev
- Agency: https://nexxoagencia.com
