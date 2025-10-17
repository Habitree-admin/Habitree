const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");
const modal = document.getElementById("modal");
const form = document.getElementById("quizForm");
const questionTypeSelect = document.getElementById("questionType");
const optionsContainer = document.getElementById("optionsContainer");
const questionInput = document.getElementById("questionText");

// Variables globales
let questionCounter = 0;
let isEditing = false;
let currentQuizId = null;

const manageModal = document.getElementById("manageModal");
const closeManageBtn = document.getElementById("closeManageModal");
const manageEditBtn = document.getElementById("manage-edit-btn");
const manageDeleteBtn = document.getElementById("manage-delete-btn");

// Modal control
openBtn.addEventListener("click", () => {
    console.log("Add new quiz");
    resetFormState(); // Limpiar completamente el estado
    modal.classList.add("open");
    initializeQuestionType();
});

closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("open");
    }
});

// Question type handling
function initializeQuestionType() {
    updateOptionsContainer(questionTypeSelect.value);
    questionTypeSelect.addEventListener('change', (e) => {
        updateOptionsContainer(e.target.value);
    });
}

function updateOptionsContainer(selectedType) {
    optionsContainer.innerHTML = '';

    switch(selectedType) {
        case 'Multiple Choice':
            optionsContainer.innerHTML = `
                <div class="option-input-group">
                    <input type="radio" name="correct_answer" value="Option 1">
                    <input type="text" placeholder="Option 1" class="smallInput option-text" value="Option 1">
                    <button type="button" class="remove-option">×</button>
                </div>
                <div class="option-input-group">
                    <input type="radio" name="correct_answer" value="Option 2">
                    <input type="text" placeholder="Option 2" class="smallInput option-text" value="Option 2">
                    <button type="button" class="remove-option">×</button>
                </div>
                <button type="button" class="add-option-btn">+ Add Option</button>
            `;
            setupMultipleChoiceHandlers();
            break;

        case 'True/False':
            optionsContainer.innerHTML = `
                <div class="option-input-group">
                    <input type="radio" name="correct_answer" value="true">
                    <label>True</label>
                </div>
                <div class="option-input-group">
                    <input type="radio" name="correct_answer" value="false">
                    <label>False</label>
                </div>
            `;
            break;
    }
}

// Modificar addNewOption para quitar required
function addNewOption() {
    const optionCount = optionsContainer.querySelectorAll('.option-input-group').length;
    const newOptionNumber = optionCount + 1;

    const newOption = document.createElement('div');
    newOption.className = 'option-input-group';
    newOption.innerHTML = `
        <input type="radio" name="correct_answer" value="Option ${newOptionNumber}">
        <input type="text" placeholder="Option ${newOptionNumber}" class="smallInput option-text" value="Option ${newOptionNumber}">
        <button type="button" class="remove-option">×</button>
    `;
    const addOptionBtn = optionsContainer.querySelector('.add-option-btn');
    optionsContainer.insertBefore(newOption, addOptionBtn);
    setupRemoveOptionListeners();
    setupOptionTextHandlers();
}

function setupMultipleChoiceHandlers() {
    const addOptionBtn = document.querySelector('.add-option-btn');
    if (addOptionBtn) {
        addOptionBtn.addEventListener('click', addNewOption);
    }
    setupRemoveOptionListeners();
    setupOptionTextHandlers();
}

function addNewOption() {
    const optionCount = optionsContainer.querySelectorAll('.option-input-group').length;
    const newOptionNumber = optionCount + 1;

    const newOption = document.createElement('div');
    newOption.className = 'option-input-group';
    newOption.innerHTML = `
        <input type="radio" name="correct_answer" value="Option ${newOptionNumber}">
        <input type="text" placeholder="Option ${newOptionNumber}" class="smallInput option-text" value="Option ${newOptionNumber}">
        <button type="button" class="remove-option">×</button>
    `;
    const addOptionBtn = optionsContainer.querySelector('.add-option-btn');
    optionsContainer.insertBefore(newOption, addOptionBtn);
    setupRemoveOptionListeners();
    setupOptionTextHandlers();
}

