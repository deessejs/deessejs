export type VitestOverrides = {
    include?: string[];
    testTimeout?: number;
    hookTimeout?: number;
    pool?: "threads" | "forks" | "vmThreads";
    setupFiles?: string[];
    coverage?: boolean | object;
    clearMocks?: boolean;
    restoreMocks?: boolean;
    environment?: "node" | "jsdom" | "happy-dom";
};
export declare const vitestConfig: (overrides?: VitestOverrides) => import("vite").UserConfig;
//# sourceMappingURL=index.d.ts.map