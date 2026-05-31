import type { CompanyBuilding } from "../../../resident/data/types";

const MVP_ADMINS =
  "Admin MVP Condos, Cientlyn Porras, Claudio Lim, Darren East, Gay Hundey, Mayflor Paraunda, Office MVP Condos, Reyneil Paraunda, Richelle Diane, Scott Hundey, Vina Porras";

function building(
  id: string,
  code: string,
  name: string,
  condoLine: string,
  cityProvincePostal: string,
  units: number,
  adminsCount: number,
  users: number,
  admins: string = MVP_ADMINS,
  subscriptionPackage = "Basic Package"
): CompanyBuilding {
  return {
    id,
    code,
    name,
    condoLine,
    cityProvincePostal,
    address: `${condoLine}, ${cityProvincePostal}`,
    admins,
    unitsCount: units,
    adminsCount,
    usersCount: users,
    imageUrl: `https://picsum.photos/seed/bld-${id}/100/80`,
    subscriptionPackage,
    status: "active",
    lastActivity: "2026-05-20",
  };
}

/** Legacy `/admin/condos/condos/` list — 25 properties */
export const seedCompanyBuildings: CompanyBuilding[] = [
  building("2125709899", "ECC3", "ECC 3", "(ECC 3) 301 Carlow Road", "Port Stanley, Ontario N5L 1B7", 51, 16, 78),
  building(
    "2125710006",
    "HSCC17",
    "HSCC 17",
    "(HSCC 17) 14 Saunders Drive",
    "Jarvis, Ontario N0A 1J0",
    24,
    11,
    40,
    "Admin MVP Condos, Cientlyn Porras, Claudio Lim, Darren East, Gay Hundey, Joel Eby, Mayflor Paraunda, Reyneil Paraunda, Richelle Diane, Scott Hundey, Vina Porras"
  ),
  building(
    "2125710007",
    "HVLCC21",
    "HVLCC 21",
    "(HVLCC 21) 24 Craddock Blvd",
    "Jarvis, Ontario N0A 1J0",
    25,
    11,
    43,
    "Admin MVP Condos, Cientlyn Porras, Claudio Lim, Darren East, Gay Hundey, Joel Eby, Mayflor Paraunda, Reyneil Paraunda, Richelle Diane, Scott Hundey, Vina Porras"
  ),
  building(
    "2125709468",
    "NCC 2",
    "NCC 2",
    "(NCC2) 2 Richardson Drive",
    "Port Dover, Ontario N0A 1N4",
    32,
    16,
    42,
    "Admin MVP Condos, Cientlyn Porras, Claudio Lim, Gay Hundey, Mayflor Paraunda, Office MVP Condos, Reyneil Paraunda, Richelle Diane, Scott Hundey, Unit 14 - Lynne Lewis, Vina Porras"
  ),
  building("2125709878", "NSCC 42", "NSCC 42", "(NSCC 42) 992 Windham Centre R...", "Windham Centre, Ontario N0E 2A0", 14, 15, 25),
  building("2125709469", "PCC7", "PCC 7", "(PCC 7) 441 Elizabeth Street E...", "Listowel, Ontario N4W 2P7", 12, 13, 15),
  building("2125709466", "SCC 168", "SCC 168", "(SCC 168) 119 DAmbrosio Drive", "Barrie, Ontario L4N 7R7", 55, 13, 74),
  building("2125709465", "SCC148", "SCC 148", "(SCC 148) 500 Essa Road", "Barrie, Ontario L4N 7L4", 58, 13, 74),
  building("2125709582", "WCC75", "WCC 75", "(WCC75) 31 Greengate Road", "Guelph, Ontario N1H 6R3", 64, 17, 77),
  building(
    "2125709952",
    "WNCC 150",
    "WNCC 150",
    "(WNCC 150) 49 McIntyre Place",
    "Kitchener, Ontario N2R 1G3",
    20,
    15,
    23,
    "Admin MVP Condos, Cientlyn Porras, Claudio Lim, Darren East, Gay Hundey, Mayflor Paraunda, Office MVP Condos, Reyneil Paraunda, Richelle Diane, Sanja Lepener, Scott Hundey, Vina Porras"
  ),
  building("2125709897", "WNCC112", "WNCC 112", "(WNCC 112) 476 Kingscourt Driv...", "Kitchener, Ontario", 48, 14, 62),
  building("2125709461", "WNCC127", "WNCC 127", "(WNCC 127) 54 Green Valley Dri...", "Kitchener, Ontario", 52, 14, 68),
  building("2125709470", "WNCC134", "WNCC 134", "(WNCC 134) 54 Green Valley Dri...", "Kitchener, Ontario", 44, 13, 58),
  building("2125710005", "WNCC147", "WNCC 147", "(WNCC 147) 10 Ellen Street Eas...", "Kitchener, Ontario", 36, 12, 48),
  building("2125709464", "WNCC149", "WNCC 149", "(WNCC 149) 54 Green Valley Dri...", "Kitchener, Ontario", 40, 13, 55),
  building("2125709458", "WNCC47", "WNCC 47", "(WNCC 47) 49 Cedarwoods Cresce...", "Kitchener, Ontario", 42, 13, 56),
  building("2125709489", "WNCC 63", "WNCC 63", "(WNCC 63) 214 Kingswood Drive", "Kitchener, Ontario", 38, 12, 50),
  building("2125709459", "WNCC87", "WNCC 87", "(WNCC 87) 236 Kingswood Drive", "Kitchener, Ontario", 46, 14, 60),
  building("2125709460", "WNCC97", "WNCC 97", "(WNCC 97) 228-232 Kingswood Dr...", "Kitchener, Ontario", 41, 13, 54),
  building("2125709847", "WSCC 179", "WSCC 179", "(WSCC 179) 365 Watson Pkwy Nor...", "Guelph, Ontario", 72, 15, 88),
  building("2125709972", "WSCC 406", "WSCC 406", "(WSCC 406) 30 Bryan Court", "Waterloo, Ontario", 28, 11, 38),
  building("2125709467", "WSCC449", "WSCC 449", "(WSCC 449) 50 Bryan Court", "Waterloo, Ontario", 34, 12, 45),
  building("2125709971", "WSCC 491", "WSCC 491", "(WSCC 491) 950 Highland Road W...", "Kitchener, Ontario", 56, 14, 70),
  building("2125709898", "WSCC6", "WSCC 6", "(WSCC 6) 6 Shettleston Drive", "Kitchener, Ontario", 30, 11, 40),
  building("2125709801", "WVLCC 678", "WVLCC 678", "(WVLCC 678) 280 Tall Grass Cre...", "Cambridge, Ontario", 62, 15, 80),
];
