/**
 * The service catalogue — everything HandLancer connects people to.
 *
 * ---------------------------------------------------------------------------
 * TWO LEVELS, ON PURPOSE
 * ---------------------------------------------------------------------------
 * CATEGORIES (lib/site.ts) stays at twelve. Those ids mirror the mobile app's
 * `src/constants/categories.ts`, they are what the waitlist form submits, and
 * lib/waitlist.ts validates against them — widening that list would drift the
 * site away from the product and break stored rows.
 *
 * SERVICES (here) is the long tail underneath it. Every service rolls up to one
 * category. This is where breadth lives: the specific things people actually
 * search for, including the ones they assume nobody local does.
 *
 * ---------------------------------------------------------------------------
 * THE GATE — read before adding a page
 * ---------------------------------------------------------------------------
 * Every service is *listed* on its category page, which is free long-tail
 * coverage on a page that is already substantial.
 *
 * A service only gets its OWN page at /services/[category]/[service] once it has
 * genuine depth: `detail` with four or more `involves`, three or more
 * `priceFactors`, and two or more FAQs. Below that it renders as a listed item
 * only, with no URL of its own.
 *
 * That is deliberate. A hundred and twenty pages of two sentences each is a
 * thin-content farm, and Google treats it as one — the whole domain pays, not
 * just the thin pages. Filling in `detail` is how a service earns its URL.
 *
 * To add depth to a service: add `detail` to its entry. Routing, the sitemap,
 * schema, breadcrumbs and internal linking all follow automatically.
 */

import type { Faq } from '@/lib/site';

export type ServiceDetail = {
  /** Conversational "why people actually call" line, in the site voice. */
  demand: string;
  /** What the job actually involves. Four minimum. */
  involves: string[];
  /** What moves the price. Three minimum. */
  priceFactors: string[];
  /** Two minimum. */
  faqs: Faq[];
};

export type Service = {
  slug: string;
  label: string;
  /** Category.id this rolls up to. */
  category: string;
  /** One line: what the service covers. Always required. */
  blurb: string;
  /** What people locally call it. Shown as an "also known as" line, max 3. */
  aliases?: string[];
  /** Presence + completeness decides whether this gets its own page. */
  detail?: ServiceDetail;
};

/* ================================================================== */
/* Catalogue                                                          */
/* ================================================================== */

