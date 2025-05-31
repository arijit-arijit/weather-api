// Weather App JavaScript

// Configuration
const CONFIG = {
    API_KEY: 'e5a5cbdbb0ae7f764932d3368da7a67c', // Replace with your actual OpenWeatherMap API key
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    UNITS: 'metric', // metric, imperial, or kelvin
    LANG: 'en' // Language for weather descriptions
};

// Utility Functions
const WeatherUtils = {
    // Get weather icon URL
    getIconUrl: (iconCode) => {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    },

    // Format date for forecast
    formatDate: (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    },

    // Format time
    formatTime: (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    },

    // Get wind direction
    getWindDirection: (degrees) => {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return directions[Math.round(degrees / 22.5) % 16];
    },

    // Convert temperature based on units
    formatTemperature: (temp) => {
        if (CONFIG.UNITS === 'metric') {
            return `${Math.round(temp)}°C`;
        } else if (CONFIG.UNITS === 'imperial') {
            return `${Math.round(temp)}°F`;
        } else {
            return `${Math.round(temp)}K`;
        }
    }
};

// API Functions
const WeatherAPI = {
    // Get current weather data
    getCurrentWeather: async (city) => {
        const url = `${CONFIG.BASE_URL}/weather?q=${city}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(response.status === 404 ? 'City not found' : 'Failed to fetch weather data');
        }
        
        return await response.json();
    },

    // Get 5-day forecast data
    getForecast: async (city) => {
        const url = `${CONFIG.BASE_URL}/forecast?q=${city}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        
        return await response.json();
    },

    // Get weather by coordinates
    getWeatherByCoords: async (lat, lon) => {
        const currentUrl = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`;
        const forecastUrl = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${CONFIG.UNITS}&lang=${CONFIG.LANG}`;
        
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }
        
        return {
            current: await currentResponse.json(),
            forecast: await forecastResponse.json()
        };
    }
};

// UI Functions
const WeatherUI = {
    // Show loading state
    showLoading: () => {
        const container = document.getElementById('weatherContainer');
        container.innerHTML = '<div class="loading">🔄 Loading weather data...</div>';
    },

    // Show error message
    showError: (message) => {
        const container = document.getElementById('weatherContainer');
        container.innerHTML = `<div class="error">❌ ${message}</div>`;
    },

    // Display current weather
    displayCurrentWeather: (data) => {
        const sunrise = WeatherUtils.formatTime(data.sys.sunrise);
        const sunset = WeatherUtils.formatTime(data.sys.sunset);
        
        return `
            <div class="weather-main">
                <div class="current-weather">
                    <div class="weather-icon">
                        <img src="${WeatherUtils.getIconUrl(data.weather[0].icon)}" 
                             alt="${data.weather[0].description}" 
                             class="weather-icon-img">
                    </div>
                    <div class="weather-info">
                        <h2>${data.name}, ${data.sys.country}</h2>
                        <p class="temp-main">${WeatherUtils.formatTemperature(data.main.temp)}</p>
                        <p class="weather-description">${data.weather[0].description}</p>
                    </div>
                </div>
                
                <div class="weather-details">
                    <div class="detail-card">
                        <h3>Feels Like</h3>
                        <p>${WeatherUtils.formatTemperature(data.main.feels_like)}</p>
                    </div>
                    <div class="detail-card">
                        <h3>Humidity</h3>
                        <p>${data.main.humidity}%</p>
                    </div>
                    <div class="detail-card">
                        <h3>Wind</h3>
                        <p>${data.wind.speed} m/s ${WeatherUtils.getWindDirection(data.wind.deg)}</p>
                    </div>
                    <div class="detail-card">
                        <h3>Pressure</h3>
                        <p>${data.main.pressure} hPa</p>
                    </div>
                    <div class="detail-card">
                        <h3>Visibility</h3>
                        <p>${(data.visibility / 1000).toFixed(1)} km</p>
                    </div>
                    <div class="detail-card">
                        <h3>Sunrise/Sunset</h3>
                        <p>☀️ ${sunrise}<br>🌅 ${sunset}</p>
                    </div>
                </div>
            </div>
        `;
    },

    // Display forecast
    displayForecast: (data) => {
        const forecastCards = data.list
            .filter((item, index) => index % 8 === 0) // Get one forecast per day (every 24 hours)
            .slice(0, 5)
            .map(item => `
                <div class="forecast-card">
                    <div class="forecast-date">${WeatherUtils.formatDate(item.dt)}</div>
                    <img src="${WeatherUtils.getIconUrl(item.weather[0].icon)}" 
                         alt="${item.weather[0].description}" 
                         class="forecast-icon">
                    <div class="forecast-temp">
                        <strong>${WeatherUtils.formatTemperature(item.main.temp)}</strong>
                    </div>
                    <div style="text-transform: capitalize; font-size: 0.9em; margin-bottom: 5px;">
                        ${item.weather[0].description}
                    </div>
                    <div style="font-size: 0.8em; opacity: 0.8;">
                        💧 ${item.main.humidity}% | 💨 ${item.wind.speed} m/s
                    </div>
                </div>
            `).join('');

        return `
            <div class="forecast-container">
                <h2 class="forecast-title">5-Day Weather Forecast</h2>
                <div class="forecast-grid">
                    ${forecastCards}
                </div>
            </div>
        `;
    }
};

