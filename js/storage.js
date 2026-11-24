
/**
 * Inventory Pro - Data Persistence Layer
 * Author: Andres Devia - Andrew Forest
 * Version: 1.0.0
 *
 * LocalStorage management and initial sample data.
 */

"use strict";

const Storage = (() => {

    const STORAGE_KEY = "inventory_pro_products_v1";

    /**
     * Generate initial demonstration products.
     */

    function getSampleProducts() {

        const timestamp = new Date().toISOString();

        const samples = [
            {
                sku: "PRD-001",
                name: "Wireless Mouse",
                category: "Electronics",
                price: 45000,
                quantity: 35
            },
            {
                sku: "PRD-002",
                name: "USB-C Cable",
                category: "Accessories",
                price: 18000,
                quantity: 4
            },
            {
                sku: "PRD-003",
                name: "Mechanical Keyboard",
                category: "Electronics",
                price: 120000,
                quantity: 18
            },
            {
                sku: "PRD-004",
                name: "Monitor Stand",
                category: "Office",
                price: 65000,
                quantity: 0
            },
            {
                sku: "PRD-005",
                name: "Wireless Headphones",
                category: "Electronics",
                price: 150000,
                quantity: 12
            },
            {
                sku: "PRD-006",
                name: "Laptop Sleeve",
                category: "Accessories",
                price: 55000,
                quantity: 3
            },
            {
                sku: "PRD-007",
                name: "Desk Lamp",
                category: "Office",
                price: 85000,
                quantity: 10
            },
            {
                sku: "PRD-008",
                name: "USB Flash Drive 64GB",
                category: "Accessories",
                price: 35000,
                quantity: 25
            }
        ];

        return samples.map(product => ({
            id: globalThis.crypto.randomUUID(),
            ...product,
            createdAt: timestamp,
            updatedAt: timestamp
        }));
    }

    /**
     * Validate the structure of stored products.
     */

    function isValidProduct(product) {

        return (
            product !== null &&
            typeof product === "object" &&
            typeof product.id === "string" &&
            typeof product.sku === "string" &&
            typeof product.name === "string" &&
            typeof product.category === "string" &&
            Number.isFinite(product.price) &&
            product.price >= 0 &&
            Number.isSafeInteger(product.quantity) &&
            product.quantity >= 0 &&
            typeof product.createdAt === "string" &&
            typeof product.updatedAt === "string"
        );
    }

    /**
     * Validate an inventory collection.
     */

    function validateCollection(products) {

        if (
            !Array.isArray(products) ||
            !products.every(isValidProduct)
        ) {
            throw new Error("Invalid inventory data.");
        }

        const ids = new Set();
        const skus = new Set();

        for (const product of products) {

            const sku = product.sku.trim().toUpperCase();

            if (
                !sku ||
                !product.name.trim() ||
                !product.category.trim()
            ) {
                throw new Error("Required product data is missing.");
            }

            if (
                ids.has(product.id) ||
                skus.has(sku)
            ) {
                throw new Error("Duplicate product data.");
            }

            ids.add(product.id);
            skus.add(sku);
        }

        return true;
    }

    /**
     * Save inventory to LocalStorage.
     */

    function saveProducts(
        products,
        storage = globalThis.localStorage
    ) {

        validateCollection(products);

        try {

            const serialized = JSON.stringify(products);

            storage.setItem(STORAGE_KEY, serialized);

            return true;

        } catch (error) {

            console.error(
                "Unable to save inventory:",
                error
            );

            throw new Error(
                "Inventory could not be saved."
            );
        }
    }

    /**
     * Load inventory from LocalStorage.
     */

    function loadProducts(
        storage = globalThis.localStorage
    ) {

        try {

            const savedData = storage.getItem(
                STORAGE_KEY
            );

            // First application launch.

            if (savedData === null) {

                const products = getSampleProducts();

                saveProducts(products, storage);

                return products;
            }

            const products = JSON.parse(savedData);

            validateCollection(products);

            return products;

        } catch (error) {

            console.error(
                "Unable to load inventory:",
                error
            );

            throw new Error(
                "Inventory could not be loaded. Stored data has been preserved."
            );
        }
    }

    /**
     * Restore demonstration inventory.
     */

    function resetProducts(
        storage = globalThis.localStorage
    ) {

        const products = getSampleProducts();

        saveProducts(products, storage);

        return products;
    }

    /**
     * Public storage module API.
     */

    return Object.freeze({

        STORAGE_KEY,
        getSampleProducts,
        isValidProduct,
        validateCollection,
        saveProducts,
        loadProducts,
        resetProducts

    });

})();

/**
 * Export module for Node.js unit testing.
 */

if (
    typeof module !== "undefined" &&
    module.exports
) {
    module.exports = Storage;
}
