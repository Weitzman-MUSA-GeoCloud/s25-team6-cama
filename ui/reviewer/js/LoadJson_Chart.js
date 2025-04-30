export async function drawPriorAssessmentChart() {
  const response = await fetch('https://storage.googleapis.com/musa5090s25-team6-public/configs/tax_year_assessment_bins.json');
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

    const ranges = Object.keys(groupedData);
    const thresholds = [10000, 20000, 30000, 35000, 40000, 45000, 50000, 55000, 60000,
      100000, 150000, 200000, 250000, 300000, 350000, 400000, 800000, 1000000,
      3000000, 5000000, 10000000, 15000000, 20000000, 30000000, Infinity];

    for (let i = 0; i < thresholds.length; i++) {
      if (lower < thresholds[i]) {
        groupedData[ranges[i]] += count;
        break;
      }
    }
  });

  const categories = Object.keys(groupedData);
  const counts = Object.values(groupedData);

  const options = {
    chart: { type: 'line', height: 450, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 4, colors: ['#008FFB'], strokeColors: '#fff', strokeWidth: 2 },
    series: [{ name: 'Number of Properties', data: counts }],
    xaxis: {
      categories,
      labels: { rotate: -45 },
      title: { text: 'Assessment Value Range' }
    },
    yaxis: {
      title: { text: 'Number of Properties' },
      labels: {
        formatter: val => val >= 1e6 ? (val / 1e6).toFixed(1) + 'M' :
                       val >= 1e3 ? (val / 1e3).toFixed(0) + 'K' : val
      }
    },
    tooltip: { y: { formatter: val => val.toLocaleString() } },
    title: { text: 'Prior-Year Assessment Values', align: 'center' }
  };

  new ApexCharts(document.querySelector("#chart-prior-values"), options).render();
}
