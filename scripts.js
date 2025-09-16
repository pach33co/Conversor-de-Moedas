// scripts.js (versão robusta: cria o chart uma vez, atualiza dados, debounce, logs)
document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const fromAmount = document.getElementById("fromAmount");
  const fromCurrency = document.getElementById("fromCurrency");
  const toCurrency = document.getElementById("toCurrency");
  const toAmount = document.getElementById("toAmount");
  const form = document.getElementById("converterForm");
  const exchangeRateEl = document.getElementById("exchangeRate");
  const lastUpdateEl = document.getElementById("lastUpdate");
  const canvasEl = document.getElementById("exchangeChart");

  // Basic validations
  if (!canvasEl) {
    console.error('Canvas #exchangeChart não encontrado no HTML.');
    return;
  }
  if (typeof Chart === 'undefined') {
    console.error('Chart.js não encontrado. Verifique se a CDN foi importada antes de scripts.js.');
    return;
  }

  // Simulated fixed rates
  const rates = {
    USD: { BRL: 5.2, EUR: 0.9, JPY: 148, GBP: 0.78, USD: 1 },
    BRL: { USD: 0.19, EUR: 0.17, JPY: 28.5, GBP: 0.15, BRL: 1 },
    EUR: { USD: 1.1, BRL: 5.8, JPY: 160, GBP: 0.86, EUR: 1 },
    JPY: { USD: 0.0067, BRL: 0.035, EUR: 0.0062, GBP: 0.0054, JPY: 1 },
    GBP: { USD: 1.28, BRL: 6.7, EUR: 1.16, JPY: 186, GBP: 1 },
  };

  // Helper: debounce to avoid too many updates while typing
  function debounce(fn, delay = 200) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // Generate numeric history array (numbers, not strings)
  function generateHistoryNumbers(baseRate) {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      // small random variation ±5%
      const variation = (Math.random() - 0.5) * 0.05;
      const value = Number((baseRate * (1 + variation)).toFixed(4));
      arr.push(value);
    }
    return arr;
  }

  // Create chart once (empty data initially)
  const labels = ["6d atrás", "5d atrás", "4d atrás", "3d atrás", "2d atrás", "Ontem", "Hoje"];
  const initialData = Array(labels.length).fill(null);

  const ctx = canvasEl.getContext("2d");
  const chartConfig = {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "—",
        data: initialData,
        borderColor: "#FFD700",
        backgroundColor: "rgba(255, 215, 0, 0.18)",
        tension: 0.25,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: "#FFD700"
      }]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { ticks: { color: "#FFD700" }, grid: { color: "#222" } },
        y: { ticks: { color: "#FFD700" }, grid: { color: "#222" } }
      },
      plugins: { legend: { labels: { color: "#FFD700" } } }
    }
  };

  let exchangeChart;
  try {
    exchangeChart = new Chart(ctx, chartConfig);
  } catch (err) {
    console.error('Erro ao inicializar Chart.js:', err);
    return;
  }

  // Update chart with numeric data
  function updateChart(from, to, rate) {
    if (!exchangeChart) return;
    const numericData = generateHistoryNumbers(rate);
    exchangeChart.data.datasets[0].label = `${from} → ${to}`;
    exchangeChart.data.datasets[0].data = numericData;
    exchangeChart.update();
  }

  // Get fixed rate with fallback (try inverse if not defined)
  function getRate(from, to) {
    if (from === to) return 1;
    if (rates[from] && typeof rates[from][to] === 'number') return rates[from][to];
    if (rates[to] && typeof rates[to][from] === 'number') return 1 / rates[to][from];
    return null;
  }

  // Main conversion (debounced for real-time typing)
  const doConvert = debounce(() => {
    const amount = Number(fromAmount.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (!amount || amount <= 0) {
      toAmount.value = "";
      exchangeRateEl.textContent = "Taxa de câmbio: —";
      lastUpdateEl.textContent = "Atualizado em: —";
      // clear chart data visually (optional)
      // exchangeChart.data.datasets[0].data = Array(labels.length).fill(null);
      // exchangeChart.update();
      return;
    }

    const rate = getRate(from, to);
    if (rate === null) {
      toAmount.value = "";
      exchangeRateEl.textContent = "Taxa não disponível (fixa).";
      lastUpdateEl.textContent = "—";
      console.warn(`Taxa fixa não encontrada para ${from} → ${to}`);
      return;
    }

    const result = amount * rate;
    toAmount.value = result.toFixed(2);
    exchangeRateEl.textContent = `1 ${from} = ${rate} ${to}`;
    lastUpdateEl.textContent = `Atualizado em: ${new Date().toLocaleTimeString()}`;

    // Update chart with numeric history
    updateChart(from, to, rate);
  }, 150); // 150ms debounce

  // Wire events
  form.addEventListener("submit", (e) => { e.preventDefault(); doConvert(); });
  fromAmount.addEventListener("input", doConvert);
  fromCurrency.addEventListener("change", doConvert);
  toCurrency.addEventListener("change", doConvert);

  // Initial run to show something
  doConvert();

  console.log("scripts.js inicializado — Chart criado e eventos ligados.");
});
