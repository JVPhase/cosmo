export type CharacterId = 'lien' | 'riva' | 'graves' | 'alex';

export type CharacterGender = 'female' | 'male';

export type CharacterOrientation = 'straight' | 'gay' | 'lesbian';

export type Character = {
  id: CharacterId;
  name: string;
  role: string;
  gender: CharacterGender;
  orientation: CharacterOrientation;
  appearance: string;
  icon: string;
  greeting: string;
  garbledMessage: string;
  messages: readonly string[];
  sectorCompleteMessages: readonly string[];
  metalDealIntro: string;
  metalDealOffer: string;
};

export const CHARACTER_IMAGES: Record<string, number> = {
  lien:   require('../../assets/lien.png'),
  riva:   require('../../assets/riva.png'),
  graves: require('../../assets/graves.png'),
  alex:   require('../../assets/alex.png'),
};
