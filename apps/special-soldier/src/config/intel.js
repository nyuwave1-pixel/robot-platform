// Intel collectibles: three laptops per mission. Each one unlocks an archive entry (OPERATIONS → INTEL ARCHIVE).
// Positions are functions so POIs built at world load can be used.
import { POI } from '../world/build.js';
import { FAC_Y } from '../world/world.js';

export const INTEL = [
  { at: () => [[-44, 300], [48, 293], [6, 252]], docs: [
    ['GUARD ROSTER', 'Shift sheet for the beach posts. Two names are crossed out with the note "transferred to the lab — do not ask". Every sentry signs in at the radar hut at 04:00.'],
    ['RADAR LOG', 'The coastal radar was ordered to ignore small craft on the night of the landing. Signed only "V." Someone on the island wanted the beach watched less, not more.'],
    ['TORN LETTER', '"…they pay three times what the army did, but nobody who goes underground comes back up to the barracks. If you get this, tell my sister I tried to leave."'] ] },
  { at: () => [[-80, 205], [POI.comms.x + 12, POI.comms.z + 18], [-112, 190]], docs: [
    ['PATROL MAP', 'Hand-drawn trails through the jungle. The waterfall cave is circled twice and labelled "NO PATROLS — VIPER ONLY".'],
    ['RELAY TRAFFIC', 'Encrypted bursts to a ship offshore every six hours. The last decrypted line: "Sample stable. Buyer confirms extraction by air, not by sea."'],
    ['FIELD JOURNAL', 'A BLACK COBRA medic: "Three of the porters are sick. Fever, then nothing. The doctors from below took them away in sealed bags."'] ] },
  { at: () => [[0, -8], [POI.hq.x - 8, POI.hq.z + 4], [POI.bunker.x - 6, POI.bunker.z + 4]], docs: [
    ['GATE ORDERS', 'All vehicles searched both ways. Nothing leaves the base without a lab stamp — not even the trash.'],
    ['HQ MEMO', 'VIPER to all officers: the facility is now the only priority. Base troops are "expendable cover" if the island is compromised.'],
    ['BUNKER MANIFEST', 'Freezer units, centrifuges, 40 biohazard containers. Destination: "Level -2, sealed wing". Delivery signed by a doctor with no surname.'] ] },
  { at: () => [[...lab(-3, -90)], [...lab(-4, -52)], [...lab(0, -74)]], docs: [
    ['SERVER NOTE', 'The research database mirrors to the offshore ship nightly. Destroying the servers here will not destroy the data — only the uplink will.'],
    ['LAB REPORT', 'Compound COBRA-7: airborne, no visible symptoms for 36 hours. Suggested use: "area denial without structural damage".'],
    ['RESEARCHER\'S CONFESSION', '"We were told it was a vaccine programme. When I asked about the test subjects, VIPER moved me to the night shift and took my badge."'] ] },
  { at: () => [[POI.hangar.x + 6, POI.hangar.z - 6], [POI.runway.x, POI.runway.z + 5], [POI.helipad.x - 14, POI.helipad.z - 6]], docs: [
    ['FLIGHT PLAN', 'A cargo plane was due at 19:30 to collect "two crates, cold storage". It never got clearance — your landing on the beach cancelled the schedule.'],
    ['BUYER CONTRACT', 'Payment in three parts. The last part is due "on successful field demonstration". The buyer\'s name is redacted on every page.'],
    ['VIPER\'S ORDERS', 'If the island falls: burn the lab, sink the ship, kill the witnesses. Handwritten at the bottom: "Except the doctor. The doctor comes with me."'] ] },
];
function lab(x, z) { const L = POI.facL; const [wx, wz] = L ? L(x, z) : [POI.fac.x + x, POI.fac.z + z]; return [wx, wz, FAC_Y]; }
export const intelTotal = () => INTEL.reduce((n, m) => n + m.docs.length, 0);
