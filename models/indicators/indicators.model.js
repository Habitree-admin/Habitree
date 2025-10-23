const db = require('../../util/database');

// Clase Indicator
module.exports = class Indicator {

    /**
     * Returns all the indicators for user and category 
     * @returns {Promise}
     */
    static async fetchAll() {
        const [rows] = await db.execute(
            `
            SELECT 
                u.IDUser,
                u.name AS userName,
                u.email,
                m.category,
                COUNT(um.IDMission) AS missionCount,
                SUM(m.value) AS totalValue,
                SUM(m.experience) AS totalExperience
            FROM 
                user u
            INNER JOIN 
                userMissions um ON u.IDUser = um.IDUser
            INNER JOIN 
                mission m ON um.IDMission = m.IDMission
            WHERE 
                um.status = 1
                AND u.deleted = 0
                AND m.available = 1
            GROUP BY 
                u.IDUser, 
                u.name, 
                u.email, 
                m.category
            ORDER BY 
                u.IDUser, 
                m.category
            `
        );

        // Groups for user
        const usersMap = {};

        rows.forEach(row => {
            const userId = row.IDUser;
            
            if (!usersMap[userId]) {
                usersMap[userId] = {
                    IDUser: row.IDUser,
                    userName: row.userName,
                    email: row.email,
                    categories: [],
                    totals: {
                        totalMissions: 0,
                        totalValue: 0,
                        totalExperience: 0
                    }
                };
            }

            // Converts to numbers using Number() or parseInt()
            const missionCount = parseInt(row.missionCount) || 0;
            const totalValue = parseInt(row.totalValue) || 0;
            const totalExperience = parseInt(row.totalExperience) || 0;

            usersMap[userId].categories.push({
                category: row.category,
                missionCount: missionCount,
                totalValue: totalValue,
                totalExperience: totalExperience
            });

            // Sum all the data
            usersMap[userId].totals.totalMissions += missionCount;
            usersMap[userId].totals.totalValue += totalValue;
            usersMap[userId].totals.totalExperience += totalExperience;
        });

        return Object.values(usersMap);
    }

    /**
 * Returns the global totlas data for category (all users summed)
 * @returns {Promise}
 */
static async fetchGlobalTotals() {
    const [rows] = await db.execute(
        `
        SELECT 
            m.category,
            COUNT(um.IDMission) AS totalMissions,
            SUM(m.value) AS totalValue,
            SUM(m.experience) AS totalExperience
        FROM 
            mission m
        INNER JOIN 
            userMissions um ON m.IDMission = um.IDMission
        INNER JOIN 
            user u ON um.IDUser = u.IDUser
        WHERE 
            um.status = 1
            AND u.deleted = 0
            AND m.available = 1
        GROUP BY 
            m.category
        ORDER BY 
            m.category
        `
    );

    return rows.map(row => ({
        category: row.category,
        totalMissions: parseInt(row.totalMissions) || 0,
        totalValue: parseInt(row.totalValue) || 0,
        totalExperience: parseInt(row.totalExperience) || 0
    }));
}

/**
 * Obtain metrics of impact for radar graph 
 * @returns {Promise}
 */
static async fetchImpactMetrics() {
    const [rows] = await db.execute(
        `
        SELECT 
            m.category,
            COUNT(DISTINCT um.IDUser) AS uniqueUsers,
            COUNT(um.IDMission) AS totalMissions,
            AVG(m.experience) AS avgExperience
        FROM 
            mission m
        INNER JOIN 
            userMissions um ON m.IDMission = um.IDMission
        INNER JOIN 
            user u ON um.IDUser = u.IDUser
        WHERE 
            um.status = 1
            AND u.deleted = 0
            AND m.available = 1
        GROUP BY 
            m.category
        ORDER BY 
            m.category
        `
    );

    return rows.map(row => ({
        category: row.category,
        uniqueUsers: parseInt(row.uniqueUsers) || 0,
        totalMissions: parseInt(row.totalMissions) || 0,
        avgExperience: parseFloat(row.avgExperience) || 0
    }));
}
};