function setupRemoveOptionListeners() {
    const removeButtons = optionsContainer.querySelectorAll('.remove-option');
    removeButtons.forEach(button => {
        button.removeEventListener('click', handleRemoveOption);
        button.addEventListener('click', handleRemoveOption);
    });
}

function setupOptionTextHandlers() {
    const optionTexts = optionsContainer.querySelectorAll('.option-text');
    optionTexts.forEach((input, index) => {
        input.addEventListener('input', function() {
            const radio = this.previousElementSibling;
            radio.value = this.value;
        });
    });
}

function handleRemoveOption(event) {
    const optionsCount = optionsContainer.querySelectorAll('.option-input-group').length;
    if (optionsCount > 2) {
        event.target.closest('.option-input-group').remove();
    } else {
        alert('Must have at least 2 options');
    }
}

// Función para obtener la respuesta correcta seleccionada
function getCorrectAnswer() {
    const selectedRadio = optionsContainer.querySelector('input[name="correct_answer"]:checked');
    return selectedRadio ? selectedRadio.value : null;
}

// Función para obtener todas las preguntas y respuestas del formulario
function getQuestionsData() {
    const questionText = questionInput.value.trim();
    const questionType = questionTypeSelect.value;
    const correctAnswer = getCorrectAnswer();
    let wrongAnswers = [];

    if (questionType === 'Multiple Choice') {
        // Obtener todas las opciones que no son la respuesta correcta
        const optionTexts = document.querySelectorAll('.option-text');
        optionTexts.forEach(input => {
            if (input.value !== correctAnswer) {
                wrongAnswers.push(input.value);
            }
        });
    }

    if (!questionText || !correctAnswer) {
        return null;
    }

    return [{
        question: questionText,
        answer: correctAnswer,
        wrongAnswers: wrongAnswers.join(',')
    }];
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeQuestionType();
});

// Reemplazar los event listeners duplicados del botón manage con uno solo
document.querySelectorAll('.manage-button').forEach(button => {
    button.addEventListener('click', async (e) => {
        console.log("Edit existing quiz");
        const row = e.target.closest('tr');
        const quizId = row.cells[0].textContent;
        currentQuizId = quizId;
        isEditing = true;
        
        try {
            const response = await fetch(`/quizzes/${quizId}`);
            const data = await response.json();
            
            if (data.success) {
                // Actualizar UI para modo "Edit"
                document.getElementById('add-edit-btn').textContent = 'Update';
                document.querySelector('.modal-title').textContent = 'Edit Quiz';
                
                fillFormWithQuizData(data.quiz);
                modal.classList.add("open");
            }
        } catch (error) {
            console.error('Error fetching quiz details:', error);
            alert('Error loading quiz details');
        }
    });
});

function fillFormWithQuizData(quiz) {
    document.getElementById('category').value = quiz.category;
    document.getElementById('description').value = quiz.description;
    document.getElementById('experience').value = quiz.experience;
    document.getElementById('available').value = quiz.available;

    // Limpiar el contenedor de preguntas guardadas
    const savedQuestionsContainer = document.getElementById('savedQuestionsContainer');
    savedQuestionsContainer.innerHTML = '';

    // Mostrar las preguntas existentes
    if (quiz.questions && quiz.questions.length > 0) {
        quiz.questions.forEach((question, index) => {
            const wrongAnswersArray = question.wrongAnswers ? question.wrongAnswers.split(',') : [];
            const allAnswers = [question.answer, ...wrongAnswersArray];
            
            const questionDiv = document.createElement('div');
            questionDiv.className = 'saved-question';
            questionDiv.innerHTML = `
                <div class="question-header">
                    <h4>Question ${index + 1}</h4>
                    <div class="question-actions">
                        <button type="button" class="edit-question" onclick="editQuestion(this)">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button type="button" class="remove-question" onclick="removeQuestion(this)">×</button>
                    </div>
                </div>
                <p><strong>Question:</strong> ${question.question}</p>
                <p><strong>Correct Answer:</strong> ${question.answer}</p>
                <p><strong>Wrong Answers:</strong> ${question.wrongAnswers || 'None'}</p>
                <input type="hidden" class="question-type" value="${question.answer === 'true' || question.answer === 'false' ? 'True/False' : 'Multiple Choice'}">
            `;
            savedQuestionsContainer.appendChild(questionDiv);
        });
        questionCounter = quiz.questions.length;
    }

    // Limpiar el formulario de nueva pregunta
    document.getElementById('questionText').value = '';
    document.getElementById('questionType').value = 'Multiple Choice';
    updateOptionsContainer('Multiple Choice');
}

