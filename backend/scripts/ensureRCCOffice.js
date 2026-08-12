const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Site = require('../models/Site');
const Company = require('../models/Company');

const RCC_COMPANY_ID = '6a43b217494db1a6fc516e21';

// RCC office coordinates from your DB
const RCC_OFFICE = {
  site_name: 'Office',
  type: 'office',
  latitude: 23.19756477839128,
  longitude: 77.4173851269985,
  radius: 300,
  is_active: true,
  company_id: RCC_COMPANY_ID,
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const isDryRun = !process.argv.includes('--apply');

    if (isDryRun) {
      console.log('╔══════════════════════════════════════════════════════╗');
      console.log('║  🔍 DRY RUN - RCC Office preview only              ║');
      console.log('║  Apply: node scripts/ensureRCCOffice.js --apply    ║');
      console.log('╚══════════════════════════════════════════════════════╝\n');
    }

    const company = await Company.findById(RCC_COMPANY_ID).select('name code');
    console.log(`🏢 Company: ${company?.name} (${company?.code})\n`);

    // Check ALL RCC office records (active/inactive)
    const existingOfficeSites = await Site.find({
      company_id: RCC_COMPANY_ID,
      site_name: { $regex: /^office$/i },
    });

    console.log(`📍 Existing RCC Office records found: ${existingOfficeSites.length}\n`);

    if (existingOfficeSites.length > 0) {
      existingOfficeSites.forEach((site, idx) => {
        console.log(`${idx + 1}. ${site.site_name}`);
        console.log(`   ID: ${site._id}`);
        console.log(`   Type: ${site.type}`);
        console.log(`   Active: ${site.is_active}`);
        console.log(`   Lat: ${site.latitude}, Lng: ${site.longitude}`);
        console.log(`   Radius: ${site.radius}m\n`);
      });
    } else {
      console.log('⚠️ No RCC Office site found.\n');
    }

    console.log('✅ Target RCC Office config:');
    console.log(`   Name: ${RCC_OFFICE.site_name}`);
    console.log(`   Type: ${RCC_OFFICE.type}`);
    console.log(`   Active: ${RCC_OFFICE.is_active}`);
    console.log(`   Lat: ${RCC_OFFICE.latitude}`);
    console.log(`   Lng: ${RCC_OFFICE.longitude}`);
    console.log(`   Radius: ${RCC_OFFICE.radius}m`);
    console.log(`   Maps: https://www.google.com/maps?q=${RCC_OFFICE.latitude},${RCC_OFFICE.longitude}\n`);

    if (isDryRun) {
      console.log('What will happen:');
      if (existingOfficeSites.length === 0) {
        console.log('   ➕ New RCC Office site will be CREATED');
      } else {
        console.log('   ♻️ First RCC Office site will be UPDATED/ACTIVATED');
        if (existingOfficeSites.length > 1) {
          console.log(`   🗑️ Extra duplicate RCC Office sites (${existingOfficeSites.length - 1}) will be soft-deleted`);
        }
      }

      console.log('\n🔍 DRY RUN COMPLETE - Nothing changed');
      console.log('Run to apply: node scripts/ensureRCCOffice.js --apply\n');
      process.exit(0);
    }

    // APPLY
    let mainOffice;

    if (existingOfficeSites.length === 0) {
      mainOffice = await Site.create(RCC_OFFICE);
      console.log(`✅ Created RCC Office: ${mainOffice._id}`);
    } else {
      mainOffice = existingOfficeSites[0];
      await Site.updateOne(
        { _id: mainOffice._id },
        { $set: RCC_OFFICE }
      );
      console.log(`✅ Updated/Activated RCC Office: ${mainOffice._id}`);

      // Soft delete extra duplicates
      if (existingOfficeSites.length > 1) {
        const duplicateIds = existingOfficeSites.slice(1).map(s => s._id);
        await Site.updateMany(
          { _id: { $in: duplicateIds } },
          { $set: { is_active: false } }
        );
        console.log(`🗑️ Soft-deleted duplicate RCC Office sites: ${duplicateIds.length}`);
      }
    }

    const finalOffices = await Site.find({
      company_id: RCC_COMPANY_ID,
      site_name: { $regex: /^office$/i },
    });

    console.log('\n📍 Final RCC Office records:');
    finalOffices.forEach((site, idx) => {
      console.log(`${idx + 1}. ${site.site_name}`);
      console.log(`   Active: ${site.is_active}`);
      console.log(`   Lat: ${site.latitude}, Lng: ${site.longitude}`);
      console.log(`   Radius: ${site.radius}m\n`);
    });

    console.log('🎉 RCC Office ensured successfully.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();