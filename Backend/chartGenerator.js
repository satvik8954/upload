// chartGenerator.js

function generateChartHTML(labels, data, chartType = "line", title = "My Chart", color = "blue") {
    /**
     * color can be:
     *  - null/undefined -> Chart.js default color
     *  - a single CSS color string -> all bars that color
     *  - an array of CSS color strings -> per-bar colors
     */

    const labelsJSON = JSON.stringify(labels);
    const dataJSON = JSON.stringify(data);

    // ----------------------------
    // changing color and all according to our theme 
   
    let backgroundJSON;
    let borderJSON;

    if (color === null || color === undefined) {
        backgroundJSON = "undefined";
        borderJSON = "undefined";
    } 
    else if (Array.isArray(color)) {
        backgroundJSON = JSON.stringify(color);
        borderJSON = JSON.stringify(color);
    } 
    else {
        backgroundJSON = JSON.stringify(color);
        borderJSON = JSON.stringify(color);
    }

    // ----------------------------
    //  HTML
    // ----------------------------
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body style="background-color: #f7f7f7;"> <!-- Change this to match your frontend -->
  <h2>${title}</h2>
  <canvas id="myChart" width="600" height="300"></canvas>

  <script>
    const ctx = document.getElementById('myChart').getContext('2d');

    const config = {
      type: "${chartType}",
      data: {
        labels: ${labelsJSON},
        datasets: [{
          label: "${title}",
          data: ${dataJSON},
          backgroundColor: ${backgroundJSON},
          borderColor: ${borderJSON},
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    if (config.data.datasets[0].backgroundColor === undefined) {
      delete config.data.datasets[0].backgroundColor;
      delete config.data.datasets[0].borderColor;
    }

    new Chart(ctx, config);
  </script>
</body>
</html>
`;

    return html;
}

module.exports = { generateChartHTML };
