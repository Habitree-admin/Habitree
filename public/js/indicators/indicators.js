// public/js/indicators/indicators.js

console.log('🚀 Script indicators.js cargado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOMContentLoaded ejecutado');
    
    // Leer datos del atributo data
    const dataElement = document.getElementById('indicatorsData');
    
    if (!dataElement) {
        console.log('❌ No data element found');
        return;
    }
    
    let globalData;
    try {
        const dataAttr = dataElement.getAttribute('data-indicators');
        console.log('📄 Data attribute:', dataAttr);
        globalData = JSON.parse(dataAttr);
        console.log('📊 Global data parsed:', globalData);
    } catch (e) {
        console.error('❌ Error parsing JSON:', e);
        return;
    }
    
    if (!globalData || globalData.length === 0) {
        console.log('❌ No global data available for chart');
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<p class="no-data">No data available for chart</p>';
        }
        return;
    }
    
    const labels = globalData.map(item => item.category.charAt(0).toUpperCase() + item.category.slice(1));
    const values = globalData.map(item => item.totalValue);
    
    console.log('📊 Labels:', labels);
    console.log('📊 Values:', values);
    
    // Colores por categoría
    
    const colors = {
        awareness: '#4DD4AC',
        transport: '#5B9FD8',
        water: '#4A90E2',
        waste: '#E07856',
        energy: '#F5C563',
        consumption: '#D8669B'
    };
    
    const backgroundColors = globalData.map(item => colors[item.category] || '#95a5a6');
    
    const ctx = document.getElementById('impactChart');
    
    if (!ctx) {
        console.log('❌ Canvas element not found');
        return;
    }
    
    console.log('✅ Creating chart...');
    
    const impactChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Impact Value',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(c => c),
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            family: "'Instrument Sans', sans-serif"
                        },
                        color: '#0b2f1f'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 47, 31, 0.9)',
                    titleFont: {
                        size: 14,
                        family: "'Instrument Sans', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Instrument Sans', sans-serif"
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const category = globalData[context.dataIndex].category;
                            let unit = '';
                            
                            if (category === 'water') unit = ' liters saved';
                            else if (category === 'energy') unit = ' watts saved';
                            else if (category === 'transport') unit = ' kg CO₂ saved';
                            else if (category === 'waste') unit = ' kg recycled';
                            else if (category === 'consumption') unit = ' items reduced';
                            else if (category === 'awareness') unit = ' actions taken';
                            
                            return context.parsed.y + unit;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12,
                            family: "'Instrument Sans', sans-serif"
                        },
                        color: '#0b2f1f'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12,
                            family: "'Instrument Sans', sans-serif"
                        },
                        color: '#0b2f1f'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    console.log('✅ Chart created successfully!');

    console.log('✅ Chart created successfully!');
    
    // ====== GRÁFICA DE RADAR ======
    console.log('📊 Creating radar chart...');
    
    let metricsData;
    try {
        const metricsAttr = dataElement.getAttribute('data-metrics');
        console.log('📄 Metrics attribute:', metricsAttr);
        metricsData = JSON.parse(metricsAttr);
        console.log('📊 Metrics data parsed:', metricsData);
    } catch (e) {
        console.error('❌ Error parsing metrics JSON:', e);
        return;
    }
    
    if (!metricsData || metricsData.length === 0) {
        console.log('❌ No metrics data available for radar chart');
        return;
    }
    
    const radarLabels = metricsData.map(item => item.category.charAt(0).toUpperCase() + item.category.slice(1));
    const radarValues = metricsData.map(item => item.totalMissions);
    
    const radarCtx = document.getElementById('radarChart');
    
    if (!radarCtx) {
        console.log('❌ Radar canvas element not found');
        return;
    }
    
    const radarChart = new Chart(radarCtx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: radarLabels,
            datasets: [{
                label: 'Mission Completion',
                data: radarValues,
                backgroundColor: 'rgba(77, 212, 172, 0.2)',
                borderColor: '#4DD4AC',
                borderWidth: 2,
                pointBackgroundColor: '#4DD4AC',
                pointHoverBorderColor: '#4DD4AC',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Instrument Sans', sans-serif"
                        },
                        color: '#0b2f1f',
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: 'rgba(11, 47, 31, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(11, 47, 31, 0.1)'
                    },
                    pointLabels: {
                        font: {
                            size: 13,
                            family: "'Instrument Sans', sans-serif"
                        },
                        color: '#0b2f1f'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            family: "'Instrument Sans', sans-serif"
                        },
                        color: '#0b2f1f'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 47, 31, 0.9)',
                    titleFont: {
                        size: 14,
                        family: "'Instrument Sans', sans-serif"
                    },
                    bodyFont: {
                        size: 13,
                        family: "'Instrument Sans', sans-serif"
                    },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    console.log('✅ Radar chart created successfully!');
});
