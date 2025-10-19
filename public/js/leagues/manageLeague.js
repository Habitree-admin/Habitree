document.addEventListener("DOMContentLoaded", () => {
    const csrfToken = document.querySelector('input[name="_csrf"]')?.value || "";

    // Modal y controles
    const modal = document.getElementById("manageModal");
    const backdrop = document.getElementById("backdrop");
    const closeBtn = document.getElementById("closeManageModal");

    // Labels / botones
    const selectedLeagueLabel = document.getElementById("selectedLeagueLabel");
    const deleteBtn = document.getElementById("deleteLeagueBtn");
    const editBtn = document.getElementById("editLeagueBtn");

    // Inputs del formulario único
    const editLeagueNameInput = document.getElementById("editLeagueName");
    const editLeagueLevelInput = document.getElementById("editLeagueLevel");

    // Botones "Manage" de la tabla
    const manageButtons = document.querySelectorAll(".manage-league-btn");

    let currentLeagueName = null;
    let currentLeagueLevel = null;

    const openModal = ({ name, level }) => {
        currentLeagueName  = name;
        currentLeagueLevel = level;

        // Prefill y etiqueta
        selectedLeagueLabel.textContent = `"${name}"`;
        editLeagueNameInput.value = name;
        editLeagueLevelInput.value = level;

        modal.classList.add("active");
        backdrop.classList.add("active");
    };

    const closeModal = () => {
        modal.classList.remove("active");
        backdrop.classList.remove("active");
        selectedLeagueLabel.textContent = "";
        currentLeagueName = null;
        currentLeagueLevel = null;
        editLeagueNameInput.value = "";
        editLeagueLevelInput.value = "";
    };

    // Abrir modal
    manageButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            const row = e.currentTarget.closest("tr");
            if (!row) return;

            const nameCell  = row.querySelector("td:nth-child(2)");
            const levelCell = row.querySelector("td:nth-child(3)");

            const leagueName  = (button.dataset.leagueName || nameCell?.textContent || "").trim();
            const leagueLevel = (levelCell?.textContent || "").trim();

            if (!leagueName) return;
            openModal({ name: leagueName, level: leagueLevel });
        });
    });

    // Cerrar
    closeBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", (evt) => { if (evt.target === backdrop) closeModal(); });

    // Helper: post x-www-form-urlencoded y tolerar respuestas no-JSON
    async function postForm(url, params) {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "CSRF-Token": csrfToken
            },
            body: new URLSearchParams(params)
        });
        let data = null;
        try { data = await res.json(); } catch { }
        return { ok: res.ok, data };
    }

    // EDIT
    editBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!currentLeagueName) return;

        const newName = editLeagueNameInput.value.trim();
        const newLevel = editLeagueLevelInput.value.trim();

        if (!newName) {
            alert("El nuevo nombre es requerido.");
            return;
        }
        if (newLevel === "") {
            alert("El nivel mínimo es requerido.");
            return;
        }

        const nameChanged  = newName !== currentLeagueName;
        const levelChanged = newLevel !== String(currentLeagueLevel);

        if (!nameChanged && !levelChanged) {
            alert("No hay cambios por guardar.");
            return;
        }

        try {
            if (nameChanged) {
                const { ok, data } = await postForm("/leagues/editName", {
                    nameA: currentLeagueName,
                    name: newName
                });
                if (!ok) throw new Error(data?.message || "Error al cambiar el nombre");
                currentLeagueName = newName; // importante para el siguiente paso
            }

            if (levelChanged) {
                const { ok, data } = await postForm("/leagues/editLevel", {
                    nameA: currentLeagueName, // si se cambió nombre arriba, ya es el nuevo
                    lvl: newLevel
                });
                if (!ok) throw new Error(data?.message || "Error al cambiar el nivel");
            }

            alert("Liga actualizada correctamente.");
            closeModal();
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert(err.message || "Error al editar la liga");
        }
    });

    // DELETE
    deleteBtn?.addEventListener("click", async () => {
        if (!currentLeagueName) return;
        if (!confirm(`Are you sure you want to delete "${currentLeagueName}"?`)) return;

        try {
            const res = await fetch("/leagues/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json", "CSRF-Token": csrfToken },
                body: JSON.stringify({ leagueName: currentLeagueName })
            });
            const data = await res.json().catch(() => null);
            if (data?.message) alert(data.message);
            if (data?.success) {
                closeModal();
                window.location.reload();
            }
        } catch (err) {
            console.error("Error deleting league:", err);
            alert("Error deleting league");
        }
    });
});
