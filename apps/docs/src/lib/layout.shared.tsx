import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { appName, gitConfig } from "./shared"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <svg
            width="20"
            height="17.5"
            viewBox="0 0 109 95"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="text-foreground"
          >
            <path
              d="M36.377 61.0078L16.877 94.5078H0.876953L28.377 48.0078L36.377 61.0078Z"
              fill="currentColor"
            />
            <path
              d="M43.877 94.0078H27.877L46.877 62.0078V61.0078L33.877 38.5078L41.377 25.0078L62.877 61.5078L43.877 94.0078Z"
              fill="currentColor"
            />
            <path
              d="M107.877 94.0078H54.877L62.877 80.0078H99.877L107.877 94.0078Z"
              fill="currentColor"
            />
            <path
              d="M94.877 71.0078H78.877L46.877 15.0078L54.877 1.00781L94.877 71.0078Z"
              fill="currentColor"
            />
            <path
              d="M36.377 61.0078L16.877 94.5078H0.876953L28.377 48.0078L36.377 61.0078Z"
              stroke="currentColor"
            />
            <path
              d="M43.877 94.0078H27.877L46.877 62.0078V61.0078L33.877 38.5078L41.377 25.0078L62.877 61.5078L43.877 94.0078Z"
              stroke="currentColor"
            />
            <path
              d="M107.877 94.0078H54.877L62.877 80.0078H99.877L107.877 94.0078Z"
              stroke="currentColor"
            />
            <path
              d="M94.877 71.0078H78.877L46.877 15.0078L54.877 1.00781L94.877 71.0078Z"
              stroke="currentColor"
            />
          </svg>
          <span>{appName}</span>
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}
