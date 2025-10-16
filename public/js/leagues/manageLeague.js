document.addEventListener("DOMContentLoaded", () => {
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
    const manageButtons = document.querySelectorAll(".table__button");
    const modalRoot = document.getElementById("modal-root");
    const backdrop = document.getElementById("backdrop");

    manageButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const row = e.target.closest("tr");
            const leagueName = row.querySelector("td:nth-child(2)").textContent.trim();
            const leagueLevel = row.querySelector("td:nth-child(3)").textContent.trim();

            // Crear modal de opciones (Manage)
            modalRoot.innerHTML = `
                <div class="modal active" id="manageModal">
                    <div class="modal-inner">
                        <h2>Manage League</h2>
                        <p style="text-align:center;">"${leagueName}"</p>
                        <div class="button-container">
                            <button id="editLeagueBtn" class="submit-btn">Edit</button>
                            <button id="deleteLeagueBtn" class="submit-btn" style="background-color:#d9534f;">Delete</button>
                        </div>
                    </div>
                </div>
            `;

            backdrop.classList.add("active");

            const manageModal = document.getElementById("manageModal");
            const editBtn = document.getElementById("editLeagueBtn");
            const deleteBtn = document.getElementById("deleteLeagueBtn");

            // Función para cerrar modal
            const closeModal = () => {
                manageModal.classList.remove("active");
                backdrop.classList.remove("active");
                modalRoot.innerHTML = "";
            };

            backdrop.addEventListener("click", (event) => {
                if (event.target === backdrop) closeModal();
            });

            // Acción DELETE
            deleteBtn.addEventListener("click", async () => {
                if (!confirm(`Are you sure you want to delete "${leagueName}"?`)) return;

                try {
                    const res = await fetch("/leagues/delete", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "CSRF-Token": csrfToken
                        },
                        body: JSON.stringify({ leagueName })
                    });

                    const data = await res.json();
                    alert(data.message || "Unknown response from server");

                    if (data.success) {
                        closeModal();
                        window.location.reload();
                    }
                } catch (err) {
                    console.error("Error deleting league:", err);
                    alert("Error deleting league");
                }
            });

            // Acción EDIT: Abrir modal de edición completo
            editBtn.addEventListener("click", () => {
                closeModal(); // cerrar el modal corto
                // Cargar modal de edición completo
                modalRoot.innerHTML = `
                    <div class="modal active" id="manageLeagueModal">
                        <div class="modal-inner">
                            <div class="modal-header">
                                <h1 class="modal-title">Edit League</h1>
                                <button id="closeManageLeagueModal" class="fa fa-times close-btn"></button>
                            </div>
                            <div class="modal-content">
                                <form id="editLeagueNameForm" action="/leagues/editName" method="POST" style="margin-bottom:2rem;">
                                    <input type="hidden" name="_csrf" value="${csrfToken}">
                                    <input type="hidden" name="nameA" id="editLeagueNameA" value="${leagueName}">
                                    <div>
                                        <label for="editLeagueName">Nuevo nombre de la liga</label>
                                        <input type="text" name="name" id="editLeagueName" required value="${leagueName}">
                                    </div>
                                    <div class="button-container">
                                        <button type="submit" class="submit-btn">Cambiar nombre</button>
                                    </div>
                                </form>
                                <form id="editLeagueLevelForm" action="/leagues/editLevel" method="POST">
                                    <input type="hidden" name="_csrf" value="${csrfToken}">
                                    <input type="hidden" name="nameA" id="editLeagueNameA2" value="${leagueName}">
                                    <div>
                                        <label for="editLeagueLevel">Nuevo nivel mínimo</label>
                                        <input type="number" name="lvl" id="editLeagueLevel" required value="${leagueLevel}">
                                    </div>
                                    <div class="button-container">
                                        <button type="submit" class="submit-btn">Cambiar nivel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                `;

                const editModal = document.getElementById("manageLeagueModal");
                const closeEditBtn = document.getElementById("closeManageLeagueModal");

                closeEditBtn.addEventListener("click", () => {
                    editModal.classList.remove("active");
                    backdrop.classList.remove("active");
                    modalRoot.innerHTML = "";
                });

                backdrop.addEventListener("click", (event) => {
                    if (event.target === backdrop) {
                        editModal.classList.remove("active");
                        backdrop.classList.remove("active");
                        modalRoot.innerHTML = "";
                    }
                });
            });
        });
    });
});
