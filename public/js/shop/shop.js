// Global variables
let currentFilters = {};

/**
 * Initializes listeners and loads initial filter options on DOM ready.
 *
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadFilterOptions();
});

/**
 * Wires up UI events like filter toggle and edit buttons.
 * Calls attachEditListeners to bind edit actions on product cards.
 *
 */
function initializeEventListeners() {
    const filterToggle = document.getElementById('filterToggle');

    // Toggle filters
    filterToggle.addEventListener('click', () => {
        const filtersSection = document.getElementById('filtersSection');
        filtersSection.classList.toggle('hidden');
    });

    attachEditListeners();
}

/**
 * Loads available filter options (states, categories, price range) from the server.
 * Populates selects and placeholders based on API response.
 *
 */
async function loadFilterOptions() {
    try {
        const response = await fetch('/shop/api/filter-options');
        const result = await response.json();

        if (result.success) {
            const { categories, states, priceRange } = result.data;

            // Fill state select
            const stateSelect = document.getElementById('filterState');
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = (state == 1) ? 'Active' : 'Inactive';
                stateSelect.appendChild(option);
            });

            // Fill category select
            const categorySelect = document.getElementById('filterCategory');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });

            // Configure max price placeholder
            if (priceRange.maxPrice > 0) {
                document.getElementById('filterMaxPrice').placeholder = priceRange.maxPrice.toFixed(2);
            }
        }
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

/**
 * Collects filter form values, validates price range, and queries filtered items.
 * Updates the product grid with results and shows loading states.
 *
 */
async function applyFilters() {
    const state = document.getElementById('filterState').value;
    const category = document.getElementById('filterCategory').value;
    const minPrice = document.getElementById('filterMinPrice').value;
    const maxPrice = document.getElementById('filterMaxPrice').value;

    // Validate price range
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
        alert('El precio mínimo no puede ser mayor que el precio máximo');
        return;
    }

    // Build filters object
    currentFilters = {};
    if (state) currentFilters.state = state;
    if (category) currentFilters.category = category;
    if (minPrice) currentFilters.minPrice = minPrice;
    if (maxPrice) currentFilters.maxPrice = maxPrice;

    showLoading(true);

    try {
        const params = new URLSearchParams(currentFilters);
        const url = `/shop/api/filter?${params.toString()}`;

        console.log('Fetching:', url); // for debugging

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            displayProducts(result.data);
        } else {
            showError(result.message || 'Error loading products');
        }
    } catch (error) {
        console.error('Error applying filters:', error);
        showError('Error applying filters. Check console for details.');
    } finally {
        showLoading(false);
    }
}

/**
 * Resets filter form and reloads the page to clear results.
 *
 */
function clearFilters() {
    document.getElementById('filterForm').reset();
    currentFilters = {};
    location.reload();
}

/**
 * Renders the products grid or a no-results view based on API data.
 * Rebinds edit button listeners after rendering.
 *
 */
function displayProducts(products) {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');

  if (products.length === 0) {
    grid.style.display = 'none';
    noResults.style.display = 'flex';
    return;
  }

  grid.style.display = 'grid';
  noResults.style.display = 'none';
  grid.innerHTML = '';

  products.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });

  attachEditListeners(); 
}

/**
 * Binds click handlers to every edit button inside product cards.
 * Fetches item data in JSON and opens the modal in edit mode.
 *
 */
function attachEditListeners() {
  document.querySelectorAll(".product-card .edit-item-btn").forEach(btn => { // all .edit-item-btn buttons
    btn.addEventListener("click", async (e) => {
      const card = e.target.closest(".product-card");
      const itemId = card?.getAttribute("data-id");
      if (!itemId) return alert("No se encontró el ID del item.");

      try {
        const res = await fetch(`/shop/edit/${itemId}`, { headers: { "Accept": "application/json" }}); 
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Error loading item data");
        const item = json.data;

        // Select modal elements
        const modal = document.getElementById("modal");
        const form = modal.querySelector("form");
        const modalTitle = modal.querySelector(".modal-title");

        // Find inputs and fill them
        form.name.value = item.name ?? "";
        form.price.value = item.price ?? "";
        form.category.value = item.category ?? "";
        form.state.value = String(item.state ?? "1");

        // Keep current image_name
        form.querySelector("#image_name_current").value = item.image_name || "";

        // Prepare edit mode
        modalTitle.textContent = "Edit Item";
        form.action = `/shop/update/${item.id}`;
        modal.classList.add("open");
        editMode = true;
        currentUserId = item.id;

        // UI buttons in modal
        document.querySelector(".submit-btn").style.display = "none";
        document.getElementById("edit-btn").style.display = "inline-block";
      } catch (err) {
        console.error(err);
        showMessage("Error loading item data", true);
      }
    });
  });
}

