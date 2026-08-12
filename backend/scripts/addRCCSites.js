// scripts/addRCCSites.js
// RCC Construction ke sites add karne ki script
// Data analysis se nikale gaye main locations

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Site = require('../models/Site');

const RCC_COMPANY_ID = '6a43b217494db1a6fc516e21';

// ── Analysis se nikale gaye main sites ──
// Sirf woh locations jo 4+ check-ins hain aur clearly ek site hain
const RCC_SITES = [

  // ── MAIN SITES (High frequency) ──
  {
    site_name: 'Scope College Site',
    type: 'site',
    latitude: 23.1536,
    longitude: 77.4788,
    radius: 400, // Thoda bada radius - multiple nearby points cover honge
    // Covers: NH46 area + Scope Global Skills University area
    // Employees: RCC-VI5351, RCC-AJ1929, RCC-BH4829, RCC-KA9021, RCC-SH8054, RCC-SU2623, RCC-PR1856, RCC-SU9029
    // Check-ins: ~70+ (combined nearby locations)
  },

  {
    site_name: 'Signature Heritage Site',
    type: 'site',
    latitude: 23.1173,
    longitude: 77.4033,
    radius: 400, // Multiple nearby points - Mahawaliya area
    // Covers: MD3123, Mahawaliya area
    // Employees: RCC-DH5982, RCC-SH8054, RCC-RA8829, RCC-AB9581
    // Check-ins: ~25
  },

  {
    site_name: 'Wallia Ji Site - Huzur Tahsil',
    type: 'site',
    latitude: 23.1976,
    longitude: 77.3625,
    radius: 300,
    // Covers: Bhopal Huzur Tahsil area
    // Employees: RCC-RA2549, RCC-SU0941
    // Check-ins: ~16
  },

  {
    site_name: 'Udit Agarwal Ji Site',
    type: 'site',
    latitude: 23.2297,
    longitude: 77.4274,
    radius: 400, // Covers nearby E-5 area also
    // Covers: Shivaji Nagar + E-5 area
    // Employees: RCC-JA1090, RCC-VI2242, RCC-GO3338
    // Check-ins: ~20
  },

  {
    site_name: 'Param Toyota Site - JK Road',
    type: 'site',
    latitude: 23.2535,
    longitude: 77.4493,
    radius: 300,
    // Covers: JK Road area
    // Employees: RCC-VI9409, RCC-SH7972, RCC-GO3338
    // Check-ins: ~15
  },

  {
    site_name: 'Madhav Gupta Ji Site - Kolar',
    type: 'site',
    latitude: 23.1716,
    longitude: 77.4276,
    radius: 300,
    // Covers: Shirdipuram, Kolar area
    // Employees: RCC-VA5455, RCC-LA2053, RCC-SH7972
    // Check-ins: ~21
  },

  {
    site_name: 'RNTU Site - Mendua',
    type: 'site',
    latitude: 23.1342,
    longitude: 77.5624,
    radius: 400,
    // Covers: MD3024 Mendua area
    // Employees: RCC-SA0240
    // Check-ins: ~9
  },

  {
    site_name: 'Piyush Goenka Site',
    type: 'site',
    latitude: 23.1240,
    longitude: 77.4964,
    radius: 300,
    // Covers: Srikrishnapuram, Indus Town
    // Employees: RCC-MA6817
    // Check-ins: ~8
  },

  {
    site_name: 'Rajeev Abbott Ji Site - TT Nagar',
    type: 'site',
    latitude: 23.2348,
    longitude: 77.3962,
    radius: 300,
    // Covers: North TT Nagar area
    // Employees: RCC-MA3385
    // Check-ins: ~8
  },

  {
    site_name: 'Imliya Jargar Site',
    type: 'site',
    latitude: 23.1184,
    longitude: 77.4295,
    radius: 300,
    // Covers: Amrawad Kalan area
    // Employees: RCC-RA0669
    // Check-ins: ~10
  },

  {
    site_name: 'Krishna Campus Site',
    type: 'site',
    latitude: 23.2658,
    longitude: 77.4253,
    radius: 300,
    // Employees: RCC-VI9409
    // Check-ins: ~4
  },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const isDryRun = !process.argv.includes('--apply');

    if (isDryRun) {
      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║  🔍 DRY RUN - Sirf preview dikhayega               ║');
      console.log('║     Database mein KUCH NAHI add hoga                ║');
      console.log('║                                                     ║');
      console.log('║  Apply karne ke liye:                               ║');
      console.log('║  node scripts/addRCCSites.js --apply                ║');
      console.log('╚══════════════════════════════════════════════════════╝\n');
    } else {
      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║  ⚡ APPLY MODE - Sites add honge!                   ║');
      console.log('╚══════════════════════════════════════════════════════╝\n');
    }

    // Check existing RCC sites
    const existingSites = await Site.find({ 
      company_id: RCC_COMPANY_ID,
      is_active: true,
    });

    console.log(`📍 Existing RCC Sites: ${existingSites.length}`);
    existingSites.forEach(s => {
      console.log(`   - ${s.site_name} | ${s.latitude}, ${s.longitude} | ${s.radius}m`);
    });

    console.log(`\n📋 Sites to be added: ${RCC_SITES.length}\n`);
    console.log('─────────────────────────────────────────────────────');

    RCC_SITES.forEach((site, idx) => {
      console.log(`${idx + 1}. ${site.site_name}`);
      console.log(`   Type: ${site.type}`);
      console.log(`   Lat: ${site.latitude}, Lng: ${site.longitude}`);
      console.log(`   Radius: ${site.radius}m`);
      console.log(`   Maps: https://www.google.com/maps?q=${site.latitude},${site.longitude}`);
      console.log('');
    });

    if (!isDryRun) {
      console.log('⚡ Adding sites...\n');

      let added = 0;
      let failed = 0;

      for (const siteData of RCC_SITES) {
        try {
          const site = await Site.create({
            ...siteData,
            company_id: RCC_COMPANY_ID,
            is_active: true,
          });
          console.log(`✅ Added: ${site.site_name}`);
          added++;
        } catch (err) {
          console.error(`❌ Failed: ${siteData.site_name} - ${err.message}`);
          failed++;
        }
      }

      console.log('\n══════════════════════════════════════════════');
      console.log(`✅ Sites added: ${added}`);
      if (failed > 0) console.log(`❌ Failed: ${failed}`);
      console.log('══════════════════════════════════════════════\n');

      // Verify
      const totalRCCSites = await Site.countDocuments({ 
        company_id: RCC_COMPANY_ID, 
        is_active: true 
      });
      console.log(`📍 Total RCC Sites now: ${totalRCCSites}`);

    } else {
      console.log('══════════════════════════════════════════════════════');
      console.log('🔍 DRY RUN COMPLETE - Database mein KUCH NAHI badla');
      console.log('');
      console.log('   Maps links dekho - sahi location hai?');
      console.log('   Phir run karo:');
      console.log('   node scripts/addRCCSites.js --apply');
      console.log('══════════════════════════════════════════════════════\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();