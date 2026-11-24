
/**
 * Inventory Pro - Business Logic Layer
 * Author: Andres Devia - Andrew Forest
 * Version: 1.0.0
 *
 * CRUD operations, validation, filtering
 * and inventory calculations.
 */

"use strict";

const Inventory = (() => {

    const LOW_STOCK_THRESHOLD = 5;

    /**
     * Generate a unique product ID.
     */

    function generateId() {
        return globalThis.crypto.randomUUID();
    }

    /**
     * Normalize product information.
     */

    function normalizeProduct(data) {

        return {
            sku: String(data.sku ?? "")
                .trim()
                .toUpperCase(),

            name: String(data.name ?? "").trim(),

            category: String(data.category ?? "").trim(),

            price: Number(data.price),

            quantity: Number(data.quantity)
        };
    }

    /**
     * Validate product information.
     */

    function validateProduct(data, products, excludeId = null) {

        const product = normalizeProduct(data);

        if (!product.sku) {
            throw new Error("SKU is required.");
        }

        if (!product.name) {
            throw new Error("Product name is required.");
        }

        if (!product.category) {
            throw new Error("Category is required.");
        }

        if (
            product.sku.length > 40 ||
            product.name.length > 100 ||
            product.category.length > 60
        ) {
            throw new Error("Maximum field length exceeded.");
        }

        if (
            data.price == null ||
            String(data.price).trim() === "" ||
            !Number.isFinite(product.price) ||
            product.price < 0
        ) {
            throw new Error(
                "Unit cost must be a valid non-negative number."
            );
        }

        if (
            data.quantity == null ||
            String(data.quantity).trim() === "" ||
            !Number.isSafeInteger(product.quantity) ||
            product.quantity < 0
        ) {
            throw new Error(
                "Quantity must be a non-negative integer."
            );
        }

        const duplicate = products.some(item =>
            item.sku.toUpperCase() === product.sku &&
            item.id !== excludeId
        );

        if (duplicate) {
            throw new Error("This SKU already exists.");
        }

        if (!Number.isFinite(
            product.price * product.quantity
        )) {
            throw new Error("Product value is too large.");
        }

        return product;
    }

    /**
     * CREATE - Register a new product.
     */

    function createProduct(products, data) {

        const validated = validateProduct(data, products);

        const timestamp = new Date().toISOString();

        const product = {
            id: generateId(),
            ...validated,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        return [...products, product];
    }

    /**
     * READ - Find a product by ID.
     */

    function getProductById(products, id) {

        return products.find(
            product => product.id === id
        ) || null;
    }

    /**
     * UPDATE - Modify an existing product.
     */

    function updateProduct(products, id, data) {

        const existing = getProductById(products, id);

        if (!existing) {
            throw new Error("Product not found.");
        }

        const validated = validateProduct(
            { ...existing, ...data },
            products,
            id
        );

        return products.map(product => {

            if (product.id !== id) {
                return product;
            }

            return {
                ...product,
                ...validated,
                updatedAt: new Date().toISOString()
            };
        });
    }

    /**
     * DELETE - Remove a product.
     */

    function deleteProduct(products, id) {

        if (!getProductById(products, id)) {
            throw new Error("Product not found.");
        }

        return products.filter(
            product => product.id !== id
        );
    }

    /**
     * Determine the product stock status.
     */

    function getStockStatus(quantity) {

        if (quantity === 0) {
            return "out-of-stock";
        }

        if (quantity < LOW_STOCK_THRESHOLD) {
            return "low-stock";
        }

        return "in-stock";
    }

    /**
     * Get a readable stock status label.
     */

    function getStatusLabel(status) {

        const labels = {
            "in-stock": "In stock",
            "low-stock": "Low stock",
            "out-of-stock": "Out of stock"
        };

        return labels[status] || "Unknown";
    }

    /**
     * Calculate total product value.
     */

    function calculateProductValue(product) {

        return product.price * product.quantity;
    }

    /**
     * Calculate dashboard statistics.
     */

    function calculateMetrics(products) {

        return products.reduce((metrics, product) => {

            metrics.totalProducts += 1;

            metrics.totalUnits += product.quantity;

            metrics.totalValue +=
                calculateProductValue(product);

            const status = getStockStatus(
                product.quantity
            );

            if (status === "low-stock") {
                metrics.lowStock += 1;
            }

            if (status === "out-of-stock") {
                metrics.outOfStock += 1;
            }

            return metrics;

        }, {
            totalProducts: 0,
            totalUnits: 0,
            totalValue: 0,
            lowStock: 0,
            outOfStock: 0
        });
    }

    /**
     * Get all available product categories.
     */

    function getCategories(products) {

        return [...new Set(
            products.map(product => product.category)
        )].sort((a, b) => a.localeCompare(b));
    }

    /**
     * Search and filter products.
     */

    function filterProducts(products, filters = {}) {

        const search = String(filters.search ?? "")
            .trim()
            .toLowerCase();

        const category = filters.category || "all";

        const status = filters.status || "all";

        return products.filter(product => {

            const matchesSearch =
                product.name.toLowerCase().includes(search) ||
                product.sku.toLowerCase().includes(search);

            const matchesCategory =
                category === "all" ||
                product.category === category;

            const matchesStatus =
                status === "all" ||
                getStockStatus(product.quantity) === status;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        });
    }

    /**
     * Format monetary values in Colombian pesos.
     */

    function formatCurrency(value) {

        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 2
        }).format(value);
    }

    /**
     * Escape CSV values and neutralize formulas.
     */

    function escapeCSV(value) {

        let text = String(value ?? "");

        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    /**
     * Generate CSV inventory data.
     */

    function generateCSV(products) {

        const headers = [
            "SKU",
            "Product",
            "Category",
            "Unit Cost (COP)",
            "Quantity",
            "Total Value (COP)",
            "Status"
        ];

        const rows = products.map(product => [

            product.sku,
            product.name,
            product.category,
            product.price.toFixed(2),
            product.quantity,
            calculateProductValue(product).toFixed(2),

            getStatusLabel(
                getStockStatus(product.quantity)
            )
        ]);

        return [headers, ...rows]

            .map(row => row.map(escapeCSV).join(","))

            .join("\r\n");
    }

    /**
     * Public module API.
     */

    return Object.freeze({

        LOW_STOCK_THRESHOLD,
        normalizeProduct,
        validateProduct,
        createProduct,
        getProductById,
        updateProduct,
        deleteProduct,
        getStockStatus,
        getStatusLabel,
        calculateProductValue,
        calculateMetrics,
        getCategories,
        filterProducts,
        formatCurrency,
        generateCSV

    });

})();

/**
 * Export module for Node.js unit testing.
 */

if (
    typeof module !== "undefined" &&
    module.exports
) {
    module.exports = Inventory;
}
