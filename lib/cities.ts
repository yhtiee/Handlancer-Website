/**
 * City × trade content.
 *
 * ---------------------------------------------------------------------------
 * THE GUARD RAIL
 * ---------------------------------------------------------------------------
 * A city × trade page is only rendered indexable, and only enters the sitemap,
 * if `isIndexable()` passes: a real local price band, at least three local job
 * types, and at least three city-specific FAQ entries. Anything short of that
 * renders `noindex` and stays out of the sitemap.
 *
 * This is not bureaucracy. A few hundred pages that differ only by city name
 * get filtered out of the index as doorway pages and drag the whole domain's
 * quality signal down with them. The gate makes that structurally impossible:
 * you cannot ship a thin page by accident, only by filling in real content.
 *
 * ---------------------------------------------------------------------------
 * ADDING A CITY
 * ---------------------------------------------------------------------------
 * Append to CITY_PAGES below. Nothing else changes — routing, sitemap, schema,
 * breadcrumbs and the footer all read from this file. A city with no trade
 * entries generates no pages at all, which is the correct behaviour: a URL that
 * does not exist beats an unindexable placeholder.
 *
 * Uyo is the first launch city and currently the only one.
 *
 * ⚠️ PRICE BANDS ARE INDICATIVE AND NEED OPERATOR VERIFICATION before launch.
 * They are rendered on the page with an explicit "indicative" disclaimer.
 */

import type { Faq } from '@/lib/site';

export type PriceBand = {
  /** Naira, labour/workmanship portion of a typical job. */
  low: number;
  high: number;
  /** What the band is measured against, e.g. 'per job', 'per room'. */
  unit: string;
};

export type CityTrade = {
  /** Category.slug this content belongs to. */
  trade: string;
  priceBand: PriceBand;
  /** What people in this city actually post for this trade. Three minimum. */
  jobTypes: string[];
  /** Why this trade behaves differently here than anywhere else. */
  localNote: string;
  /** City-specific questions. Three minimum. */
  faqs: Faq[];
};

export type City = {
  slug: string;
  name: string;
  state: string;
  /** Shown in the page lede. */
  blurb: string;
  /** Named in copy and used for the areaServed claim. */
  areas: string[];
  trades: CityTrade[];
};

/* ------------------------------------------------------------------ */
/* Uyo — Akwa Ibom State                                               */
/* ------------------------------------------------------------------ */

