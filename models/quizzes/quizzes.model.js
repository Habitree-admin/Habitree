const db = require('../../util/database');

module.exports = class Quiz {
    constructor(responseVerification, category, description, dateOfCreation, available, experience) {
        this.responseVerification = responseVerification || 1;
        this.category = category;
        this.description = description;
        this.dateOfCreation = dateOfCreation;
        this.available = available || 1;
        this.experience = experience;
    }

    save() {
        return db.execute(
            'INSERT INTO quiz (responseVerification, category, description, dateOfCreation, available, experience) VALUES (?, ?, ?, ?, ?, ?)',
            [this.responseVerification, this.category, this.description, this.dateOfCreation, this.available, this.experience]
        );
    }

    static fetchAll() {
        return db.execute(`
            SELECT q.IDQuiz, q.description, q.category, q.available, q.experience, 
            COALESCE(GROUP_CONCAT(
                CONCAT(ques.question, ' - Correct: ', ques.answer, 
                CASE WHEN ques.wrongAnswers IS NOT NULL 
                    THEN CONCAT(' - Wrong: ', ques.wrongAnswers)
                    ELSE ''
                END)
            SEPARATOR '; '), 'No hay preguntas') AS questions 
            FROM quiz q 
            LEFT JOIN question ques ON q.IDQuiz = ques.IDQuiz 
            GROUP BY q.IDQuiz, q.description, q.category, q.available, q.experience 
            ORDER BY q.IDQuiz`
        );
    }

    static findById(id) {
        return db.execute(
            `SELECT q.*, ques.IDQuestion, ques.question, ques.answer, ques.wrongAnswers 
             FROM quiz q 
             LEFT JOIN question ques ON q.IDQuiz = ques.IDQuiz 
             WHERE q.IDQuiz = ?`,
            [id]
        );
    }

    static update(id, quizData) {
        return db.execute(
            'UPDATE quiz SET category = ?, description = ?, available = ?, experience = ? WHERE IDQuiz = ?',
            [quizData.category, quizData.description, quizData.available, quizData.experience, id]
        );
    }
}