// Agregar función para editar pregunta
function editQuestion(button) {
    const questionDiv = button.closest('.saved-question');
    const questionText = questionDiv.querySelector('p:nth-child(2)').textContent.replace('Question: ', '');
    const answer = questionDiv.querySelector('p:nth-child(3)').textContent.replace('Correct Answer: ', '');
    const wrongAnswersText = questionDiv.querySelector('p:nth-child(4)').textContent.replace('Wrong Answers: ', '');
    const questionType = questionDiv.querySelector('.question-type').value;

    // Llenar el formulario
    document.getElementById('questionText').value = questionText;
    document.getElementById('questionType').value = questionType;
    updateOptionsContainer(questionType);

    if (questionType === 'Multiple Choice') {
        // Procesar respuestas incorrectas
        const wrongAnswers = wrongAnswersText === 'None' ? [] : wrongAnswersText.split(',').map(ans => ans.trim());
        const allAnswers = [answer, ...wrongAnswers];

        // Agregar opciones necesarias
        while (document.querySelectorAll('.option-input-group').length < allAnswers.length) {
            addNewOption();
        }

        // Actualizar valores y marcar respuesta correcta
        document.querySelectorAll('.option-text').forEach((input, index) => {
            if (index < allAnswers.length) {
                input.value = allAnswers[index];
                const radio = input.previousElementSibling;
                radio.value = allAnswers[index];
                if (allAnswers[index] === answer) {
                    radio.checked = true;
                }
            }
        });
    } else {
        // Para True/False
        const radios = document.querySelectorAll('input[name="correct_answer"]');
        radios.forEach(radio => {
            if (radio.value === answer) {
                radio.checked = true;
            }
        });
    }

    // Mostrar el formulario y cambiar el texto del botón
    const questionFormContainer = document.getElementById('questionFormContainer');
    questionFormContainer.style.display = 'block';
    document.getElementById('addQuestionBtn').style.display = 'none';

    // Remover la pregunta anterior
    questionDiv.remove();
    updateQuestionNumbers();
}

// Función para actualizar números de preguntas
function updateQuestionNumbers() {
    document.querySelectorAll('.saved-question').forEach((q, index) => {
        q.querySelector('h4').textContent = `Question ${index + 1}`;
    });
    questionCounter = document.querySelectorAll('.saved-question').length;
}

// Modificar addQuestionBtn event listener
addQuestionBtn.addEventListener('click', () => {
    const questionFormContainer = document.getElementById('questionFormContainer');
    questionFormContainer.style.display = 'block';
    document.getElementById('addQuestionBtn').style.display = 'none';
});

// Añadir event listener para el botón cancelar
document.getElementById('cancelQuestionBtn').addEventListener('click', () => {
    const questionFormContainer = document.getElementById('questionFormContainer');
    questionFormContainer.style.display = 'none';
    document.getElementById('addQuestionBtn').style.display = 'block';
    
    // Limpiar el formulario
    document.getElementById('questionText').value = '';
    const optionInputs = document.querySelectorAll('.option-text');
    optionInputs.forEach(input => input.value = '');
    const radios = document.querySelectorAll('input[name="correct_answer"]');
    radios.forEach(radio => radio.checked = false);
});