const UYO: City = {
  slug: 'uyo',
  name: 'Uyo',
  state: 'Akwa Ibom',
  blurb:
    'Uyo is our first launch city. Akwa Ibom takes more rain than almost anywhere else in Nigeria, the water table sits high across much of the town, and the air off the creeks is salty enough to eat metal — all of which changes what artisans here are actually called out to fix.',
  areas: [
    'Ewet Housing Estate',
    'Ibom Layout',
    'Shelter Afrique',
    'Osongama Estate',
    'Nwaniba Road',
    'Oron Road',
    'Abak Road',
    'Ikot Ekpene Road',
    'Use Offot',
    'Itam',
  ],
  trades: [
    {
      trade: 'plumbing',
      priceBand: { low: 15_000, high: 90_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Soakaway digging and repair where the water table is high',
        'Borehole pump replacement and pressure tank set-up',
        'Burst pipework in older Abak Road and Oron Road buildings',
        'Overhead tank plumbing and float valve replacement',
        'Bathroom refits in the newer Ibom Layout and Osongama houses',
      ],
      localNote:
        'The high water table around Uyo is the thing that makes plumbing here different. Soakaways fill faster than they do inland, and a soakaway that was dug too shallow will keep backing up every wet season no matter how many times it is emptied. Ask any quote to state the depth.',
      faqs: [
        {
          q: 'Why does my soakaway keep filling up in Uyo?',
          a: 'Usually depth. Much of Uyo sits on a high water table, so a soakaway dug to the depth that works in a drier state fills from the ground up as well as from the house. If yours needs emptying more than once a season, the fix is normally a deeper or second pit rather than another evacuation. Ask for the intended depth to be written into the quote as a material line item, so you are not paying twice.',
        },
        {
          q: 'How much does a plumber charge in Uyo?',
          a: 'For workmanship alone, most jobs posted in Uyo land between ₦15,000 and ₦90,000 — a tap or float valve at the lower end, a full bathroom refit or soakaway job at the upper end. Materials are quoted separately as their own line items, which is what lets you release the materials money early and hold the labour until the work is signed off.',
        },
        {
          q: 'Can I get a plumber in Uyo the same day?',
          a: 'For a burst pipe, post the job with photos and a clear budget and mark it urgent. Providers set their own service radius, so a plumber living around Ewet Housing or Itam will see an Ewet Housing job before someone across town does. Direct hire is faster still if you already know who you want.',
        },
        {
          q: 'Do plumbers in Uyo handle borehole work?',
          a: 'Many do, but drilling and pump work are different skills. Pump replacement, pressure tanks and the plumbing from the tank into the house are ordinary plumbing jobs. Actual drilling is specialist rig work — say which one you need in the job post so you get quotes from people who do that thing.',
        },
      ],
    },
    {
      trade: 'electrical',
      priceBand: { low: 20_000, high: 150_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Inverter and battery bank installation',
        'Solar panel mounting and changeover wiring',
        'DB board replacement and circuit separation',
        'Rewiring older properties off Ikot Ekpene Road',
        'Earthing and surge protection after lightning damage',
      ],
      localNote:
        'Uyo gets serious electrical storms through the wet season, and surge damage is one of the most common call-outs here. Proper earthing is not an upsell in Akwa Ibom — it is the difference between losing one bulb and losing a fridge, a TV and an inverter in the same night.',
      faqs: [
        {
          q: 'How much does inverter installation cost in Uyo?',
          a: 'Workmanship for a straightforward 1.5kVA to 3.5kVA install with a changeover typically runs ₦35,000 to ₦90,000 in Uyo. The batteries and inverter itself are the bulk of the spend and are quoted as materials, so you can release that portion up front and keep the installation labour in escrow until the system is tested under load.',
        },
        {
          q: 'My appliances keep getting damaged during storms in Uyo — what should I ask for?',
          a: 'Ask for the earthing to be tested, not assumed. Akwa Ibom takes heavy lightning activity, and a lot of the surge damage people blame on the grid traces back to an earth rod that was never driven deep enough or has corroded through. A competent electrician will quote for testing the existing earth before selling you surge protection that has nothing to discharge into.',
        },
        {
          q: 'Can I find a solar installer in Uyo through HandLancer?',
          a: 'Yes — solar and inverter work sit under Electrical. Post the job with your daily energy need or a list of what you want to run and for how long, and quotes will come back itemised into panels, batteries, inverter and labour. That itemisation is what stops a solar quote from being one large unexplained number.',
        },
        {
          q: 'Is it worth separating my circuits?',
          a: 'If your whole house trips when one appliance faults, yes. Splitting lighting, sockets and heavy loads across separate breakers at the DB board is a half-day job for most Uyo homes and it means a fault in the kitchen no longer puts the whole building in darkness. It also makes every later fault far cheaper to diagnose.',
        },
      ],
    },
    {
      trade: 'carpentry',
      priceBand: { low: 45_000, high: 400_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Fitted wardrobes for the newer Ibom Layout and Osongama builds',
        'Kitchen cabinet fabrication and installation',
        'Door replacement where humidity has swollen the frames',
        'Ceiling noggins and PVC ceiling installation',
        'Student-let furniture around Use Offot and Ifa Ikot Okpon',
      ],
      localNote:
        'Humidity is the carpenter’s problem in Uyo. Doors that fit perfectly in January bind in the wet season, and untreated MDF in a bathroom or kitchen will swell within a year. Ask what board is being quoted and whether the edges are sealed — it is the single biggest difference between work that lasts and work that does not.',
      faqs: [
        {
          q: 'What does a fitted wardrobe cost in Uyo?',
          a: 'Workmanship for a standard two-door fitted wardrobe generally falls between ₦60,000 and ₦180,000 in Uyo, with the board, hinges and handles quoted separately as materials. A full walk-in or a run of wardrobes across a master bedroom moves toward the top of the range and beyond.',
        },
        {
          q: 'Why do my doors stick during the rainy season in Uyo?',
          a: 'Because the timber is taking on moisture. Akwa Ibom humidity swells untreated wood, and a door hung tight in the dry season has nowhere to go when it expands. The durable fix is planing with a seasonal allowance and sealing all six faces of the door, including the top and bottom edges that most people never paint.',
        },
        {
          q: 'Which board should I ask for in a humid climate?',
          a: 'For anything in a kitchen or bathroom, ask for moisture-resistant board or properly sealed plywood rather than plain MDF. It costs more as a material line item and it is worth it in Uyo — plain MDF that gets damp swells at the edges and cannot be repaired, only replaced.',
        },
        {
          q: 'Can a carpenter in Uyo work from my own design?',
          a: 'Yes. Attach photos or a sketch to the job post with your measurements. Quotes come back itemised, so you can see exactly what board and fittings are being priced against your design rather than a generic figure for "a wardrobe".',
        },
      ],
    },
    {
      trade: 'painting',
      priceBand: { low: 60_000, high: 450_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Exterior repainting after wet-season damage',
        'Mould and damp treatment before repainting',
        'POP ceiling finishing and cornice work',
        'Screeding and texture finishes in new estate houses',
        'Quick repaints between tenancies near the university',
      ],
      localNote:
        'Exterior paint in Uyo works harder than almost anywhere. Rain-driven damp on the weather-facing wall is why so many repaints fail within two years — if the wall is not treated and allowed to dry properly first, the new coat lifts. A painter who quotes for preparation is quoting honestly.',
      faqs: [
        {
          q: 'How much does it cost to paint a house in Uyo?',
          a: 'Workmanship for a three-bedroom interior repaint typically runs ₦80,000 to ₦200,000 in Uyo, with paint quoted separately. Exteriors cost more per square metre because of preparation and access. Any quote well below that range is usually skipping the preparation, which is exactly the part that determines whether the job survives a wet season.',
        },
        {
          q: 'Why does exterior paint peel so quickly in Uyo?',
          a: 'Driven rain and damp. Water gets into the wall, the wall never fully dries, and the paint film lifts from behind. Fixing it properly means finding the moisture source, treating any mould, letting the wall dry, then using an exterior-grade emulsion. Painting over damp is the reason the same wall gets repainted every two years.',
        },
        {
          q: 'Should I treat mould before painting?',
          a: 'Always, and treat it rather than cover it. Mould painted over will come back through the new coat, usually within one rainy season. Ask for the treatment to appear as its own line item on the quote so you can see it was actually priced and not quietly dropped to win the job.',
        },
        {
          q: 'How long should I allow for a repaint in Uyo?',
          a: 'Longer than you would inland, because drying time between coats stretches in high humidity. A three-bedroom interior that might take three days in the dry season can take five in the middle of the rains. Agree the schedule before funding, so nobody is under pressure to recoat a surface that has not dried.',
        },
      ],
    },
    {
      trade: 'cleaning',
      priceBand: { low: 25_000, high: 180_000, unit: 'per job' },
      jobTypes: [
        'Post-construction cleaning in the newer estates',
        'Move-in and move-out deep cleans',
        'Mould and mildew removal after the rains',
        'Fumigation against termites and mosquitoes',
        'Student-let turnaround cleans near Uniuyo',
      ],
      localNote:
        'Two things drive cleaning work in Uyo: the wet season leaves mould on surfaces that never get direct sun, and the estates around Ibom Layout and Osongama are still filling up, so post-construction cleans are constant. They are different jobs and should be priced differently.',
      faqs: [
        {
          q: 'How much is a deep clean in Uyo?',
          a: 'A three-bedroom deep clean generally runs ₦35,000 to ₦80,000 in Uyo. Post-construction cleaning costs more — cement dust, paint spots and adhesive residue take far longer than ordinary dirt, and it usually needs a team rather than one person.',
        },
        {
          q: 'Can cleaners in Uyo remove mould?',
          a: 'Mould removal is a specific service, so name it in the job post. Wiping mould with soap and water spreads spores and it returns within weeks. Proper treatment means a fungicidal wash and, more importantly, identifying why that surface stays damp — otherwise you are buying the same clean again next season.',
        },
        {
          q: 'Do I need fumigation in Uyo?',
          a: 'Termites are a genuine problem across Akwa Ibom, particularly in properties with timber roof structures or where soil meets untreated wood. If you are seeing mud tubes on walls or hollow-sounding skirting, get it looked at before it reaches the roof timbers. Fumigation is quoted as a separate service from cleaning.',
        },
        {
          q: 'What is post-construction cleaning and do I need it?',
          a: 'It is the clean between the builders finishing and you moving in — cement film off tiles, paint off glass and fittings, dust out of every track and socket. If you are taking handover of a new build in Ibom Layout or Osongama, budget for it as its own job. Ordinary cleaners without the right tools will not shift cement film.',
        },
      ],
    },
    {
      trade: 'appliance-repair',
      priceBand: { low: 12_000, high: 85_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Fridge and freezer gas recharge and compressor work',
        'Generator servicing and starter repair',
        'Washing machine pump and drum repairs',
        'Gas cooker ignition and regulator faults',
        'Corrosion-related faults on units near the creeks',
      ],
      localNote:
        'Damp and salt air shorten appliance life in Uyo, and generators here work harder and longer than the manufacturer ever assumed. A generator that gets a proper service twice a year is dramatically cheaper to own than one that gets fixed only when it stops.',
      faqs: [
        {
          q: 'How much does fridge repair cost in Uyo?',
          a: 'A gas recharge typically runs ₦15,000 to ₦30,000 in workmanship, while compressor replacement sits higher and the compressor itself is a material line item. Ask for the fault to be diagnosed and stated before you fund anything — "it needs gas" is a symptom, and if there is a leak the gas will be gone again within weeks.',
        },
        {
          q: 'How often should I service a generator in Uyo?',
          a: 'If it is your main power source, every three to four months or by running hours, whichever comes first. Uyo generators run long daily cycles in high humidity, which is hard on oil, filters and the starter. Servicing is far cheaper than the rewind you will otherwise pay for.',
        },
        {
          q: 'Why do my appliances corrode faster here?',
          a: 'If you are near Nwaniba Road or the creeks, salt-laden air is reaching the back of your units and attacking terminals and coils. Keeping units off exterior walls, allowing airflow behind them, and having contacts cleaned during servicing all extend their life noticeably.',
        },
        {
          q: 'Can a technician come to my house in Uyo?',
          a: 'Most appliance work here is done on site, and for a fridge or washing machine that is what you want — moving a unit risks more damage than the repair. Say in the job post whether the appliance can be moved, since it changes how a technician quotes.',
        },
      ],
    },
    {
      trade: 'masonry',
      priceBand: { low: 40_000, high: 350_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Interlocking paving on compounds that flood',
        'Drainage channels and compound levelling',
        'Wall plastering and damp patch repairs',
        'Floor and bathroom tiling',
        'Block work for fences and boundary walls',
      ],
      localNote:
        'Drainage is the masonry question in Uyo. A compound that holds water after a downpour will undermine a boundary wall and rot the base of the building over a few seasons. Interlocking laid without a fall and a channel just moves the puddle somewhere less convenient.',
      faqs: [
        {
          q: 'How much does interlocking cost in Uyo?',
          a: 'Workmanship for laying interlocking is usually quoted per square metre and a typical compound lands between ₦60,000 and ₦250,000 in labour, with the stones, sand and edging as materials. Insist that the quote includes the fall and drainage, not just the laying — that is what stops the water sitting.',
        },
        {
          q: 'How do I stop my compound flooding in the rainy season?',
          a: 'Get the levels surveyed before anything is laid. The fix is normally a deliberate fall away from the building into a channel or soakaway, not more concrete. A mason who asks where the water currently goes before quoting is the one to hire.',
        },
        {
          q: 'What causes damp patches on my walls in Uyo?',
          a: 'Commonly either rain driving into a weather-facing wall through failed render, or ground moisture rising where the damp-proof course is bridged by soil or a raised path outside. They are different repairs, so the diagnosis matters more than the plastering. Ask for photos of the outside face at the same height as the patch.',
        },
        {
          q: 'Can I get a tiler in Uyo through HandLancer?',
          a: 'Yes, tiling sits under Masonry. Include your room dimensions and whether the floor needs screeding first, since an uneven substrate is the usual reason a tiling quote changes after work starts. Getting it into the quote up front keeps the escrow figure honest.',
        },
      ],
    },
    {
      trade: 'air-conditioning',
      priceBand: { low: 18_000, high: 120_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Split unit installation and relocation',
        'Gassing and pressure testing for leaks',
        'Servicing and coil cleaning after the wet season',
        'Corroded outdoor unit repair near the creeks',
        'Drainage rerouting where condensate is staining walls',
      ],
      localNote:
        'Humidity makes air conditioners in Uyo work as dehumidifiers most of the year, which means they produce far more condensate than they would inland. Badly routed drainage is behind a surprising share of the damp patches people blame on rain.',
      faqs: [
        {
          q: 'How much does AC installation cost in Uyo?',
          a: 'Workmanship for a standard split unit install typically runs ₦25,000 to ₦60,000 in Uyo, depending on pipe run and whether the wall needs coring. The unit, bracket, pipe and cable are material line items. Longer runs between indoor and outdoor units cost more and should be measured before quoting, not estimated.',
        },
        {
          q: 'How often should I service my AC in Uyo?',
          a: 'Twice a year, and time one of them for the end of the rains. High humidity means coils and filters clog faster here, and a clogged coil makes the unit work harder for less cooling while quietly raising what it costs to run.',
        },
        {
          q: 'Why is my AC leaking water inside the room?',
          a: 'Almost always a blocked or badly graded condensate drain rather than a refrigerant fault. In Uyo the volume of condensate is high enough that a drain with insufficient fall backs up into the indoor unit. It is usually a cheap fix, but left alone it will stain and eventually damage the wall beneath.',
        },
        {
          q: 'My outdoor unit is rusting — is that normal near Nwaniba?',
          a: 'It is common closer to the creeks, where salt in the air attacks the casing and coil fins. Siting the outdoor unit out of direct salt spray, keeping the fins clean and treating early corrosion all extend its life. Ask about a coated coil if you are replacing a unit in that part of town.',
        },
      ],
    },
    {
      trade: 'auto-repair',
      priceBand: { low: 15_000, high: 200_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Mobile diagnostics for cars that will not start on the estate',
        'Suspension and shock work after pothole damage',
        'Panel beating and respray',
        'Car air conditioning regas and compressor repair',
        'Servicing at or near Itam mechanic village',
      ],
      localNote:
        'Uyo’s main roads are good and its link roads are not, which is why suspension and shock absorber work dominates. Wet-season potholes on the smaller roads off Abak and Oron Road do more damage in a month than a year of ordinary driving.',
      faqs: [
        {
          q: 'Can a mechanic come to me in Uyo?',
          a: 'Yes — mobile mechanics cover diagnostics, batteries, brakes and most servicing at your location. Anything needing a lift or heavy panel work still goes to a workshop, and Itam is where most of that capacity sits. Say in the job post whether the car is drivable, because it changes the quote entirely.',
        },
        {
          q: 'Why does my suspension keep failing in Uyo?',
          a: 'The link roads. Potholes that open up during the rains take shocks, bushes and lower arms far faster than main-road driving does. If you are replacing shocks more than once a year, ask for the bushes and mountings to be inspected at the same time — replacing the shock alone on worn mountings just wears the new one out.',
        },
        {
          q: 'How much is car AC repair in Uyo?',
          a: 'A regas with a leak test typically runs ₦20,000 to ₦45,000 in workmanship. If the compressor has failed the part dominates the cost and is quoted as a material. Insist on a leak test before a regas — regassing a leaking system is money you will spend again in a month.',
        },
        {
          q: 'How do I know a mechanic in Uyo will not overcharge?',
          a: 'Quotes on HandLancer are itemised into parts and labour, and you can compare several against the same job description before choosing. The workmanship portion stays in escrow until you have seen the car back and rated the work, so the incentive to pad the bill and disappear is gone.',
        },
      ],
    },
    {
      trade: 'gardening',
      priceBand: { low: 15_000, high: 120_000, unit: 'per job' },
      jobTypes: [
        'Wet-season overgrowth clearing',
        'Tree cutting and branch removal near roofs and power lines',
        'Lawn establishment and regular mowing',
        'Compound landscaping in the newer estates',
        'Drainage-friendly planting on compounds that hold water',
      ],
      localNote:
        'Growth in Akwa Ibom is fast enough that a compound left through the rains becomes a clearing job rather than a mowing job. Trees near roofs are the other constant: a branch that looks fine in the dry season is the one that comes down in a storm.',
      faqs: [
        {
          q: 'How often does a lawn need cutting in Uyo?',
          a: 'Through the wet season, every two to three weeks — growth here is much faster than in the north. A standing arrangement usually costs less per visit than calling someone once the compound has become overgrown, because clearing is a different and heavier job than mowing.',
        },
        {
          q: 'How much does it cost to cut down a tree in Uyo?',
          a: 'It depends almost entirely on what is underneath it. A tree with clear space around it might be ₦25,000 to ₦60,000 in workmanship; one leaning over a roof, a fence or power lines needs sectional cutting and roping and costs considerably more. Send photos showing what is below the tree, not just the tree.',
        },
        {
          q: 'Should I clear branches before the rainy season?',
          a: 'Yes. Storms in Akwa Ibom bring down branches that were already dead or overextended, and they land on roofs, cars and lines. Pre-season pruning is far cheaper than roof repair, and it is the one gardening job worth booking in advance rather than reacting to.',
        },
        {
          q: 'Can a gardener help with a compound that floods?',
          a: 'Partly. Planting and levelling can slow runoff and stop soil washing out, but if water is standing against the building you need drainage work under Masonry as well. Post both if you are not sure, and let the quotes tell you which trade owns the problem.',
        },
      ],
    },
    {
      trade: 'moving',
      priceBand: { low: 45_000, high: 300_000, unit: 'per move' },
      jobTypes: [
        'Flat and house moves within Uyo',
        'Student moves around Use Offot and Ifa Ikot Okpon',
        'Office relocation within the town',
        'Pickup and dispatch for single heavy items',
        'Moves out to Ikot Ekpene, Eket and Oron',
      ],
      localNote:
        'Access is what drives the price of a move in Uyo. A ground-floor flat on a tarred estate road is a different job from a third-floor walk-up on a road the truck cannot reach in the rain — and the second one is where quotes go wrong if nobody asked.',
      faqs: [
        {
          q: 'How much does moving house cost in Uyo?',
          a: 'A one-bedroom move within Uyo typically runs ₦45,000 to ₦90,000, and a three-bedroom move ₦120,000 to ₦250,000 depending on access, floor level and how much needs dismantling. Moves out to Eket, Oron or Ikot Ekpene are priced on distance on top of that.',
        },
        {
          q: 'What should I tell movers when posting a job in Uyo?',
          a: 'Floor level at both ends, how close a truck can park, and anything that needs dismantling — wardrobes and beds especially. Those three facts are what separate an accurate quote from one that changes on the day, and they are the usual source of arguments at the far end.',
        },
        {
          q: 'Can I move during the rainy season?',
          a: 'Yes, but build in protection. Ask what covering is provided for mattresses and electronics, and be realistic about roads that soften in heavy rain. Booking a morning slot gives you room if the weather moves the schedule.',
        },
        {
          q: 'Do I need a full truck for one heavy item?',
          a: 'No. Single-item pickup and dispatch is a normal job on the platform, and quoting it as its own job is far cheaper than booking a full move for one generator or fridge. Include the weight and dimensions if you know them.',
        },
      ],
    },
    {
      trade: 'handyman',
      priceBand: { low: 10_000, high: 70_000, unit: 'per job, workmanship only' },
      jobTypes: [
        'Gates, burglary bars and railings, including rust treatment',
        'Door locks, hinges and handle replacement',
        'Curtain rails, shelving and TV mounting',
        'Tailoring alterations and repairs',
        'Small jobs bundled into one visit',
      ],
      localNote:
        'Welding is the trade that quietly matters most in Uyo. Salt air and rain mean gates and burglary bars corrode from the base up, and the repair everybody delays — grinding back, treating and repainting — is a fraction of the cost of replacing a gate that has rusted through.',
      faqs: [
        {
          q: 'Can I post several small jobs as one in Uyo?',
          a: 'Yes, and you usually should. A handyman charging for one visit to hang a curtain rail, change two locks and mount a TV is far better value than three separate call-outs. List each task in the job description so the quote covers all of them.',
        },
        {
          q: 'How much does gate repair cost in Uyo?',
          a: 'Rust treatment and repainting on a standard gate typically runs ₦20,000 to ₦50,000 in workmanship, while replacing corroded sections costs more and the steel is a material line item. Catching it while the corrosion is surface-level is dramatically cheaper than waiting until the base has gone.',
        },
        {
          q: 'How do I stop my gate rusting so fast?',
          a: 'The base is where it starts, because water sits there and salt in the air accelerates it. Ask for the bottom sections to be ground back properly, primed with a rust-inhibiting primer and repainted — a topcoat straight over existing rust looks fine for one season and then blisters.',
        },
        {
          q: 'Can I find a tailor in Uyo on HandLancer?',
          a: 'Yes — tailoring sits under this category alongside welders, barbers, drivers and general handymen. For alterations, include measurements or photos of the garment in the job post so quotes come back against something concrete.',
        },
      ],
    },
  ],
};

export const CITY_PAGES: City[] = [UYO];

/* ------------------------------------------------------------------ */
/* The gate                                                            */
/* ------------------------------------------------------------------ */

/** Minimum bar for a city × trade page to be indexed. See the header comment. */
export function isIndexable(content: CityTrade | undefined): content is CityTrade {
  return (
    !!content &&
    content.priceBand.low > 0 &&
    content.priceBand.high > content.priceBand.low &&
    content.jobTypes.length >= 3 &&
    content.faqs.length >= 3
  );
}

export function getCity(slug: string): City | undefined {
  return CITY_PAGES.find((c) => c.slug === slug);
}

export function getCityTrade(citySlug: string, tradeSlug: string): CityTrade | undefined {
  return getCity(citySlug)?.trades.find((t) => t.trade === tradeSlug);
}

/** Every city × trade pair that has a page, indexable or not. */
export function allCityTradePairs(): { city: City; content: CityTrade }[] {
  return CITY_PAGES.flatMap((city) => city.trades.map((content) => ({ city, content })));
}

/** Only the pairs good enough to be indexed — this is what feeds the sitemap. */
export function indexableCityTradePairs(): { city: City; content: CityTrade }[] {
  return allCityTradePairs().filter(({ content }) => isIndexable(content));
}
