// ModifyReward.js
document.addEventListener("DOMContentLoaded", () => {
  const tbody   = document.querySelector(".table-container tbody");
  const modal   = document.getElementById("modifyRewardModal");
  const closeBtn= document.getElementById("closeModifyRewardModal");
  const form    = document.getElementById("modifyRewardForm");

  if (!tbody || !modal || !closeBtn || !form) {
    console.error("Faltan elementos (tbody / modifyRewardModal / closeModifyRewardModal / modifyRewardForm).");
    return;
  }

  let prevStatus = null; 


   /**
   * Button  Manage (class .edit-btn)
  */
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button.edit-btn");
    if (!btn) return;

    const id = btn.dataset.id || btn.closest("tr")?.querySelector("td")?.textContent.trim();
    if (!id) {
      console.error("No se pudo obtener el ID de la fila.");
      return;
    }

    try {
      const response = await fetch(`/modify-reward/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`GET /modify-reward/${id} -> ${response.status}`);

      const reward = await response.json();

      // Fill ouut forms
      document.getElementById("editName").value        = reward.name ?? "";
      document.getElementById("editDescription").value = reward.description ?? "";
      document.getElementById("editType").value        = reward.type ?? "nonMonetary";
      document.getElementById("editValue").value       = reward.value ?? "";
      document.getElementById("editStatus").value      = reward.available ? "1" : "0";

      // Save preview state to confirm if changes to 0
      prevStatus = reward.available ? "1" : "0";

      // Action of form (POST)
      form.action = `/modify-reward/edit/${encodeURIComponent(reward.IDReward ?? id)}`;

      // Show modal
      modal.classList.add("open");
    } catch (err) {
      console.error("Error cargando recompensa:", err);
      alert("No se pudo cargar la recompensa.");
    }
  });

  // Confirm if is desactivated (to 1 -> 0)
  form.addEventListener("submit", (e) => {
    const editStatus = document.getElementById("editStatus");
    if (prevStatus !== "0" && editStatus.value === "0") {
      const ok = confirm("Are you sure you want to deactivate this reward? It will not be available to users and may be removed.");
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
        editStatus.value = prevStatus; 
      }
    }
  });

  // Close modal
  closeBtn.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
});
