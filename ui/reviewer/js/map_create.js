let map;

export function initializeMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      },
      property_tiles: {
          type: 'vector',
          tiles: [
            'https://storage.googleapis.com/musa5090s25-team6-public/tiles/properties/{z}/{x}/{y}.pbf'
          ],
          minzoom: 10,
          maxzoom: 18
        }
      },
      layers: [
        {
          id: 'osm-basemap',
          type: 'raster',
          source: 'basemap',
          minzoom: 0,
          maxzoom: 22
        },
        {
          id: 'current-assessed',
          type: 'fill',
          source: 'property_tiles',
          'source-layer': 'property_tile_info',
          paint: {
            'fill-color': [
              'step',
              ['get', 'current_assessed_value'],
              '#ffffcc', 100000,
              '#a1dab4', 250000,
              '#41b6c4', 500000,
              '#2c7fb8', 1000000,
              '#253494'
            ],
            'fill-opacity': 0.8,
            'fill-outline-color': '#000'
          }
        },
        {
          id: 'prior-assessed',
          type: 'fill',
          source: 'property_tiles',
          'source-layer': 'property_tile_info',
          paint: {
            'fill-color': [
              'step',
              ['get', 'market_value'],
              '#ffffcc', 100000,
              '#a1dab4', 250000,
              '#41b6c4', 500000,
              '#2c7fb8', 1000000,
              '#253494'
            ],
            'fill-opacity': 0,
            'fill-outline-color': '#000'
          }
        },
        {
          id: 'percent-change',
          type: 'fill',
          source: 'property_tiles',
          'source-layer': 'property_tile_info',
          paint: {
            'fill-color': [
              'step',
              [
                '/',
                ['-', ['get', 'current_assessed_value'], ['get', 'tax_year_assessed_value']],
                ['get', 'tax_year_assessed_value']
              ],
              '#ffffcc', 0.05,
              '#a1dab4', 0.1,
              '#41b6c4', 0.2,
              '#2c7fb8', 0.3,
              '#253494'
            ],
            'fill-opacity': 0,
            'fill-outline-color': '#000'
          }
        }
      ]
    },
    center: [-75.1652, 39.9526],
    zoom: 12
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  map.on('click', e => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['current-assessed', 'prior-assessed', 'percent-change']
    });

    if (features.length > 0) {
      const f = features[0].properties;
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${f.address}</strong><br>
          Current: $${Number(f.current_assessed_value).toLocaleString()}<br>
          2023: $${Number(f.tax_year_assessed_value).toLocaleString()}`)
        .addTo(map);
    }
  });
}

// Hook for legend.js to toggle visibility
export function setLayerVisibility(metric) {
  map.setPaintProperty('current-assessed', 'fill-opacity', metric === 'current' ? 0.8 : 0);
  map.setPaintProperty('prior-assessed', 'fill-opacity', metric === 'prior' ? 0.8 : 0);
  map.setPaintProperty('percent-change', 'fill-opacity', metric === 'percent' ? 0.8 : 0);
}
