// Variables globales
let currentFilters = {};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadFilterOptions();
});

// Configurar event listeners
function initializeEventListeners() {
    const filterToggle = document.getElementById('filterToggle');

    // Toggle filtros
    filterToggle.addEventListener('click', () => {
        const filtersSection = document.getElementById('filtersSection');
        filtersSection.classList.toggle('hidden');
    });

    attachEditListeners();
}

// Cargar opciones de filtros desde la BD
async function loadFilterOptions() {
    try {
        const response = await fetch('/shop/api/filter-options');
        const result = await response.json();

        if (result.success) {
            const { categories, states, priceRange } = result.data;

            // Llenar select de estados
            const stateSelect = document.getElementById('filterState');
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = (state == 1) ? 'Active' : 'Inactive';
                stateSelect.appendChild(option);
            });

            // Llenar select de categorías
            const categorySelect = document.getElementById('filterCategory');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });

            // Configurar placeholder del precio máximo
            if (priceRange.maxPrice > 0) {
                document.getElementById('filterMaxPrice').placeholder = priceRange.maxPrice.toFixed(2);
            }
        }
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

// Aplicar filtros
async function applyFilters() {
    const state = document.getElementById('filterState').value;
    const category = document.getElementById('filterCategory').value;
    const minPrice = document.getElementById('filterMinPrice').value;
    const maxPrice = document.getElementById('filterMaxPrice').value;


    // Validar rango de precios
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
        alert('El precio mínimo no puede ser mayor que el precio máximo');
        return;
    }

    // Construir objeto de filtros
    currentFilters = {};
    if (state) currentFilters.state = state;
    if (category) currentFilters.category = category;
    if (minPrice) currentFilters.minPrice = minPrice;
    if (maxPrice) currentFilters.maxPrice = maxPrice;

    showLoading(true);

    try {
        const params = new URLSearchParams(currentFilters);
        const url = `/shop/api/filter?${params.toString()}`;

        console.log('Fetching:', url); // Para debugging

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

// Limpiar filtros
function clearFilters() {
    document.getElementById('filterForm').reset();
    currentFilters = {};
    location.reload();
}

// Mostrar productos
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

// Adjuntar listeners a botones de edición
function attachEditListeners() {
  document.querySelectorAll(".product-card .edit-item-btn").forEach(btn => { // Todos los botones .edit-item-btn
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

        // Seleccionar elementos del modal
        const modal = document.getElementById("modal");
        const form = modal.querySelector("form");
        const modalTitle = modal.querySelector(".modal-title");

        // Busca los inputs y rellena
        form.name.value = item.name ?? "";
        form.price.value = item.price ?? "";
        form.category.value = item.category ?? "";
        form.state.value = String(item.state ?? "1");

        // Conserva el image_name actual
        form.querySelector("#image_name_current").value = item.image_name || "";


        // preparar modo edición
        modalTitle.textContent = "Edit Item";
        form.action = `/shop/update/${item.id}`;
        modal.classList.add("open");
        editMode = true;
        currentUserId = item.id;

        // UI botones del modal
        document.querySelector(".submit-btn").style.display = "none";
        document.getElementById("edit-btn").style.display = "inline-block";
      } catch (err) {
        console.error(err);
        showMessage("Error loading item data", true);
      }
    });
  });
}


// Crear tarjeta de producto
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.id = product.id; // <- con alias ya existe

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


// Mostrar/ocultar loading
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

// Mostrar error
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

closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("open");
    }
});

// Mostrar mensajes en el pop-up
function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById("form-message");
    msgDiv.textContent = msg;
    msgDiv.style.display = "block";
    msgDiv.style.color = isError ? "red" : "green";
    setTimeout(() => { msgDiv.style.display = "none"; }, 3000);
}



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

    // Puede venir JSON (si edit/add por AJAX) o redirección
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
      // Si el server respondió con un redirect por HTML
      modal.classList.remove("open");
      window.location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
    alert(editMode ? 'Error updating item' : 'Error adding item');
  }
});

// --- Búsqueda de usuarios ---
const searchInput = document.getElementById("searchInput");
const usersTableBody = document.getElementById("usersTableBody");
const noUserFoundMsg = document.getElementById("noUserFoundMsg");

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
    // Ocultar/mostrar mensaje de no encontrado
    if (!found) {
        noUserFoundMsg.style.display = "block";
    } else {
        noUserFoundMsg.style.display = "none";
    }
    // Ocultar la fila de "No hay usuarios registrados" si hay búsqueda
    const noUsersRow = usersTableBody.querySelector("tr.no-users-row");
    if (noUsersRow) {
        noUsersRow.style.display = searchValue === "" ? "" : "none";
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('productGrid');

  if (productGrid) {
    productGrid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.change-state-btn');
      if (!btn) return;

      const id = btn.getAttribute('data-id');

      if (!confirm('¿Deseas cambiar el estado de este producto?')) return;

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
          window.location.reload(); // <-- Esta línea recarga la página
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
