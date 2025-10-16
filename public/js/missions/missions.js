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
    form.IDMission.removeAttribute("readonly");
    document.getElementById("id-readonly-msg").style.display = "none";
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
                form.IDMission.value = mission.IDMission;
                form.responseVerification.value = mission.responseVerification;
                const radios = document.querySelectorAll('input[name="category"]');
                radios.forEach(r => { r.checked = (r.value === mission.category); });
                form.description.value = mission.description;
                form.available.value = mission.available;
                form.experience.value = mission.experience;
                form.value.value = mission.value || '';
                if (mission.assignedReward) {
                    try { rewardSelect.value = mission.assignedReward; } catch(e){}
                } else { rewardSelect.value = '' }
                updateUnitForCategory(mission.category);
                modalTitle.textContent = "Edit Mission";
                form.action = `/missions/edit/${mission.IDMission}`;
                modal.classList.add("open");
                editMode = true;
                currentMissionId = mission.IDMission;
                form.IDMission.setAttribute("readonly", true);
                document.getElementById("id-readonly-msg").style.display = "inline";
                document.getElementById("delete-btn").style.display = "inline-block";
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
document.getElementById('delete-btn').addEventListener('click', function() {
    if (confirm('¿Seguro que quieres eliminar esta misión?')) {
        const missionId = document.getElementById('id').value;
        const csrfToken = document.querySelector('input[name="_csrf"]').value;
        fetch(`/missions/${missionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            }
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message || 'Misión eliminada');
            setTimeout(() => { window.location.reload(); }, 1200);
        })
        .catch(err => {
            showMessage('Error eliminando misión', true);
            console.error(err);
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