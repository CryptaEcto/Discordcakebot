// Configuration for the Cake Party Bot

// Custom emojis for ingredients and roles
const emojis = {
  apple: '<:apple:1364650758775247059>',
  blueberry: '<:blueberry:1364650527513645209>',
  sweetleaf: '<:sweetleaf:1364650657184747571>',
  milk: '<:milk:1364650830095192186>',
  egg: '<:egg:1364651054725337261>',
  flour: '<:flour:1364651107497803796>',
  butter: '<:butter:1364651171649814618>',
  sugar: '<:sugar:1364651294794448987>',
  star: '<:star:1364651827886555146>',
  cakebatter: '<:cakebatter:1364653780112510996>',
  fruitfrosting: '<:fruitfrosting:1364653475811561603>',
  jelliedcakelayer: '<:jelliedcakelayer:1364653208777003048>',
  cakelayer: '<:cakelayer:1364653062437736620>',
  frosting: '<:frosting:1364652782795227227>',
  groundsweetleaf: '<:groundsweetleaf:1364652261766201475>',
  celebrationcake: '<:celebrationcake:1364657276954214522>',
  lockbox: '<:lockbox:1364652635495465022>'
};

// Role definitions with base ingredients
const roles = {
  batterer: {
    id: 'join_batterer',
    name: 'Batterer',
    emoji: emojis.cakebatter,
    baseIngredients: [
      { emoji: emojis.egg, count: 3 },
      { emoji: emojis.butter, count: 3 },
      { emoji: emojis.milk, count: 1 }
    ],
    scalingFactor: 0.5 // How much ingredients increase per additional person
  },
  froster: {
    id: 'join_froster',
    name: 'Froster',
    emoji: emojis.frosting,
    baseIngredients: [
      { emoji: emojis.egg, count: 1 },
      { emoji: emojis.butter, count: 1 },
      { emoji: emojis.flour, count: 1 }
    ],
    scalingFactor: 0.5
  },
  fruitfroster: {
    id: 'join_fruitfroster',
    name: 'Fruit Froster',
    emoji: emojis.fruitfrosting,
    baseIngredients: [
      { emoji: emojis.star + emojis.apple, count: 2 },
      { emoji: emojis.star + emojis.blueberry, count: 2 }
    ],
    scalingFactor: 0.5
  },
  leafer: {
    id: 'join_leafer',
    name: 'Leafer',
    emoji: emojis.groundsweetleaf,
    baseIngredients: [
      { emoji: emojis.sweetleaf, count: 2 }
    ],
    scalingFactor: 0.5
  },
  spreader: {
    id: 'join_spreader',
    name: 'Spreader',
    emoji: emojis.jelliedcakelayer,
    baseIngredients: [
      { emoji: emojis.sugar, count: 2 }
    ],
    scalingFactor: 0.5
  },
  baker: {
    id: 'join_baker',
    name: 'Baker',
    emoji: emojis.cakelayer,
    baseIngredients: [],
    scalingFactor: 0
  }
};

// Mapping from button IDs to role names
const roleMap = {
  join_batterer: 'Batterer',
  join_froster: 'Froster',
  join_fruitfroster: 'Fruit Froster',
  join_leafer: 'Leafer',
  join_spreader: 'Spreader',
  join_baker: 'Baker'
};

// Colors used in embeds
const colors = {
  help: '#f7c8ff',
  party: '#ffdde0',
  success: '#baffc9',
  error: '#ffb3ba'
};

module.exports = {
  emojis,
  roles,
  roleMap,
  colors
};
