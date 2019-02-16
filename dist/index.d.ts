import { BaseGame, BaseGameData, BaseGameMove, BaseGamePlayer } from 'z-games-base-game';
export interface LostCitiesData extends BaseGameData {
    cards: number[];
    discards: number[][];
    cardsLeft: number;
    players: LostCitiesPlayer[];
}
export interface LostCitiesPlayer extends BaseGamePlayer {
    cardsHand: LostCitiesCard[];
    cardsExpeditions: number[][];
    points: number;
}
export interface LostCitiesMove extends BaseGameMove {
    card: LostCitiesCard;
    discard: boolean;
    takeExpedition: number;
}
export interface LostCitiesCard {
    cost: number;
    expedition: number;
}
export declare class LostCities extends BaseGame {
    private static instance;
    static readonly Instance: LostCities;
    getNewGame: () => {
        playersMax: number;
        playersMin: number;
        gameData: string;
    };
    startGame: (gameDataJSON: string) => {
        gameData: string;
        nextPlayersIds: string[];
    };
    parseGameDataForUser: ({ gameData: gameDataJSON, userId }: {
        gameData: string;
        userId: string;
    }) => string;
    makeMove: ({ gameData: gameDataJSON, move: moveJSON, userId }: {
        gameData: string;
        move: string;
        userId: string;
    }) => {
        gameData: string;
        nextPlayersIds: string[];
    };
    getRules: () => string[];
    private getPointsForPlayer;
    private updatePlayerPlaces;
    private getPlayerNumber;
}
