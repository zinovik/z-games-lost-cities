import { IBaseGameData } from 'z-games-base-game';

import { ILostCitiesPlayer, ILostCitiesCard } from './';

export interface ILostCitiesData extends IBaseGameData {
  cards: ILostCitiesCard[];
  discards: ILostCitiesCard[];
  discardsCount: number[];
  cardsLeft: number;
  players: ILostCitiesPlayer[];
}
