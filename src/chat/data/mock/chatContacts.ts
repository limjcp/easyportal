import type { ChatContact } from "../../../resident/data/types";
import { DEMO_BUILDING_ID } from "../../../resident/data/types";

const WNCC87 = DEMO_BUILDING_ID;
const WNCC47 = "2125709458";

export const seedChatContacts: ChatContact[] = [
  {
    id: "contact-resident-claudio",
    name: "Claudio",
    email: "claudio.owner@example.com",
    role: "Owner - Board Member",
    buildingId: WNCC87,
    buildingLabel: "WNCC 87",
    kind: "resident",
  },
  {
    id: "contact-admin-claudio",
    name: "Claudio Owner - Board Member",
    email: "limjahnclaudio@gmail.com",
    role: "Board Member",
    buildingId: WNCC87,
    buildingLabel: "WNCC 87",
    kind: "building_admin",
  },
  {
    id: "contact-company-claudio",
    name: "Claudio Lim",
    email: "claudio@mvpcondos.com",
    role: "Company Administrator",
    buildingId: WNCC87,
    buildingLabel: "WNCC 87",
    kind: "company",
  },
  {
    id: "contact-resident-deborah",
    name: "Deborah Little",
    email: "deborah@email.com",
    role: "Owner",
    buildingId: WNCC87,
    buildingLabel: "WNCC 87",
    kind: "resident",
  },
  {
    id: "contact-resident-patricia",
    name: "Patricia Seeger",
    email: "patricia@email.com",
    role: "Owner",
    buildingId: WNCC87,
    buildingLabel: "WNCC 87",
    kind: "resident",
  },
  {
    id: "contact-admin-mayflor",
    name: "Mayflor Paraunda",
    email: "mayflor@mvpcondos.com",
    role: "Property Administrator",
    buildingId: WNCC87,
    buildingLabel: "WNCC 87",
    kind: "building_admin",
  },
  {
    id: "contact-resident-wncc47-1",
    name: "Alex Turner",
    email: "alex.turner@email.com",
    role: "Owner",
    buildingId: WNCC47,
    buildingLabel: "WNCC 47",
    kind: "resident",
  },
  {
    id: "contact-admin-wncc47-1",
    name: "Jordan Lee",
    email: "jordan.lee@mvpcondos.com",
    role: "Property Manager",
    buildingId: WNCC47,
    buildingLabel: "WNCC 47",
    kind: "building_admin",
  },
];
