document.addEventListener("DOMContentLoaded", () => {
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
    const manageButtons = document.querySelectorAll(".manage-league-btn");

    const modal = document.getElementById("manageModal");
    const backdrop = document.getElementById("backdrop");
    const closeBtn = document.getElementById("closeManageModal");
    const deleteBtn = document.getElementById("deleteLeagueBtn");
    const selectedLeagueLabel = document.getElementById("selectedLeagueLabel");

    let currentLeagueName = null;

    const openModal = (leagueName) => {
        currentLeagueName = leagueName;
        selectedLeagueLabel.textContent = `"${leagueName}"`;
        modal.classList.add("active");
        backdrop.classList.add("active");
    };

    const closeModal = () => {
        modal.classList.remove("active");
        backdrop.classList.remove("active");
        currentLeagueName = null;
        selectedLeagueLabel.textContent = "";
    };

    // Abrir modal
    manageButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            const leagueName = button.dataset.leagueName?.trim()
                || e.target.closest("tr")?.querySelector("td:nth-child(2)")?.textContent.trim();

            if (!leagueName) return;
            openModal(leagueName);
        });
    });

    // Cerrar con X
    closeBtn.addEventListener("click", closeModal);

    // Cerrar clic en backdrop
    backdrop.addEventListener("click", (evt) => {
        if (evt.target === backdrop) closeModal();
    });

    // DELETE
    deleteBtn.addEventListener("click", async () => {
        if (!currentLeagueName) return;
        if (!confirm(`Are you sure you want to delete "${currentLeagueName}"?`)) return;

        try {
            const res = await fetch("/leagues/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken
                },
                body: JSON.stringify({ leagueName: currentLeagueName })
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
});
