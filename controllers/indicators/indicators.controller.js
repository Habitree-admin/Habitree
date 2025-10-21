const { response } = require('express');
const Indicator = require('../../models/indicators/indicators.model');

/**
 * Listar todos los indicadores
 */
exports.getIndicators = async (req, res) => {
    try {
        const indicators = await Indicator.fetchAll();
        const globalTotals = await Indicator.fetchGlobalTotals();
        const impactMetrics = await Indicator.fetchImpactMetrics();
        
        console.log('✅ Indicators:', indicators.length);
        console.log('✅ Global Totals:', globalTotals.length);
        console.log('✅ Impact Metrics:', impactMetrics.length);
        
        res.render('indicators/indicators', { 
            title: 'Indicators', 
            indicators: indicators,
            globalTotals: globalTotals,
            impactMetrics: impactMetrics,
            csrfToken: req.csrfToken() 
        });
    } catch (err) {
        console.error('❌ Error fetching indicators:', err);
        res.render('indicators/indicators', { 
            title: 'Indicators', 
            indicators: [],
            globalTotals: [],
            impactMetrics: [],
            csrfToken: req.csrfToken() 
        });
    }
};