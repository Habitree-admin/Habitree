document.addEventListener("click", (event) => {
    // Busca el botón Add con clase header__button
    const addBtn = event.target.closest(".header__button");
    if (!addBtn) return; // Si no es el botón "Add", sal de la función

    // Realiza la petición para obtener el contenido del modal de agregar
    fetch(`/notifications/add-modal`)
        // Verifica que la respuesta sea correcta
        .then(res => {
            if (!res.ok) {
                throw new Error("Error al obtener el modal de agregar notificación");
            }
            return res.text();
        })
        // Si la respuesta es correcta procesa el HTML recibido
        .then(html => {
            // PASO 1: Inserta el HTML recibido en el modal-root que es dinamico
            const modalRoot = document.getElementById("modal-root");
            if (modalRoot) {
                modalRoot.innerHTML = html;
            } else {
                console.error("No se encontró el elemento #modal-root.");
                return;
            }

            // PASO 2: El modal add ya se desplego, ahora selecciona el modal y el backdrop
            // para manipular su visibilidad y añadir funcionalidad de cierre
            const modal = modalRoot.querySelector(".modal");
            const backdrop = document.getElementById("backdrop");

            // PASO 3: Verificar que ambos elementos existan
            if (modal && backdrop) {
                // Muestra el modal
                modal.classList.add("active");
                backdrop.classList.add("active");

                // PASO 4: Crear event listeners para cerrar el modal
                const closeModalBtn = modal.querySelector(".close-modal");
                if (closeModalBtn) {
                    closeModalBtn.onclick = () => {
                        modal.classList.remove("active");
                        backdrop.classList.remove("active");
                    };
                }

                // PAS 5: Cierra el modal si se hace clic en el backdrop
                backdrop.onclick = (event) => {
                    if (event.target === backdrop) {
                        modal.classList.remove("active");
                        backdrop.classList.remove("active");
                    }
                };
            // Si no se encuentran los elementos se muestra un error en consola
            } else {
                console.error("Error: Modal o backdrop no encontrados.");
            }
        })
        .catch(err => {
            console.error(err);
            alert("There was an error loading the add notification modal. Please try again.");
        });
});