// Añadir event listener para el botón guardar
document.getElementById('saveQuestionBtn').addEventListener('click', () => {
    const questionText = document.getElementById('questionText').value.trim();
    const selectedAnswer = document.querySelector('input[name="correct_answer"]:checked');
    const questionType = document.getElementById('questionType').value;
    let wrongAnswers = [];
    
    if (!questionText) {
        alert('Please enter a question');
        return;
    }
    
    if (!selectedAnswer) {
        alert('Please select a correct answer');
        return;
    }

    if (questionType === 'Multiple Choice') {
        // Recolectar todas las respuestas que no son la correcta
        document.querySelectorAll('.option-text').forEach(input => {
            const value = input.value.trim();
            // Verificar que el input tenga un valor antes de procesarlo
            if (value && value !== selectedAnswer.value) {
                wrongAnswers.push(value);
            }
        });
    }

    // Guardar la pregunta en el contenedor de preguntas guardadas
    const savedQuestionsContainer = document.getElementById('savedQuestionsContainer');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'saved-question';
    questionDiv.innerHTML = `
        <div class="question-header">
            <h4>Question ${questionCounter + 1}</h4>
            <div class="question-actions">
                <button type="button" class="edit-question" onclick="editQuestion(this)">
                    <i class="fa fa-edit"></i>
                </button>
                <button type="button" class="remove-question" onclick="removeQuestion(this)">×</button>
            </div>
        </div>
        <p><strong>Question:</strong> ${questionText}</p>
        <p><strong>Correct Answer:</strong> ${selectedAnswer.value}</p>
        <p><strong>Wrong Answers:</strong> ${wrongAnswers.length > 0 ? wrongAnswers.join(', ') : 'None'}</p>
        <input type="hidden" class="question-type" value="${questionType}">
        <input type="hidden" class="wrong-answers" value="${wrongAnswers.join(',')}">
    `;
    
    savedQuestionsContainer.appendChild(questionDiv);
    questionCounter++;

    // Limpiar y ocultar el formulario
    document.getElementById('questionText').value = '';
    const optionInputs = document.querySelectorAll('.option-text');
    optionInputs.forEach(input => input.value = '');
    const radios = document.querySelectorAll('input[name="correct_answer"]');
    radios.forEach(radio => radio.checked = false);
    questionFormContainer.style.display = 'none';
    document.getElementById('addQuestionBtn').style.display = 'block';
});

// Agregar función para remover preguntas
function removeQuestion(button) {
    const questionDiv = button.closest('.saved-question');
    questionDiv.remove();
    // Actualizar los números de las preguntas restantes
    const questions = document.querySelectorAll('.saved-question');
    questions.forEach((q, index) => {
        q.querySelector('h4').textContent = `Question ${index + 1}`;
    });
    questionCounter--;
}

// Modificar getAllQuestionsData para incluir las preguntas guardadas
function getAllQuestionsData() {
    const questions = [];
    
    // Obtener preguntas guardadas
    document.querySelectorAll('.saved-question').forEach(questionDiv => {
        const questionText = questionDiv.querySelector('p:nth-child(2)').textContent.replace('Question: ', '').trim();
        const answer = questionDiv.querySelector('p:nth-child(3)').textContent.replace('Correct Answer: ', '').trim();
        const wrongAnswers = questionDiv.querySelector('p:nth-child(4)').textContent.replace('Wrong Answers: ', '').trim();
        
        questions.push({ 
            question: questionText, 
            answer: answer,
            wrongAnswers: wrongAnswers === 'None' ? '' : wrongAnswers
        });
    });

    // Obtener pregunta actual si existe
    const currentQuestionForm = document.getElementById('questionFormContainer');
    if (currentQuestionForm.style.display !== 'none') {
        const questionText = document.getElementById('questionText').value.trim();
        const questionType = document.getElementById('questionType').value;
        const selectedAnswer = document.querySelector('input[name="correct_answer"]:checked')?.value;
        
        if (questionText && selectedAnswer) {
            let wrongAnswers = [];
            if (questionType === 'Multiple Choice') {
                // Recolectar todas las respuestas que no son la correcta
                document.querySelectorAll('.option-text').forEach(input => {
                    if (input.value.trim() !== selectedAnswer) {
                        wrongAnswers.push(input.value.trim());
                    }
                });
            }
            
            questions.push({
                question: questionText,
                answer: selectedAnswer,
                wrongAnswers: wrongAnswers.join(',')
            });
        }
    }

    return questions;
}

