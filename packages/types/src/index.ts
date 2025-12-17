// Market Regime Types

export enum MarketRegime {
  STABLE_RISK_ON = 'STABLE_RISK_ON',
  SUPPORTIVE = 'SUPPORTIVE',
  NEUTRAL = 'NEUTRAL',
  DEFENSIVE = 'DEFENSIVE',
  TIGHT_RISK_OFF = 'TIGHT_RISK_OFF',
  LIQUIDITY_DRIVEN_RALLY = 'LIQUIDITY_DRIVEN_RALLY',
  TRANSITION = 'TRANSITION',
}

export enum RiskState {
  RISK_ON = 'RISK_ON',
  NEUTRAL = 'NEUTRAL',
  RISK_OFF = 'RISK_OFF',
}

export enum LiquidityState {
  EASING = 'EASING',
  NEUTRAL = 'NEUTRAL',
  TIGHTENING = 'TIGHTENING',
}

export enum StructureState {
  ALIGNED = 'ALIGNED',
  CONFLICT = 'CONFLICT',
}

export enum StabilityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  FLAT = 'FLAT',
}

export enum PositionState {
  ABOVE_MA = 'ABOVE_MA',
  BELOW_MA = 'BELOW_MA',
}

// Indicator Types

export interface IndicatorRaw {
  id: string
  symbol: string
  value: number
  timestamp: Date
  source: string
}

export interface IndicatorProcessed {
  id: string
  symbol: string
  value: number
  ma20: number
  ma60: number
  maDeviation: number
  zScore: number
  trendShort: TrendDirection
  positionMid: PositionState
  timestamp: Date
}

// Layer Types

export interface LayerState {
  id: string
  timestamp: Date
  riskState: RiskState
  liquidityState: LiquidityState
  structureState: StructureState
  stabilityLevel: StabilityLevel
}

// Market Regime

export interface MarketRegimeData {
  id: string
  regime: MarketRegime
  description: string
  riskState: RiskState
  liquidityState: LiquidityState
  stabilityLevel: StabilityLevel
  startDate: Date
  endDate?: Date
  durationDays: number
}

// API Response Types

export interface CurrentRegimeResponse {
  regime: MarketRegime
  description: string
  durationDays: number
  riskState: RiskState
  liquidityState: LiquidityState
  stabilityLevel: StabilityLevel
  updatedAt: Date
}

export interface IndicatorListResponse {
  indicators: IndicatorProcessed[]
  timestamp: Date
}

export interface RegimeHistoryResponse {
  regimes: MarketRegimeData[]
  total: number
}
