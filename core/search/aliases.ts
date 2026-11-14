/**
 * Names people actually type for places whose official name they do not know.
 *
 * Each rule applies to every searchable item whose folded name contains
 * `match`, so "Swayambhu" covers the stupa, the hill and the museum alike.
 * Spelling variants close enough to be caught by typo tolerance are left out;
 * these are the ones that are not: other transliterations, nicknames, and the
 * English a guidebook uses.
 */
export type AliasRule = { match: string; aliases: readonly string[] };

export const SEARCH_ALIASES: readonly AliasRule[] = [
  { match: 'swayambhu', aliases: ['swayambhunath', 'syambhunath', 'swoyambhu', 'monkey temple', 'स्वयम्भू', 'स्वयम्भूनाथ'] },
  { match: 'boudha', aliases: ['boudhanath', 'bouddhanath', 'bodhnath', 'bodnath', 'khasti', 'बौद्धनाथ', 'बौद्ध'] },
  { match: 'pashupati', aliases: ['pashupatinath', 'pasupati', 'पशुपतिनाथ'] },
  { match: 'maya devi', aliases: ['mayadevi', 'birthplace of buddha', 'buddha birthplace', 'मायादेवी'] },
  { match: 'ashokan pillar', aliases: ['ashoka pillar', 'asoka pillar', 'lumbini pillar'] },
  { match: 'puskarini', aliases: ['pushkarini', 'sacred pond', 'holy pond'] },
  { match: 'world peace pagoda', aliases: ['shanti stupa', 'peace stupa', 'japanese peace pagoda'] },
  { match: 'kathmandu durbar square', aliases: ['hanuman dhoka', 'basantapur', 'basantapur durbar square', 'kathmandu palace square'] },
  { match: 'patan durbar square', aliases: ['lalitpur durbar square', 'mangal bazaar', 'yala'] },
  { match: 'bhaktapur durbar square', aliases: ['bhadgaon', 'khwopa', 'bhaktapur palace square'] },
  { match: 'kasthamandap', aliases: ['kashthamandap', 'maru sattal', 'wooden pavilion'] },
  { match: 'kumari ghar', aliases: ['kumari chowk', 'living goddess', 'house of the living goddess'] },
  { match: 'tilaurakot', aliases: ['kapilvastu', 'kapilavastu', 'kapilbastu', 'shakya palace'] },
  { match: 'ramagrama', aliases: ['ramgram', 'ramgrama'] },
  { match: 'changu narayan', aliases: ['changunarayan', 'changu', 'चाँगु'] },
  { match: 'budhanilkantha', aliases: ['sleeping vishnu', 'budanilkantha'] },
  { match: 'garden of dreams', aliases: ['swapna bagaicha', 'keshar mahal'] },
  { match: 'nyatapola', aliases: ['five storey temple', 'five-storey temple'] },
  { match: 'dharahara', aliases: ['bhimsen tower'] },
  { match: 'everest base camp', aliases: ['ebc', 'khumbu', 'sagarmatha base camp'] },
  { match: 'poon hill', aliases: ['ghorepani', 'pun hill'] },
  { match: 'langtang', aliases: ['kyanjin', 'kyanjin gompa'] },
  { match: 'chitwan national park', aliases: ['chitwan', 'sauraha', 'jungle safari'] },
];
