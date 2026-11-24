
/**
 * Inventory Pro - Storage Unit Tests
 * Author: Andres Devia - Andrew Forest
 *
 * Data persistence and integrity validation.
 */

"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const Storage = require("../js/storage.js");
const Inventory = require("../js/inventory.js");

/**
 * Mock LocalStorage for isolated testing.
 */

function createMockStorage() {

    const data = new Map();

    return {
        getItem(key) {
            return data.has(key)
                ? data.get(key)
                : null;
        },

        setItem(key, value) {
            data.set(key, String(value));
        },

        removeItem(key) {
            data.delete(key);
        },

        clear() {
            data.clear();
        }
    };
}

/**
 * Generate test products.
 */

function sampleProducts() {

    return Inventory.createProduct([], {
        sku: "TEST-001",
        name: "Test Product",
        category: "Electronics",
        price: 50000,
        quantity: 10
    });
}

// INITIAL DATA

test("Generate eight demonstration products", () => {

    const products = Storage.getSampleProducts();

    assert.equal(products.length, 8);
});

test("Sample products contain unique IDs", () => {

    const products = Storage.getSampleProducts();

    const ids = new Set(
        products.map(product => product.id)
    );

    assert.equal(ids.size, products.length);
});

test("Sample products contain unique SKUs", () => {

    const products = Storage.getSampleProducts();

    const skus = new Set(
        products.map(product => product.sku)
    );

    assert.equal(skus.size, products.length);
});

test("Validate all demonstration products", () => {

    assert.equal(
        Storage.validateCollection(
            Storage.getSampleProducts()
        ),
        true
    );
});

// SAVE AND LOAD

test("Save inventory to storage", () => {

    const storage = createMockStorage();

    const products = sampleProducts();

    const result = Storage.saveProducts(
        products,
        storage
    );

    assert.equal(result, true);

    assert.ok(
        storage.getItem(Storage.STORAGE_KEY)
    );
});

test("Load previously saved inventory", () => {

    const storage = createMockStorage();

    const products = sampleProducts();

    Storage.saveProducts(products, storage);

    const loaded = Storage.loadProducts(storage);

    assert.deepEqual(loaded, products);
});

test("Initialize sample data on first launch", () => {

    const storage = createMockStorage();

    const products = Storage.loadProducts(storage);

    assert.equal(products.length, 8);

    assert.ok(
        storage.getItem(Storage.STORAGE_KEY)
    );
});

test("Preserve empty inventory after reload", () => {

    const storage = createMockStorage();

    Storage.saveProducts([], storage);

    const loaded = Storage.loadProducts(storage);

    assert.deepEqual(loaded, []);
});

test("Preserve updated product information", () => {

    const storage = createMockStorage();

    let products = sampleProducts();

    products = Inventory.updateProduct(
        products,
        products[0].id,
        {
            price: 75000,
            quantity: 3
        }
    );

    Storage.saveProducts(products, storage);

    const loaded = Storage.loadProducts(storage);

    assert.equal(loaded[0].price, 75000);
    assert.equal(loaded[0].quantity, 3);
});

test("Preserve product deletion after reload", () => {

    const storage = createMockStorage();

    let products = sampleProducts();

    Storage.saveProducts(products, storage);

    products = Inventory.deleteProduct(
        products,
        products[0].id
    );

    Storage.saveProducts(products, storage);

    assert.deepEqual(
        Storage.loadProducts(storage),
        []
    );
});

// DATA INTEGRITY

test("Reject invalid inventory collection", () => {

    assert.throws(
        () => Storage.validateCollection(null),
        /Invalid inventory data/
    );
});

test("Reject invalid product structure", () => {

    assert.throws(
        () => Storage.validateCollection([
            { name: "Invalid Product" }
        ]),
        /Invalid inventory data/
    );
});

test("Reject duplicate product IDs", () => {

    const products = sampleProducts();

    const duplicate = {
        ...products[0],
        sku: "TEST-002"
    };

    assert.throws(
        () => Storage.validateCollection([
            products[0],
            duplicate
        ]),
        /Duplicate product data/
    );
});

test("Reject duplicate product SKUs", () => {

    const products = sampleProducts();

    const duplicate = {
        ...products[0],
        id: "different-id"
    };

    assert.throws(
        () => Storage.validateCollection([
            products[0],
            duplicate
        ]),
        /Duplicate product data/
    );
});

test("Reject negative stored quantity", () => {

    const products = sampleProducts();

    products[0].quantity = -5;

    assert.throws(
        () => Storage.validateCollection(products),
        /Invalid inventory data/
    );
});

test("Reject negative stored price", () => {

    const products = sampleProducts();

    products[0].price = -1000;

    assert.throws(
        () => Storage.validateCollection(products),
        /Invalid inventory data/
    );
});

test("Reject missing required product data", () => {

    const products = sampleProducts();

    products[0].name = " ";

    assert.throws(
        () => Storage.validateCollection(products),
        /Required product data/
    );
});

// ERROR HANDLING

test("Preserve corrupted JSON without overwriting", () => {

    const storage = createMockStorage();

    const corrupted = "{invalid-json";

    storage.setItem(
        Storage.STORAGE_KEY,
        corrupted
    );

    assert.throws(
        () => Storage.loadProducts(storage),
        /Inventory could not be loaded/
    );

    assert.equal(
        storage.getItem(Storage.STORAGE_KEY),
        corrupted
    );
});

test("Handle unavailable storage", () => {

    const storage = {
        getItem() {
            throw new Error("Storage unavailable");
        }
    };

    assert.throws(
        () => Storage.loadProducts(storage),
        /Inventory could not be loaded/
    );
});

test("Handle storage quota errors", () => {

    const storage = {
        setItem() {
            throw new Error("Quota exceeded");
        }
    };

    assert.throws(
        () => Storage.saveProducts(
            sampleProducts(),
            storage
        ),
        /Inventory could not be saved/
    );
});

// RESET INVENTORY

test("Restore demonstration inventory", () => {

    const storage = createMockStorage();

    Storage.saveProducts([], storage);

    const restored = Storage.resetProducts(storage);

    assert.equal(restored.length, 8);

    assert.deepEqual(
        Storage.loadProducts(storage),
        restored
    );
});
