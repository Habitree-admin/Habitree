const { response } = require('express');
const Mission = require('../../models/Missions/Missions.model');
const Reward = require('../../models/Rewards/Rewards.model');

exports.getMissions = async (req, res) => {
    try {
        const missionsResult = await Mission.fetchAll();
        const rewardsResult = await Reward.fetchAll();
        const missions = missionsResult[0];
        const rewards = rewardsResult[0];
        res.render('../views/Missions/missions', { title: 'Missions', missions, rewards, csrfToken: req.csrfToken()});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading missions');
    }
};

exports.postMissions = async(req,res,next) => {
    try {
        const addMissions = new Mission (
            req.body.IDMission,
            req.body.responseVerification,
            req.body.category,
            req.body.description,
            new Date(),
            req.body.available,
            req.body.experience,
            req.body.value || 0
        );
        const result = await addMissions.save();
        // Si se envió reward, asignarla en missionRewards
        const rewardId = req.body.reward || null;
        // Si IDMission fue provisto y la tabla usa ese ID, usamos ese; si la BD autoincrementa, podríamos usar result[0].insertId
        const missionId = req.body.IDMission || (result && result[0] && result[0].insertId);
        if (missionId) {
            await Mission.setRewardForMission(missionId, rewardId);
        }
        res.redirect('/missions');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating mission');
    }
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
        const missionRow = mission[0][0];
        // Buscar reward asociado (si existe)
        const rewardRes = await Reward.fetchAll();
        // buscar en missionRewards
        const mr = await require('../../util/database').execute('SELECT IDReward FROM missionRewards WHERE IDMission = ?', [req.params.id]);
        if (mr && mr[0] && mr[0][0]) {
            missionRow.assignedReward = mr[0][0].IDReward;
        } else {
            missionRow.assignedReward = null;
        }
        res.json(missionRow);
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
        // incluir valor si se agrega
        data.value = req.body.value || 0;
        const result = await Mission.update(id, data);
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Mission not found' });
        }
        const rewardId = req.body.reward || null;
        await Mission.setRewardForMission(id, rewardId);
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