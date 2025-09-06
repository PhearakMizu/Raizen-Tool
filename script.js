/* Toggle between calculator and simulator */
document.getElementById('showCalculator').addEventListener('click', () => {
    document.getElementById('calculatorSection').classList.add('active');
    document.getElementById('simulatorSection').classList.remove('active');
    document.getElementById('showCalculator').classList.add('active');
    document.getElementById('showSimulator').classList.remove('active');
});
document.getElementById('showSimulator').addEventListener('click', () => {
    document.getElementById('simulatorSection').classList.add('active');
    document.getElementById('calculatorSection').classList.remove('active');
    document.getElementById('showSimulator').classList.add('active');
    document.getElementById('showCalculator').classList.remove('active');
});

/* ==== Your existing Calculator Logic ==== */
["capital", "winrate"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            runSimulation();
        }
    });
});

function calculatePosition() {
    const entry = parseFloat(document.getElementById('entry').value);
    const sl = parseFloat(document.getElementById('sl').value);
    const tp = parseFloat(document.getElementById('tp').value);
    const risk = parseFloat(document.getElementById('risk').value);

    if(isNaN(entry) || isNaN(sl) || isNaN(tp) || isNaN(risk) || entry === sl || entry === tp || sl === tp) {
        document.getElementById("calculatorResult").style.display = "none";
        document.getElementById("calculatorError").style.display = "block";
        document.getElementById('error').innerHTML = '<div>Please enter valid PRICE !</div>';
        return;
    }
    else if ((entry > sl && entry > tp) || (entry < sl && entry < tp)) {
        document.getElementById("calculatorResult").style.display = "none";
        document.getElementById("calculatorError").style.display = "block";
        document.getElementById('error').innerHTML = '<div>Take Profit and Stop Loss must be on opposite sides of Entry Price !</div>';
        return;
    }
    else{
      document.getElementById("calculatorResult").style.display = "block";
      document.getElementById("calculatorError").style.display = "none";
    }

    const positionSize = Math.abs(risk / (entry - sl));
    const potentialProfit = positionSize * Math.abs(tp - entry);
    const rr = Math.abs(tp - entry) / Math.abs(entry - sl);
    const pnl = potentialProfit;
    const limitFeePercent = 0.02 / 100; // 0.02% fee
    const marketFeePercent = 0.045 / 100; // 0.045% fee
    const marketWinFee = (entry + tp) * positionSize * marketFeePercent;
    const marketLoseFee = (entry + sl) * positionSize * marketFeePercent;
    const limitWinFee = (entry + tp) * positionSize * limitFeePercent;
    const limitLoseFee = (entry + sl) * positionSize * limitFeePercent;
    const marketLosePnL = -Math.abs(risk) - marketLoseFee;
    const limitLosePnL = -Math.abs(risk) - limitLoseFee;
    const marketWinPnL = pnl - marketWinFee;
    const limitWinPnL = pnl - limitWinFee;

    document.getElementById('result').innerHTML = `
        <div class="label">Position Size (units)</div>
        <div class="value position">${positionSize.toFixed(6)} </div>
        <div class="label">Profit Target ($)</div>
        <div class="value pnl">$ ${pnl.toFixed(2)}</div>
        <div class="label">Risk-Reward (RR)</div>
        <div class="value rr">${rr.toFixed(2)}</div>
        <div class="label"><hr/></div>
        <div class="value position"><hr/></div>
        <div class="label fee">Market Win Fee ($)</div>
        <div class="value fee">$ ${marketWinFee.toFixed(2)} → PnL = $ ${marketWinPnL.toFixed(2)}</div>
        <div class="label fee">Market Win Fee ($)</div>
        <div class="value fee">$ ${marketLoseFee.toFixed(2)} → PnL = $ ${marketLosePnL.toFixed(2)}</div>
        <div class="label fee">Limit Win Fee ($)</div>
        <div class="value fee">$ ${limitWinFee.toFixed(2)} → PnL = $ ${limitWinPnL.toFixed(2)}</div>
        <div class="label fee">Limit Lose Fee ($)</div>
        <div class="value fee">$ ${limitLoseFee.toFixed(2)} → PnL = $ ${limitLosePnL.toFixed(2)}</div>
    `;
}
document.getElementById('calculateBtn').addEventListener('click', calculatePosition);
const inputs = ['entry','sl','tp','risk'];
inputs.forEach((id, index) => {
    document.getElementById(id).addEventListener('keydown', function(e){
        if(e.key === "Enter") {
            e.preventDefault();
            if(index < inputs.length - 1) {
                document.getElementById(inputs[index + 1]).focus();
            } else {
                calculatePosition();
            }
        }
    });
});

