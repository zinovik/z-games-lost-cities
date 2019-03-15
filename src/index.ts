import {
  BaseGame,
  BaseGameData,
  BaseGameMove,
  BaseGamePlayer,
} from 'z-games-base-game';

const PLAYERS_MIN = 1; // TODO: 2
const PLAYERS_MAX = 2;

const EXPEDITIONS_NUMBER = 5;
const MIN_COST = 2;
const MAX_COST = 10;
const INVESTMENT_CARDS_NUMBER = 3;
const START_CARDS_NUMBER = 8;

export interface LostCitiesData extends BaseGameData {
  cards: LostCitiesCard[];
  discards: LostCitiesCard[];
  cardsLeft: number;
  players: LostCitiesPlayer[];
}

export interface LostCitiesPlayer extends BaseGamePlayer {
  cardsHand: LostCitiesCard[];
  cardsHandCount: number;
  cardsExpeditions: LostCitiesCard[];
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

export const LOST_CITIES = 'Lost Cities';

export class LostCities extends BaseGame {
  private static instance: LostCities;

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }

  public getNewGame = (): { playersMax: number, playersMin: number, gameData: string } => {
    const gameData: LostCitiesData = {
      cards: [],
      discards: [],
      cardsLeft: 0,
      players: [],
    };

    return {
      playersMax: PLAYERS_MAX,
      playersMin: PLAYERS_MIN,
      gameData: JSON.stringify(gameData),
    };
  }

  public startGame = (gameDataJSON: string): { gameData: string, nextPlayersIds: string[] } => {
    const gameData: LostCitiesData = JSON.parse(gameDataJSON);
    const { cards } = gameData;
    let { players } = gameData;

    for (let i = 0; i < EXPEDITIONS_NUMBER; i++) {
      for (let j = MIN_COST; j < MAX_COST + 1; j++) {
        cards.push({
          cost: 0,
          expedition: i,
        });
      }

      for (let k = 0; k < INVESTMENT_CARDS_NUMBER; k++) {
        cards.push({
          cost: 0,
          expedition: i,
        });
      }
    }

    players = players.map(player => {
      const cardsHand: LostCitiesCard[] = [];

      for (let i = 0; i < START_CARDS_NUMBER; i++) {
        cardsHand.push(cards.splice(Math.floor(Math.random() * cards.length), 1)[0]);
      }

      return {
        ...player,
        cardsHand,
        cardsHandCount: START_CARDS_NUMBER,
        cardsExpeditions: [],
        points: 0,
      };
    });

    const cardsLeft = cards.length;

    const nextPlayersIds = [players[Math.floor(Math.random() * players.length)].id];

    return {
      gameData: JSON.stringify({
        ...gameData,
        cards,
        cardsLeft,
        players,
      }), nextPlayersIds,
    };
  }

