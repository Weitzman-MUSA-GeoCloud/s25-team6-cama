// percent_change_chart.js

async function drawPercentChangeChart() {
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
  
    currentData.forEach(d => {
      const lower = d.lower_bound;
      const count = d.property_count;
      const label = getBinLabel(lower);
      if (label) groupedCurrent[label] += count;
    });
  
    priorData.forEach(d => {
      const lower = d.lower_bound;
      const count = d.property_count;
      const label = getBinLabel(lower);
      if (label) groupedPrior[label] += count;
    });
  
    // Calculate Percent Change
    const percentChanges = binLabels.map(label => {
      const prior = groupedPrior[label];
      if (prior === 0) return 0;
      return parseFloat(((groupedCurrent[label] - prior) / prior * 100).toFixed(2));
    });
  
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
        colors: ['#FF4560'],
        strokeColors: '#fff',
        strokeWidth: 2
      },
      series: [{
        name: 'Percent Change (%)',
        data: percentChanges
      }],
      xaxis: {
        categories: binLabels,
        labels: { rotate: -45 },
        title: { text: 'Assessment Value Range' }
      },
      yaxis: {
        title: { text: 'Percent Change (%)' }
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return val.toFixed(2) + '%';
          }
        }
      },
      title: {
        text: 'Percent Change in Property Counts (Custom Grouping)',
        align: 'center'
      }
    };
  
    const chart = new ApexCharts(document.querySelector("#chart-percent-change"), options);
    chart.render();
  }
  
  document.addEventListener('DOMContentLoaded', drawPercentChangeChart);
  