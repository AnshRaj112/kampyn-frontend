"use client";
import React, { useEffect, useState } from 'react';
import styles from './styles/Snowflakes.module.scss';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
  windDirection: number; // Angle in degrees (0 = right, 90 = down, 180 = left, 270 = up)
  windStrength: number; // Multiplier for horizontal drift
  color: string; // Interpolated color between white and sky blue
}

interface WeatherConditions {
  windDirection: number; // Angle in degrees
  windSpeed: number; // Base wind speed multiplier
  quantity: number; // Number of snowflakes
  colorIntensity: number; // 0 = white, 1 = sky blue
}

// Get weather conditions based on current hour
function getWeatherConditions(): WeatherConditions {
    const hour = new Date().getHours();
    
    // Wind direction changes hourly (0-360 degrees)
    // Using hour to create a pattern that cycles
    const windDirection = (hour * 15) % 360; // 15 degrees per hour
    
    // Wind speed varies - create patterns (sometimes calm, sometimes windy)
    const speedPattern = Math.sin((hour / 24) * Math.PI * 2);
    const windSpeed = 0.5 + (speedPattern + 1) * 0.5; // Range: 0.5 to 1.5
    
    // Quantity varies - sometimes heavy snow, sometimes light
    const quantityPattern = Math.sin((hour / 12) * Math.PI);
    const baseQuantity = 50;
    const quantityVariation = 80;
    const quantity = Math.floor(baseQuantity + (quantityPattern + 1) * quantityVariation); // Range: 50 to 210
    
    // Color intensity varies - sometimes whiter, sometimes bluer
    const colorPattern = Math.sin((hour / 8) * Math.PI);
    const colorIntensity = (colorPattern + 1) / 2; // Range: 0 to 1
    
    return {
      windDirection,
      windSpeed,
      quantity,
      colorIntensity,
    };
  }

const Snowflakes: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [weatherConditions, setWeatherConditions] = useState<WeatherConditions>(getWeatherConditions());

  // Interpolate color between white and sky blue
  function interpolateColor(intensity: number): string {
    const white = { r: 135, g: 206, b: 235 };
    const skyBlue = { r: 135, g: 206, b: 235 };
    
    const r = Math.floor(white.r + (skyBlue.r - white.r) * intensity);
    const g = Math.floor(white.g + (skyBlue.g - white.g) * intensity);
    const b = Math.floor(white.b + (skyBlue.b - white.b) * intensity);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  useEffect(() => {
    // Update weather conditions every hour
    const updateWeather = () => {
      const newConditions = getWeatherConditions();
      setWeatherConditions(newConditions);
    };

    // Update immediately
    updateWeather();

    // Calculate milliseconds until next hour
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const msUntilNextHour = nextHour.getTime() - now.getTime();

    let intervalId: NodeJS.Timeout | null = null;

    // Set timeout for next hour
    const timeoutId = setTimeout(() => {
      updateWeather();
      // Then update every hour
      intervalId = setInterval(updateWeather, 60 * 60 * 1000);
    }, msUntilNextHour);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    // Generate snowflakes based on current weather conditions
    const generateSnowflakes = () => {
      const newSnowflakes: Snowflake[] = [];

      for (let i = 0; i < weatherConditions.quantity; i++) {
        // Random variation for each snowflake
        const individualWindVariation = (Math.random() - 0.5) * 30; // ±15 degrees variation
        const windDirection = (weatherConditions.windDirection + individualWindVariation + 360) % 360;
        
        // Base speed affected by wind speed
        const baseSpeed = 3 + Math.random() * 7;
        const animationDuration = baseSpeed / weatherConditions.windSpeed;
        
        // Wind strength affects horizontal drift
        const windStrength = 0.5 + Math.random() * weatherConditions.windSpeed;
        
        // Color with some individual variation
        const colorVariation = (Math.random() - 0.5) * 0.3;
        const colorIntensity = Math.max(0, Math.min(1, weatherConditions.colorIntensity + colorVariation));
        const color = interpolateColor(colorIntensity);

        newSnowflakes.push({
          id: i,
          left: Math.random() * 100,
          animationDuration,
          animationDelay: Math.random() * 5,
          size: 5 + Math.random() * 10,
          opacity: 0.3 + Math.random() * 0.7,
          windDirection,
          windStrength,
          color,
        });
      }

      setSnowflakes(newSnowflakes);
    };

    generateSnowflakes();
  }, [weatherConditions]);

  const getSnowflakeChar = (id: number): string => {
    const chars = ['❄', '❅', '❆', '✻', '✼', '✽', '✾', '✿'];
    return chars[id % chars.length];
  };

  return (
    <div className={styles.snowflakesContainer}>
      {snowflakes.map((snowflake) => {
        // Calculate horizontal drift based on wind direction and strength
        // Wind direction: 0° = right, 90° = down, 180° = left, 270° = up
        // For falling snow, we want the horizontal component of the wind
        const windRad = (snowflake.windDirection * Math.PI) / 180;
        
        // Calculate horizontal drift (left/right movement)
        // Positive = right, Negative = left
        const horizontalDrift = Math.sin(windRad) * snowflake.windStrength * 150; // pixels of drift
        
        // Calculate vertical speed multiplier (how fast it falls)
        // When wind is horizontal (0° or 180°), it falls slower due to wind resistance
        // When wind is vertical (90° or 270°), it falls faster
        const verticalComponent = Math.cos(windRad);
        const verticalSpeed = 0.7 + Math.abs(verticalComponent) * 0.6; // Range: 0.7 to 1.3
        
        return (
          <div
            key={snowflake.id}
            className={styles.snowflake}
            style={{
              left: `${snowflake.left}%`,
              width: `${snowflake.size}px`,
              height: `${snowflake.size}px`,
              opacity: snowflake.opacity,
              animationDuration: `${snowflake.animationDuration / verticalSpeed}s`,
              animationDelay: `${snowflake.animationDelay}s`,
              fontSize: `${snowflake.size}px`,
              color: snowflake.color,
              '--wind-drift': `${horizontalDrift}px`,
              '--wind-angle': `${snowflake.windDirection}deg`,
            } as React.CSSProperties & {
              '--wind-drift': string;
              '--wind-angle': string;
            }}
          >
            {getSnowflakeChar(snowflake.id)}
          </div>
        );
      })}
    </div>
  );
};

export default Snowflakes;

