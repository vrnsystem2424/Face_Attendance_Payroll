// scripts/fixBrokenSites.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Site = require('../models/Site');
const Company = require('../models/Company');

const COMPANIES = {
  DIM: '6a43b217494db1a6fc516e22',
  VRN: '6a43b217494db1a6fc516e23',
  RCC: '6a43b217494db1a6fc516e21',
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const isDryRun = !process.argv.includes('--apply');

    if (isDryRun) {
      console.log('╔════════════════════════════════════════════════╗');
      console.log('║  🔍 DRY RUN - Preview only                    ║');
      console.log('║  Apply: node scripts/fixBrokenSites.js --apply║');
      console.log('╚════════════════════════════════════════════════╝\n');
    }

    const allSites = await Site.find().populate('company_id', 'name code');
    const brokenSites = allSites.filter(s => !s.company_id || !s.company_id._id);
    const goodSites = allSites.filter(s => s.company_id && s.company_id._id);

    console.log(`📍 Total Sites: ${allSites.length}`);
    console.log(`✅ Good (company linked): ${goodSites.length}`);
    console.log(`❌ Broken (no company):   ${brokenSites.length}\n`);

    // ── Categorize ──
    const toDelete = [];   // Duplicate office sites only
    const toAssignRCC = []; // All old RCC sites → assign to RCC

    // Check which companies already have office site
    const dimHasOffice = goodSites.some(s =>
      s.company_id?.name?.includes('Dimensions') &&
      s.site_name?.toLowerCase().includes('office')
    );
    const vrnHasOffice = goodSites.some(s =>
      s.company_id?.name?.includes('VRN') &&
      s.site_name?.toLowerCase().includes('office')
    );
    const rccHasOffice = goodSites.some(s =>
      s.company_id?.name?.includes('RCC') &&
      s.site_name?.toLowerCase().includes('office')
    );

    console.log(`Office sites check:`);
    console.log(`   DIM has office: ${dimHasOffice}`);
    console.log(`   VRN has office: ${vrnHasOffice}`);
    console.log(`   RCC has office: ${rccHasOffice}\n`);

    brokenSites.forEach(site => {
      const isOffice = site.site_name?.toLowerCase() === 'office';

      if (isOffice) {
        // All 3 companies already have office site → DELETE
        toDelete.push({
          site,
          reason: 'Duplicate office site - all companies already have office',
        });
      } else {
        // Ye RCC construction sites hain → ASSIGN to RCC
        toAssignRCC.push(site);
      }
    });

    // ── Show Plan ──
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 PLAN:');
    console.log(`   🏗️  Assign to RCC: ${toAssignRCC.length} sites`);
    console.log(`   🗑️  Delete:         ${toDelete.length} sites`);
    console.log('═══════════════════════════════════════════════════\n');

    if (toAssignRCC.length > 0) {
      console.log('─────────────────────────────────────────────────');
      console.log('🏗️  Will ASSIGN to RCC Construction:');
      console.log('─────────────────────────────────────────────────');
      toAssignRCC.forEach((site, idx) => {
        console.log(`${idx + 1}. ${site.site_name}`);
        console.log(`   Lat: ${site.latitude}, Lng: ${site.longitude}`);
        console.log(`   Radius: ${site.radius}m`);
        console.log(`   Maps: https://www.google.com/maps?q=${site.latitude},${site.longitude}`);
        console.log('');
      });
    }

    if (toDelete.length > 0) {
      console.log('─────────────────────────────────────────────────');
      console.log('🗑️  Will DELETE (duplicate offices):');
      console.log('─────────────────────────────────────────────────');
      toDelete.forEach(({ site, reason }) => {
        console.log(`   ${site.site_name} (${site._id})`);
        console.log(`   Reason: ${reason}`);
        console.log('');
      });
    }

    // ── Apply ──
    if (!isDryRun) {
      console.log('\n⚡ Applying changes...\n');

      let assigned = 0;
      let deleted = 0;

      // Assign RCC sites
      for (const site of toAssignRCC) {
        try {
          await Site.updateOne(
            { _id: site._id },
            { $set: { company_id: COMPANIES.RCC } }
          );
          console.log(`✅ Assigned to RCC: ${site.site_name}`);
          assigned++;
        } catch (err) {
          console.error(`❌ Failed: ${site.site_name} - ${err.message}`);
        }
      }

      // Delete duplicate offices
      for (const { site } of toDelete) {
        try {
          await Site.updateOne(
            { _id: site._id },
            { $set: { is_active: false } }
          );
          console.log(`🗑️  Deleted: ${site.site_name} (${site._id})`);
          deleted++;
        } catch (err) {
          console.error(`❌ Failed: ${site.site_name} - ${err.message}`);
        }
      }

      // Final summary
      console.log('\n═══════════════════════════════════════════════════');
      console.log(`✅ Assigned to RCC: ${assigned}`);
      console.log(`🗑️  Deleted:         ${deleted}`);
      console.log('═══════════════════════════════════════════════════\n');

      // Show final state
      const activeSites = await Site.find({ is_active: true })
        .populate('company_id', 'name code');

      console.log('📍 Final Active Sites:');
      const grouped = {};
      activeSites.forEach(s => {
        const comp = s.company_id?.name || 'NO COMPANY';
        if (!grouped[comp]) grouped[comp] = [];
        grouped[comp].push(s.site_name);
      });

      Object.entries(grouped).forEach(([comp, siteNames]) => {
        console.log(`\n   🏢 ${comp}: ${siteNames.length} sites`);
        siteNames.forEach(name => console.log(`      📍 ${name}`));
      });

    } else {
      console.log('═══════════════════════════════════════════════════');
      console.log('🔍 DRY RUN COMPLETE - Kuch nahi badla');
      console.log('');
      console.log('   Sab sahi hai? Apply karo:');
      console.log('   node scripts/fixBrokenSites.js --apply');
      console.log('═══════════════════════════════════════════════════\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();