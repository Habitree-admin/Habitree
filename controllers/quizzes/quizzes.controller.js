const Quiz = require('../../models/quizzes/quizzes.model');
const db = require('../../util/database');

/*
* Get all quizzes and render the quizzes page
* Error handling included
* Shows only unique quizzes based on IDQuiz
*/

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


/*
* Handle POST request to add a new quiz with questions
* Uses a transaction to ensure data integrity
* Error handling included
*/
exports.postAddQuiz = async (req, res) => {
    let connection;

    try {
        // Get database connection
        connection = await db.getConnection();
        await connection.beginTransaction();

        const { category, description, experience, questions } = req.body;
        const dateOfCreation = new Date().toISOString().slice(0, 10);

        // 1. Create the quiz
        const [quizResult] = await connection.execute(
            'INSERT INTO quiz (responseVerification, category, description, dateOfCreation, available, experience) VALUES (?, ?, ?, ?, ?, ?)',
            [1, category, description, dateOfCreation, 1, experience]
        );

        // 2. Get the ID of the newly created quiz
        const newQuizId = quizResult.insertId;

        // 3. Save the questions using the same connection
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


/*
* Get a quiz by its ID, including its questions
* Error handling included
*/
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

/*
* Update a quiz and its questions
* Inserts new questions after deleting existing ones
* Uses a transaction to ensure data integrity
* Error handling included
*/
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


