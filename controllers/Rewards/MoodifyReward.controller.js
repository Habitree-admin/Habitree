const Reward = require('../../models/Rewards/ModifyReward.model');

/**
 * Obtener recompensa por ID (para mostrar en el modal de edición)
 */
exports.getRewardById = async (req, res) => {
  try {
    const id = req.params.id;
    const [reward] = await Reward.fetchById(id);
    if (!reward || reward.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    res.json(reward[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching reward' });
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
      return res.status(404).render("error", { message: "Reward not found" });
    }

    //  Redirigir directamente a la vista /rewards
    res.redirect("/rewards");

  } catch (err) {
    console.error(err);
    res.status(500).render("error", { message: "Error updating reward" });
  }
};
