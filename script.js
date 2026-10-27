const themeBtn = document.getElementById("themeBtn");
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const forecast = document.getElementById("forecast");
const recentSearches = document.getElementById("recentSearches");

let recentCities = [];

function getCondition(code) {
  if (code === 0) {
    return "Clear sky";
  } else if (code >= 1 && code <= 3) {
    return "Partly cloudy";
  } else if (code >= 45 && code <= 48) {
    return "Fog";
  } else if (code >= 51 && code <= 57) {
    return "Drizzle";
  } else if (code >= 61 && code <= 67) {
    return "Rain";
  } else if (code >= 71 && code <= 77) {
    return "Snow";
  } else if (code >= 80 && code <= 82) {
    return "Rain showers";
  } else if (code >= 95 && code <= 99) {
    return "Thunderstorm";
  } else {
    return "Unknown";
  }
}

async function getWeather(city) {
  try {
    message.textContent = "Loading...";
    searchBtn.disabled = true;

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

    let response = await fetch(geoUrl);
    if (!response.ok) {
      throw new Error("Could not find city information.");
    }
    const geoData = await response.json();

    if (geoData.results === undefined || geoData.results.length === 0) {
      message.textContent = "City not found. Please try again.";
      return;
    }

    const latitude = geoData.results[0].latitude;
    const longitude = geoData.results[0].longitude;
    const placeName = geoData.results[0].name;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

    response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error("Could not load weather information.");
    }
    const weatherData = await response.json();

    showCurrentWeather(placeName, weatherData);
    showForecast(weatherData);
    saveCity(placeName);
    message.textContent = "";
  } catch (error) {
    message.textContent = "Something went wrong. Please check your internet connection.";
    console.log(error);
  } finally {
    searchBtn.disabled = false;
  }
}

function showCurrentWeather(placeName, weatherData) {
  cityName.textContent = placeName;
  temperature.textContent = `${Math.round(weatherData.current.temperature_2m)} °C`;
  condition.textContent = getCondition(weatherData.current.weather_code);
  humidity.textContent = `${weatherData.current.relative_humidity_2m}%`;
  wind.textContent = `${weatherData.current.wind_speed_10m} km/h`;
}

function showForecast(weatherData) {
  forecast.textContent = "";

  for (let i = 0; i < weatherData.daily.time.length; i++) {
    const forecastCard = document.createElement("div");
    forecastCard.className = "forecast-card";

    const dayHeading = document.createElement("h4");
    const date = new Date(weatherData.daily.time[i]);
    dayHeading.textContent = date.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: "UTC"
    });

    const temperatureText = document.createElement("p");
    const maxTemperature = Math.round(weatherData.daily.temperature_2m_max[i]);
    const minTemperature = Math.round(weatherData.daily.temperature_2m_min[i]);
    temperatureText.textContent = `${maxTemperature} / ${minTemperature} °C`;

    const conditionText = document.createElement("p");
    conditionText.textContent = getCondition(weatherData.daily.weather_code[i]);

    forecastCard.appendChild(dayHeading);
    forecastCard.appendChild(temperatureText);
    forecastCard.appendChild(conditionText);
    forecast.appendChild(forecastCard);
  }
}

function loadSavedCities() {
  const storedCities = JSON.parse(localStorage.getItem("recentCities"));

  if (storedCities === null) {
    recentCities = [];
  } else {
    recentCities = storedCities;
  }
}

function saveCity(city) {
  let cityIsSaved = false;

  for (let i = 0; i < recentCities.length; i++) {
    if (recentCities[i] === city) {
      cityIsSaved = true;
    }
  }

  if (cityIsSaved === false) {
    recentCities.unshift(city);
  }

  if (recentCities.length > 5) {
    recentCities.pop();
  }

  localStorage.setItem("recentCities", JSON.stringify(recentCities));
  showRecentSearches();
}

function showRecentSearches() {
  recentSearches.textContent = "";

  for (let i = 0; i < recentCities.length; i++) {
    const recentButton = document.createElement("button");
    const city = recentCities[i];
    recentButton.textContent = city;

    recentButton.addEventListener("click", function () {
      cityInput.value = city;
      getWeather(city);
    });

    recentSearches.appendChild(recentButton);
  }
}

function loadSavedTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.textContent = "Light Mode";
  }
}

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (city === "") {
    message.textContent = "Please enter a city name.";
    return;
  }

  getWeather(city);
});

themeBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    themeBtn.textContent = "Light Mode";
  } else {
    localStorage.setItem("theme", "light");
    themeBtn.textContent = "Dark Mode";
  }
});

loadSavedTheme();
loadSavedCities();
showRecentSearches();