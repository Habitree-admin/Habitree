document.addEventListener("click", (event) => {
    const manageBtn = event.target.closest(".manage-league-btn");
    if (!manageBtn) return;

    const fila = manageBtn.closest("tr");
    if (!fila) return;

    const leagueName = fila.cells[1].textContent.trim();
    const leagueLevel = fila.cells[2].textContent.trim();

    fetch(`/leagues/edit-modal?name=${leagueName}&level=${leagueLevel}`)
        .then(res => {
            if (!res.ok) throw new Error("Error al obtener el modal de edición");
            return res.text();
        })
        .then(html => {
            const modalRoot = document.getElementById("modal-root");
            if (modalRoot) {
                modalRoot.innerHTML = html;
            } else {
                console.error("No se encontró el elemento #modal-root.");
                return;
            }

            // Rellena los campos de ambos formularios
            document.getElementById("editLeagueNameA").value = leagueName;
            document.getElementById("editLeagueName").value = leagueName;
            document.getElementById("editLeagueNameA2").value = leagueName;
            document.getElementById("editLeagueLevel").value = leagueLevel;

            const modal = document.getElementById("manageLeagueModal");
            const backdrop = document.getElementById("backdrop");

            if (modal && backdrop) {
                modal.classList.add("active");
                backdrop.classList.add("active");

                document.getElementById("closeManageLeagueModal").onclick = () => {
                    modal.classList.remove("active");
                    backdrop.classList.remove("active");
                };

                backdrop.onclick = (event) => {
                    if (event.target === backdrop) {
                        modal.classList.remove("active");
                        backdrop.classList.remove("active");
                    }
                };
            }
        })
        .catch(err => {
            console.error(err);
            alert("There was an error loading the edit league modal. Please try again.");
        });
});
