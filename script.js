
"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function formatNumber(value, decimals = 1) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/* MENU MOBILE */

const menuButton = $("#menu-toggle");
const navigation = $("#main-nav");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const expanded =
      menuButton.getAttribute("aria-expanded") === "true";

    menuButton.setAttribute("aria-expanded", String(!expanded));
    navigation.classList.toggle("active");
  });

  $$("#main-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("active");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

/* PROGRESSO DE LEITURA */

const progressBar = $("#reading-progress");

function updateReadingProgress() {
  if (!progressBar) return;

  const total =
    document.documentElement.scrollHeight - window.innerHeight;

  const progress =
    total > 0 ? (window.scrollY / total) * 100 : 0;

  progressBar.style.width = `${progress}%`;
}

window.addEventListener("scroll", updateReadingProgress);
updateReadingProgress();

/* ACESSIBILIDADE */

let fontScale = 1;

function applyFontScale() {
  document.documentElement.style.setProperty(
    "--font-scale",
    fontScale
  );
}

$("#increase-font")?.addEventListener("click", () => {
  fontScale = Math.min(fontScale + 0.1, 1.5);
  applyFontScale();
});

$("#decrease-font")?.addEventListener("click", () => {
  fontScale = Math.max(fontScale - 0.1, 0.8);
  applyFontScale();
});

$("#toggle-contrast")?.addEventListener("click", (event) => {
  document.body.classList.toggle("high-contrast");

  const enabled =
    document.body.classList.contains("high-contrast");

  event.currentTarget.setAttribute(
    "aria-pressed",
    String(enabled)
  );
});

/* SIMULADOR DE RADIAÇÃO DO CORPO NEGRO */

const canvas = $("#blackbody-chart");

if (canvas) {
  const ctx = canvas.getContext("2d");
  const temperatureInput = $("#blackbody-temperature");

  const WIEN = 2.898e-3;
  const STEFAN_BOLTZMANN = 5.670374419e-8;
  const H = 6.62607015e-34;
  const C = 299792458;
  const K = 1.380649e-23;

  function planck(wavelength, temperature) {
    const exponent =
      (H * C) / (wavelength * K * temperature);

    if (exponent > 700) return 0;

    return (
      (2 * H * C ** 2) /
      (wavelength ** 5 * Math.expm1(exponent))
    );
  }

  function drawBlackbody() {
    const temperature = Number(temperatureInput.value);
    const width = canvas.width;
    const height = canvas.height;

    const padding = 45;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    ctx.clearRect(0, 0, width, height);

    const points = [];

    for (let i = 0; i <= 250; i++) {
      const wavelengthNm = 100 + (2900 * i / 250);
      const intensity = planck(
        wavelengthNm * 1e-9,
        temperature
      );

      points.push({
        wavelength: wavelengthNm,
        intensity
      });
    }

    const maxIntensity = Math.max(
      ...points.map(point => point.intensity)
    );

    /* Eixos */

    ctx.strokeStyle = "#8a9bb0";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    /* Curva */

    ctx.beginPath();

    points.forEach((point, index) => {
      const x =
        padding +
        ((point.wavelength - 100) / 2900) * graphWidth;

      const y =
        height - padding -
        (point.intensity / maxIntensity) * graphHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = "#f5b942";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);

    ctx.fillStyle = "rgba(245,185,66,0.12)";
    ctx.fill();

    /* Pico de emissão */

    const peakNm = (WIEN / temperature) * 1e9;

    const peakOutput = $("#blackbody-peak");
    const powerOutput = $("#blackbody-power");
    const temperatureOutput = $("#blackbody-temperature-value");

    if (temperatureOutput) {
      temperatureOutput.textContent = `${temperature} K`;
    }

    if (peakOutput) {
      peakOutput.textContent = `${formatNumber(peakNm, 0)} nm`;
    }

    if (powerOutput) {
      const power =
        STEFAN_BOLTZMANN * temperature ** 4;

      powerOutput.textContent =
        `${formatNumber(power, 0)} W/m²`;
    }

    ctx.fillStyle = "#a8bdca";
    ctx.font = "12px Arial";
    ctx.fillText(
      "Comprimento de onda (nm)",
      width / 2 - 65,
      height - 8
    );
  }

  temperatureInput.addEventListener("input", drawBlackbody);
  drawBlackbody();
}

/* SIMULADOR DE AQUECIMENTO DA PISCINA */

const poolForm = $("#pool-form");

if (poolForm) {
  poolForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const volume = Number($("#pool-volume").value);
    const initialTemperature =
      Number($("#pool-initial-temperature").value);
    const power = Number($("#pool-solar-energy").value);
    const hours = Number($("#pool-hours").value);

    const result = $("#pool-result");

    if (
      volume <= 0 ||
      power < 0 ||
      hours < 0 ||
      !Number.isFinite(volume + power + hours)
    ) {
      result.textContent = "Insira valores válidos.";
      return;
    }

    /*
      Modelo idealizado:
      Energia = potência × tempo

      Calor específico volumétrico da água:
      aproximadamente 4.186.000 J/(m³·°C).
    */

    const energy = power * hours * 3600;
    const heatCapacity = 4186000;

    const temperatureIncrease =
      energy / (volume * heatCapacity);

    const finalTemperature =
      initialTemperature + temperatureIncrease;

    result.innerHTML = `
      <strong>Resultado da simulação</strong>
      <p>Energia recebida: ${formatNumber(energy / 1e6, 2)} MJ</p>
      <p>Aumento de temperatura: +${formatNumber(temperatureIncrease, 2)} °C</p>
      <p>Temperatura final estimada: ${formatNumber(finalTemperature, 2)} °C</p>
      <small>Estimativa idealizada, sem perdas térmicas.</small>
    `;
  });
}

