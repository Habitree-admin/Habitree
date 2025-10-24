const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const modal = document.getElementById("modal");
const form = modal.querySelector("form");
const modalTitle = modal.querySelector(".modal-title");
let editMode = false;
let currentUserId = null;

openBtn.addEventListener("click", () => {
    modal.classList.add("open");
    modalTitle.textContent = "Add User";
    form.action = "/users";
    form.reset();
    editMode = false;
    currentUserId = null;
    form.email.removeAttribute("readonly");
    document.getElementById("id-readonly-msg").style.display = "none";
    document.getElementById("delete-btn").style.display = "none";
    document.getElementById("add-edit-btn").textContent = "Add";
});

closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("open");
    }
});

/**
 
 this shows a message in the modal popup
 this displays success or error text briefly
 *
 */
function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById("form-message");
    msgDiv.textContent = msg;
    msgDiv.style.display = "block";
    msgDiv.style.color = isError ? "red" : "green";
    setTimeout(() => { msgDiv.style.display = "none"; }, 3000);
}

// Open modal in edit mode on 'Manage' click
document.querySelectorAll(".manage-user-btn").forEach(btn => {
    btn.addEventListener("click", function(e) {
        const row = e.target.closest("tr");
        const userId = row.getAttribute("data-id");
        // Get user data via fetch
        fetch(`/users/${userId}`)
            .then(res => res.json())
            .then(user => {
                form.name.value = user.name;
                form.email.value = user.email;
                form.gender.value = user.gender;
                form.dateOfBirth.value = user.dateOfBirth ? user.dateOfBirth.slice(0,10) : "";
                modalTitle.textContent = "Edit User";
                form.action = `/users/edit/${userId}`;
                modal.classList.add("open");
                editMode = true;
                currentUserId = userId;
                form.email.removeAttribute("readonly");
                document.getElementById("id-readonly-msg").style.display = "inline";
                document.getElementById("delete-btn").style.display = "inline-block";
                document.getElementById("add-edit-btn").textContent = "Edit";
                // show delete button inside modal
                const deleteBtn = document.getElementById("delete-btn");
                deleteBtn.style.display = "inline-block";
                deleteBtn.dataset.userId = userId;
                deleteBtn.dataset.userName = user.name || row.getAttribute("data-name");
            })
            .catch(() => {
                showMessage("Error loading user data", true);
            });
    });
});

/**
 
 this handler deletes a user from the UI
 this posts to bd and shows message on success
 *
 */
document.getElementById('delete-btn').addEventListener('click', function() {
    if (!confirm('¿Seguro que quieres eliminar este usuario?')) return;
    const userId = this.dataset.userId || currentUserId;
    const csrfToken = document.querySelector('input[name="_csrf"]') ? document.querySelector('input[name="_csrf"]').value : (document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').getAttribute('content') : '');

    // users route expects POST /users/delete/:id
+    fetch(`/users/delete/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
        }
    })
    .then(res => res.json())
    .then(data => {
        showMessage(data.message || 'Usuario eliminado');
        setTimeout(() => { window.location.reload(); }, 1200);
    })
    .catch(err => {
        showMessage('Error eliminando usuario', true);
        console.error(err);
    });
});

/**
 
 this handler submits user edits via ajax in edit mode
 this prevents default and posts json
 *
 */
// intercept submit in edit mode
form.addEventListener("submit", async function (e) {
    const submitBtn = document.getElementById("add-edit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    if (editMode) {
        e.preventDefault();

        const data = {
            name: form.name.value,
            email: form.email.value,
            gender: form.gender.value,
            dateOfBirth: form.dateOfBirth.value
        };

        try {
            const res = await fetch(`/users/edit/${currentUserId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": form._csrf.value
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (result.success) {
                showMessage(result.message);
                setTimeout(() => window.location.reload(), 1200);
            } else {
                showMessage(result.message, true);
                submitBtn.disabled = false;
                submitBtn.textContent = "Edit";
            }

        } catch (err) {
            showMessage("Error updating user", true);
            submitBtn.disabled = false;
            submitBtn.textContent = "Edit";
        }

    } else {
        // Si es modo "Add", bloquea clics rápidos
        submitBtn.disabled = true;
        submitBtn.textContent = "Adding...";

        // Reactiva el botón después de unos segundos preventivos
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = "Add";
        }, 4000);
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
    if (!found) {
        noUserFoundMsg.style.display = "block";
    } else {
        noUserFoundMsg.style.display = "none";
    }
    const noUsersRow = usersTableBody.querySelector("tr.no-users-row");
    if (noUsersRow) {
        noUsersRow.style.display = searchValue === "" ? "" : "none";
    }
}

searchInput.addEventListener("input", filterUsers);