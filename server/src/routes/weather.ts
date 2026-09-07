import { Router } from 'express'
import { db } from '../db'
import type { WeatherCell } from '../../src/types'

export const weatherRouter = Router()

function formatWeather(row: any): WeatherCell {
  return {
    state: row.state,
    district: row.district,
    condition: row.condition,
    rainfallMm: row.rainfall_mm,
    humidity: row.humidity,
    windKph: row.wind_kph,
    warning: row.warning,
  }
}

weatherRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM weather_cells').all()
  res.json(rows.map(formatWeather))
})
