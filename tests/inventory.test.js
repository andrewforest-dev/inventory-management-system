
/**
 * Inventory Pro - Unit Tests
 * Author: Andres Devia - Andrew Forest
 *
 * Business logic and CRUD validation.
 */

"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const Inventory = require("../js/inventory.js");

// Test fixture

function sampleProduct(overrides = {}) {
    return {
        sku: "PRD-001",
        name: "Wireless Mouse",
        category: "Electronics",
        price: 45000,
        quantity: 35,
        ...overrides
    };
}

function sampleInventory() {
    let products = [];

    products = Inventory.createProduct(
        products,
        sampleProduct()
    );

    products = Inventory.createProduct(
        products,
        sampleProduct({
            sku: "PRD-002",
            name: "USB-C Cable",
            category: "Accessories",
            price: 18000,
            quantity: 4
        })
    );

    products = Inventory.createProduct(
        products,
        sampleProduct({
            sku: "PRD-003",
            name: "Monitor Stand",
            category: "Office",
            price: 65000,
            quantity: 0
        })
    );

    return products;
}

// CREATE

test("Create a new product", () => {

    const products = Inventory.createProduct(
        [],
        sampleProduct()
    );

    assert.equal(products.length, 1);
    assert.equal(products[0].sku, "PRD-001");
    assert.equal(products[0].name, "Wireless Mouse");
    assert.ok(products[0].id);
    assert.ok(products[0].createdAt);
});

test("Create product without mutating original array", () => {

    const original = [];

    const updated = Inventory.createProduct(
        original,
        sampleProduct()
    );

    assert.equal(original.length, 0);
    assert.equal(updated.length, 1);
});

// READ

test("Find product by ID", () => {

    const products = sampleInventory();

    const product = Inventory.getProductById(
        products,
        products[0].id
    );

    assert.equal(product.sku, "PRD-001");
});

test("Return null for unknown product ID", () => {

    assert.equal(
        Inventory.getProductById([], "unknown"),
        null
    );
});

// UPDATE

test("Update product price and quantity", () => {

    const products = sampleInventory();

    const updated = Inventory.updateProduct(
        products,
        products[0].id,
        {
            price: 50000,
            quantity: 10
        }
    );

    assert.equal(updated[0].price, 50000);
    assert.equal(updated[0].quantity, 10);
    assert.equal(updated[0].id, products[0].id);
});

test("Update does not mutate original product", () => {

    const products = sampleInventory();

    Inventory.updateProduct(
        products,
        products[0].id,
        { quantity: 10 }
    );

    assert.equal(products[0].quantity, 35);
});

test("Reject update for unknown product", () => {

    assert.throws(
        () => Inventory.updateProduct(
            [],
            "unknown",
            { quantity: 10 }
        ),
        /Product not found/
    );
});

// DELETE

test("Delete an existing product", () => {

    const products = sampleInventory();

    const updated = Inventory.deleteProduct(
        products,
        products[0].id
    );

    assert.equal(updated.length, 2);

    assert.equal(
        Inventory.getProductById(
            updated,
            products[0].id
        ),
        null
    );
});

test("Reject deletion of unknown product", () => {

    assert.throws(
        () => Inventory.deleteProduct([], "unknown"),
        /Product not found/
    );
});

// DATA VALIDATION

test("Reject duplicate SKU", () => {

    const products = sampleInventory();

    assert.throws(
        () => Inventory.createProduct(
            products,
            sampleProduct()
        ),
        /SKU already exists/
    );
});

test("Reject duplicate SKU regardless of case", () => {

    const products = sampleInventory();

    assert.throws(
        () => Inventory.createProduct(
            products,
            sampleProduct({ sku: "prd-001" })
        ),
        /SKU already exists/
    );
});

test("Reject empty product name", () => {

    assert.throws(
        () => Inventory.createProduct(
            [],
            sampleProduct({ name: "" })
        ),
        /Product name is required/
    );
});

test("Reject empty SKU", () => {

    assert.throws(
        () => Inventory.createProduct(
            [],
            sampleProduct({ sku: "" })
        ),
        /SKU is required/
    );
});

test("Reject empty category", () => {

    assert.throws(
        () => Inventory.createProduct(
            [],
            sampleProduct({ category: "" })
        ),
        /Category is required/
    );
});