  public parseGameDataForUser = ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }): string => {
    const gameData: LostCitiesData = JSON.parse(gameDataJSON);

    gameData.players.forEach((player, index) => {
      if (player.id !== userId) {
        gameData.players[index] = {
          ...gameData.players[index],
          cardsHand: [],
        };
      }
    });

    return JSON.stringify({ ...gameData, cards: [] });
  }

  public makeMove = ({ gameData: gameDataJSON, move: moveJSON, userId }: { gameData: string, move: string, userId: string }): {
    gameData: string,
    nextPlayersIds: string[],
  } => {
    const gameData: LostCitiesData = JSON.parse(gameDataJSON);
    const move: LostCitiesMove = JSON.parse(moveJSON);

    const { cards, discards, cardsLeft } = gameData;
    let { players } = gameData;
    const { card, discard, takeExpedition } = move;

    const playerNumber = this.getPlayerNumber({ userId, players });

    // TODO checkMove();

    players[playerNumber].cardsHand = players[playerNumber].cardsHand.filter(currentCard =>
      currentCard.cost !== card.cost && currentCard.expedition !== card.expedition);

    if (discard) {
      gameData.discards.push(card);
    } else {
      players[playerNumber].cardsExpeditions.push(card);
    }

    if (takeExpedition === null) {
      players[playerNumber].cardsHand.push(cards.splice(Math.floor(Math.random() * cards.length), 1)[0]);
    } else {
      let cardIndex = 0;
      discards.forEach((currentCard, index) => {
        if (currentCard.expedition === takeExpedition) {
          cardIndex = index;
        }
      });
      players[playerNumber].cardsHand.push(discards.splice(cardIndex, 1)[0]);
    }

    players[playerNumber].points = this.getPointsForPlayer(players[playerNumber]);

    const nextPlayersIds = [];

    if (cardsLeft) {
      if (playerNumber >= players.length - 1) {
        nextPlayersIds.push(players[0].id);
      } else {
        nextPlayersIds.push(players[playerNumber + 1].id);
      }
    } else {
      players = this.updatePlayerPlaces(players);
    }

    return {
      gameData: JSON.stringify({
        ...gameData,
        cards,
        players,
        cardsLeft: cards.length,
      }),
      nextPlayersIds,
    };
  }

  public getRules = (): string[] => {
    const rules = [];

    rules.push('Lost Cities is a 60-card card game, designed in 1999 by game designer Reiner Knizia and published by several publishers. The objective of the game is to mount profitable expeditions to one or more of the five lost cities (the Himalayas, the Brazilian Rain Forest, the Desert Sands, the Ancient Volcanos and Neptune\'s Realm). The game was originally intended as a 2-player game, but rule variants have been contributed by fans to allow 1 or 2 further players, causing Reiner Knizia himself to later provide semi-official 4-player rules.');

    rules.push('Lost Cities is a fast-moving game, with players playing or discarding, and then replacing, a single card each turn. Cards represent progress on one of the five color-coded expeditions. Players must decide, during the course of the game, how many of these expeditions to actually embark upon. Card-play rules are quite straightforward, but because players can only move forward on an expedition (by playing cards which are higher-numbered than those already played), making the right choice in a given game situation can be quite difficult. An expedition that has been started will earn points according to how much progress has been made when the game ends, and after three rounds, the player with the highest total score wins the game. Each expedition that is started but not thoroughly charted incurs a negative point penalty (investment costs).');

    rules.push('Interaction between players is indirect, in that one cannot directly impact another player\'s expeditions. However, since players can draw from the common discard piles, they are free to make use of opposing discards. Additionally, since the available cards for a given expedition are finite, progress made by an opponent in a given color can lead to difficulty making progress in that same color.');

    rules.push('The game\'s board, while designed to supplement the theme, is optional and consists only of simple marked areas where players place discards. If Lost Cities had four expeditions instead of five, it could be played with a standard deck of playing cards. When doing so, the face cards would represent investment cards, with numbered cards two through ten serving as the expedition progress cards.');

    return rules;
  }

  private getPointsForPlayer = (player: LostCitiesPlayer): number => {
    let points = 0;
    let lastCard = 0;

    player.cardsHand.forEach(card => {
      if (card.cost !== lastCard + 1) {
        points += card.cost;
      }

      lastCard = card.cost;
    });

    return points;
  }

  private updatePlayerPlaces = (players: LostCitiesPlayer[]): LostCitiesPlayer[] => {
    const playersPlaces: Array<{ id: string, points: number }> = [];

    players.forEach(player => {
      playersPlaces.push({ id: player.id, points: player.points });
    });

    playersPlaces.sort((a, b) => a.points - b.points);

    return players.map(player => {
      let place = 0;

      playersPlaces.forEach((playersPlace, i) => {
        if (player.id === playersPlace.id) {
          place = i + 1;
        }
      });

      return {
        ...player,
        place,
      };
    });
  }

  private getPlayerNumber = ({ userId, players }: { userId: string, players: LostCitiesPlayer[] }): number => {
    let playerNumber = 0;

    players.forEach((player, index) => {
      if (player.id === userId) {
        playerNumber = index;
      }
    });

    return playerNumber;
  }
}
