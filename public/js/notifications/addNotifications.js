/**
 * 
 * This function allows the administrator to open a form to create a new notification
 * 
 * This function on the code manage the fetching and display of the Add modal
 * 
**/

document.addEventListener("click", (event) => {
    // Search the Add button in the header__button class
    const addBtn = event.target.closest(".header__button");
    if (!addBtn) return; // If its not the Add button -> exit the function

    // Make the request to get the add modal content
    fetch(`/notifications/add-modal`)
        // Verify that the response is correctly
        .then(res => {
            if (!res.ok) {
                throw new Error("Error al obtener el modal de agregar notificación");
            }
            return res.text();
        })
        // If the response is correct -> process the HTML
        .then(html => {
            // STEP 1: Insert the HTML into the modal-root that is dynamic
            const modalRoot = document.getElementById("modal-root");
            if (modalRoot) {
                modalRoot.innerHTML = html;
            } else {
                console.error("No se encontró el elemento #modal-root.");
                return;
            }

            // STEP 2: The add modal is already deployed, now select the modal and backdrop
            // to manipulate its visibility and add closing functionality
            const modal = modalRoot.querySelector(".modal");
            const backdrop = document.getElementById("backdrop");

            // STEP 3: Verify that both elements exist
            if (modal && backdrop) {
                // Show the modal
                modal.classList.add("active");
                backdrop.classList.add("active");

                // STEP 4: Create an event listeners to close the modal
                const closeModalBtn = modal.querySelector(".close-modal");
                if (closeModalBtn) {
                    closeModalBtn.onclick = () => {
                        modal.classList.remove("active");
                        backdrop.classList.remove("active");
                    };
                }

                // STEP 5: Close the modal if clicking on the backdrop
                backdrop.onclick = (event) => {
                    if (event.target === backdrop) {
                        modal.classList.remove("active");
                        backdrop.classList.remove("active");
                    }
                };
            // If the elements are not found -> show an error in console
            } else {
                console.error("Error: Modal o backdrop no encontrados.");
            }
        })
        .catch(err => {
            console.error(err);
            alert("There was an error loading the add notification modal. Please try again.");
        });
});