// Main Functions
async function getWeather() {
    const city = document.getElementById('cityInput').value.trim();
    
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    if (CONFIG.API_KEY === 'YOUR_API_KEY') {
        WeatherUI.showError('Please replace YOUR_API_KEY with your actual OpenWeatherMap API key in the script.js file');
        return;
    }

    WeatherUI.showLoading();

    try {
        // Fetch both current weather and forecast
        const [currentData, forecastData] = await Promise.all([
            WeatherAPI.getCurrentWeather(city),
            WeatherAPI.getForecast(city)
        ]);

        displayWeatherData(currentData, forecastData);

    } catch (error) {
        WeatherUI.showError(error.message);
        console.error('Weather API Error:', error);
    }
}

function displayWeatherData(currentData, forecastData) {
    const container = document.getElementById('weatherContainer');
    const currentWeatherHtml = WeatherUI.displayCurrentWeather(currentData);
    const forecastHtml = WeatherUI.displayForecast(forecastData);
    
    container.innerHTML = currentWeatherHtml + forecastHtml;
}

// Get user location and fetch weather
function getLocationWeather() {
    if (navigator.geolocation) {
        WeatherUI.showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const data = await WeatherAPI.getWeatherByCoords(latitude, longitude);
                    displayWeatherData(data.current, data.forecast);
                    
                    // Update input field with current location
                    document.getElementById('cityInput').value = data.current.name;
                } catch (error) {
                    WeatherUI.showError('Failed to get weather for your location');
                    console.error('Location Weather Error:', error);
                }
            },
            (error) => {
                WeatherUI.showError('Unable to get your location');
                console.error('Geolocation Error:', error);
            }
        );
    } else {
        WeatherUI.showError('Geolocation is not supported by this browser');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const cityInput = document.getElementById('cityInput');
    
    // Allow Enter key to search
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getWeather();
        }
    });

    // Set default city
    cityInput.value = '';
    
    // Add location button (you can add this to HTML if needed)
    // Uncomment below to automatically get user's location on page load
    // getLocationWeather();
});

// Additional utility functions for extended functionality
const WeatherExtras = {
    // Convert between temperature units
    convertTemperature: (temp, fromUnit, toUnit) => {
        let celsius = temp;
        
        // Convert to Celsius first
        if (fromUnit === 'fahrenheit') {
            celsius = (temp - 32) * 5/9;
        } else if (fromUnit === 'kelvin') {
            celsius = temp - 273.15;
        }
        
        // Convert from Celsius to target unit
        if (toUnit === 'fahrenheit') {
            return (celsius * 9/5) + 32;
        } else if (toUnit === 'kelvin') {
            return celsius + 273.15;
        }
        
        return celsius;
    },

    // Get weather emoji based on weather condition
    getWeatherEmoji: (weatherCode) => {
        const weatherEmojis = {
            '200': '⛈️', '201': '⛈️', '202': '⛈️', '210': '🌩️', '211': '🌩️', '212': '🌩️', '221': '🌩️', '230': '⛈️', '231': '⛈️', '232': '⛈️',
            '300': '🌦️', '301': '🌦️', '302': '🌧️', '310': '🌧️', '311': '🌧️', '312': '🌧️', '313': '🌧️', '314': '🌧️', '321': '🌧️',
            '500': '🌧️', '501': '🌧️', '502': '🌧️', '503': '🌧️', '504': '🌧️', '511': '🌧️', '520': '🌧️', '521': '🌧️', '522': '🌧️', '531': '🌧️',
            '600': '🌨️', '601': '🌨️', '602': '🌨️', '611': '🌨️', '612': '🌨️', '613': '🌨️', '615': '🌨️', '616': '🌨️', '620': '🌨️', '621': '🌨️', '622': '🌨️',
            '701': '🌫️', '711': '💨', '721': '🌫️', '731': '💨', '741': '🌫️', '751': '💨', '761': '💨', '762': '🌋', '771': '💨', '781': '🌪️',
            '800': '☀️',
            '801': '🌤️', '802': '⛅', '803': '🌥️', '804': '☁️'
        };
        
        return weatherEmojis[weatherCode] || '🌤️';
    }
};

// Export functions for potential module use
// Uncomment if using ES6 modules
// export { getWeather, getLocationWeather, WeatherAPI, WeatherUI, WeatherUtils, WeatherExtras };
