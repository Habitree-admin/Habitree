document.addEventListener("click", (event) => {
    // Busca el botón de la tabla que se ha clicado
    const boton = event.target.closest(".table__button");
    if (!boton) return; // Si no es un botón de la tabla, sal de la función

    const fila = boton.closest("tr");
    if (!fila) return;

    // Obtén el ID de la fila
    const id = fila.cells[0].textContent.trim();

    // Realiza la petición para obtener el contenido del modal
    fetch(`/notifications/edit/${id}`)
        .then(res => {
            if (!res.ok) {
                throw new Error("Error al obtener datos de la notificación");
            }
            return res.text();
        })
        .then(html => {
            // Paso 1: Inserta el HTML recibido en el modal-root
            const modalRoot = document.getElementById("modal-root");
            if (modalRoot) {
                modalRoot.innerHTML = html;
            } else {
                console.error("No se encontró el elemento #modal-root.");
                return;
            }

            // Paso 2: Ahora que el modal ya está en el DOM, busca los elementos
            const modal = modalRoot.querySelector(".modal");
            const backdrop = document.getElementById("backdrop");

            // Paso 3: Asegúrate de que los elementos se encontraron antes de manipularlos
            if (modal && backdrop) {
                // Muestra el modal con las clases correctas
                modal.classList.add("active");
                backdrop.classList.add("active");

                // Paso 4: Añade los event listeners para cerrar el modal
                const closeModalBtn = modal.querySelector(".close-modal");
                if (closeModalBtn) {
                    closeModalBtn.onclick = () => {
                        modal.classList.remove("active");
                        backdrop.classList.remove("active");
                    };
                }

                backdrop.onclick = (event) => {
                    // Solo cierra el modal si el clic se hizo directamente en el backdrop
                    if (event.target === backdrop) {
                        modal.classList.remove("active");
                        backdrop.classList.remove("active");
                    }
                };
                
                // También permite cerrar con la tecla Escape
                document.addEventListener("keydown", function escapeHandler(event) {
                    if (event.key === "Escape") {
                        modal.classList.remove("active");
                        backdrop.classList.remove("active");
                        document.removeEventListener("keydown", escapeHandler);
                    }
                });
                
            
            const deleteBtn = document.getElementById("delete-btn");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", () => {
                    // Obtenemos el texto del botón para determinar la acción
                    const actionText = deleteBtn.textContent.trim().toLowerCase();
                    
                    // Creamos el mensaje de confirmación de forma dinámica
                    const confirmationMessage = (actionText === 'deactivate')
                        ? "Are you sure you want to deactivate this notification?"
                        : "Are you sure you want to activate this notification?";

                    // Mostramos el mensaje de confirmación
                    if (confirm(confirmationMessage)) {
                        const deleteForm = document.getElementById("form-delete-notification");
                        if (deleteForm) {
                            // Obtenemos el estado actual del botón para saber si es 'Activate' o 'Deactivate'
                            const currentState = actionText;
                            
                            // Creamos un campo oculto para enviar el estado actual
                            const stateInput = document.createElement('input');
                            stateInput.type = 'hidden';
                            stateInput.name = 'currentState';
                            stateInput.value = currentState;
                            deleteForm.appendChild(stateInput);
                            
                            deleteForm.submit();
                        }
                    }
                });
            }
                
            } else {
                console.error("Error: Modal o backdrop no encontrados.");
            }
        })
        .catch(err => {
            console.error(err);
            alert("There was an error loading the notification. Please try again.");
        });
});