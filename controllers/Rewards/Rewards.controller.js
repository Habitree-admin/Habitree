const { response } = require('express');
const Reward = require('../../models/Rewards/Rewards.model');

/**
 * This function renders all the rewards information on the ejs view
 * 
 *  getRewards Retrieves all available rewards and renderize it in the route
 */
exports.getRewards = async (req, res) => {
    try {

        // Fetch all available rewards
        const [rewards] = await Reward.fetchAll();

        //Renders the information in the route 
        res.render('Rewards/rewards', { 
            title: 'Rewards', 
            rewards, 

             // CSRF protection for forms
            csrfToken: req.csrfToken() 
        });
    } catch (err) {

        // Handle database errors
        res.status(500).json({ error: 'Error fetching rewards' });
    }
};

/** 
 * Add new reward
 */
exports.postRewards = async (req, res) => {
    try {
        const addReward = new Reward(
            req.body.name,          
            req.body.description,
            req.body.type || "nonMonetary", // if it does not send
            req.body.available || 1,       // defect
            req.body.value
        );

        await addReward.save();
        res.redirect('/rewards');  //  return to list
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error saving reward' });
    }
};

/**
 * Collect reward for ID 
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
 * Edit existent reward
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
 * Delete reward for ID
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