/**
 * Creates a product card element from a product object.
 * Outputs the structure used by the grid and includes the edit button.
 *
 */
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.id = product.id; // with alias it already exists

  const imageUrl = product.imageUrl || '/images/placeholder.jpg';
  const price = parseFloat(product.price).toFixed(2);
  const stateText = product.state == 1 ? 'Active' : 'Inactive';

  card.innerHTML = `
    <div class="product-image" style="background-image: url('${imageUrl}')"></div>
    <div class="product-info">
      <div class="product-category">${product.category}</div>
      <div class="product-name">${product.name}</div>
      <div class="review-count">${stateText}</div>
      <div class="price-row">
        <div><span class="price">$${price}</span></div>
        <button class="edit-item-btn">Edit</button>
        <button class="add-to-cart">
          <svg fill="#ffffff" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 52 52">
            <g>
              <path d="M9.5,33.4l8.9,8.9c0.4,0.4,1,0.4,1.4,0L42,20c0.4-0.4,0.4-1,0-1.4l-8.8-8.8c-0.4-0.4-1-0.4-1.4,0L9.5,32.1
                C9.1,32.5,9.1,33.1,9.5,33.4z"/>
              <path d="M36.1,5.7c-0.4,0.4-0.4,1,0,1.4l8.8,8.8c0.4,0.4,1,0.4,1.4,0l2.5-2.5c1.6-1.5,1.6-3.9,0-5.5l-4.7-4.7
                c-1.6-1.6-4.1-1.6-5.7,0L36.1,5.7z"/>
              <path d="M2.1,48.2c-0.2,1,0.7,1.9,1.7,1.7l10.9-2.6c0.4-0.1,0.7-0.3,0.9-0.5l0.2-0.2c0.2-0.2,0.3-0.9-0.1-1.3l-9-9
                c-0.4-0.4-1.1-0.3-1.3-0.1s-0.2,0.2-0.2,0.2c-0.3,0.3-0.4,0.6-0.5,0.9L2.1,48.2z"/>
            </g>
          </svg>
        </button>
      </div>
    </div>
  `;
  return card;
}

/**
 * Shows or hides the loading spinner and related sections.
 *
 */
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const grid = document.getElementById('productGrid');
    const noResults = document.getElementById('noResults');

    if (show) {
        spinner.style.display = 'flex';
        grid.style.display = 'none';
        noResults.style.display = 'none';
    } else {
        spinner.style.display = 'none';
    }
}

/**
 * Displays an error banner inside the grid area with a message.
 *
 */
function showError(message) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <p style="font-size: 18px;">${message}</p>
        </div>
    `;
}

const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const modal = document.getElementById("modal");
const form = modal.querySelector("form");
const modalTitle = modal.querySelector(".modal-title");
let editMode = false;
let currentUserId = null;

/**
 * Opens the modal in "Add Item" mode and resets form state.
 *
 */
openBtn.addEventListener("click", () => {
    modal.classList.add("open");
    modalTitle.textContent = "Add Item";
    form.action = "/shop";
    form.reset();
    editMode = false;
    currentUserId = null;
    form.email.removeAttribute("readonly");
    document.querySelector(".submit-btn").style.display = "inline-block";
    document.getElementById("edit-btn").style.display = "none";
});

/**
 * Closes the modal (close button).
 *
 */
closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
});

/**
 * Closes the modal when clicking on the backdrop.
 *
 */
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("open");
    }
});

/**
 * Shows a temporary message inside the form area.
 *
 */
function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById("form-message");
    msgDiv.textContent = msg;
    msgDiv.style.display = "block";
    msgDiv.style.color = isError ? "red" : "green";
    setTimeout(() => { msgDiv.style.display = "none"; }, 3000);
}

/**
 * Handles submit for add/update item.
 * Sends multipart form-data with CSRF header and processes JSON or redirect responses.
 *
 */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const csrfToken = form.querySelector('input[name="_csrf"]').value;
  const formData = new FormData(form);
  formData.delete('_csrf'); 

  const url = editMode ? form.action : '/shop';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'CSRF-Token': csrfToken },
      body: formData
    });

    // Could be JSON (AJAX add/edit) or a redirect
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const result = await response.json();
      if (result.success) {
        alert(editMode ? 'Item updated successfully' : 'Item added successfully');
        modal.classList.remove("open");
        window.location.href = result.redirect || '/shop';
      } else {
        alert('Error: ' + (result.msg || 'Operation failed'));
      }
    } else {
      // If server issued an HTML redirect
      modal.classList.remove("open");
      window.location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
    alert(editMode ? 'Error updating item' : 'Error adding item');
  }
});

// --- User search ---
const searchInput = document.getElementById("searchInput");
const usersTableBody = document.getElementById("usersTableBody");
const noUserFoundMsg = document.getElementById("noUserFoundMsg");

/**
 * Filters visible user rows by id or name and toggles the "not found" message.
 *
 */
function filterUsers() {
    const searchValue = searchInput.value.trim().toLowerCase();
    let found = false;
    const rows = usersTableBody.querySelectorAll("tr.user-row");
    rows.forEach(row => {
        const id = row.getAttribute("data-id").toLowerCase();
        const name = row.getAttribute("data-name").toLowerCase();
        if (
            searchValue === "" ||
            id.includes(searchValue) ||
            name.includes(searchValue)
        ) {
            row.style.display = "";
            found = true;
        } else {
            row.style.display = "none";
        }
    });
    // Hide/show not found message
    if (!found) {
        noUserFoundMsg.style.display = "block";
    } else {
        noUserFoundMsg.style.display = "none";
    }
    // Hide the "No users found" row when searching
    const noUsersRow = usersTableBody.querySelector("tr.no-users-row");
    if (noUsersRow) {
        noUsersRow.style.display = searchValue === "" ? "" : "none";
    }
}

/**
 * Handles click on "change state" buttons inside the product grid.
 * Sends a POST to toggle the item, then reloads on success.
 *
 */
document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('productGrid');

  if (productGrid) {
    productGrid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.change-state-btn');
      if (!btn) return;

      const id = btn.getAttribute('data-id');
      
      if (!confirm('Do you want to change the status of this product?')) return;

      try {
        const res = await fetch('/shop/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': window.csrfToken
          },
          body: JSON.stringify({ id })
        });

        const result = await res.json();

        if (result.success) {
          alert(result.message);
          window.location.reload(); // reload the page to reflect changes
        } else {
          alert(result.message || 'Error al cambiar el estado');
        }
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        alert('Error de conexión o del servidor');
      }
    });
  }
});
