export const BUILDING_TYPES = [
  "High Rise",
  "Mid Rise",
  "Low Rise",
  "Rental",
  "Town Houses",
  "Lofts",
  "Bungalows",
] as const;

export const BUILDING_FEATURES = [
  "Concierge",
  "No Pets Allowed",
  "Pets Allowed",
  "Phone Entry System",
  "Security Guard",
] as const;

export const AMENITIES = [
  "Basketball Court",
  "BBQ / Grill Area",
  "Bicycle Parking",
  "Business Centre",
  "Car Wash",
  "Elevator(s)",
  "Guest Suite(s)",
  "Gym / Excercise Room",
  "Hot Tub / Jacuzzi",
  "Laundry Room",
  "Library",
  "Media Room",
  "Meeting Room",
  "Moving Elevator(s)",
  "Outdoor Patio/Garden",
  "Parking Garage",
  "Party Room(s)",
  "Playground (inside)",
  "Playground (outside)",
  "Pool",
  "Rec Center",
  "Rooftop Deck",
  "Sauna",
  "Spa",
  "Squash Court(s)",
  "Tennis Court(s)",
  "Visitor Lounge",
  "Visitor Parking",
  "Whirlpool",
  "Yoga Studio",
] as const;

export const COMMON_AREAS = [
  "Balcony",
  "Corridor",
  "Garbage Chutes",
  "Garbage Room",
  "Lobby",
  "Locker Area",
  "Mechanical Room",
  "Moving Room",
  "Outdoor Grounds",
  "Parkade",
  "Patio",
  "Roof",
  "Stairwell(s)",
  "Terrace",
] as const;

export const CORPORATIONS = [
  { value: "", label: "Select" },
  { value: "none", label: "None" },
  { value: "WNCC", label: "WNCC - Waterloo North Condominium Corp" },
  { value: "MTCC", label: "MTCC - Metro Toronto Condominium Corporation" },
  { value: "TSCC", label: "TSCC - Toronto Standard Condominium Corporation" },
  { value: "YCC", label: "YCC - York Condominium Corporation" },
] as const;

export const LINKED_BUILDINGS = [
  { id: "2125709458", label: "WNCC47 - (WNCC 47) 49 Cedar... - Kitchener" },
  { id: "2125709461", label: "WNCC127 - (WNCC 127) 54 Gre... - Kitchener" },
  { id: "2125709897", label: "WNCC112 - (WNCC 112) 476 Ki... - Waterloo" },
  { id: "2125710005", label: "WNCC147 - (WNCC 147) 10 Ell... - Kitchener" },
  { id: "2125709952", label: "WNCC 150 - (WNCC 150) 49 McI... - Kitchener" },
  { id: "2125709582", label: "WCC75 - (WCC75) 31 Greeng... - Guelph" },
] as const;

export const CANADIAN_PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
  "Northwest Territories",
  "Nanavut",
] as const;