/* ==== Your existing Simulator Logic ==== */
function runSimulation() {
  document.getElementById("simulatorResult").style.display = "block";
  const startCapital = parseFloat(document.getElementById("capital").value);
  const inputWinrate = parseFloat(document.getElementById("winrate").value)/100;
  const commissionPercent = parseFloat(document.getElementById("commissionPercent").value);

  if (
    isNaN(startCapital) || startCapital <= 0 ||
    isNaN(inputWinrate) || inputWinrate < 0 || inputWinrate > 1 ||
    isNaN(commissionPercent) || commissionPercent < 0 || commissionPercent > 10
  ) {
    alert("Please enter valid input values.");
    return;
  }

  const days = 365;
  const tradesPerDay = 3;
  const rr = document.getElementById("riskreward").value;
  const dailyGrowth = 1.02;
  const riskPercent = 0.01;

  let capital = startCapital;
  let targetCapitals = [startCapital];
  for (let i = 1; i < days; i++) {
    targetCapitals.push(targetCapitals[i - 1] * dailyGrowth);
  }

  let winningDaysCount = 0;
  let equityCurve = [];

  let html =
    "<table><tr><th>Day</th><th>Target</th><th>Bucket Base</th><th>Risk %</th><th>Risk $</th><th>Trades</th><th>Daily RR</th><th>Daily P/L</th><th>Commission</th><th>Final Capital</th><th>Target Met</th></tr>";

  for (let day = 0; day < days; day++) {
    const target = targetCapitals[day];
    const baseRiskCapital = Math.floor(capital / 100) * 100;
    const risk = baseRiskCapital * riskPercent;

    let trades = [];
    let profit = 0;
    let rrTotal = 0;

    const commissionPerTrade = risk * (commissionPercent / 100);
    const totalCommission = commissionPerTrade * tradesPerDay;

    for (let t = 0; t < tradesPerDay; t++) {
      const rnd = Math.random();

      if (rnd < inputWinrate) {
        let tradeProfit = risk * rr;
        if (Math.random() < 0.5) {
          tradeProfit = risk * 1;
          trades.push("+" + tradeProfit.toFixed(2) + " (trail)");
        } else {
          trades.push("+" + tradeProfit.toFixed(2));
        }
        profit += tradeProfit;
        rrTotal += tradeProfit / risk;
      } else if (rnd < inputWinrate + (1 - inputWinrate) / 2) {
        trades.push("0.00");
      } else {
        trades.push("-" + risk.toFixed(2));
        profit -= risk;
        rrTotal -= 1;
      }
    }

    profit -= totalCommission;
    capital += profit;

    if (profit > 0) winningDaysCount++;

    equityCurve.push(capital);

    let rowClass = ((day + 1) % 30 === 0) ? "highlight-row" : "";
    html += `<tr class="${rowClass}">
    <td>${day + 1}</td>
    <td>${target.toFixed(2)}</td>
    <td>$${baseRiskCapital}</td>
    <td>${(riskPercent * 100).toFixed(2)}%</td>
    <td>${risk.toFixed(2)}</td>
    <td>${trades.join(", ")}</td>
    <td>${rrTotal.toFixed(2)}</td>
    <td>${profit.toFixed(2)}</td>
    <td>${totalCommission.toFixed(2)}</td>
    <td>${capital.toFixed(2)}</td>
    <td>${capital >= target ? "✅" : "❌"}</td>
    </tr>`;
  }

  html += "</table>";

  const actualWinrate = (winningDaysCount / days).toFixed(3);

  document.getElementById("results").innerHTML =
    `<p><strong>Win Rate Based on Winning Days:</strong> ${actualWinrate}</p>` + html;

  drawEquityChart(equityCurve);
}

function drawEquityChart(data) {
  const canvas = document.getElementById("equityChart");
  const ctx = canvas.getContext("2d");

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (data.length === 0) return;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const padding = 40;

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding / 2);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  ctx.fillStyle = "#333";
  ctx.font = "12px Arial";
  ctx.fillText(minVal.toFixed(2), 5, canvas.height - padding);
  ctx.fillText(maxVal.toFixed(2), 5, padding);

  ctx.strokeStyle = "#4caf50";
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    let x = padding + ((canvas.width - 2 * padding) * i) / (data.length - 1);
    let y =
      canvas.height - padding -
      ((data[i] - minVal) / (maxVal - minVal || 1)) *
        (canvas.height - 2 * padding);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}