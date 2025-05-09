async function lookupAssessment() {
  const opaId = document.getElementById('opa-id').value.trim();
  if (!opaId) {
    alert("Please enter a valid OPA ID.");
    return;
  }

  const urlPast = `https://us-east4-musa5090s25-team6.cloudfunctions.net/request_files?type=past_assessments&property_id=${opaId}`;
  const urlPred = `https://us-east4-musa5090s25-team6.cloudfunctions.net/request_files?type=predictions&property_id=${opaId}`;

  try {
    const [resPast, resPred] = await Promise.all([fetch(urlPast), fetch(urlPred)]);
    if (!resPast.ok || !resPred.ok) throw new Error("One or both API requests failed");

    const [dataPast, dataPred] = await Promise.all([resPast.json(), resPred.json()]);

    // ========================
    // 🟦 CHART DATA
    // ========================
    const chartYears = [];
    const chartValues = [];

    // Add past assessment market values
    if (Array.isArray(dataPast)) {
      const sortedPast = dataPast.sort((a, b) => a.tax_year - b.tax_year);
      sortedPast.forEach(row => {
        chartYears.push(Number(row.tax_year));
        chartValues.push(row.market_value);
      });
    }

    // Add predicted 2026 value (first valid one found)
    let predictionRow = null;
    if (Array.isArray(dataPred)) {
      predictionRow = dataPred.find(d => d.predicted_at === "2026" && Number(d.predicted_value) > 0);
      if (predictionRow) {
        chartYears.push(2026);
        chartValues.push(Number(predictionRow.predicted_value));
      }
    }

    renderChart(chartYears, chartValues);

    // ========================
    // 🟨 TABLE DATA
    // ========================
    const tableRows = [];

    if (Array.isArray(dataPast)) {
      dataPast.forEach(row => {
        tableRows.push({
          year: Number(row.tax_year),
          market: row.market_value,
          land: row.taxable_land,
          improvement: row.taxable_building,
          exemptLand: row.exempt_land,
          exemptImprovement: row.exempt_building
        });
      });
    }

    if (predictionRow) {
      tableRows.push({
        year: 2026,
        market: Number(predictionRow.predicted_value),
        land: 0,
        improvement: 0,
        exemptLand: 0,
        exemptImprovement: 0
      });
    }

    renderTable(tableRows);

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
          pointBackgroundColor: labels.map(year => year === 2026 ? 'red' : '#0072ce'),
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
    const isPrediction = row.year === 2026;
    html += `<tr style="color: ${isPrediction ? 'red' : '#222'};">`;
    html += `
      <td>${row.year}</td>
      <td>$${row.market.toLocaleString()}</td>
      <td>$${row.land.toLocaleString()}</td>
      <td>$${row.improvement.toLocaleString()}</td>
      <td>$${row.exemptLand.toLocaleString()}</td>
      <td>$${row.exemptImprovement.toLocaleString()}</td>
    </tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}
