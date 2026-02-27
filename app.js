// WeatherApp Constructor Function
function WeatherApp() {
  // DOM References - Store once for better performance
  this.searchForm = document.getElementById('searchForm');
  this.searchInput = document.getElementById('searchInput');
  this.weatherContainer = document.getElementById('weatherContainer');
  this.forecastContainer = document.getElementById('forecastContainer');
  this.loading = document.getElementById('loading');
  this.error = document.getElementById('error');
  
  // API Configuration
  this.apiKey = 'YOUR_API_KEY_HERE'; // Replace with your OpenWeatherMap API key
  this.currentWeatherUrl = 'https://api.openweathermap.org/data/2.5/weather';
  this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
}

// Initialize the application
WeatherApp.prototype.init = function() {
  // Bind event listeners with correct 'this' context
  this.searchForm.addEventListener('submit', this.handleSearch.bind(this));
  
  // Show welcome message on load
  this.showWelcome();
};

// Show welcome message
WeatherApp.prototype.showWelcome = function() {
  this.weatherContainer.innerHTML = `
    <div class="welcome-message">
      <h2>Welcome to SkyFetch Weather!</h2>
      <p>Search for a city to get the current weather and 5-day forecast</p>
    </div>
  `;
  this.forecastContainer.innerHTML = '';
  this.error.style.display = 'none';
};

// Handle search form submission
WeatherApp.prototype.handleSearch = function(e) {
  e.preventDefault();
  
  const city = this.searchInput.value.trim();
  
  if (city) {
    // Fetch both current weather and forecast simultaneously
    this.getWeather(city);
  }
};

// Get current weather and forecast using Promise.all()
WeatherApp.prototype.getWeather = async function(city) {
  try {
    this.showLoading();
    
    // Fetch both APIs simultaneously
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(`${this.currentWeatherUrl}?q=${city}&appid=${this.apiKey}&units=metric`),
      fetch(`${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`)
    ]);
    
    // Check if both responses are OK
    if (!weatherResponse.ok || !forecastResponse.ok) {
      throw new Error('City not found');
    }
    
    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();
    
    // Display both current weather and forecast
    this.displayWeather(weatherData);
    this.displayForecast(forecastData);
    
  } catch (error) {
    this.showError(error.message);
  }
};

// Display current weather
WeatherApp.prototype.displayWeather = function(data) {
  this.loading.style.display = 'none';
  this.error.style.display = 'none';
  
  const { name, main, weather, wind } = data;
  const iconCode = weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  
  this.weatherContainer.innerHTML = `
    <div class="weather-card">
      <h2 class="city-name">${name}</h2>
      <div class="weather-icon">
        <img src="${iconUrl}" alt="${weather[0].description}">
      </div>
      <p class="temperature">${Math.round(main.temp)}°C</p>
      <p class="description">${weather[0].description}</p>
      <div class="weather-details">
        <p>Feels like: ${Math.round(main.feels_like)}°C</p>
        <p>Humidity: ${main.humidity}%</p>
        <p>Wind: ${wind.speed} m/s</p>
        <p>Pressure: ${main.pressure} hPa</p>
      </div>
    </div>
  `;
};

// Get forecast data
WeatherApp.prototype.getForecast = async function(city) {
  try {
    const response = await fetch(`${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`);
    
    if (!response.ok) {
      throw new Error('Forecast not available');
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return null;
  }
};

// Process forecast data - get one forecast per day at noon
WeatherApp.prototype.processForecastData = function(data) {
  // Filter to get only one forecast per day (at noon)
  const dailyForecasts = [];
  
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const hour = date.getHours();
    
    // Get noon forecast for each day (or closest to noon)
    if (hour >= 11 && hour <= 14) {
      dailyForecasts.push(item);
    }
  });
  
  // If we don't have noon data, take one reading per day
  if (dailyForecasts.length < 5) {
    const uniqueDays = new Map();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const day = date.toLocaleDateString();
      
      if (!uniqueDays.has(day)) {
        uniqueDays.set(day, item);
      }
    });
    
    return Array.from(uniqueDays.values()).slice(0, 5);
  }
  
  return dailyForecasts.slice(0, 5);
};

// Display 5-day forecast
WeatherApp.prototype.displayForecast = function(data) {
  const forecastDays = this.processForecastData(data);
  
  let forecastHTML = '<div class="forecast-grid">';
  
  forecastDays.forEach(day => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const iconCode = day.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const temp = Math.round(day.main.temp);
    const description = day.weather[0].description;
    
    forecastHTML += `
      <div class="forecast-card">
        <p class="forecast-day">${dayName}</p>
        <img src="${iconUrl}" alt="${description}" class="forecast-icon">
        <p class="forecast-temp">${temp}°C</p>
        <p class="forecast-desc">${description}</p>
      </div>
    `;
  });
  
  forecastHTML += '</div>';
  this.forecastContainer.innerHTML = forecastHTML;
};

// Show loading state
WeatherApp.prototype.showLoading = function() {
  this.weatherContainer.innerHTML = '';
  this.forecastContainer.innerHTML = '';
  this.error.style.display = 'none';
  this.loading.style.display = 'block';
};

// Show error message
WeatherApp.prototype.showError = function(message) {
  this.loading.style.display = 'none';
  this.weatherContainer.innerHTML = '';
  this.forecastContainer.innerHTML = '';
  this.error.textContent = message;
  this.error.style.display = 'block';
};

// Create instance when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const app = new WeatherApp();
  app.init();
});
