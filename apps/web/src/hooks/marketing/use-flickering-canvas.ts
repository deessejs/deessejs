"use client"

import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react"

type GridParams = { cols: number; rows: number; squares: Float32Array; dpr: number }

export function useFlickeringCanvas(args: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  containerRef: RefObject<HTMLDivElement | null>
  width: number | undefined
  height: number | undefined
  isInView: boolean
  setIsInView: Dispatch<SetStateAction<boolean>>
  setCanvasSize: Dispatch<SetStateAction<{ width: number; height: number }>>
  setupCanvas: (canvas: HTMLCanvasElement, width: number, height: number) => GridParams
  updateSquares: (squares: Float32Array, deltaTime: number) => void
  drawGrid: (ctx: CanvasRenderingContext2D, width: number, height: number, cols: number, rows: number, squares: Float32Array, dpr: number) => void
}) {
  const { canvasRef, containerRef, width, height, isInView, setIsInView, setCanvasSize, setupCanvas, updateSquares, drawGrid } = args
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const context = canvas?.getContext("2d") ?? null
    let frame: number | null = null
    let grid: GridParams | null = null
    if (canvas && container && context) {
      const resize = () => {
        const nextWidth = width || container.clientWidth
        const nextHeight = height || container.clientHeight
        setCanvasSize({ width: nextWidth, height: nextHeight })
        grid = setupCanvas(canvas, nextWidth, nextHeight)
      }
      resize()
      let lastTime = 0
      const animate = (time: number) => {
        if (!isInView || !grid) return
        const delta = (time - lastTime) / 1000
        lastTime = time
        updateSquares(grid.squares, delta)
        drawGrid(context, canvas.width, canvas.height, grid.cols, grid.rows, grid.squares, grid.dpr)
        frame = requestAnimationFrame(animate)
      }
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        if (entry) setIsInView(entry.isIntersecting)
      }, { threshold: 0 })
      intersectionObserver.observe(canvas)
      if (isInView) frame = requestAnimationFrame(animate)
      return () => {
        if (frame !== null) cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
      }
    }
    return () => { if (frame !== null) cancelAnimationFrame(frame) }
  }, [canvasRef, containerRef, width, height, isInView, setIsInView, setCanvasSize, setupCanvas, updateSquares, drawGrid])
}
