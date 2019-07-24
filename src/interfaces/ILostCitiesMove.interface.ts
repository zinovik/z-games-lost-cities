import { ILostCitiesCard } from './';

export interface ILostCitiesMove {
  card: ILostCitiesCard;
  isDiscard: boolean;
  takeExpedition: number;
}
