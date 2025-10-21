const { response } = require('express');
const Mission = require('../../models/Missions/Missions.model');


/**
 * Retrieves all missions from the database and renders the missions view.
 */
exports.getMissions = async (req, res) => {
    const missions = await Mission.fetchAll();
    res.render('../views/Missions/missions', { title: 'Missions', missions, csrfToken: req.csrfToken()});
};

exports.postMissions = async(req,res,next) => {

    const addMissions = new Mission (
        req.body.IDMission, 
        req.body.responseVerification,
        req.body.category,
        req.body.description,
        new Date(),
        req.body.available,
        req.body.experience,
    ); 
    addMissions.save()
        .then(() => {
            res.redirect('/missions');
    })
    .catch(err => console.log(err));
}

/**
 * Devuelve los datos de una misión por ID (para edición).
 */
exports.getMissionById = async (req, res) => {
    try {
        const mission = await Mission.fetchById(req.params.id);
        if (mission[0].length === 0) {
            return res.status(404).json({ error: 'Mission not found' });
        }
        res.json(mission[0][0]);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching mission' });
    }
};

/**
 * Edita una misión existente.
 */
exports.editMission = async (req, res) => {
    try {
        const id = req.params.id;
        const data = {
            responseVerification: req.body.responseVerification,
            category: req.body.category,
            description: req.body.description,
            available: req.body.available,
            experience: req.body.experience
        };
        const result = await Mission.update(id, data);
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Mission not found' });
        }
        res.json({ success: true, message: 'Mission updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating mission' });
    }
};

/**
 * Elimina una misión por su ID.
 */

exports.deleteMission = async (req, res) => {
    try {
        const id = req.params.id;
        // Borrado logico para actualizar a 0
        const result = await Mission.update(id, { available: 0 });
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Mission not found' });
        }
        res.json({ success: true, message: 'Mission deleted (logical) successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting mission' });
    }
};