// Modificar el event listener del formulario
form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const questionsData = getAllQuestionsData();
    if (questionsData.length === 0) {
        alert("Please add at least one question");
        return;
    }

    const formData = new FormData(form);
    const data = {
        category: formData.get('category'),
        description: formData.get('description'),
        experience: parseInt(formData.get('experience')),
        available: parseInt(formData.get('available')),
        questions: questionsData
    };

    const url = isEditing ? `/quizzes/${currentQuizId}` : '/quizzes';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': formData.get('_csrf')
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        loadingOverlay.style.display = 'none';

        if (responseData.success) {
            resetFormState();
            modal.classList.remove("open");
            location.reload();
        } else {
            alert(isEditing ? "Error updating quiz: " : "Error creating quiz: " + responseData.message);
        }
    } catch (error) {
        document.getElementById('loadingOverlay').style.display = 'none';
        alert("Error: " + error.message);
        console.error(error);
    }
});

closeManageBtn.addEventListener("click", () => {
    manageModal.classList.remove("open");
});

// Botón eliminar
manageDeleteBtn.addEventListener("click", () => {
    if (!currentQuizId) return;

    if (confirm("Are you sure you want to delete this quiz?")) {
        fetch(`/quizzes/${currentQuizId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": document.querySelector('input[name="_csrf"]').value
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (data.message.includes("desactivado")) {
                        alert("This quiz cannot be deleted because it's already used, but it has been disabled.");
                    } else {
                        alert("Quiz deleted successfully!");
                    }
                    manageModal.classList.remove("open");
                    setTimeout(() => location.reload(), 1000);
                } else {
                    if (data.message.includes("inactive") || data.message.includes("deleted")) {
                        alert("This quiz was already deleted previously.");
                    } else {
                        alert("Error deleting quiz: " + data.message);
                    }
                }
                manageModal.classList.remove("open");
                setTimeout(() => location.reload(), 1000);
            })
            .catch(err => {
                alert("Error deleting quiz: " + err.message);
                console.error(err);
            });
    }
});


manageEditBtn.addEventListener("click", () => {
    alert("Edit clicked for quiz ID: " + currentQuizId);

});

// Modificar el openBtn click handler
openBtn.addEventListener("click", () => {
    console.log("Add new quiz");
    resetFormState(); // Limpiar completamente el estado
    modal.classList.add("open");
    initializeQuestionType();
});

// Actualizar resetFormState para asegurar una limpieza completa
function resetFormState() {
    isEditing = false;
    currentQuizId = null;
    form.reset();
    questionCounter = 0;
    
    // Limpiar todos los campos del formulario
    document.getElementById('category').value = '';
    document.getElementById('description').value = '';
    document.getElementById('experience').value = '';
    document.getElementById('available').value = '1'; // Valor por defecto
    
    // Actualizar UI para modo "Add"
    document.getElementById('add-edit-btn').textContent = 'Add';
    document.querySelector('.modal-title').textContent = 'Add New Quiz';
    
    // Limpiar contenedor de preguntas guardadas
    const savedQuestionsContainer = document.getElementById('savedQuestionsContainer');
    if (savedQuestionsContainer) {
        savedQuestionsContainer.innerHTML = '';
    }
    
    // Resetear formulario de pregunta
    const questionFormContainer = document.getElementById('questionFormContainer');
    questionFormContainer.style.display = 'none';
    document.getElementById('addQuestionBtn').style.display = 'block';
    document.getElementById('questionText').value = '';
    document.getElementById('questionType').value = 'Multiple Choice';
    updateOptionsContainer('Multiple Choice');

    // Limpiar las opciones
    const optionInputs = document.querySelectorAll('.option-text');
    optionInputs.forEach(input => input.value = '');
    const radios = document.querySelectorAll('input[name="correct_answer"]');
    radios.forEach(radio => radio.checked = false);
}

// Modificar el closeBtn click handler
closeBtn.addEventListener("click", () => {
    resetFormState();
    modal.classList.remove("open");
});

// Modificar el window click handler
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        resetFormState();
        modal.classList.remove("open");
    }
});