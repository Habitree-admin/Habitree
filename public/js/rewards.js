// rewards.js
document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openModal");
  const modal   = document.getElementById("modal");
  const closeBtn= document.getElementById("closeModal");

  if (!openBtn || !modal || !closeBtn) {
    console.error("Faltan elementos del modal (openModal / modal / closeModal). Revisa rewards.ejs");
    return;
  }

  // Abrir modal Add y resetear el form
  openBtn.addEventListener("click", () => {
    const form = modal.querySelector("form");
    if (form) {
      form.reset();
      form.action = "/rewards";
      const addBtn = document.getElementById("add-edit-btn");
      if (addBtn) addBtn.textContent = "Add";
    }
    modal.classList.add("open");
  });

  // Cerrar con la X
  closeBtn.addEventListener("click", () => modal.classList.remove("open"));

  // Cerrar al hacer click fuera del contenido
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
});
