
/**
 * Inventory Pro - Application Controller
 * Author: Andres Devia - Andrew Forest
 * Version: 1.0.0
 *
 * Connects the user interface, business logic
 * and persistent storage modules.
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    let products = [];
    let notificationTimer;
    let storageAvailable = true;

    const $ = id => document.getElementById(id);

    const elements = {
        tableBody: $("products-table-body"),
        emptyState: $("empty-state"),
        productCount: $("product-count"),

        totalProducts: $("total-products"),
        totalUnits: $("total-units"),
        totalValue: $("total-value"),
        lowStock: $("low-stock"),
        outOfStock: $("out-of-stock"),

        search: $("search-input"),
        categoryFilter: $("category-filter"),
        statusFilter: $("status-filter"),

        modal: $("product-modal"),
        modalTitle: $("modal-title"),
        form: $("product-form"),
        formError: $("form-error"),

        productId: $("product-id"),
        sku: $("product-sku"),
        name: $("product-name"),
        category: $("product-category"),
        price: $("product-price"),
        quantity: $("product-quantity"),

        notification: $("notification")
    };

    /**
     * Display application notifications.
     */

    function showNotification(message, type = "success") {

        clearTimeout(notificationTimer);

        elements.notification.textContent = message;

        elements.notification.classList.toggle(
            "error",
            type === "error"
        );

        elements.notification.classList.add("show");

        notificationTimer = setTimeout(() => {

            elements.notification.classList.remove("show");

        }, 3500);
    }

    /**
     * Update dashboard metrics.
     */

    function renderMetrics() {

        const metrics = Inventory.calculateMetrics(products);

        elements.totalProducts.textContent =
            metrics.totalProducts;

        elements.totalUnits.textContent =
            metrics.totalUnits.toLocaleString("es-CO");

        elements.totalValue.textContent =
            Inventory.formatCurrency(metrics.totalValue);

        elements.lowStock.textContent =
            metrics.lowStock;

        elements.outOfStock.textContent =
            metrics.outOfStock;
    }

    /**
     * Update available product categories.
     */

    function renderCategories() {

        const selected = elements.categoryFilter.value;

        const categories = Inventory.getCategories(products);

        elements.categoryFilter.replaceChildren();

        elements.categoryFilter.add(
            new Option("All categories", "all")
        );

        categories.forEach(category => {

            elements.categoryFilter.add(
                new Option(category, "category:" + category)
            );

        });

        const exists = Array.from(
            elements.categoryFilter.options
        ).some(option => option.value === selected);

        elements.categoryFilter.value =
            exists ? selected : "all";
    }

    /**
     * Create a safe table cell.
     */

    function createCell(value) {

        const cell = document.createElement("td");

        cell.textContent = value;

        return cell;
    }

    /**
     * Create stock status badge.
     */

    function createStatusBadge(quantity) {

        const status = Inventory.getStockStatus(quantity);

        const badge = document.createElement("span");

        badge.className = "status-badge " + status;

        badge.textContent =
            Inventory.getStatusLabel(status);

        return badge;
    }

    /**
     * Create product action buttons.
     */

    function createActionButtons(product) {

        const container = document.createElement("div");

        container.className = "action-buttons";

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";

        editButton.setAttribute(
            "aria-label",
            "Edit " + product.name
        );

        editButton.addEventListener("click", () => {

            openEditModal(product.id);

        });

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.setAttribute(
            "aria-label",
            "Delete " + product.name
        );

        deleteButton.addEventListener("click", () => {

            handleDelete(product.id);

        });

        container.append(editButton, deleteButton);

        return container;
    }

    /**
     * Render inventory products.
     */

    function renderProducts() {

        const selectedCategory =
            elements.categoryFilter.value;

        const filtered = Inventory.filterProducts(
            products,
            {
                search: elements.search.value,

                category: selectedCategory === "all"
                    ? "all"
                    : selectedCategory.slice(9),

                status: elements.statusFilter.value
            }
        ).filter(product =>

            selectedCategory === "all" ||
            product.category === selectedCategory.slice(9)

        );

        elements.tableBody.replaceChildren();

        filtered.forEach(product => {

            const row = document.createElement("tr");

            row.append(
                createCell(product.sku),
                createCell(product.name),
                createCell(product.category),

                createCell(
                    Inventory.formatCurrency(product.price)
                ),

                createCell(product.quantity),

                createCell(
                    Inventory.formatCurrency(
                        Inventory.calculateProductValue(product)
                    )
                )
            );

            const statusCell =
                document.createElement("td");

            statusCell.append(
                createStatusBadge(product.quantity)
            );

            const actionsCell =
                document.createElement("td");

            actionsCell.append(
                createActionButtons(product)
            );

            row.append(statusCell, actionsCell);

            elements.tableBody.append(row);

        });

        elements.emptyState.hidden =
            filtered.length !== 0;

        elements.productCount.textContent =
            `Showing ${filtered.length} of ${products.length} products`;
    }

    /**
     * Refresh all application components.
     */

    function renderApp() {

        renderMetrics();
        renderCategories();
        renderProducts();
    }

    /**
     * Save inventory before updating application state.
     */

    function persistProducts(updatedProducts) {

        if (!storageAvailable) {

            throw new Error(
                "Storage is unavailable. Existing data has been preserved."
            );
        }

        Storage.saveProducts(updatedProducts);

        products = updatedProducts;

        renderApp();
    }

    /**
     * Display form errors.
     */

    function showFormError(message) {

        elements.formError.textContent = message;

        elements.formError.hidden = false;
    }

    function clearFormError() {

        elements.formError.textContent = "";

        elements.formError.hidden = true;
    }

    /**
     * Open product creation dialog.
     */

    function openCreateModal() {

        if (!storageAvailable) {

            showNotification(
                "Inventory storage is unavailable.",
                "error"
            );

            return;
        }

        elements.form.reset();

        elements.productId.value = "";

        elements.modalTitle.textContent = "Add product";

        clearFormError();

        elements.modal.showModal();

        elements.sku.focus();
    }

    /**
     * Open product editing dialog.
     */

    function openEditModal(id) {

        const product = Inventory.getProductById(
            products,
            id
        );

        if (!product) {

            showNotification(
                "Product not found.",
                "error"
            );

            return;
        }

        clearFormError();

        elements.modalTitle.textContent =
            "Edit product";

        elements.productId.value = product.id;
        elements.sku.value = product.sku;
        elements.name.value = product.name;
        elements.category.value = product.category;
        elements.price.value = product.price;
        elements.quantity.value = product.quantity;

        elements.modal.showModal();
    }

    /**
     * Close product dialog.
     */

    function closeModal() {

        elements.modal.close();

        clearFormError();
    }

    /**
     * Handle product creation and editing.
     */

    function handleFormSubmit(event) {

        event.preventDefault();

        clearFormError();

        const id = elements.productId.value;

        const data = {
            sku: elements.sku.value,
            name: elements.name.value,
            category: elements.category.value,
            price: elements.price.value,
            quantity: elements.quantity.value
        };

        try {

            let updatedProducts;

            if (id) {

                updatedProducts = Inventory.updateProduct(
                    products,
                    id,
                    data
                );

            } else {

                updatedProducts = Inventory.createProduct(
                    products,
                    data
                );
            }

            persistProducts(updatedProducts);

            closeModal();

            showNotification(
                id
                    ? "Product updated successfully."
                    : "Product created successfully."
            );

        } catch (error) {

            showFormError(error.message);

        }
    }

    /**
     * Handle product deletion.
     */

    function handleDelete(id) {

        const product = Inventory.getProductById(
            products,
            id
        );

        if (!product) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${product.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            const updatedProducts =
                Inventory.deleteProduct(products, id);

            persistProducts(updatedProducts);

            showNotification(
                "Product deleted successfully."
            );

        } catch (error) {

            showNotification(
                error.message,
                "error"
            );
        }
    }

    /**
     * Export inventory as a CSV file.
     */

    function exportInventory() {

        if (products.length === 0) {

            showNotification(
                "There are no products to export.",
                "error"
            );

            return;
        }

        const csv = Inventory.generateCSV(products);

        const blob = new Blob(
            ["\uFEFF", csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        const date = new Date()
            .toISOString()
            .slice(0, 10);

        link.href = url;

        link.download = `inventory-${date}.csv`;

        document.body.append(link);

        link.click();

        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        showNotification(
            "Inventory CSV exported successfully."
        );
    }

    /**
     * Register application events.
     */

    function registerEvents() {

        $("add-product-btn").addEventListener(
            "click",
            openCreateModal
        );

        $("sidebar-add-product").addEventListener(
            "click",
            openCreateModal
        );

        $("close-modal").addEventListener(
            "click",
            closeModal
        );

        $("cancel-product").addEventListener(
            "click",
            closeModal
        );

        $("export-btn").addEventListener(
            "click",
            exportInventory
        );

        $("sidebar-export").addEventListener(
            "click",
            exportInventory
        );

        elements.form.addEventListener(
            "submit",
            handleFormSubmit
        );

        elements.search.addEventListener(
            "input",
            renderProducts
        );

        elements.categoryFilter.addEventListener(
            "change",
            renderProducts
        );

        elements.statusFilter.addEventListener(
            "change",
            renderProducts
        );

        elements.modal.addEventListener(
            "click",
            event => {

                if (event.target === elements.modal) {

                    const rect =
                        elements.modal.getBoundingClientRect();

                    const outside =
                        event.clientX < rect.left ||
                        event.clientX > rect.right ||
                        event.clientY < rect.top ||
                        event.clientY > rect.bottom;

                    if (outside) {
                        closeModal();
                    }
                }
            }
        );

        document.querySelectorAll(
            ".navigation a"
        ).forEach(link => {

            link.addEventListener("click", () => {

                document.querySelectorAll(
                    ".navigation a"
                ).forEach(item => {

                    item.classList.remove("active");

                });

                link.classList.add("active");
            });
        });
    }

    /**
     * Initialize the application.
     */

    function initializeApp() {

        registerEvents();

        try {

            products = Storage.loadProducts();

        } catch (error) {

            storageAvailable = false;

            showNotification(
                error.message,
                "error"
            );
        }

        renderApp();
    }

    initializeApp();

});
