const Quiz = require('../../models/quizzes/quizzes.model');
const db = require('../../util/database');

exports.getQuizzes = async (req, res) => {
    try {
        const [quizzes] = await Quiz.fetchAll();
        const uniqueQuizzes = Array.from(new Set(quizzes.map(q => q.IDQuiz)))
            .map(id => quizzes.find(q => q.IDQuiz === id));

        res.render('quizzes/quizzes.ejs', {
            title: 'Quizzes',
            quizzes: uniqueQuizzes,
            csrfToken: req.csrfToken()
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading quizzes');
    }
};

exports.postAddQuiz = async (req, res) => {
    let connection;

    try {
        // Obtener conexión con la base de datos
        connection = await db.getConnection();
        await connection.beginTransaction();

        const { category, description, experience, questions } = req.body;
        const dateOfCreation = new Date().toISOString().slice(0, 10);

        // 1. Crear el quiz
        const [quizResult] = await connection.execute(
            'INSERT INTO quiz (responseVerification, category, description, dateOfCreation, available, experience) VALUES (?, ?, ?, ?, ?, ?)',
            [1, category, description, dateOfCreation, 1, experience]
        );

        // 2. Obtener el ID del quiz recién creado
        const newQuizId = quizResult.insertId;

        // 3. Guardar las preguntas usando la misma conexión
        if (questions && questions.length > 0) {

            for (const questionData of questions) {
                await connection.execute(
                    'INSERT INTO question (IDQuiz, question, answer, wrongAnswers) VALUES (?, ?, ?, ?)',
                    [newQuizId, questionData.question, questionData.answer, questionData.wrongAnswers || null]
                );
            }
            console.log('Preguntas guardadas exitosamente');
        } else {
            console.log('No hay preguntas para guardar');
        }

        await connection.commit();
        console.log('Transacción completada exitosamente');

        res.status(200).json({
            success: true,
            message: 'Quiz and questions created successfully',
            quizId: newQuizId
        });
    } catch (error) {
        console.error('Error completo en postAddQuiz:', error);

        if (connection) {
            await connection.rollback();
            console.log('Transacción revertida');
        }

        res.status(500).json({
            success: false,
            message: 'Error creating quiz and questions: ' + error.message
        });
    } finally {
        if (connection) {
            connection.release();
            console.log('Conexión liberada');
        }
    }
};


exports.deleteQuiz = async (req, res) => {
    let connection;
    try {
        const quizId = req.params.id;

        connection = await db.getConnection();


        const [rows] = await connection.execute('SELECT available FROM quiz WHERE IDQuiz = ?', [quizId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }

        const isAvailable = rows[0].available;

        if (isAvailable === 0) {
            return res.json({
                success: false,
                message: "This quiz has already been deleted or is inactive."
            });
        }
        await connection.beginTransaction();

        // Eliminar primero las preguntas del quiz
        await connection.execute('DELETE FROM question WHERE IDQuiz = ?', [quizId]);

        // Luego el quiz
        await connection.execute('DELETE FROM quiz WHERE IDQuiz = ?', [quizId]);

        await connection.commit();

        res.json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            try {
                console.warn(`Quiz ${req.params.id} it is in use, updating 'available' to 0...`);
                await connection.execute('UPDATE quiz SET available = 0 WHERE IDQuiz = ?', [req.params.id]);
                await connection.commit();
                res.json({
                    success: true,
                    message: "Quiz deactivated (cannot be deleted because it is in use)"
                });
            } catch (updateError) {
                if (connection) await connection.rollback();
                res.status(500).json({ success: false, message: "Error updating quiz availability: " + updateError.message });
            }
        } else {
            if (connection) await connection.rollback();
            res.status(500).json({ success: false, message: "Error deleting quiz: " + error.message });
        }
    } finally {
        if (connection) connection.release();
    }
};


exports.getQuizById = async (req, res) => {
    try {
        const [quiz] = await Quiz.findById(req.params.id);
        if (quiz.length === 0) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const formattedQuiz = {
            ...quiz[0],
            questions: quiz.map(q => ({
                id: q.IDQuestion,
                question: q.question,
                answer: q.answer,
                wrongAnswers: q.wrongAnswers // Añadimos wrongAnswers aquí
            })).filter(q => q.id) // Filter out null questions
        };

        res.json({ success: true, quiz: formattedQuiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching quiz details' });
    }
};

exports.updateQuiz = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const quizId = req.params.id;
        const { category, description, experience, available, questions } = req.body;

        await Quiz.update(quizId, { category, description, experience, available });

        if (questions && questions.length > 0) {
            // Delete existing questions
            await connection.execute('DELETE FROM question WHERE IDQuiz = ?', [quizId]);

            // Insert new questions with wrongAnswers
            for (const questionData of questions) {
                await connection.execute(
                    'INSERT INTO question (IDQuiz, question, answer, wrongAnswers) VALUES (?, ?, ?, ?)',
                    [quizId, questionData.question, questionData.answer, questionData.wrongAnswers || null]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Quiz updated successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating quiz' });
    } finally {
        if (connection) connection.release();
    }
};

exports.deleteQuiz = async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const quizId = req.params.id;

        // Primero eliminar las preguntas asociadas
        await connection.execute('DELETE FROM question WHERE IDQuiz = ?', [quizId]);
        
        // Luego eliminar el quiz
        await connection.execute('DELETE FROM quiz WHERE IDQuiz = ?', [quizId]);

        await connection.commit();
        res.json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error(error);
        res.status(500).json({ success: false, message: 'Error deleting quiz' });
    } finally {
        if (connection) connection.release();
    }
};