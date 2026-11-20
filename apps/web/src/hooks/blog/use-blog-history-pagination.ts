"use client"

import { useEffect, type Dispatch, type SetStateAction } from "react"

export function useBlogHistoryPagination(postsLength: number, pageSize: number, setVisibleCount: Dispatch<SetStateAction<number>>) {
  useEffect(() => {
    function restore(event: PopStateEvent) {
      const page = Number(new URL(window.location.href).searchParams.get("page")) || 1
      const count = event.state?.blogVisibleCount
      setVisibleCount(typeof count === "number" ? count : Math.min(page * pageSize, postsLength))
    }
    window.addEventListener("popstate", restore)
    return () => window.removeEventListener("popstate", restore)
  }, [postsLength, pageSize, setVisibleCount])
}
