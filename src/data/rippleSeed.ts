import type { RippleContact } from "@/lib/types";

// Fictional. 25 contacts, 5 from each of 5 employees.
const SUMMIT = "IT Forward Summit 2026";
const DAYS = "Health IT Days";
const RETAIL = "Retail Tech Live";
const DESK = "Service Desk World";

type Row = [
  name: string, title: string, companyName: string, domain: string, industry: string,
  eventName: string | null, note: string, day: number, options?: { okToContact?: boolean; okToMention?: boolean; region?: string },
];
const EMPLOYEES: { owner: string; team: RippleContact["team"]; contacts: Row[] }[] = [
  {
    owner: "Dana Cole", team: "marketing", contacts: [
      ["Marcus Ellery", "CIO", "Harrowgate Grocers", "harrowgategrocers", "Retail", SUMMIT, "Asked how we handle after-hours tickets", 18],
      ["Renee Alvarado", "VP IT", "Cedar Point Clinics", "cedarpointclinics", "Healthcare", SUMMIT, "Wants to see the routing feature", 18],
      ["Colin Adeyemi", "CIO", "Palisade Lending", "palisadelending", "Fintech", SUMMIT, "Asked not to get sales emails", 18, { okToContact: false }],
      ["Hye-jin Moon", "Director Service Desk", "Bellweather Health", "bellweatherhealth", "Healthcare", DAYS, "Ticket volume doubled this year", 12],
      ["Gavin Stroud", "IT Ops Manager", "Copperfin Bank", "copperfinbank", "Fintech", SUMMIT, "Comparing tools in the new year", 18],
    ],
  },
  {
    owner: "Sam Ortiz", team: "sales", contacts: [
      ["Ivan Petrov", "Director Service Desk", "Fernway Outfitters", "fernwayoutfitters", "Retail", null, "Worked together on an earlier project", 10],
      ["Bea Lindholm", "IT Ops Manager", "Marlowe Freight", "marlowefreight", "Logistics", null, "Friendly, not sure they need us yet", 10],
      ["Grace Whitfield", "CIO", "Larkfield Care Group", "larkfieldcaregroup", "Healthcare", null, "Former neighbor", 9],
      ["Tariq Mansour", "VP IT", "Juniper & Vale", "junipervale", "Retail", null, "Happy to take a call in December", 11],
      ["Odile Renard", "CIO", "Maison Clairval", "maisonclairval", "Retail", null, "Based in Lyon", 11, { region: "Europe" }],
    ],
  },
  {
    owner: "Nina Kapoor", team: "marketing", contacts: [
      ["Walter Osei", "CIO", "Northlake Pediatrics", "northlakepediatrics", "Healthcare", DAYS, "Opening three new sites", 12],
      ["Simone Tran", "Director Service Desk", "Verity Dental Group", "veritydental", "Healthcare", DAYS, "Small team, many locations", 12],
      ["Pablo Serrano", "IT Ops Manager", "Golden Acre Seniors", "goldenacreseniors", "Healthcare", DAYS, "Interested in self-service", 12],
      ["Ingrid Solheim", "VP IT", "Bluestone Hospitals", "bluestonehospitals", "Healthcare", DAYS, "Wants a reference customer", 12],
      ["Kofi Mensah", "Principal", "Larch Lane School", "larchlaneschool", "Education", DAYS, "Came for the keynote", 12],
    ],
  },
  {
    owner: "Leo Fontaine", team: "sales", contacts: [
      ["Omar Haddad", "IT Ops Manager", "Summit Ridge Medical", "summitridgemedical", "Healthcare", null, "Played in the same league", 8],
      ["Talia Brandt", "CIO", "Ironbridge Payments", "ironbridgepayments", "Fintech", DESK, "Budget opens in January", 16],
      ["Desmond Clarke", "VP IT", "Fairlight Credit", "fairlightcredit", "Fintech", DESK, "Liked the demo", 16],
      ["Yuki Tanabe", "Director Service Desk", "Stonepath Lending", "stonepathlending", "Fintech", DESK, "Prefers a short call", 16],
      ["Marta Kowalska", "CIO", "Northwind Cargo", "northwindcargo", "Logistics", DESK, "Just browsing", 16],
    ],
  },
  {
    owner: "Ruth Abara", team: "marketing", contacts: [
      ["Elias Romero", "CIO", "Sunpeak Outdoor", "sunpeakoutdoor", "Retail", RETAIL, "Peak season support is hard", 5],
      ["Joanna Pike", "VP IT", "Thistle & Thread", "thistlethread", "Retail", RETAIL, "Asked about store rollouts", 5],
      ["Henrik Dahl", "IT Ops Manager", "Harbor Lane Foods", "harborlanefoods", "Retail", RETAIL, "Replacing a shared inbox", 5, { okToMention: false }],
      ["Amara Diallo", "Director Service Desk", "Bright Basket", "brightbasket", "Retail", RETAIL, "Wants reports on response times", 5],
      ["Nolan Reeves", "CIO", "Finch & Field", "finchfield", "Retail", RETAIL, "Unsubscribed at the booth", 5, { okToContact: false }],
    ],
  },
];

let n = 0;
export const RIPPLE_SEED: RippleContact[] = EMPLOYEES.flatMap(({ owner, team, contacts }) =>
  contacts.map(([name, title, companyName, host, industry, eventName, note, day, options]) => ({
    id: `rip_${String(++n).padStart(2, "0")}`,
    name, title, companyName,
    domain: `${host}.example`,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${host}.example`,
    industry,
    region: "North America",
    owner, team,
    origin: eventName ? ("event" as const) : ("colleague" as const),
    ...(eventName && { eventName }),
    note,
    okToContact: true,
    okToMention: true,
    addedAt: `2026-11-${String(day).padStart(2, "0")}T17:00:00Z`,
    ...options,
  })),
);
