//FUNCIÓN PARA CREAR POP UP

const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const modal = document.getElementById("modal");
const form = modal.querySelector("form");
const modalTitle = modal.querySelector(".modal-title");
let editMode = false;
let currentMissionId = null;

const valueInput = document.getElementById('value');
const valueUnit = document.getElementById('value-unit');
const rewardSelect = document.getElementById('reward');

function updateUnitForCategory(cat) {
    switch(cat) {
        case 'water':
            valueUnit.textContent = 'liters';
            break;
        case 'energy':
            valueUnit.textContent = 'watts';
            break;
        case 'transport':
            valueUnit.textContent = 'CO2';
            break;
        case 'waste':
            valueUnit.textContent = 'kg';
            break;
        default:
            valueUnit.textContent = 'points';
    }
}

openBtn.addEventListener("click", () => {
    modal.classList.add("open");
    modalTitle.textContent = "Add Mission";
    form.action = "/missions";
    form.reset();
    editMode = false;
    currentMissionId = null;
    const idMsg = document.getElementById("id-readonly-msg");
    if (idMsg) idMsg.style.display = "none";
    document.getElementById("delete-btn").style.display = "none";
    document.getElementById("add-edit-btn").textContent = "Add";
    // reset unit
    updateUnitForCategory('');
});

closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
});

// Cerrar al hacer clic fuera del modal
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("open");
    }
});

// Abrir pop-up en modo edición al hacer clic en el botón Manage
document.querySelectorAll(".table__button").forEach(btn => {
    btn.addEventListener("click", function(e) {
        const row = e.target.closest("tr");
        const cells = row.querySelectorAll("td");
        const missionId = cells[0].textContent;
        // Obtener datos actualizados desde el backend por AJAX
        fetch(`/missions/${missionId}`)
            .then(res => res.json())
            .then(mission => {
                form.responseVerification.value = mission.responseVerification ? 1 : 0;
                const categorySelect = document.getElementById('category');
                if (categorySelect) categorySelect.value = mission.category;

                form.description.value = mission.description;
                form.available.value = mission.available ? 1 : 0;
                form.experience.value = mission.experience;
                if (form.value) form.value.value = mission.value || 0;

                if (mission.assignedReward) {
                    try { rewardSelect.value = mission.assignedReward; } catch(e){}
                } else {
                    rewardSelect.value = '';
                }

                updateUnitForCategory(mission.category);

                modalTitle.textContent = "Edit Mission";
                form.action = `/missions/edit/${mission.IDMission}`;
                modal.classList.add("open");
                editMode = true;
                currentMissionId = mission.IDMission;

                const delBtn = document.getElementById("delete-btn");
                if (delBtn) delBtn.style.display = "inline-block";
                document.getElementById("add-edit-btn").textContent = "Edit";
            })
            .catch(() => {
                showMessage("Error loading mission data", true);
            });
    });
});

// Mostrar mensajes en el pop-up
function showMessage(msg, isError = false) {
    const msgDiv = document.getElementById("form-message");
    msgDiv.textContent = msg;
    msgDiv.style.display = "block";
    msgDiv.style.color = isError ? "red" : "green";
    setTimeout(() => { msgDiv.style.display = "none"; }, 3000);
}

// Interceptar el submit en modo edición para enviar por AJAX
form.addEventListener("submit", function(e) {
    if (editMode) {
        e.preventDefault();
        const data = {
            responseVerification: form.responseVerification.value,
            category: form.category.value,
            description: form.description.value,
            available: form.available.value,
            experience: form.experience.value
        };
        // incluye reward si existe
        data.value = form.value ? form.value.value : 0;
        data.reward = form.reward ? form.reward.value : null;
        fetch(`/missions/edit/${currentMissionId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": form._csrf.value
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                showMessage(result.message);
                setTimeout(() => { window.location.reload(); }, 1200);
            } else {
                showMessage(result.message, true);
            }
        })
        .catch(() => {
            showMessage("Error updating mission", true);
        });
    }
    // Si no está en modo edición, el submit normal agrega misión
});

// Manejar eliminación de misión
document.getElementById('delete-btn').addEventListener('click', function () {
    if (!currentMissionId) {
        showMessage('No mission selected', true);
        return;
    }

    if (confirm('¿Seguro que quieres eliminar esta misión?')) {
        const csrfToken = document.querySelector('input[name="_csrf"]').value;

        fetch(`/missions/${currentMissionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'csrf-token': csrfToken
            }
        })
            .then(async (res) => {
                if (!res.ok) {
                    const txt = await res.text().catch(() => '');
                    throw new Error(`DELETE /missions/${currentMissionId} -> ${res.status} ${res.statusText} ${txt}`);
                }
                return res.json();
            })
            .then((data) => {
                showMessage(data.message || 'Misión eliminada');
                setTimeout(() => { window.location.reload(); }, 1200);
            })
            .catch((err) => {
                console.error(err);
                showMessage('Error eliminando misión', true);
            });
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const categorySelect = document.getElementById("category");
    const valueUnit = document.getElementById("value-unit");
    const valueHelp = document.getElementById("value-help");

    function updateUnit() {
        const selected = categorySelect.value;
        let unit = "points";

        switch (selected) {
            case "water":
                unit = "lt";
                break;
            case "energy":
                unit = "watts";
                break;
            case "waste":
                unit = "kg";
                break;
            case "transport":
                unit = "CO₂";
                break;
            default:
                unit = "points";
        }

        valueUnit.textContent = unit;
        valueHelp.textContent = `Units depend on mission type (water=lt, energy=watts, transport=CO₂, waste=kg, others=points)`;
    }

    // Actualiza al cargar y cuando cambie el valor
    categorySelect.addEventListener("change", updateUnit);
    updateUnit();
});