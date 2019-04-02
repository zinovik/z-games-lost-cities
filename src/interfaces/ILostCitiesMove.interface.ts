import { IBaseGameMove } from 'z-games-base-game';

import { ILostCitiesCard } from './';

export interface ILostCitiesMove extends IBaseGameMove {
  card: ILostCitiesCard;
  discard: boolean;
  takeExpedition: number;
}
