import type { CarPage, CriticReview, Recall } from "./types";

// Shown when no database is configured, so the site can be developed and previewed
// before the agents have run. The carmakers, outlets, reviews, complaints and recalls
// here are all made up.

const OUTLETS = ["Sample Motor Weekly", "Sample Road Test", "Sample Drive Guide", "Sample Buyer Reports"];

function review(
  i: number,
  slug: string,
  score_10: number | null,
  summary: string,
  likes: string[],
  dislikes: string[],
): CriticReview {
  return {
    outlet: OUTLETS[i],
    url: `https://example.com/${slug}/review-${i + 1}`,
    title: `${OUTLETS[i]} road test`,
    published: `2024-0${i + 3}-1${i}`,
    score: score_10 === null ? "" : i === 3 ? `${score_10 * 10}/100` : `${score_10}/10`,
    score_10,
    summary,
    likes,
    dislikes,
  };
}

function recall(campaign: string, reported: string, component: string, summary: string, remedy: string): Recall {
  return { campaign, reported, component, summary, consequence: "", remedy, park_it: false };
}

const base = { critic_consensus: "", updated_at: "2026-10-13T06:00:00Z", fire_count: 0, photo: null };

export const SAMPLE_CARS: CarPage[] = [
  {
    ...base,
    slug: "2024-northline-ridgeway",
    year: 2024,
    make: "Northline",
    model: "Ridgeway",
    body: "SUV",
    powertrain: "Gas",
    price_from: 31450,
    headline: "Critics praise the smooth automatic; owners keep reporting a shudder from a stop",
    verdict:
      "Reviewers rank the Ridgeway near the top of its class for comfort, space and refinement. Owners mostly agree on the cabin, but a steady stream of complaints describes the transmission shuddering or lurching at low speed, which no review mentions. A software recall fixed the backup camera. If you shop one, drive it in stop-and-go traffic and ask whether the latest transmission update is installed.",
    agreement_level: "mixed",
    critic_score: 8.4,
    critic_consensus: "Critics call it one of the most comfortable and roomy small SUVs, held back by a slow touchscreen.",
    critics: [
      review(0, "ridgeway", 9, "A quiet, roomy small SUV with a ride that soaks up rough roads. The tester singled out the smooth eight-speed automatic.", ["Quiet cabin", "Smooth automatic", "Big cargo hold"], ["Laggy touchscreen"]),
      review(1, "ridgeway", 8, "Comfortable and sensible, with good fuel economy for the class, though the base engine runs out of breath on the highway.", ["Fuel economy", "Comfort"], ["Weak highway passing", "Dull steering"]),
      review(2, "ridgeway", 8, "An easy recommendation for families thanks to its back-seat space and simple controls.", ["Rear-seat room", "Simple controls"], ["Road noise on the top trim's big wheels"]),
      review(3, "ridgeway", 8.6, "Scored well in testing for braking and comfort; reliability for this new generation is not yet known.", ["Short stops", "Comfortable seats"], ["Infotainment lag"]),
    ],
    owner_overview: "Most complaints are about the transmission hesitating, shuddering or lurching at low speeds, followed by the screen freezing.",
    owner_themes: [
      { title: "Transmission shudders or lurches at low speed", component: "Power train", summary: "Owners describe a shudder pulling away from a stop and sudden lurches in slow traffic, some after dealer visits that found no fault.", count: 46, complaint_ids: [11550001, 11550002] },
      { title: "Touchscreen freezes or goes black", component: "Electrical system", summary: "The central screen freezes or goes dark, sometimes taking the backup camera with it.", count: 21, complaint_ids: [11550003] },
      { title: "Forward collision braking triggers for no reason", component: "Forward collision avoidance", summary: "Owners report the car braking hard for shadows or parked cars on curves.", count: 9, complaint_ids: [11550004] },
    ],
    complaint_count: 112,
    complaint_components: [
      { component: "Power train", count: 52 },
      { component: "Electrical system", count: 27 },
      { component: "Forward collision avoidance", count: 12 },
      { component: "Engine", count: 8 },
      { component: "Service brakes", count: 5 },
    ],
    crash_count: 3,
    injury_count: 1,
    recalls: [
      recall("24V100000", "2024-02-15", "Back over prevention", "The rearview camera image may not appear when reversing because of a software fault.", "Dealers update the camera software, free of charge."),
    ],
    disagreements: [
      { topic: "Transmission", headline: "Critics call the automatic smooth; owners report shudder and lurching", critics: "Three of four reviews praise how smoothly the eight-speed shifts.", owners: "46 owner complaints describe shudder or lurching from a stop, the car's most common complaint.", records: "No recall covers the transmission.", kind: "critics vs owners", strength: "strong" },
      { topic: "Touchscreen", headline: "Critics call the screen slow; owners say it fails outright", critics: "Reviewers mention lag, but as an annoyance.", owners: "21 complaints say the screen freezes or goes black, sometimes with the backup camera.", records: "A recall fixed one camera fault, not the freezing.", kind: "critics vs owners", strength: "some" },
      { topic: "Highway power", headline: "Critics split on whether the base engine is strong enough", critics: "One review finds highway passing weak; the others call the power adequate.", owners: "", records: "", kind: "critics split", strength: "some" },
    ],
    agreements: ["The cabin is quiet and roomy", "Fuel economy is good for the class", "The touchscreen is the weak spot"],
  },
  {
    ...base,
    slug: "2024-calder-vista-hybrid",
    year: 2024,
    make: "Calder",
    model: "Vista Hybrid",
    body: "Sedan",
    powertrain: "Hybrid",
    price_from: 28900,
    headline: "Critics, owners and the recall record all point the same way: a dependable, frugal sedan",
    verdict:
      "Reviewers like the Vista Hybrid's 50-plus mpg and calm manners, and complain mainly that it is dull to drive. Owner complaints are few and scattered, with no common fault, and there are no recalls. This is the rare car where every source agrees.",
    agreement_level: "mostly agree",
    critic_score: 7.9,
    critics: [
      review(0, "vista", 8, "Remarkably efficient and relaxing, if forgettable to drive.", ["Over 50 mpg", "Smooth hybrid system"], ["Bland steering"]),
      review(1, "vista", 7.5, "Does everything well and nothing excitingly; the back seat is roomy for the class.", ["Rear-seat space", "Quiet ride"], ["Engine drones when pushed"]),
      review(2, "vista", 8, "A smart buy that should cost little to run.", ["Running costs", "Easy to live with"], ["Plain interior"]),
    ],
    owner_overview: "Very few complaints, spread across unrelated systems.",
    owner_themes: [
      { title: "Wind noise from the driver's door", component: "Structure", summary: "A few owners hear a whistle at highway speed from the driver's door seal.", count: 4, complaint_ids: [11560001] },
    ],
    complaint_count: 11,
    complaint_components: [
      { component: "Structure", count: 4 },
      { component: "Electrical system", count: 3 },
      { component: "Service brakes", count: 2 },
    ],
    crash_count: 0,
    injury_count: 0,
    recalls: [],
    disagreements: [],
    agreements: ["Excellent fuel economy", "Comfortable and quiet", "Not exciting to drive", "No recalls and few complaints"],
  },
  {
    ...base,
    slug: "2024-voltra-arc",
    year: 2024,
    make: "Voltra",
    model: "Arc",
    body: "SUV",
    powertrain: "Electric",
    price_from: 44990,
    headline: "Critics split on the ride, and owners report the small 12-volt battery leaving them stranded",
    verdict:
      "Critics agree the Arc charges fast and goes far, but disagree sharply on its firm ride. Owners raise something reviewers never had time to see: the car going dead because its small 12-volt battery drains. Two recalls cover charging software. Test the ride on rough roads, and ask whether the 12-volt fix has been applied.",
    agreement_level: "split",
    critic_score: 7.2,
    critics: [
      review(0, "arc", 9, "Quick, fast-charging and roomy, with a ride the tester called composed.", ["Charging speed", "Range", "Acceleration"], ["Pricey top trims"]),
      review(1, "arc", 6, "Impressive tech undone by a stiff, jittery ride on broken pavement.", ["Range"], ["Harsh ride", "Confusing menus"]),
      review(2, "arc", 7, "A strong electric SUV for road trips, if you can live with the firm suspension.", ["Road-trip range", "Fast charging"], ["Firm ride", "Small frunk"]),
      review(3, "arc", 6.8, "Fast charging tested well; ride comfort scored below average.", ["Charging"], ["Ride comfort"]),
    ],
    owner_overview: "Owners most often report the car going dead from a drained 12-volt battery, and charging sessions that stop early.",
    owner_themes: [
      { title: "Car goes dead from a drained 12-volt battery", component: "Electrical system", summary: "Owners describe the car refusing to unlock or start after sitting, traced to the small 12-volt battery.", count: 38, complaint_ids: [11570001] },
      { title: "Fast charging stops early", component: "Electrical system", summary: "Charging sessions end on their own at public fast chargers.", count: 17, complaint_ids: [11570002] },
    ],
    complaint_count: 74,
    complaint_components: [
      { component: "Electrical system", count: 61 },
      { component: "Suspension", count: 6 },
      { component: "Steering", count: 4 },
    ],
    crash_count: 0,
    injury_count: 0,
    recalls: [
      recall("24V300000", "2024-06-03", "Electrical system", "A charging control unit may stop charging the 12-volt battery, which can cause a loss of drive power.", "Dealers update the software and replace the unit if needed."),
      recall("24V310000", "2024-07-19", "Electrical system", "Fast-charging sessions can end early because of a software error.", "Over-the-air software update."),
    ],
    disagreements: [
      { topic: "Ride comfort", headline: "Critics can't agree whether the ride is composed or harsh", critics: "One review calls the ride composed; three call it stiff or harsh.", owners: "Few owners complain about the ride.", records: "", kind: "critics split", strength: "strong" },
      { topic: "Reliability", headline: "Critics found no faults; owners report the car going dead", critics: "No review mentions a reliability problem.", owners: "38 complaints describe a drained 12-volt battery leaving the car dead.", records: "A recall covers the part that charges the 12-volt battery.", kind: "critics vs owners", strength: "strong" },
    ],
    agreements: ["Charging is fast", "Range is good for road trips"],
  },
  {
    ...base,
    slug: "2024-harlow-t6",
    year: 2024,
    make: "Harlow",
    model: "T6",
    body: "Truck",
    powertrain: "Gas",
    price_from: 38200,
    headline: "Critics rate the towing highly; a recall and owner reports flag fuel leaks",
    verdict:
      "Reviewers like the T6's towing, ride and cabin tech. The recall record tells a different story about one part: a fuel line that can leak, recalled in 2024, which owners also describe. Check that any T6 you look at has had the recall done.",
    agreement_level: "mixed",
    critic_score: 8.1,
    fire_count: 2,
    critics: [
      review(0, "t6", 8.5, "A capable full-size truck that tows well and rides better than most.", ["Towing", "Ride"], ["Expensive options"]),
      review(1, "t6", 8, "A comfortable work truck with clever bed features.", ["Bed features", "Cabin tech"], ["Thirsty V8"]),
      review(3, "t6", 7.8, "Tested strongly for towing stability; predicted reliability is average.", ["Towing stability"], ["Fuel economy"]),
    ],
    owner_overview: "Owners most often report a fuel smell or leak, and oil use between changes.",
    owner_themes: [
      { title: "Fuel smell or leak under the truck", component: "Fuel system", summary: "Owners smell fuel after refuelling or see drips under the cab.", count: 19, complaint_ids: [11580001] },
      { title: "Engine burns oil between changes", component: "Engine", summary: "Owners report adding oil between scheduled changes.", count: 12, complaint_ids: [11580002] },
    ],
    complaint_count: 58,
    complaint_components: [
      { component: "Fuel system, gasoline", count: 21 },
      { component: "Engine", count: 15 },
      { component: "Electrical system", count: 9 },
    ],
    crash_count: 0,
    injury_count: 0,
    recalls: [
      { ...recall("24V200000", "2024-05-06", "Fuel system, gasoline", "A fuel line connector may crack and leak fuel.", "Dealers replace the fuel line, free of charge."), consequence: "A fuel leak near an ignition source increases the risk of a fire." },
    ],
    disagreements: [
      { topic: "Fuel system", headline: "Reviews never mention it, but a recall and owners report fuel leaks", critics: "No review raises the fuel system.", owners: "19 complaints describe a fuel smell or leak.", records: "Recalled in May 2024 for a fuel line that can crack.", kind: "critics vs recalls", strength: "strong" },
    ],
    agreements: ["Tows confidently", "Rides well for a truck", "Fuel economy is poor"],
  },
];
