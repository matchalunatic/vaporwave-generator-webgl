type AppStateType = {
    appWidth: number;
    appHeight: number;
    debugShaders: (t: number) => boolean;
}

let AppState: AppStateType = {
    appWidth: 1,
    appHeight: 1,
    debugShaders: (t: number) => {
        return t % 5000 < 2000;
    },
}

export { AppState }
export type { AppStateType }
