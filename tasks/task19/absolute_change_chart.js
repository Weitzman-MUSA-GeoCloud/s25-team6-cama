// absolute_change_chart.js

async function drawAbsoluteChangeChart() {
    const [currentResponse, priorResponse] = await Promise.all([
      fetch('https://storage.googleapis.com/musa5090s25-team6-public/configs/current_assessment_bins.json'),
      fetch('https://storage.googleapis.com/musa5090s25-team6-public/configs/tax_year_assessment_bins.json')
    ]);
  
    const currentData = await currentResponse.json();
    const priorData = await priorResponse.json();
  
    const binLabels = [
      '$0–10K', '$10K–20K', '$20K–30K', '$30K–35K', '$35K–40K', '$40K–45K', '$45K–50K', '$50K–55K', '$55K–60K',
      '$60K–100K', '$100K–150K', '$150K–200K', '$200K–250K', '$250K–300K', '$300K–350K', '$350K–400K',
      '$400K–800K', '$800K–1M', '$1M–3M', '$3M–5M', '$5M–10M', '$10M–15M', '$15M–20M', '$20M–30M', 'Above $30M'
    ];
    const groupedCurrent = {};
    const groupedPrior = {};
  
    binLabels.forEach(label => {
      groupedCurrent[label] = 0;
      groupedPrior[label] = 0;
    });
  
    // Group Current Data
    currentData.forEach(d => {
      const lower = d.lower_bound;
      const count = d.property_count;
      const label = getBinLabel(lower);
      if (label) groupedCurrent[label] += count;
    });
  
    // Group Prior Data
    priorData.forEach(d => {
      const lower = d.lower_bound;
      const count = d.property_count;
      const label = getBinLabel(lower);
      if (label) groupedPrior[label] += count;
    });
  
    // Calculate Absolute Change
    const absoluteChanges = binLabels.map(label => groupedCurrent[label] - groupedPrior[label]);
  
    const options = {
      chart: {
        type: 'line',
        height: 400,
        toolbar: { show: false }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      markers: {
        size: 4,
        colors: ['blue'],
        strokeColors: '#fff',
        strokeWidth: 2
      },
      series: [{
        name: 'Absolute Change',
        data: absoluteChanges
      }],
      xaxis: {
        categories: binLabels,
        labels: { rotate: -45 },
        title: { text: 'Assessment Value Range' }
      },
      yaxis: {
        title: { text: 'Change in Number of Properties' }
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return val.toLocaleString();
          }
        }
      },
      title: {
        text: 'Absolute Change in Property Counts (Custom Grouping)',
        align: 'center'
      }
    };
  
    const chart = new ApexCharts(document.querySelector("#chart-absolute-change"), options);
    chart.render();
  }
  
  // Helper to assign bin labels
  function getBinLabel(lower) {
    if (lower < 10000) return '$0–10K';
    if (lower < 20000) return '$10K–20K';
    if (lower < 30000) return '$20K–30K';
    if (lower < 35000) return '$30K–35K';
    if (lower < 40000) return '$35K–40K';
    if (lower < 45000) return '$40K–45K';
    if (lower < 50000) return '$45K–50K';
    if (lower < 55000) return '$50K–55K';
    if (lower < 60000) return '$55K–60K';
    if (lower < 100000) return '$60K–100K';
    if (lower < 150000) return '$100K–150K';
    if (lower < 200000) return '$150K–200K';
    if (lower < 250000) return '$200K–250K';
    if (lower < 300000) return '$250K–300K';
    if (lower < 350000) return '$300K–350K';
    if (lower < 400000) return '$350K–400K';
    if (lower < 800000) return '$400K–800K';
    if (lower < 1000000) return '$800K–1M';
    if (lower < 3000000) return '$1M–3M';
    if (lower < 5000000) return '$3M–5M';
    if (lower < 10000000) return '$5M–10M';
    if (lower < 15000000) return '$10M–15M';
    if (lower < 20000000) return '$15M–20M';
    if (lower < 30000000) return '$20M–30M';
    return 'Above $30M';
  }
  
  document.addEventListener('DOMContentLoaded', drawAbsoluteChangeChart);
  