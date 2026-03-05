import type { Venue, TvVenue } from "@/types";

export const ALL_VENUES: Venue[] = [
  // Tennis Australia (play.tennis.com.au)
  { id: "ta-batemans", name: "Batemans Bay Tennis Courts", source: "tennisAu", slug: "BatemansBayTennisCourts", suburb: "Batemans Bay" },
  { id: "ta-bega", name: "Bega Tennis Club", source: "tennisAu", slug: "BegaTennisClub", suburb: "Bega" },
  { id: "ta-byrnes", name: "Byrnes Street Tennis Courts", source: "tennisAu", slug: "ByrnesStreetTennisCourts", suburb: "South Granville" },
  { id: "ta-casino", name: "Casino Town Tennis Club", source: "tennisAu", slug: "CasinoTownTennisClub", suburb: "Casino" },
  { id: "ta-central", name: "Central Gardens Tennis Courts", source: "tennisAu", slug: "CentralGardensTennisCourts", suburb: "Greystanes" },
  { id: "ta-civic", name: "Civic Park Tennis Courts", source: "tennisAu", slug: "CivicParkTennisCourts", suburb: "Pendle Hill" },
  { id: "ta-copacabana", name: "Copacabana Tennis Club", source: "tennisAu", slug: "CopacabanaTennisClub", suburb: "Copacabana" },
  { id: "ta-cowra", name: "Cowra Tennis Club", source: "tennisAu", slug: "CowraTennisClub", suburb: "Cowra" },
  { id: "ta-dirrabarri", name: "Dirrabarri Tennis Courts", source: "tennisAu", slug: "DirrabarriTennisCourts", suburb: "Pemulwuy" },
  { id: "ta-fullagar", name: "Fullagar Road Tennis Courts", source: "tennisAu", slug: "FullagarRoadTennisCourts", suburb: "Wentworthville" },
  { id: "ta-greystanes", name: "Greystanes Sportsground Tennis Courts", source: "tennisAu", slug: "GreystanesSportsgroundTennisCourts", suburb: "Greystanes" },
  { id: "ta-griffith", name: "Griffith Tennis Club", source: "tennisAu", slug: "GriffithTennisClub", suburb: "Griffith" },
  { id: "ta-guildford", name: "Guildford West Sports Ground", source: "tennisAu", slug: "GuildfordWestSportsGround", suburb: "Guildford West" },
  { id: "ta-hinton", name: "Hinton and District Tennis Club", source: "tennisAu", slug: "HintonAndDistrictTennisClub", suburb: "Hinton" },
  { id: "ta-lambton", name: "Lambton Park Tennis Club", source: "tennisAu", slug: "LambtonParkTennisClub", suburb: "Lambton" },
  { id: "ta-lawson", name: "Lawson Square Park Tennis Courts", source: "tennisAu", slug: "LawsonSquareParkTennisCourts", suburb: "Merrylands" },
  { id: "ta-merrylands", name: "Merrylands Park Tennis Courts", source: "tennisAu", slug: "MerrylandsParkTennisCourts", suburb: "Merrylands" },
  { id: "ta-parramatta", name: "Parramatta City Tennis", source: "tennisAu", slug: "ParramattaCityTennis", suburb: "Parramatta" },
  { id: "ta-paramount", name: "Paramount Tennis Club Dubbo", source: "tennisAu", slug: "Paramounttennisclubdubbo", suburb: "Dubbo" },
  { id: "ta-parkes", name: "Parkes Tennis Club", source: "tennisAu", slug: "ParkesTennisClub", suburb: "Parkes" },
  { id: "ta-soldiers", name: "Soldiers Point Tennis Club", source: "tennisAu", slug: "SoldiersPointTennisClub", suburb: "Soldiers Point" },
  { id: "ta-tilligerry", name: "Tilligerry Tennis Club", source: "tennisAu", slug: "TilligerryTennisClub", suburb: "Mallabula" },
  { id: "ta-tyneside", name: "Tyneside Tennis Courts", source: "tennisAu", slug: "TynesideTennisCourts", suburb: "Willoughby" },
  { id: "ta-wagga", name: "Wagga Wagga Tennis Association", source: "tennisAu", slug: "WaggaWaggaTennisAssociation", suburb: "Wagga Wagga" },
  { id: "ta-wyong", name: "Wyong District Tennis Association", source: "tennisAu", slug: "WyongDistrictTennisAssociation", suburb: "Wyong" },

  // Hills Shire (bookable.net.au)
  { id: "hills-15", name: "Annangrove Reserve Tennis Courts", source: "hills", venueId: 15, bookingSlug: "annangrove-reserve-tennis-courts", suburb: "Annangrove" },
  { id: "hills-80", name: "Balmoral Reserve Tennis Courts", source: "hills", venueId: 80, bookingSlug: "balmoral-reserve-tennis-courts", suburb: "Kellyville" },
  { id: "hills-17", name: "Bella Vista Tennis Courts", source: "hills", venueId: 17, bookingSlug: "bella-vista-tennis-courts", suburb: "Bella Vista" },
  { id: "hills-20", name: "Bernie Mullane Tennis Courts", source: "hills", venueId: 20, bookingSlug: "bernie-mullane-tennis-courts", suburb: "Kellyville" },
  { id: "hills-31", name: "Crestwood Reserve Tennis Courts", source: "hills", venueId: 31, bookingSlug: "crestwood-reserve-tennis-courts", suburb: "Baulkham Hills" },
  { id: "hills-87", name: "Gables Central Playing Fields Tennis Courts", source: "hills", venueId: 87, bookingSlug: "gables-central-playing-fields-tennis-courts", suburb: "Box Hill" },
  { id: "hills-25", name: "Kenthurst Park Tennis Courts", source: "hills", venueId: 25, bookingSlug: "kenthurst-park-tennis-courts", suburb: "Kenthurst" },
  { id: "hills-23", name: "Les Shore Reserve Tennis Courts", source: "hills", venueId: 23, bookingSlug: "les-shore-reserve-tennis-courts", suburb: "Glenorie" },
  { id: "hills-19", name: "Ted Horwood Reserve Tennis Courts", source: "hills", venueId: 19, bookingSlug: "ted-horwood-reserve-tennis-courts", suburb: "Baulkham Hills" },
];

export const TV_VENUES: TvVenue[] = [
  { id: "tv-north-rocks", name: "North Rocks Tennis Club", source: "tv", clientId: "north-rocks-tc", venueId: "2225", suburb: "North Rocks" },
];

export const SEARCHABLE_VENUES: Venue[] = [...ALL_VENUES, ...TV_VENUES];
