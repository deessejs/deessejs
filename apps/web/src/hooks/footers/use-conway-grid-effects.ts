"use client"

import { useEffect, useLayoutEffect, type Dispatch, type MutableRefObject } from "react"
import type { SimAction, SimState } from "@/components/footers/conway-grid"

type Props = {
  wrapperRef: MutableRefObject<HTMLDivElement | null>
  sim: SimState
  cols: number
  rows: number
  isInView: boolean
  docVisible: boolean
  reduceMotion: boolean
  dispatch: Dispatch<SimAction>
  setIsInView: (value: boolean) => void
  setDocVisible: (value: boolean) => void
  setCursor: (update: (current: [number, number] | null) => [number, number] | null) => void
  gridRef: MutableRefObject<Uint8Array>
  modeRef: MutableRefObject<SimState["mode"]>
  countdownRef: MutableRefObject<number>
  endGesture: () => void
  cellSize: number
  rowsCount: number
  tickMs: number
  firstInjectionMin: number
  firstInjectionMax: number
  nextInjectionMin: number
  nextInjectionMax: number
  retryTicks: number
  seedGrid: (cols: number, rows: number, rng: () => number) => Uint8Array
  randomInRange: (min: number, max: number, rng: () => number) => number
  pickInjection: (grid: Uint8Array, cols: number, rows: number, rng: () => number) => { pattern: Extract<SimAction, { type: "INJECT" }>["pattern"]; x: number; y: number } | null
}

export function useConwayGridEffects({ wrapperRef, sim, cols, rows, isInView, docVisible, reduceMotion, dispatch, setIsInView, setDocVisible, setCursor, gridRef, modeRef, countdownRef, endGesture, cellSize, rowsCount, tickMs, firstInjectionMin, firstInjectionMax, nextInjectionMin, nextInjectionMax, retryTicks, seedGrid, randomInRange, pickInjection }: Props) {
  useEffect(() => {
    gridRef.current = sim.grid
    modeRef.current = sim.mode
  }, [sim.grid, sim.mode, gridRef, modeRef])

  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const measured = Math.floor(el.getBoundingClientRect().width / cellSize)
    if (measured < 3) return
    dispatch({ type: "SEED", grid: seedGrid(measured, rowsCount, Math.random), cols: measured, rows: rowsCount })
    countdownRef.current = randomInRange(firstInjectionMin, firstInjectionMax, Math.random)
  }, [wrapperRef, dispatch, countdownRef, cellSize, rowsCount, seedGrid, randomInRange, firstInjectionMin, firstInjectionMax])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const measured = Math.floor(el.getBoundingClientRect().width / cellSize)
      if (measured === cols) return
      endGesture()
      if (measured >= 3) {
        dispatch({ type: "SEED", grid: seedGrid(measured, rowsCount, Math.random), cols: measured, rows: rowsCount })
        countdownRef.current = randomInRange(firstInjectionMin, firstInjectionMax, Math.random)
        setCursor((current) => current ? [Math.min(current[0], measured - 1), Math.min(current[1], rowsCount - 1)] : current)
      } else dispatch({ type: "SEED", grid: new Uint8Array(0), cols: 0, rows: rowsCount })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [wrapperRef, cols, dispatch, countdownRef, setCursor, endGesture, cellSize, rowsCount, seedGrid, randomInRange, firstInjectionMin, firstInjectionMax])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => { if (entry) setIsInView(entry.isIntersecting) }, { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [wrapperRef, setIsInView])

  useEffect(() => {
    const onVisibilityChange = () => setDocVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [setDocVisible])

  useEffect(() => {
    if (cols < 3 || !isInView || !docVisible || reduceMotion) return
    const interval = window.setInterval(() => {
      const current = gridRef.current
      if (modeRef.current === "active") dispatch({ type: "STEP" })
      countdownRef.current = Math.max(0, countdownRef.current - 1)
      if (countdownRef.current > 0) return
      const pick = pickInjection(current, cols, rows, Math.random)
      if (!pick) { countdownRef.current = retryTicks; return }
      dispatch({ type: "INJECT", pattern: pick.pattern, x: pick.x, y: pick.y })
      countdownRef.current = randomInRange(nextInjectionMin, nextInjectionMax, Math.random)
    }, tickMs)
    return () => window.clearInterval(interval)
  }, [cols, rows, isInView, docVisible, reduceMotion, dispatch, gridRef, modeRef, countdownRef, pickInjection, retryTicks, randomInRange, nextInjectionMin, nextInjectionMax, tickMs])
}
