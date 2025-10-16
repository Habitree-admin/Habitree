// rewards.js

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addRewardBtn");
  const modal = document.getElementById("rewardModal");
  const closeBtn = document.getElementById("closeRewardModal");

  if (!addBtn || !modal || !closeBtn) {
    console.error(" Faltan elementos en rewards.ejs (Add button o modal)");
    return;
  }

  //  Abrir modal
  addBtn.addEventListener("click", () => {
    modal.style.display = "flex"; // el modal se muestra en flex
  });

  //  Cerrar modal con la X
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  //  Cerrar modal si se hace clic en el fondo oscuro
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});