/* SIMULADOR DO EFEITO FOTOELÉTRICO */

const photoelectricForm = $("#photoelectric-form");

if (photoelectricForm) {
  const frequencyInput = $("#light-frequency");
  const workFunctionInput = $("#work-function");
  const frequencyOutput = $("#light-frequency-value");
  const result = $("#photoelectric-result");

  const PLANCK_EV = 4.135667696e-15;

  function calculatePhotoelectricEffect() {
    const frequency =
      Number(frequencyInput.value) * 1e14;

    const workFunction =
      Number(workFunctionInput.value);

    if (
      !Number.isFinite(frequency) ||
      !Number.isFinite(workFunction) ||
      workFunction < 0
    ) {
      result.textContent = "Insira valores válidos.";
      return;
    }

    const photonEnergy = PLANCK_EV * frequency;
    const kineticEnergy = photonEnergy - workFunction;

    frequencyOutput.textContent =
      `${formatNumber(frequency / 1e14, 2)} × 10¹⁴ Hz`;

    if (kineticEnergy > 0) {
      result.innerHTML = `
        <strong>Emissão de elétrons!</strong>
        <p>Energia do fóton: ${formatNumber(photonEnergy, 2)} eV</p>
        <p>Função trabalho: ${formatNumber(workFunction, 2)} eV</p>
        <p>Energia cinética máxima: ${formatNumber(kineticEnergy, 2)} eV</p>
      `;
    } else {
      result.innerHTML = `
        <strong>Não ocorre emissão de elétrons.</strong>
        <p>Energia do fóton: ${formatNumber(photonEnergy, 2)} eV</p>
        <p>Função trabalho: ${formatNumber(workFunction, 2)} eV</p>
        <p>A energia do fóton é insuficiente para superar a função trabalho.</p>
      `;
    }
  }

  frequencyInput.addEventListener(
    "input",
    calculatePhotoelectricEffect
  );

  workFunctionInput.addEventListener(
    "input",
    calculatePhotoelectricEffect
  );

  photoelectricForm.addEventListener("submit", (event) => {
    event.preventDefault();
    calculatePhotoelectricEffect();
  });

  calculatePhotoelectricEffect();
}

/* SIMULADOR DE SENSORES DA PISCINA */

const sensorForm = $("#sensor-form");

if (sensorForm) {
  sensorForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const temperature =
      Number($("#sensor-temperature").value);

    const ph = Number($("#sensor-ph").value);
    const level = Number($("#sensor-level").value);

    const output = $("#sensor-result");

    if (
      !Number.isFinite(temperature) ||
      !Number.isFinite(ph) ||
      !Number.isFinite(level) ||
      ph < 0 || ph > 14 ||
      level < 0 || level > 100
    ) {
      output.textContent = "Confira os valores informados.";
      return;
    }

    const messages = [];

    if (temperature < 20) {
      messages.push("Temperatura baixa: verificar aquecimento.");
    } else if (temperature > 30) {
      messages.push("Temperatura elevada: verificar resfriamento.");
    } else {
      messages.push("Temperatura dentro da faixa configurada.");
    }

    if (ph < 7.2) {
      messages.push("pH baixo: água ácida.");
    } else if (ph > 7.8) {
      messages.push("pH alto: água alcalina.");
    } else {
      messages.push("pH dentro da faixa de referência.");
    }

    if (level < 30) {
      messages.push("Nível de água baixo: verificar abastecimento.");
    } else {
      messages.push("Nível de água adequado.");
    }

    output.innerHTML = `
      <strong>Relatório dos sensores</strong>
      <ul>
        ${messages.map(message => `<li>${message}</li>`).join("")}
      </ul>
      <small>Valores simulados, não são medições reais.</small>
    `;
  });
}

/* ANO AUTOMÁTICO NO RODAPÉ */

const yearElement = $("#current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

console.log("SOLÁGUA iniciado com sucesso.");