export const SERVICES: Service[] = [
  /* ---------------- Plumbing ---------------- */
  {
    slug: 'borehole-drilling',
    label: 'Borehole drilling',
    category: 'plumbing',
    blurb: 'Survey, drilling, casing and development of a new borehole.',
    aliases: ['water borehole', 'bore hole'],
    detail: {
      demand:
        'Public supply is unreliable enough that most households eventually stop waiting for it. The decision is rarely whether to drill — it is how deep, and who you trust to tell you the truth about that.',
      involves: [
        'A geophysical survey to find water and estimate depth before anything is drilled',
        'Drilling to the depth the survey indicates, not the depth that fits the budget',
        'Casing and gravel packing to stop the hole collapsing or silting up',
        'Development and flushing until the water runs clear',
        'A yield test so you know what the hole actually produces per hour',
      ],
      priceFactors: [
        'Depth to water, which varies street by street even within one town',
        'Whether the ground is sand, clay or rock — rock needs different equipment and takes longer',
        'Casing diameter and material, which is a large material line item on its own',
        'Access for the rig, since a compound a truck cannot enter changes the whole job',
      ],
      faqs: [
        {
          q: 'How deep does a borehole need to be?',
          a: 'It depends entirely on where you are — this is what the survey is for. Insist on seeing the survey result and having the target depth written into the quote before funding. A driller who quotes a depth without surveying is guessing, and you carry the cost of the guess.',
        },
        {
          q: 'What is a yield test and why does it matter?',
          a: 'It measures how much water the hole actually delivers per hour. A borehole that produces well for ten minutes and then runs dry is a common and expensive disappointment. Ask for the yield figure to be recorded on completion, before you release the workmanship portion.',
        },
        {
          q: 'Is drilling the same job as installing the pump?',
          a: 'No. Drilling is specialist rig work; the pump, pressure tank and the plumbing into the house are ordinary plumbing. They are often quoted together, but they should appear as separate line items so you can see what you are paying for each.',
        },
      ],
    },
  },
  {
    slug: 'borehole-pump-repair',
    label: 'Borehole pump repair',
    category: 'plumbing',
    blurb: 'Submersible and surface pump replacement, pressure tanks and controls.',
    aliases: ['submersible pump repair', 'water pump repair'],
  },
  {
    slug: 'soakaway-construction',
    label: 'Soakaway construction & repair',
    category: 'plumbing',
    blurb: 'Digging, lining and repairing soakaway pits, and diagnosing ones that keep filling.',
    aliases: ['soak away', 'septic soakaway'],
    detail: {
      demand:
        'Almost nobody calls about a soakaway until it backs up, and by then the question is not how to empty it but why it filled so fast in the first place.',
      involves: [
        'Checking the water table and existing pit depth before quoting a fix',
        'Excavation to a depth that accounts for ground water, not just waste volume',
        'Lining or ringing the pit so the walls cannot collapse inward',
        'Connecting and falling the inlet pipe correctly from the septic tank',
        'Backfilling and reinstating the surface above it',
      ],
      priceFactors: [
        'Required depth — the single biggest driver, and the one most often understated',
        'Ground conditions and how much of the dig has to be done by hand',
        'Whether the existing pit can be deepened or a second one is needed',
        'Distance from the septic tank and how much pipework has to be relaid',
      ],
      faqs: [
        {
          q: 'Why does my soakaway keep filling up?',
          a: 'Usually depth, especially anywhere with a high water table — the pit fills from the ground as well as from the house. If yours needs emptying more than once a season, repeated evacuation is treating the symptom. A deeper or additional pit is the actual fix.',
        },
        {
          q: 'How do I stop being overcharged for this?',
          a: 'Get the intended depth written into the quote as a material line item. Without a stated depth you have no way to tell whether the pit you paid for was the pit you got, and no basis for a dispute if it backs up again next season.',
        },
      ],
    },
  },
  {
    slug: 'burst-pipe-repair',
    label: 'Burst pipe repair',
    category: 'plumbing',
    blurb: 'Emergency repair of burst and leaking pipework, including chased-in runs.',
    aliases: ['pipe leak repair'],
  },
  {
    slug: 'water-heater-installation',
    label: 'Water heater installation',
    category: 'plumbing',
    blurb: 'Instant and storage water heater supply, mounting and connection.',
    aliases: ['geyser installation', 'heater installation'],
  },
  {
    slug: 'overhead-tank-installation',
    label: 'Overhead tank installation',
    category: 'plumbing',
    blurb: 'Tank supply, stand mounting, float valves and distribution plumbing.',
    aliases: ['water tank installation', 'GP tank'],
  },
  {
    slug: 'toilet-repair',
    label: 'Toilet & WC repair',
    category: 'plumbing',
    blurb: 'Cistern mechanisms, running toilets, blockages and WC replacement.',
    aliases: ['water closet repair'],
  },
  {
    slug: 'bathroom-plumbing',
    label: 'Bathroom refit plumbing',
    category: 'plumbing',
    blurb: 'First and second fix plumbing for a full bathroom or shower room.',
  },
  {
    slug: 'water-treatment',
    label: 'Water treatment & filtration',
    category: 'plumbing',
    blurb: 'Filters, softeners and treatment for iron, hardness and borehole water.',
    aliases: ['water purification', 'water filter installation'],
  },
  {
    slug: 'drainage-clearing',
    label: 'Blocked drain clearing',
    category: 'plumbing',
    blurb: 'Clearing blocked drains, gullies and waste runs, and finding the cause.',
    aliases: ['drain unblocking'],
  },

  /* ---------------- Electrical ---------------- */
  {
    slug: 'house-wiring',
    label: 'House wiring & rewiring',
    category: 'electrical',
    blurb: 'Full and partial rewires, new circuits, sockets and lighting points.',
    aliases: ['electrical wiring', 'rewiring'],
  },
  {
    slug: 'inverter-installation',
    label: 'Inverter installation',
    category: 'electrical',
    blurb: 'Inverter sizing, battery banks, changeover wiring and load testing.',
    aliases: ['inverter and battery', 'backup power'],
    detail: {
      demand:
        'People rarely buy an inverter because they planned to. They buy one after a stretch of bad supply, and the ones who are still happy a year later are the ones who sized it before buying rather than after.',
      involves: [
        'Working out your real load — what you want to run, and for how many hours',
        'Sizing the inverter and battery bank against that load rather than a round number',
        'Mounting and ventilating the battery bank, which matters more than most installs admit',
        'Wiring a changeover so mains, generator and inverter cannot fight each other',
        'Testing under actual load before the job is signed off',
      ],
      priceFactors: [
        'Battery type and capacity — usually the largest single material cost',
        'Inverter rating, and whether you need pure sine wave for sensitive equipment',
        'How much rewiring is needed to separate the circuits you want backed up',
        'Cable runs from the battery location to the distribution board',
      ],
      faqs: [
        {
          q: 'What size inverter do I need?',
          a: 'It comes from your load, not from a price bracket. List what you want running and for how long — fans, lights, fridge, television — and let the installer size against that. An inverter bought before that calculation is either underpowered within a week or overpriced for what it does.',
        },
        {
          q: 'Why do my batteries keep dying early?',
          a: 'Most commonly heat, ventilation and depth of discharge. Batteries in an unventilated cupboard run hot and lose life fast, and a bank sized too small gets discharged too deeply every night. Both are installation decisions, not battery defects.',
        },
        {
          q: 'Should the whole house run on the inverter?',
          a: 'Usually not. Backing up selected circuits — lights, sockets, fridge — costs far less than backing up everything including air conditioning and pressing irons, and it makes the batteries last dramatically longer. That circuit separation is part of the job.',
        },
      ],
    },
  },
  {
    slug: 'solar-installation',
    label: 'Solar panel installation',
    category: 'electrical',
    blurb: 'Panel mounting, charge controllers, hybrid inverters and system commissioning.',
    aliases: ['solar power', 'solar system installation'],
    detail: {
      demand:
        'Solar stopped being an idealistic purchase and became an arithmetic one. The question people ask now is simply whether it beats what they currently spend on fuel — and whether the person quoting can show their working.',
      involves: [
        'A load assessment, exactly as with an inverter — panels do not remove that step',
        'Roof or ground mounting sized and oriented for actual sun hours',
        'Charge controller or hybrid inverter selection matched to the array',
        'Battery storage sized for the hours you need after dark',
        'Commissioning with measured output, not just "it is working"',
      ],
      priceFactors: [
        'Array size in watts, which follows directly from your load assessment',
        'Battery storage capacity — usually a larger cost than the panels themselves',
        'Roof type and access, since some mounting needs different fixings and more labour',
        'Whether you want a hybrid system that still uses mains and generator',
      ],
      faqs: [
        {
          q: 'Will solar run my air conditioner?',
          a: 'It can, but that is the load that changes the size and cost of the whole system. Be specific about it up front. A system quoted for lights, fans and a fridge will not quietly absorb an air conditioner later, and finding that out after installation is expensive.',
        },
        {
          q: 'How do I compare solar quotes fairly?',
          a: 'Compare the array watts, the battery capacity in kilowatt hours, and the inverter rating — not the headline price. Three quotes at similar prices can be very different systems, and the cheapest is often the one that quietly shrank the battery bank.',
        },
      ],
    },
  },
  {
    slug: 'db-board-upgrade',
    label: 'DB board & breaker upgrade',
    category: 'electrical',
    blurb: 'Distribution board replacement, circuit separation and breaker sizing.',
    aliases: ['distribution board', 'fuse box'],
  },
  {
    slug: 'earthing-surge-protection',
    label: 'Earthing & surge protection',
    category: 'electrical',
    blurb: 'Earth rod installation, earth testing and surge protective devices.',
    aliases: ['earthing', 'lightning protection'],
  },
  {
    slug: 'generator-changeover',
    label: 'Generator changeover switch',
    category: 'electrical',
    blurb: 'Manual and automatic changeover installation and generator connection.',
    aliases: ['change over switch', 'ATS installation'],
  },
  {
    slug: 'security-lighting',
    label: 'Security & compound lighting',
    category: 'electrical',
    blurb: 'Floodlights, perimeter and motion-sensor lighting for compounds.',
  },
  {
    slug: 'cctv-installation',
    label: 'CCTV installation',
    category: 'electrical',
    blurb: 'Camera siting, cabling, recorders and remote viewing setup.',
    aliases: ['security camera installation', 'surveillance camera'],
    detail: {
      demand:
        'Most CCTV that disappoints was installed to cover a compound in general rather than to answer a specific question. Deciding what you actually need to see — the gate, the entrance, the generator — changes where cameras go and how many you need.',
      involves: [
        'Deciding what each camera is for before choosing how many to install',
        'Siting for light conditions, since a camera facing the morning sun records a silhouette',
        'Cabling and power, including protecting runs where they cross a compound',
        'Recorder setup with enough storage for the retention period you want',
        'Remote viewing configured and tested on your own phone before sign-off',
      ],
      priceFactors: [
        'Number of cameras and resolution',
        'Cable runs and whether they can be surface-fixed or need chasing',
        'Recorder storage capacity, which decides how many days you can look back',
        'Whether night vision or a separate infrared illuminator is required',
      ],
      faqs: [
        {
          q: 'How many cameras do I actually need?',
          a: 'Fewer than most quotes suggest, if they are placed deliberately. Two cameras covering the gate and the main entrance usually answer more real questions than six spread evenly around a compound. Decide what you need to be able to prove, then place cameras for that.',
        },
        {
          q: 'How long will the footage be kept?',
          a: 'That is a storage decision, so ask for the retention period in days to be stated in the quote. A system that overwrites after two days is close to useless for anything you discover on a Monday morning.',
        },
      ],
    },
  },
  {
    slug: 'electric-fence',
    label: 'Electric fence installation',
    category: 'electrical',
    blurb: 'Perimeter electric fencing, energisers, alarm integration and signage.',
    aliases: ['perimeter fence electrification'],
  },
  {
    slug: 'intercom-access-control',
    label: 'Intercom & access control',
    category: 'electrical',
    blurb: 'Gate intercoms, video doorbells, keypads and access control wiring.',
    aliases: ['video doorbell', 'gate intercom'],
  },

  /* ---------------- Carpentry ---------------- */
  {
    slug: 'fitted-wardrobes',
    label: 'Fitted wardrobes',
    category: 'carpentry',
    blurb: 'Built-in wardrobes made and fitted to the room rather than bought off the shelf.',
    aliases: ['built-in wardrobe', 'closet'],
    detail: {
      demand:
        'Free-standing wardrobes waste the space above and beside them, and in a room that is already tight that gap is the whole reason people go fitted.',
      involves: [
        'Measuring the opening properly, including walls that are not square',
        'Agreeing the internal layout — hanging, shelving and drawer split — before cutting',
        'Board selection and edge sealing, which decides how it survives humidity',
        'Carcass build and installation, scribed to the wall rather than gapped',
        'Doors, hinges and handles fitted and adjusted',
      ],
      priceFactors: [
        'Board type and thickness — moisture-resistant board costs more and lasts longer',
        'Run length and height, particularly where it goes to ceiling',
        'Internal complexity: drawers and soft-close runners add cost quickly',
        'Door style, with sliding doors typically costing more than hinged',
      ],
      faqs: [
        {
          q: 'Which board should I ask for?',
          a: 'For anywhere humid, ask for moisture-resistant board or properly sealed plywood rather than plain MDF. Plain MDF that takes on damp swells at the edges and cannot be repaired, only replaced — and the edges are exactly where it will get wet.',
        },
        {
          q: 'Can a carpenter work from my own design?',
          a: 'Yes. Attach a sketch or photos with your measurements to the job post. Quotes come back itemised, so you can see what board and fittings are being priced against your design instead of a single figure for "a wardrobe".',
        },
      ],
    },
  },
  {
    slug: 'kitchen-cabinets',
    label: 'Kitchen cabinets',
    category: 'carpentry',
    blurb: 'Base and wall units, worktops, and full kitchen fit-outs.',
    aliases: ['kitchen fitting', 'cupboards'],
  },
  {
    slug: 'door-installation',
    label: 'Door installation & repair',
    category: 'carpentry',
    blurb: 'Hanging, easing and replacing internal, external and security doors.',
    aliases: ['door hanging', 'door frame repair'],
  },
  {
    slug: 'pvc-ceiling',
    label: 'PVC ceiling installation',
    category: 'carpentry',
    blurb: 'PVC and panel ceilings, including noggins and trims.',
    aliases: ['PVC ceiling sheet', 'plastic ceiling'],
  },
  {
    slug: 'custom-furniture',
    label: 'Custom furniture',
    category: 'carpentry',
    blurb: 'Beds, tables, wardrobes and pieces built to your measurements.',
    aliases: ['bespoke furniture', 'furniture making'],
  },
  {
    slug: 'wooden-flooring',
    label: 'Wooden & laminate flooring',
    category: 'carpentry',
    blurb: 'Laminate, engineered and solid timber floor laying.',
    aliases: ['laminate flooring', 'parquet'],
  },
  {
    slug: 'shelving-tv-units',
    label: 'Shelving & TV units',
    category: 'carpentry',
    blurb: 'Floating shelves, media walls, bookcases and display units.',
  },
  {
    slug: 'roof-carpentry',
    label: 'Roof timber & trusses',
    category: 'carpentry',
    blurb: 'Roof structure, trusses, purlins and repairs to rotted timbers.',
    aliases: ['roofing carpentry'],
  },
  {
    slug: 'window-frames',
    label: 'Window frames & repairs',
    category: 'carpentry',
    blurb: 'Timber window frames, sills, and repairs to swollen or rotted units.',
  },
  {
    slug: 'office-partitioning',
    label: 'Office partitioning',
    category: 'carpentry',
    blurb: 'Partition walls, workstations and shopfitting joinery.',
    aliases: ['shop fitting', 'partition'],
  },

  /* ---------------- Painting ---------------- */
  {
    slug: 'interior-painting',
    label: 'Interior painting',
    category: 'painting',
    blurb: 'Preparation, filling and painting of interior walls and ceilings.',
    aliases: ['house painting', 'room painting'],
  },
  {
    slug: 'exterior-painting',
    label: 'Exterior painting',
    category: 'painting',
    blurb: 'Exterior walls, weather-facing elevations and access equipment.',
    aliases: ['outside painting'],
  },
  {
    slug: 'pop-ceiling',
    label: 'POP ceiling & cornice',
    category: 'painting',
    blurb: 'Plaster of Paris ceilings, cornices, coving and decorative detail.',
    aliases: ['POP', 'plaster of paris ceiling'],
    detail: {
      demand:
        'POP is the finish that makes a plain room look deliberate, which is why it is usually the first thing added to a new build and the last thing budgeted for.',
      involves: [
        'Setting out and levelling the frame or suspension before any plaster goes up',
        'Board or in-situ POP work depending on the design and the span',
        'Cornice and drop detailing, including any concealed lighting recesses',
        'Filling, sanding and making good ready for paint',
        'Coordinating with the electrician if lighting is being recessed into it',
      ],
      priceFactors: [
        'Area covered, usually priced per square metre',
        'Design complexity — plain flat POP is far cheaper than multi-level drops',
        'Whether concealed lighting is being built in, which adds coordination and detail',
        'Ceiling height and access',
      ],
      faqs: [
        {
          q: 'Should POP go in before or after the electrician?',
          a: 'They overlap. Lighting positions must be set before the POP is closed up, because cutting recesses into finished POP afterwards means patching and repainting. Post both jobs with the sequence in mind and say so in the description.',
        },
        {
          q: 'Why is my POP cracking?',
          a: 'Usually movement in the frame or drying too fast, and occasionally water from above. Cracks that follow a straight line normally trace a joint; cracks with staining mean a leak, and painting over them without fixing the source guarantees they return.',
        },
      ],
    },
  },
  {
    slug: 'screeding',
    label: 'Wall screeding',
    category: 'painting',
    blurb: 'Screeding and skimming walls to a smooth finish before painting.',
    aliases: ['skimming', 'wall smoothing'],
  },
  {
    slug: 'texture-coating',
    label: 'Texture & decorative coating',
    category: 'painting',
    blurb: 'Textured finishes, stucco, marble and decorative wall effects.',
    aliases: ['wall texture', 'stucco'],
  },
  {
    slug: 'damp-mould-treatment',
    label: 'Damp & mould treatment',
    category: 'painting',
    blurb: 'Diagnosing the moisture source, treating mould and repainting properly.',
    aliases: ['mould removal', 'damp proofing'],
    detail: {
      demand:
        'Damp is the repair people put off longest and pay for most often, because painting over it works for exactly one season and then the same patch comes back slightly larger.',
      involves: [
        'Finding the moisture source before any treatment — rain penetration, rising damp or condensation',
        'Fixing that source, which is often outside the room the stain is in',
        'Treating the mould with a fungicidal wash rather than covering it',
        'Allowing the wall to dry properly, which takes longer than most schedules assume',
        'Repainting with an appropriate coating once the substrate is genuinely dry',
      ],
      priceFactors: [
        'Whether the source is accessible — a leaking gutter is cheap, a failed damp course is not',
        'Area affected and how far the moisture has travelled through the wall',
        'Drying time required, which can stretch the schedule and therefore the labour',
        'Whether plaster has blown and needs hacking off and re-rendering',
      ],
      faqs: [
        {
          q: 'Can I just paint over the mould?',
          a: 'It will come back through the new coat, usually within one wet season. Mould is a symptom of moisture, and paint does not remove moisture. Ask for the treatment and the source repair to appear as separate line items so you can see they were actually priced.',
        },
        {
          q: 'How do I know if it is rising damp or a leak?',
          a: 'Position and shape are the clue. Rising damp shows as a fairly even band near the bottom of the wall; rain penetration usually appears as a patch on a weather-facing elevation at the height of the defect outside. Photograph the outside face at the same height as the patch — that is what a good tradesman will ask for.',
        },
      ],
    },
  },
  {
    slug: 'wallpaper-installation',
    label: 'Wallpaper installation',
    category: 'painting',
    blurb: 'Wallpaper hanging, feature walls and removal of old paper.',
    aliases: ['wall paper'],
  },
  {
    slug: 'epoxy-floor-coating',
    label: 'Epoxy floor coating',
    category: 'painting',
    blurb: 'Epoxy and resin floors for garages, workshops and commercial spaces.',
    aliases: ['epoxy flooring', '3D floor'],
  },
  {
    slug: 'roof-painting',
    label: 'Roof painting & sealing',
    category: 'painting',
    blurb: 'Roof coating, rust treatment on metal sheets and leak sealing.',
    aliases: ['roof coating'],
  },
  {
    slug: 'gate-spray-painting',
    label: 'Gate & metal spray painting',
    category: 'painting',
    blurb: 'Rust removal, priming and spray finishing on gates, rails and grilles.',
    aliases: ['metal painting', 'gate painting'],
  },

  /* ---------------- Cleaning ---------------- */
  {
    slug: 'deep-cleaning',
    label: 'Deep cleaning',
    category: 'cleaning',
    blurb: 'Full property clean covering the places routine cleaning never reaches.',
    aliases: ['thorough cleaning'],
  },
  {
    slug: 'post-construction-cleaning',
    label: 'Post-construction cleaning',
    category: 'cleaning',
    blurb: 'Removing cement film, paint spots and builders dust before handover.',
    aliases: ['after builders clean', 'post build cleaning'],
    detail: {
      demand:
        'The gap between the builders finishing and you moving in is its own job, and underestimating it is why so many handovers slip by a week.',
      involves: [
        'Removing cement film from tiles and sanitaryware, which ordinary detergent will not shift',
        'Scraping paint and adhesive off glass, frames and fittings',
        'Clearing dust from window tracks, sockets, switch plates and cornices',
        'Cleaning inside fitted units, cupboards and wardrobes before anything goes in',
        'A final wet clean once airborne dust has settled',
      ],
      priceFactors: [
        'Floor area and number of bathrooms, which carry the most cement film',
        'How much paint and adhesive residue was left behind',
        'Whether windows and façade are included and how high they go',
        'Team size needed to finish before a fixed handover date',
      ],
      faqs: [
        {
          q: 'Is this different from a deep clean?',
          a: 'Yes, and pricing it as a deep clean is the usual mistake. Cement film, paint spots and adhesive need different chemicals and tools, and the volume of fine dust means surfaces have to be done more than once as it settles.',
        },
        {
          q: 'When should it be booked?',
          a: 'After the last trade leaves and before furniture arrives. Booking it while snagging is still happening means paying to clean the same rooms twice, and cleaning after furniture is in means never properly reaching the units.',
        },
      ],
    },
  },
  {
    slug: 'move-in-out-cleaning',
    label: 'Move-in & move-out cleaning',
    category: 'cleaning',
    blurb: 'Turnaround cleaning between tenancies, including inside all units.',
    aliases: ['end of tenancy cleaning'],
  },
  {
    slug: 'fumigation',
    label: 'Fumigation & pest control',
    category: 'cleaning',
    blurb: 'Treatment for roaches, rodents, mosquitoes and general infestation.',
    aliases: ['pest control', 'insect treatment'],
  },
  {
    slug: 'termite-treatment',
    label: 'Termite treatment',
    category: 'cleaning',
    blurb: 'Termite inspection, soil treatment and protection of roof timbers.',
    aliases: ['anti-termite treatment', 'white ants'],
  },
  {
    slug: 'upholstery-cleaning',
    label: 'Upholstery & sofa cleaning',
    category: 'cleaning',
    blurb: 'Deep cleaning of sofas, mattresses, chairs and fabric furniture.',
    aliases: ['sofa washing', 'chair cleaning'],
  },
  {
    slug: 'carpet-rug-cleaning',
    label: 'Carpet & rug cleaning',
    category: 'cleaning',
    blurb: 'Carpet shampooing, rug washing and stain treatment.',
  },
  {
    slug: 'water-tank-cleaning',
    label: 'Water tank cleaning',
    category: 'cleaning',
    blurb: 'Draining, scrubbing and disinfecting overhead and ground tanks.',
    aliases: ['tank washing'],
  },
  {
    slug: 'septic-tank-evacuation',
    label: 'Septic tank evacuation',
    category: 'cleaning',
    blurb: 'Emptying septic tanks and soakaways, and advising why they fill.',
    aliases: ['sewage evacuation', 'soakaway emptying'],
  },
  {
    slug: 'office-cleaning',
    label: 'Office & commercial cleaning',
    category: 'cleaning',
    blurb: 'Scheduled or one-off cleaning for offices, shops and clinics.',
    aliases: ['commercial cleaning', 'janitorial'],
  },
  {
    slug: 'window-facade-cleaning',
    label: 'Window & façade cleaning',
    category: 'cleaning',
    blurb: 'Glass, frames and building façades, including work at height.',
    aliases: ['glass cleaning'],
  },

  /* ---------------- Appliance repair ---------------- */
  {
    slug: 'fridge-repair',
    label: 'Fridge & freezer repair',
    category: 'appliance',
    blurb: 'Gas, compressor, thermostat and door seal faults on cooling appliances.',
    aliases: ['refrigerator repair', 'deep freezer repair'],
    detail: {
      demand:
        'A fridge rarely dies outright. It hums, feels cold to the hand but not to the food, and quietly ruins a week of shopping before anyone accepts it is faulty.',
      involves: [
        'Diagnosing the actual fault rather than defaulting to a gas top-up',
        'Leak testing before any regassing, so the gas does not simply escape again',
        'Compressor, thermostat, fan or relay replacement as diagnosed',
        'Cleaning condenser coils, which are often the whole problem',
        'Running the unit and confirming it holds temperature before sign-off',
      ],
      priceFactors: [
        'Whether the compressor needs replacing — the largest single part cost',
        'Gas type, since older and newer refrigerants differ in price and handling',
        'Whether the fault is accessible or the unit must be stripped',
        'Call-out distance and whether the repair can be done on site',
      ],
      faqs: [
        {
          q: 'It just needs gas, right?',
          a: 'Not on its own. A sealed system does not consume refrigerant — if the gas is low, it leaked, and regassing without finding the leak buys you a few weeks. Ask for a leak test to be part of the quote before you fund it.',
        },
        {
          q: 'Is it worth repairing or should I replace it?',
          a: 'The rough test is compressor cost against replacement cost. A thermostat, relay or fan is almost always worth fixing; a failed compressor on an old unit often is not. Ask for the diagnosis and the part cost before deciding, not after.',
        },
      ],
    },
  },
  {
    slug: 'washing-machine-repair',
    label: 'Washing machine repair',
    category: 'appliance',
    blurb: 'Pumps, drums, bearings, boards and machines stuck mid-cycle.',
  },
  {
    slug: 'generator-repair',
    label: 'Generator repair & servicing',
    category: 'appliance',
    blurb: 'Servicing, starter and alternator faults, rewinding and load testing.',
    aliases: ['gen repair', 'plant servicing'],
    detail: {
      demand:
        'A generator that only gets attention when it refuses to start is the most expensive way to own one, and almost everybody learns that the same way.',
      involves: [
        'Oil, filter and plug service on a schedule based on running hours',
        'Starter, battery and charging circuit checks',
        'Fuel system cleaning, which is where most no-start faults actually live',
        'Alternator testing and rewinding where the windings have gone',
        'Load testing so you know it will carry what you need it to',
      ],
      priceFactors: [
        'Generator size, since larger sets need more oil, bigger filters and more labour',
        'Whether the fault is service-level or needs the alternator rewound',
        'Parts availability for the make and model',
        'Whether it can be worked on where it stands or must be moved',
      ],
      faqs: [
        {
          q: 'How often should I service a generator?',
          a: 'By running hours rather than by calendar — and if it is your main power source, that usually means every three to four months. Long daily cycles are hard on oil, filters and the starter, and servicing costs a fraction of a rewind.',
        },
        {
          q: 'Why will it not start even with a new battery?',
          a: 'Most often fuel rather than electrics: stale fuel, a blocked filter or a dirty carburettor. A new battery cures a genuinely flat battery and nothing else, which is why it is worth paying for a diagnosis before buying parts.',
        },
      ],
    },
  },
  {
    slug: 'gas-cooker-repair',
    label: 'Gas cooker & oven repair',
    category: 'appliance',
    blurb: 'Ignition, burners, thermostats, regulators and gas safety checks.',
    aliases: ['cooker repair', 'oven repair'],
  },
  {
    slug: 'microwave-repair',
    label: 'Microwave repair',
    category: 'appliance',
    blurb: 'Magnetrons, door switches, boards and turntable faults.',
  },
  {
    slug: 'tv-repair',
    label: 'TV & home theatre repair',
    category: 'appliance',
    blurb: 'Panel, backlight, board and sound system faults.',
    aliases: ['television repair'],
  },
  {
    slug: 'water-dispenser-repair',
    label: 'Water dispenser repair',
    category: 'appliance',
    blurb: 'Cooling, heating and tap faults on water dispensers.',
  },
  {
    slug: 'inverter-battery-service',
    label: 'Inverter & battery servicing',
    category: 'appliance',
    blurb: 'Battery testing, terminal cleaning, replacement and bank balancing.',
  },
  {
    slug: 'industrial-freezer-repair',
    label: 'Cold room & industrial freezer repair',
    category: 'appliance',
    blurb: 'Commercial refrigeration, cold rooms, display chillers and ice makers.',
    aliases: ['cold room repair', 'commercial fridge'],
  },

  /* ---------------- Masonry ---------------- */
  {
    slug: 'block-work',
    label: 'Block work & walls',
    category: 'masonry',
    blurb: 'Block laying for walls, extensions and structural alterations.',
    aliases: ['bricklaying', 'block laying'],
  },
  {
    slug: 'plastering',
    label: 'Plastering & rendering',
    category: 'masonry',
    blurb: 'Internal plastering, external rendering and patch repairs.',
    aliases: ['rendering', 'wall plastering'],
  },
  {
    slug: 'floor-tiling',
    label: 'Floor tiling',
    category: 'masonry',
    blurb: 'Floor tiles, screeding the substrate and setting out the pattern.',
    aliases: ['tiling', 'tiler'],
    detail: {
      demand:
        'Tiling quotes change after work starts more often than almost any other trade, and the reason is nearly always the floor underneath rather than the tiles on top.',
      involves: [
        'Checking the substrate for level and, where needed, screeding it first',
        'Setting out so cut tiles land where they are least visible',
        'Laying with the right adhesive for the tile and the substrate',
        'Grouting, and sealing where the tile is porous',
        'Skirting, thresholds and trims to finish edges properly',
      ],
      priceFactors: [
        'Area, and how many cuts the room shape forces',
        'Whether the floor needs screeding first — the usual cause of a revised quote',
        'Tile size and material, since large-format and natural stone are slower to lay',
        'Pattern: straight set is quickest, diagonal and herringbone considerably slower',
      ],
      faqs: [
        {
          q: 'Why did my tiling quote go up after work started?',
          a: 'Almost always because the floor was not level and needed screeding, which was not in the original quote. Ask for the substrate to be checked before you fund anything, and for screeding to be either included or explicitly excluded in writing.',
        },
        {
          q: 'How much extra tile should I buy?',
          a: 'Allow around ten percent over the measured area for cuts and breakages, and more for diagonal or herringbone patterns. Buying the shortfall later often means a different batch with a visibly different shade.',
        },
      ],
    },
  },
  {
    slug: 'bathroom-tiling',
    label: 'Bathroom & wall tiling',
    category: 'masonry',
    blurb: 'Wall tiling, wet areas, waterproofing and trim detail.',
  },
  {
    slug: 'interlocking-paving',
    label: 'Interlocking paving',
    category: 'masonry',
    blurb: 'Compound paving with proper falls, edging and drainage.',
    aliases: ['interlocking stone', 'paving stone'],
    detail: {
      demand:
        'Interlocking is bought to make a compound usable in the rains. Laid without thinking about where the water goes, it just relocates the puddle to somewhere less convenient.',
      involves: [
        'Surveying existing levels and deciding where the water should run to',
        'Excavation and a compacted sub-base, which is what stops it sinking later',
        'Sand bedding laid to a deliberate fall rather than flat',
        'Laying, cutting to edges, and installing edge restraints',
        'Jointing sand and compaction, plus any channel or soakaway connection',
      ],
      priceFactors: [
        'Area in square metres',
        'Whether drainage channels or a soakaway connection are included',
        'Depth of excavation needed, which depends on the existing ground',
        'Stone thickness — driveways carrying vehicles need thicker units than footpaths',
      ],
      faqs: [
        {
          q: 'How do I stop my compound flooding after paving?',
          a: 'The fall and the drainage do that, not the stone. Get the levels surveyed first and insist the quote states where water is being directed. Paving laid flat over ground that already holds water will hold it just as well afterwards.',
        },
        {
          q: 'Why is my interlocking sinking in places?',
          a: 'Usually an inadequate or poorly compacted sub-base, sometimes edge restraints that were left out. It is a groundwork failure rather than a stone failure, which is why the sub-base depth is worth having written into the quote.',
        },
      ],
    },
  },
  {
    slug: 'compound-drainage',
    label: 'Compound drainage',
    category: 'masonry',
    blurb: 'Drainage channels, levelling and directing runoff away from buildings.',
    aliases: ['drainage construction', 'gutter construction'],
  },
  {
    slug: 'concrete-repairs',
    label: 'Concrete repairs',
    category: 'masonry',
    blurb: 'Slab, step and column repairs, and patching spalled concrete.',
  },
  {
    slug: 'fence-construction',
    label: 'Fence & boundary wall',
    category: 'masonry',
    blurb: 'Boundary walls, gate piers, copings and perimeter security topping.',
    aliases: ['perimeter fence', 'boundary fence'],
  },
  {
    slug: 'stamped-concrete',
    label: 'Stamped & decorative concrete',
    category: 'masonry',
    blurb: 'Patterned and coloured concrete for driveways and terraces.',
    aliases: ['printed concrete'],
  },
  {
    slug: 'swimming-pool-construction',
    label: 'Swimming pool construction',
    category: 'masonry',
    blurb: 'Pool shells, tiling, filtration plant and pool maintenance.',
    aliases: ['pool construction', 'pool maintenance'],
  },
  {
    slug: 'tank-stand-construction',
    label: 'Tank stand & base construction',
    category: 'masonry',
    blurb: 'Reinforced stands and bases for overhead tanks and plant.',
    aliases: ['tank base', 'stanchion'],
  },

  /* ---------------- AC & cooling ---------------- */
  {
    slug: 'split-ac-installation',
    label: 'Split AC installation',
    category: 'ac',
    blurb: 'Indoor and outdoor unit mounting, pipe runs, drainage and commissioning.',
    aliases: ['AC installation', 'air conditioner installation'],
    detail: {
      demand:
        'An air conditioner is usually bought in the first genuinely hot week of the year, which is also the week every installer is busy — and rushed installs are where the long-term faults come from.',
      involves: [
        'Siting the indoor unit for airflow and the outdoor unit for heat rejection',
        'Measuring the actual pipe run rather than assuming a standard length',
        'Core drilling and sleeving the wall penetration',
        'Running condensate drainage with enough fall to actually drain',
        'Vacuuming the lines and commissioning, then checking it cools under load',
      ],
      priceFactors: [
        'Pipe run length between indoor and outdoor units',
        'Whether the wall needs coring and how thick it is',
        'Bracket type and working height for the outdoor unit',
        'Any electrical work needed to give the unit its own circuit',
      ],
      faqs: [
        {
          q: 'Why is my new AC leaking water inside?',
          a: 'Nearly always the condensate drain rather than a refrigerant fault — insufficient fall, or a blockage. In humid climates the volume of condensate is high enough that a marginal drain backs up into the indoor unit. It is a cheap fix that gets expensive if it soaks the wall first.',
        },
        {
          q: 'Does the pipe run really change the price?',
          a: 'Yes, materially. Pipe, insulation and cable are priced by the metre, and a long run also affects performance. Have it measured before the quote rather than estimated, so the figure you fund is the figure you pay.',
        },
      ],
    },
  },
  {
    slug: 'ac-servicing',
    label: 'AC servicing & coil cleaning',
    category: 'ac',
    blurb: 'Filter and coil cleaning, drain clearing and performance checks.',
    aliases: ['AC maintenance', 'aircon servicing'],
  },
  {
    slug: 'ac-gassing',
    label: 'AC gassing & leak repair',
    category: 'ac',
    blurb: 'Leak detection, repair and refrigerant recharge.',
    aliases: ['AC gas refill', 'freon'],
  },
  {
    slug: 'cold-room-installation',
    label: 'Cold room installation',
    category: 'ac',
    blurb: 'Panel cold rooms, condensing units and temperature monitoring.',
    aliases: ['cold store'],
  },
  {
    slug: 'chiller-repair',
    label: 'Chiller & industrial cooling',
    category: 'ac',
    blurb: 'Chillers, package units and commercial cooling plant.',
  },
  {
    slug: 'ducted-ac',
    label: 'Ducted & central AC',
    category: 'ac',
    blurb: 'Ducted systems, grilles and central air conditioning installation.',
    aliases: ['central air conditioning'],
  },
  {
    slug: 'ac-relocation',
    label: 'AC relocation',
    category: 'ac',
    blurb: 'Removing, moving and recommissioning an existing split unit.',
    aliases: ['AC removal'],
  },

  /* ---------------- Auto repair ---------------- */
  {
    slug: 'mobile-mechanic',
    label: 'Mobile mechanic & diagnostics',
    category: 'auto',
    blurb: 'Diagnostics, servicing and roadside repair at your location.',
    aliases: ['car diagnostics', 'mechanic near me'],
  },
  {
    slug: 'suspension-repair',
    label: 'Suspension & shock repair',
    category: 'auto',
    blurb: 'Shocks, bushes, control arms and steering components.',
    aliases: ['shock absorber replacement'],
  },
  {
    slug: 'panel-beating',
    label: 'Panel beating & respray',
    category: 'auto',
    blurb: 'Dent removal, panel straightening, filling and colour-matched respray.',
    aliases: ['body work', 'auto spray'],
  },
  {
    slug: 'car-ac-repair',
    label: 'Car air conditioning repair',
    category: 'auto',
    blurb: 'Compressors, condensers, leak testing and regassing.',
    aliases: ['car AC gas'],
  },
  {
    slug: 'auto-electrician',
    label: 'Auto electrician',
    category: 'auto',
    blurb: 'Wiring faults, alternators, starters, alarms and central locking.',
    aliases: ['car electrician', 'auto electrical'],
  },
  {
    slug: 'tyre-services',
    label: 'Tyre fitting & wheel balancing',
    category: 'auto',
    blurb: 'Tyre replacement, balancing, alignment and puncture repair.',
    aliases: ['wheel alignment', 'vulcanizer'],
  },
  {
    slug: 'engine-overhaul',
    label: 'Engine overhaul',
    category: 'auto',
    blurb: 'Head gaskets, rings, bearings and full engine rebuilds.',
    aliases: ['engine repair', 'engine knock'],
  },
  {
    slug: 'car-detailing',
    label: 'Car washing & detailing',
    category: 'auto',
    blurb: 'Interior detailing, polishing, paint correction and ceramic coating.',
    aliases: ['car wash', 'auto detailing'],
  },
  {
    slug: 'tricycle-motorcycle-repair',
    label: 'Tricycle & motorcycle repair',
    category: 'auto',
    blurb: 'Keke and okada servicing, engine work and electrical faults.',
    aliases: ['keke repair', 'okada repair'],
  },
  {
    slug: 'towing-recovery',
    label: 'Towing & vehicle recovery',
    category: 'auto',
    blurb: 'Towing, jump starts and recovery of immobilised vehicles.',
    aliases: ['tow truck'],
  },

  /* ---------------- Gardening ---------------- */
  {
    slug: 'lawn-mowing',
    label: 'Lawn mowing & maintenance',
    category: 'gardening',
    blurb: 'Regular or one-off mowing, edging and lawn treatment.',
    aliases: ['grass cutting'],
  },
  {
    slug: 'landscaping',
    label: 'Landscaping & garden design',
    category: 'gardening',
    blurb: 'Laying out compounds, planting schemes, paths and features.',
    aliases: ['garden design', 'compound landscaping'],
  },
  {
    slug: 'tree-cutting',
    label: 'Tree cutting & branch removal',
    category: 'gardening',
    blurb: 'Felling, sectional cutting and removing branches over roofs and lines.',
    aliases: ['tree felling', 'tree trimming'],
    detail: {
      demand:
        'The branch that comes down in a storm is almost never the one that looked dangerous. It is the one nobody looked at, over the roof, at the end of a long dry spell.',
      involves: [
        'Assessing what is underneath and around the tree before deciding the method',
        'Sectional cutting and roping where a straight fell would hit something',
        'Cutting back to a proper point rather than leaving stubs that die back',
        'Removing arisings, or stacking them if you want the wood',
        'Stump treatment or grinding where the stump is in the way',
      ],
      priceFactors: [
        'What is below the tree — clear ground is a fraction of the cost of a roof or power line',
        'Height and spread, and whether climbing or access equipment is needed',
        'Whether waste removal is included, which is often the larger half of the job',
        'Species and timber density, since some cut far slower than others',
      ],
      faqs: [
        {
          q: 'Why do quotes for the same tree vary so much?',
          a: 'Because they are quoting different methods. A tree that can be felled in one piece is quick; the same tree over a roof needs sectional cutting and roping, which takes hours longer and carries real risk. Send photos showing what is *below* the tree, not just the tree.',
        },
        {
          q: 'Should I cut back before the rainy season?',
          a: 'Yes — it is the one gardening job worth booking in advance rather than reacting to. Storms bring down branches that were already dead or overextended, and they land on roofs, cars and lines. Pre-season pruning costs a fraction of roof repair.',
        },
      ],
    },
  },
  {
    slug: 'bush-clearing',
    label: 'Bush clearing',
    category: 'gardening',
    blurb: 'Clearing overgrown plots, compounds and land before building.',
    aliases: ['land clearing', 'site clearing'],
  },
  {
    slug: 'irrigation-installation',
    label: 'Irrigation installation',
    category: 'gardening',
    blurb: 'Sprinkler and drip irrigation, timers and garden water supply.',
    aliases: ['sprinkler system'],
  },
  {
    slug: 'vertical-garden',
    label: 'Vertical gardens & planters',
    category: 'gardening',
    blurb: 'Green walls, planter construction and indoor plant installations.',
    aliases: ['green wall'],
  },
  {
    slug: 'palm-tree-maintenance',
    label: 'Palm tree maintenance',
    category: 'gardening',
    blurb: 'Palm pruning, frond removal and coconut clearing for safety.',
  },

  /* ---------------- Moving & haulage ---------------- */
  {
    slug: 'house-moving',
    label: 'House moving',
    category: 'moving',
    blurb: 'Packing, loading, transport and reassembly for household moves.',
    aliases: ['house removal', 'relocation'],
    detail: {
      demand:
        'Moving quotes go wrong for three reasons, and all three are things nobody asked about before the truck arrived: the floor, the road, and what has to come apart.',
      involves: [
        'Surveying what is being moved, ideally from photos or a walkthrough',
        'Dismantling wardrobes, beds and anything that will not go through a door',
        'Wrapping and protecting mattresses, glass and electronics',
        'Loading, transport and unloading at the far end',
        'Reassembly and placing items in the right rooms',
      ],
      priceFactors: [
        'Floor level at both ends and whether there is a lift',
        'How close a truck can park, which decides how far everything is carried',
        'Volume, and therefore truck size and number of trips',
        'How much dismantling and reassembly is included',
      ],
      faqs: [
        {
          q: 'What should I tell movers when posting the job?',
          a: 'Floor level at both ends, how close a truck can park, and what needs dismantling. Those three facts separate an accurate quote from one that changes on the day, and they are the usual source of arguments at the far end.',
        },
        {
          q: 'Can I move during the rainy season?',
          a: 'Yes, but ask what covering is provided for mattresses and electronics, and be realistic about roads that soften in heavy rain. A morning slot leaves room if the weather moves the schedule.',
        },
      ],
    },
  },
  {
    slug: 'office-relocation',
    label: 'Office relocation',
    category: 'moving',
    blurb: 'Office moves including IT, files, workstations and out-of-hours work.',
    aliases: ['business relocation'],
  },
  {
    slug: 'pickup-dispatch',
    label: 'Pickup & dispatch',
    category: 'moving',
    blurb: 'Single-item pickup, delivery and dispatch runs.',
    aliases: ['dispatch rider', 'delivery'],
  },
  {
    slug: 'heavy-item-moving',
    label: 'Heavy item moving',
    category: 'moving',
    blurb: 'Generators, safes, pianos, machinery and anything that needs a team.',
  },
  {
    slug: 'interstate-haulage',
    label: 'Interstate haulage',
    category: 'moving',
    blurb: 'Long-distance transport of goods and household items between states.',
    aliases: ['long distance moving', 'truck hire'],
  },
  {
    slug: 'furniture-dismantling',
    label: 'Furniture dismantling & reassembly',
    category: 'moving',
    blurb: 'Taking apart and rebuilding wardrobes, beds and flat-pack units.',
    aliases: ['flat pack assembly'],
  },

  /* ---------------- More trades ---------------- */
  {
    slug: 'welding-fabrication',
    label: 'Welding & metal fabrication',
    category: 'other',
    blurb: 'Gates, railings, staircases, canopies and custom metalwork.',
    aliases: ['welder', 'metal fabrication'],
    detail: {
      demand:
        'Metalwork in a coastal or humid climate fails from the bottom up, quietly, and the repair everyone delays costs a fraction of the replacement everyone eventually pays for.',
      involves: [
        'Measuring and templating on site rather than building to a standard size',
        'Fabricating in the workshop, then fitting and adjusting on site',
        'Grinding back existing corrosion to sound metal where repairing',
        'Priming with a rust-inhibiting primer before any topcoat',
        'Finishing, and hanging or fixing with the right ironmongery',
      ],
      priceFactors: [
        'Steel section and gauge — thin sections are cheaper and fail sooner',
        'Design complexity and how much ornamental work is involved',
        'Whether the finish is brush-applied or sprayed',
        'Site access, and whether fitting needs lifting equipment',
      ],
      faqs: [
        {
          q: 'How do I stop my gate rusting so fast?',
          a: 'Treat the base, because that is where it starts — water sits there and, near the coast, salt accelerates it. Ask for corrosion to be ground back to sound metal and primed with a rust-inhibiting primer. A topcoat straight over existing rust looks right for one season and then blisters.',
        },
        {
          q: 'What gauge of steel should I ask for?',
          a: 'Ask for it to be stated in the quote, whatever it is. Two quotes for "a gate" can use quite different sections, and the cheaper one is usually cheaper because it is thinner. Once you know the gauge you can compare honestly.',
        },
      ],
    },
  },
  {
    slug: 'gate-installation',
    label: 'Gate installation & automation',
    category: 'other',
    blurb: 'Sliding and swing gates, motors, remotes and safety sensors.',
    aliases: ['automatic gate', 'gate motor'],
  },
  {
    slug: 'burglary-proof',
    label: 'Burglary bars & window protection',
    category: 'other',
    blurb: 'Window and door security bars, fabricated and fitted to the opening.',
    aliases: ['burglary proof', 'security bars'],
  },
  {
    slug: 'aluminium-windows',
    label: 'Aluminium windows & doors',
    category: 'other',
    blurb: 'Aluminium and sliding windows, glazing, screens and shopfronts.',
    aliases: ['sliding windows', 'casement window'],
  },
  {
    slug: 'tailoring',
    label: 'Tailoring & alterations',
    category: 'other',
    blurb: 'Bespoke garments, alterations, repairs and occasion wear.',
    aliases: ['fashion designer', 'seamstress'],
  },
  {
    slug: 'home-barbing',
    label: 'Home barbing & grooming',
    category: 'other',
    blurb: 'Barbers who come to you, for regular cuts or a household at once.',
    aliases: ['mobile barber', 'home haircut'],
  },
  {
    slug: 'hairdressing-braiding',
    label: 'Hairdressing & braiding',
    category: 'other',
    blurb: 'Braiding, styling, treatments and bridal hair at home.',
    aliases: ['home hairdresser', 'braider'],
  },
  {
    slug: 'private-chef',
    label: 'Private chef & event catering',
    category: 'other',
    blurb: 'Meal preparation, weekly cooking and catering for events.',
    aliases: ['caterer', 'cook'],
  },
  {
    slug: 'driver-hire',
    label: 'Driver hire',
    category: 'other',
    blurb: 'Daily, weekly or occasional drivers, including airport runs.',
    aliases: ['hire a driver', 'chauffeur'],
  },
  {
    slug: 'event-setup',
    label: 'Event setup & rentals',
    category: 'other',
    blurb: 'Canopies, chairs, staging, decoration and event breakdown.',
    aliases: ['event decoration', 'canopy rental'],
  },
  {
    slug: 'photography-videography',
    label: 'Photography & videography',
    category: 'other',
    blurb: 'Events, portraits, product shoots and video coverage.',
    aliases: ['photographer', 'videographer'],
  },
  {
    slug: 'makeup-artistry',
    label: 'Makeup artistry',
    category: 'other',
    blurb: 'Bridal, event and editorial makeup, at your location.',
    aliases: ['makeup artist', 'MUA'],
  },
  {
    slug: 'laundry-ironing',
    label: 'Laundry & ironing',
    category: 'other',
    blurb: 'Pickup laundry, ironing services and dry-cleaning runs.',
    aliases: ['dry cleaning', 'washing and ironing'],
  },
  {
    slug: 'home-tutoring',
    label: 'Home tutoring',
    category: 'other',
    blurb: 'Subject tutoring, exam preparation and lessons at home.',
    aliases: ['private lesson teacher', 'home teacher'],
  },
  {
    slug: 'elderly-childcare',
    label: 'Elderly & childcare support',
    category: 'other',
    blurb: 'Nannies, carers and daytime support arranged through verified profiles.',
    aliases: ['nanny', 'caregiver'],
  },
  {
    slug: 'tv-mounting',
    label: 'TV mounting & bracket installation',
    category: 'other',
    blurb: 'Wall mounting televisions, cable concealment and bracket supply.',
    aliases: ['TV bracket', 'wall mount TV'],
  },
  {
    slug: 'curtain-installation',
    label: 'Curtains & blinds installation',
    category: 'other',
    blurb: 'Curtain rails, tracks, blinds and made-to-measure window dressing.',
    aliases: ['curtain rail', 'window blinds'],
  },
  {
    slug: 'solar-water-heater',
    label: 'Solar water heater',
    category: 'other',
    blurb: 'Solar water heating installation, servicing and descaling.',
  },
  {
    slug: 'satellite-dish-installation',
    label: 'Satellite dish & signal setup',
    category: 'other',
    blurb: 'Dish installation, alignment, decoders and signal faults.',
    aliases: ['DSTV installation', 'dish alignment'],
  },
  {
    slug: 'appliance-installation',
    label: 'Appliance installation',
    category: 'other',
    blurb: 'Installing washing machines, cookers, dishwashers and built-in units.',
  },
  {
    slug: 'locksmith',
    label: 'Locksmith & lock repair',
    category: 'other',
    blurb: 'Lock changes, lockouts, door locks and key cutting.',
    aliases: ['lock repair', 'key cutting'],
  },
  {
    slug: 'signage-branding',
    label: 'Signage & branding',
    category: 'other',
    blurb: 'Shop signs, 3D lettering, vehicle branding and banners.',
    aliases: ['signwriting', 'shop sign'],
  },
  {
    slug: 'computer-repair',
    label: 'Computer & phone repair',
    category: 'other',
    blurb: 'Laptop, desktop and phone repair, data recovery and setup.',
    aliases: ['laptop repair', 'phone repair'],
  },
  {
    slug: 'general-handyman',
    label: 'General handyman',
    category: 'other',
    blurb: 'Several small jobs in one visit — the repairs with no obvious trade.',
    aliases: ['odd jobs', 'handyman'],
  },
];

/* ================================================================== */
/* The gate + lookups                                                 */
/* ================================================================== */

/** Minimum depth for a service to earn its own URL. See the header comment. */
export function hasOwnPage(service: Service): service is Service & { detail: ServiceDetail } {
  const d = service.detail;
  return (
    !!d &&
    d.demand.trim().length > 0 &&
    d.involves.length >= 4 &&
    d.priceFactors.length >= 3 &&
    d.faqs.length >= 2
  );
}

export function servicesForCategory(categoryId: string): Service[] {
  return SERVICES.filter((s) => s.category === categoryId);
}

/** Only the ones with their own page, for linking and the sitemap. */
export function pagedServicesForCategory(categoryId: string): Service[] {
  return servicesForCategory(categoryId).filter(hasOwnPage);
}

export function allPagedServices(): Service[] {
  return SERVICES.filter(hasOwnPage);
}

export function getService(categoryId: string, slug: string): Service | undefined {
  return SERVICES.find((s) => s.category === categoryId && s.slug === slug);
}

export const SERVICE_COUNT = SERVICES.length;
