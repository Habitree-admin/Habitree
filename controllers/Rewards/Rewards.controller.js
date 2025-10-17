const { response } = require('express');
const Reward = require('../../models/Rewards/Rewards.model');

/**
 * Listar todas las recompensas
 */
exports.getRewards = async (req, res) => {
    try {
        const [rewards] = await Reward.fetchAll();
        res.render('Rewards/rewards', { 
            title: 'Rewards', 
            rewards, 
            csrfToken: req.csrfToken() 
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching rewards' });
    }
};

/** Registrar nueva recompensa
 */
exports.postRewards = async (req, res) => {
    try {
        const addReward = new Reward(
            req.body.name,          // ahora sí coincide con form
            req.body.description,
            req.body.type || "nonMonetary", // por si no envías
            req.body.available || 1,       // por defecto disponible
            req.body.value
        );

        await addReward.save();
        res.redirect('/rewards');  // 👈 vuelve a la lista
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error saving reward' });
    }
};

/**
 * Obtener recompensa por ID
 */
exports.getRewardById = async (req, res) => {
    try {
        const id = req.params.id;
        const [reward] = await Reward.findById(id);
        if (!reward || reward.length === 0) {
            return res.status(404).json({ error: "Reward not found" });
        }
        res.json(reward[0]);
    } catch (err) {
        res.status(500).json({ error: "Error fetching reward" });
    }
};


/**
 * Editar recompensa existente
 */
exports.editReward = async (req, res) => {
    try {
        const id = req.params.id;
        const data = {
            name: req.body.name,
            description: req.body.description,
            type: req.body.type,
            available: req.body.available,
            value: req.body.value
        };

        const result = await Reward.update(id, data);
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reward not found' });
        }
        res.json({ success: true, message: 'Reward updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating reward' });
    }
};

/**
 * Eliminar recompensa por ID
 */
exports.deleteReward = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Reward.deleteRewardById(id);
        if (result[0].affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reward not found' });
        }
        res.json({ success: true, message: 'Reward deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting reward' });
    }
};