test("Reject negative product price", () => {

    assert.throws(
        () => Inventory.createProduct(
            [],
            sampleProduct({ price: -1000 })
        ),
        /non-negative number/
    );
});

test("Reject negative stock quantity", () => {

    assert.throws(
        () => Inventory.createProduct(
            [],
            sampleProduct({ quantity: -5 })
        ),
        /non-negative integer/
    );
});

test("Reject decimal stock quantity", () => {

    assert.throws(
        () => Inventory.createProduct(
            [],
            sampleProduct({ quantity: 2.5 })
        ),
        /non-negative integer/
    );
});

test("Normalize SKU and product name", () => {

    const product = Inventory.normalizeProduct(
        sampleProduct({
            sku: " prd-001 ",
            name: " Wireless Mouse "
        })
    );

    assert.equal(product.sku, "PRD-001");
    assert.equal(product.name, "Wireless Mouse");
});

// STOCK BUSINESS RULES

test("Detect out-of-stock products", () => {

    assert.equal(
        Inventory.getStockStatus(0),
        "out-of-stock"
    );
});

test("Detect low-stock products", () => {

    assert.equal(
        Inventory.getStockStatus(4),
        "low-stock"
    );
});

test("Detect available stock", () => {

    assert.equal(
        Inventory.getStockStatus(5),
        "in-stock"
    );
});

// INVENTORY CALCULATIONS

test("Calculate total product value", () => {

    assert.equal(
        Inventory.calculateProductValue(
            sampleProduct()
        ),
        1575000
    );
});

test("Calculate dashboard metrics", () => {

    const metrics = Inventory.calculateMetrics(
        sampleInventory()
    );

    assert.deepEqual(metrics, {
        totalProducts: 3,
        totalUnits: 39,
        totalValue: 1647000,
        lowStock: 1,
        outOfStock: 1
    });
});

test("Calculate metrics for empty inventory", () => {

    assert.deepEqual(
        Inventory.calculateMetrics([]),
        {
            totalProducts: 0,
            totalUnits: 0,
            totalValue: 0,
            lowStock: 0,
            outOfStock: 0
        }
    );
});

// SEARCH AND FILTERS

test("Search products by name", () => {

    const results = Inventory.filterProducts(
        sampleInventory(),
        { search: "wireless" }
    );

    assert.equal(results.length, 1);
    assert.equal(results[0].sku, "PRD-001");
});

test("Search products by SKU", () => {

    const results = Inventory.filterProducts(
        sampleInventory(),
        { search: "PRD-002" }
    );

    assert.equal(results.length, 1);
    assert.equal(results[0].name, "USB-C Cable");
});

test("Filter products by category", () => {

    const results = Inventory.filterProducts(
        sampleInventory(),
        { category: "Electronics" }
    );

    assert.equal(results.length, 1);
});

test("Filter products by stock status", () => {

    const results = Inventory.filterProducts(
        sampleInventory(),
        { status: "low-stock" }
    );

    assert.equal(results.length, 1);
    assert.equal(results[0].quantity, 4);
});

test("Combine category and stock filters", () => {

    const results = Inventory.filterProducts(
        sampleInventory(),
        {
            category: "Accessories",
            status: "low-stock"
        }
    );

    assert.equal(results.length, 1);
    assert.equal(results[0].sku, "PRD-002");
});

test("Get unique product categories", () => {

    assert.deepEqual(
        Inventory.getCategories(sampleInventory()),
        ["Accessories", "Electronics", "Office"]
    );
});

// CSV EXPORT

test("Generate inventory CSV", () => {

    const csv = Inventory.generateCSV(
        sampleInventory()
    );

    assert.ok(csv.includes('"SKU"'));
    assert.ok(csv.includes('"Wireless Mouse"'));
    assert.ok(csv.includes('"1575000.00"'));
    assert.equal(csv.split("\r\n").length, 4);
});

test("Escape quotation marks in CSV", () => {

    const products = Inventory.createProduct(
        [],
        sampleProduct({
            name: 'Monitor 24"'
        })
    );

    const csv = Inventory.generateCSV(products);

    assert.ok(csv.includes('"Monitor 24"""'));
});

test("Neutralize formula injection in CSV", () => {

    const products = Inventory.createProduct(
        [],
        sampleProduct({
            name: "=1+1"
        })
    );

    const csv = Inventory.generateCSV(products);

    assert.ok(csv.includes("\"'=1+1\""));
});
