import { IBaseGameData } from 'z-games-base-game';

import { ILostCitiesPlayer, ILostCitiesCard } from './';

export interface ILostCitiesData extends IBaseGameData {
  cards: ILostCitiesCard[];
  discards: ILostCitiesCard[];
  cardsLeft: number;
  players: ILostCitiesPlayer[];
}
