import { setLayerVisibility } from './map_create.js';

export function initializeLegend() {
  document.querySelectorAll('input[name="metric"]').forEach(input => {
    input.addEventListener('change', () => {
      setLayerVisibility(input.value);
    });
  });
}