// Configuration for the Cake Party Bot

/**
 * Custom emojis for ingredients and roles
 * 
 * Custom Discord emojis format: 
 * - Regular emojis: <:name:id>
 * - Animated emojis: <a:name:id>
 * 
 * To use emojis from other servers, add them here with their full ID.
 * The bot must be in those servers to use their emojis.
 * 
 * You can get emoji IDs by typing \:emoji_name: in Discord
 * (add a backslash before the emoji name)
 */
const emojis = {
  // New server emojis
  apple: '<:Apple:1364749232204152873>',
  blueberry: '<:Blueberry:1364750405338271835>',
  sweetleaf: '<:Sweetleaf:1364749235547017246>',
  milk: '<:Milk:1364749224599879780>',
  egg: '<:Egg:1364749064226209904>',
  flour: '<:Flour:1364749221978177617>',
  butter: '<:Butter:1364749228827607141>',
  sugar: '<:Sugar:1364749093800513678>',
  star: '<:Star:1364749225799454801>',
  cakebatter: '<:Cakebatter:1364749218467811338>',
  fruitfrosting: '<:Fruitfrosting:1364749220745187338>',
  jelliedcakelayer: '<:Jelliedcakelayer:1364749526883369001>',
  cakelayer: '<:Cakelayer:1364749223303843842>',
  frosting: '<:Frosting:1364749219474309242>',
  groundsweetleaf: '<:Groundsweetleaf:1364749217595129968>',
  celebrationcake: '<:Celebrationcake:1364749415386058785>',
  lockbox: '<:Lockbox:1364749337246302230>',
  
  // Original server emojis (kept as backup)
  original_apple: '<:apple:1364650758775247059>',
  original_blueberry: '<:blueberry:1364650527513645209>',
  original_sweetleaf: '<:sweetleaf:1364650657184747571>',
  original_milk: '<:milk:1364650830095192186>',
  original_egg: '<:egg:1364651054725337261>',
  original_flour: '<:flour:1364651107497803796>',
  original_butter: '<:butter:1364651171649814618>',
  original_sugar: '<:sugar:1364651294794448987>',
  original_star: '<:star:1364651827886555146>',
  original_cakebatter: '<:cakebatter:1364653780112510996>',
  original_fruitfrosting: '<:fruitfrosting:1364653475811561603>',
  original_jelliedcakelayer: '<:jelliedcakelayer:1364653208777003048>',
  original_cakelayer: '<:cakelayer:1364653062437736620>',
  original_frosting: '<:frosting:1364652782795227227>',
  original_groundsweetleaf: '<:groundsweetleaf:1364652261766201475>',
  original_celebrationcake: '<:celebrationcake:1364657276954214522>',
  original_lockbox: '<:lockbox:1364652635495465022>',
  
  // Standard Unicode emojis
  party: '🥳',
  cake: '🎂',
  balloon: '🎈',
  confetti: '🎊',
  sparkles: '✨',
  tada: '🎉',
  partying_face: '🥳',
  gift: '🎁',
  heart: '💖',
  star2: '🌟'
};

// Role definitions with base ingredients
const roles = {
  starter: {
    id: 'join_starter',
    name: 'Starter',
    emoji: emojis.celebrationcake,
    baseIngredients: [
      { emoji: emojis.star + ' ' + emojis.blueberry, count: 1 }
    ],
    maxMembers: 1,
    tip: 'Also needs the Celebration Cake Recipe',
    scalingFactor: 0 // No scaling for starter
  },
  batterer: {
    id: 'join_batterer',
    name: 'Batterer',
    emoji: emojis.cakebatter,
    baseIngredients: [
      { emoji: emojis.butter, count: 3 },
      { emoji: emojis.egg, count: 3 },
      { emoji: emojis.flour, count: 3 }
    ],
    maxMembers: 3,
    tip: 'Lock away your milk so you don\'t accidentally use it!',
    scalingFactor: 0 // Evenly divided among all batterers
  },
  froster: {
    id: 'join_froster',
    name: 'Froster',
    emoji: emojis.frosting,
    baseIngredients: [
      { emoji: emojis.milk, count: 1 },
      { emoji: emojis.butter, count: 1 }
    ],
    maxMembers: 1,
    tip: 'Lock away your flour so you don\'t accidentally use it!',
    scalingFactor: 0 // No scaling for froster
  },
  fruitfroster: {
    id: 'join_fruitfroster',
    name: 'Fruit Froster',
    emoji: emojis.fruitfrosting,
    baseIngredients: [
      { emoji: emojis.star + ' ' + emojis.apple + '/' + emojis.star + ' ' + emojis.blueberry, count: 3 },
      { emoji: emojis.sugar, count: 3 }
    ],
    maxMembers: 3,
    scalingFactor: 0 // Evenly divided among all fruit frosters
  },
  leafer: {
    id: 'join_leafer',
    name: 'Leafer',
    emoji: emojis.groundsweetleaf,
    baseIngredients: [
      { emoji: emojis.sweetleaf, count: 4 }
    ],
    maxMembers: 4,
    scalingFactor: 0 // Evenly divided among all leafers
  },
  spreader: {
    id: 'join_spreader',
    name: 'Spreader',
    emoji: emojis.jelliedcakelayer,
    baseIngredients: [],
    maxMembers: 3,
    tip: 'You can also join as a Baker at the same time!',
    scalingFactor: 0
  },
  baker: {
    id: 'join_baker',
    name: 'Baker',
    emoji: emojis.cakelayer,
    baseIngredients: [],
    maxMembers: 3,
    tip: 'You can also join as a Spreader at the same time!',
    scalingFactor: 0
  }
};

// Mapping from button IDs to role names
const roleMap = {
  join_starter: 'Starter',
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
