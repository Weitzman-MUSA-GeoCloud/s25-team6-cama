async function lookupAssessment() {
  const opaId = document.getElementById('opa-id').value.trim();
  if (!opaId) {
    alert("Please enter a valid OPA ID.");
    return;
  }

  const apiUrl = `https://us-east4-musa5090s25-team6.cloudfunctions.net/request_files?type=predictions&property_id='${opaId}'`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      alert("No assessment data found for this OPA ID.");
      return;
    }

    // Sort by tax year (ascending)
    const sorted = data.sort((a, b) => a.tax_year - b.tax_year);

    // Chart: market value over time
    const years = sorted.map(row => row.tax_year);
    const values = sorted.map(row => row.market_value);

    // Table: detailed breakdown
    const breakdown = sorted.map(row => ({
      year: row.tax_year,
      market: row.market_value,
      land: row.taxable_land ?? 0,
      improvement: row.taxable_building ?? 0,
      exemptLand: row.exempt_land ?? 0,
      exemptImprovement: row.exempt_building ?? 0
    }));

    renderChart(years, values);
    renderTable(breakdown);

  } catch (error) {
    console.error("Error fetching data:", error);
    alert("An error occurred while retrieving the assessment data.");
  }
}

function renderChart(labels, data) {
  const ctx = document.getElementById('valuation-chart')?.getContext('2d');

  if (!ctx) {
    const container = document.getElementById('valuation-chart-container');
    container.innerHTML = '<canvas id="valuation-chart"></canvas>';
  }

  if (window.chartInstance) window.chartInstance.destroy();

  window.chartInstance = new Chart(
    document.getElementById('valuation-chart'),
    {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Assessed Market Value',
          data,
          borderColor: '#0072ce',
          backgroundColor: 'rgba(0, 114, 206, 0.1)',
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: false }
        }
      }
    }
  );
}

function renderTable(data) {
  const container = document.getElementById('valuation-table-container');
  let html = `<table>
    <thead>
      <tr>
        <th>Year</th><th>Market Value</th><th>Taxable Land</th><th>Taxable Improvement</th>
        <th>Exempt Land</th><th>Exempt Improvement</th>
      </tr>
    </thead>
    <tbody>`;

  data.forEach(row => {
    html += `<tr>
      <td>${row.year ?? 'N/A'}</td>
      <td>$${(row.market ?? 0).toLocaleString()}</td>
      <td>$${(row.land ?? 0).toLocaleString()}</td>
      <td>$${(row.improvement ?? 0).toLocaleString()}</td>
      <td>$${(row.exemptLand ?? 0).toLocaleString()}</td>
      <td>$${(row.exemptImprovement ?? 0).toLocaleString()}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}
