import { initializeMap } from './map_create.js';
import { initializeLegend } from './map_legend.js';
import { drawPriorAssessmentChart } from './LoadJson_Chart.js';
import { drawPredictedAssessmentChart } from './LoadJson_Chart_predicted.js';
import { drawAbsoluteChangeChart } from './absolute_change_chart.js';
import { drawPercentChangeChart } from './percent_change_chart.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initializeMap();
  initializeLegend();
  drawPriorAssessmentChart();
  drawPredictedAssessmentChart();
  drawAbsoluteChangeChart();
  drawPercentChangeChart();
});
