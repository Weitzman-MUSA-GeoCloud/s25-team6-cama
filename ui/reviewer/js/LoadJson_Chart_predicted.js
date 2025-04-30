export async function drawPredictedAssessmentChart() {
  const response = await fetch('https://storage.googleapis.com/musa5090s25-team6-public/configs/current_assessment_bins.json');
  const rawData = await response.json();

  const groupedData = {
    '$0–10K': 0, '$10K–20K': 0, '$20K–30K': 0, '$30K–35K': 0, '$35K–40K': 0,
    '$40K–45K': 0, '$45K–50K': 0, '$50K–55K': 0, '$55K–60K': 0, '$60K–100K': 0,
    '$100K–150K': 0, '$150K–200K': 0, '$200K–250K': 0, '$250K–300K': 0,
    '$300K–350K': 0, '$350K–400K': 0, '$400K–800K': 0, '$800K–1M': 0,
    '$1M–3M': 0, '$3M–5M': 0, '$5M–10M': 0, '$10M–15M': 0,
    '$15M–20M': 0, '$20M–30M': 0, 'Above $30M': 0
  };

  rawData.forEach(d => {
    const lower = d.lower_bound;
    const count = d.property_count;

    if (lower < 10000) groupedData['$0–10K'] += count;
    else if (lower < 20000) groupedData['$10K–20K'] += count;
    else if (lower < 30000) groupedData['$20K–30K'] += count;
    else if (lower < 35000) groupedData['$30K–35K'] += count;
    else if (lower < 40000) groupedData['$35K–40K'] += count;
    else if (lower < 45000) groupedData['$40K–45K'] += count;
    else if (lower < 50000) groupedData['$45K–50K'] += count;
    else if (lower < 55000) groupedData['$50K–55K'] += count;
    else if (lower < 60000) groupedData['$55K–60K'] += count;
    else if (lower < 100000) groupedData['$60K–100K'] += count;
    else if (lower < 150000) groupedData['$100K–150K'] += count;
    else if (lower < 200000) groupedData['$150K–200K'] += count;
    else if (lower < 250000) groupedData['$200K–250K'] += count;
    else if (lower < 300000) groupedData['$250K–300K'] += count;
    else if (lower < 350000) groupedData['$300K–350K'] += count;
    else if (lower < 400000) groupedData['$350K–400K'] += count;
    else if (lower < 800000) groupedData['$400K–800K'] += count;
    else if (lower < 1000000) groupedData['$800K–1M'] += count;
    else if (lower < 3000000) groupedData['$1M–3M'] += count;
    else if (lower < 5000000) groupedData['$3M–5M'] += count;
    else if (lower < 10000000) groupedData['$5M–10M'] += count;
    else if (lower < 15000000) groupedData['$10M–15M'] += count;
    else if (lower < 20000000) groupedData['$15M–20M'] += count;
    else if (lower < 30000000) groupedData['$20M–30M'] += count;
    else groupedData['Above $30M'] += count;
  });

  const categories = Object.keys(groupedData);
  const counts = Object.values(groupedData);

  const options = {
    chart: {
      type: 'line',
      height: 450,
      toolbar: { show: false }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    markers: {
      size: 4,
      colors: ['#008FFB'],
      strokeColors: '#fff',
      strokeWidth: 2
    },
    series: [{
      name: 'Number of Properties',
      data: counts
    }],
    xaxis: {
      categories: categories,
      labels: {
        rotate: -45
      },
      title: {
        text: 'Assessment Value Range'
      }
    },
    yaxis: {
      title: {
        text: 'Number of Properties'
      },
      labels: {
        formatter: function(val) {
          if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + 'M';
          } else if (val >= 1000) {
            return (val / 1000).toFixed(0) + 'K';
          }
          return val;
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val.toLocaleString();
        }
      }
    },
    title: {
      text: 'Current Assessment Values',
      align: 'center'
    }
  };

  const chart = new ApexCharts(document.querySelector("#chart-current-values"), options);
  chart.render();
}
