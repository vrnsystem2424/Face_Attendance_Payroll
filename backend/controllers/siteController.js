// // controllers/siteController.js

// const Site = require('../models/Site');

// // ════════════════════════════════════════════
// // GET ALL SITES (Company-filtered)
// // ════════════════════════════════════════════
// const getAllSites = async (req, res) => {
//   try {
//     let filter = { is_active: true };

//     // 🆕 Company filter — Super admin sees all, others see only their company
//     if (req.employee.role !== 'super_admin') {
//       const companyId = req.employee.company_id?._id || req.employee.company_id;
//       filter.company_id = companyId;
//     }

//     const sites = await Site.find(filter)
//       .populate('company_id', 'name code')
//       .sort({ createdAt: -1 });

//     console.log(`📍 Found ${sites.length} sites for role: ${req.employee.role}`);

//     return res.status(200).json({
//       success: true,
//       count: sites.length,
//       data: sites,
//     });
//   } catch (error) {
//     console.log('getAllSites error:', error.message);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ════════════════════════════════════════════
// // ADD SITE (Auto-save company_id)
// // ════════════════════════════════════════════
// const addSite = async (req, res) => {
//   try {
//     const { site_name, type, latitude, longitude, radius } = req.body;

//     // Validation
//     if (!site_name || !type || !latitude || !longitude) {
//       return res.status(400).json({
//         success: false,
//         message: 'All fields are required',
//       });
//     }

//     // 🆕 Extract company_id from logged-in admin
//     const companyId = req.employee.company_id?._id || req.employee.company_id;

//     if (!companyId && req.employee.role !== 'super_admin') {
//       return res.status(400).json({
//         success: false,
//         message: 'Company information missing',
//       });
//     }

//     const site = await Site.create({
//       site_name,
//       type,
//       latitude: Number(latitude),
//       longitude: Number(longitude),
//       radius: Number(radius) || 100,
//       company_id: companyId,   // ✅ AUTO-SAVE FROM LOGGED-IN ADMIN
//     });

//     console.log(`✅ Site added: ${site.site_name} for company: ${companyId}`);

//     // Populate company info before sending response
//     const populatedSite = await Site.findById(site._id).populate('company_id', 'name code');

//     return res.status(201).json({
//       success: true,
//       message: 'Site add ho gayi',
//       data: populatedSite,
//     });
//   } catch (error) {
//     console.log('addSite error:', error.message);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ════════════════════════════════════════════
// // UPDATE SITE (Company-protected)
// // ════════════════════════════════════════════
// const updateSite = async (req, res) => {
//   try {
//     const targetSite = await Site.findById(req.params.id);
//     if (!targetSite) {
//       return res.status(404).json({ success: false, message: 'Site nahi mili' });
//     }

//     // 🆕 Company check — can't edit other company's sites
//     if (req.employee.role !== 'super_admin') {
//       const myCompanyId = req.employee.company_id?._id?.toString()
//                        || req.employee.company_id?.toString();
//       const targetCompanyId = targetSite.company_id?.toString();

//       if (myCompanyId !== targetCompanyId) {
//         return res.status(403).json({
//           success: false,
//           message: 'Doosri company ki site update nahi kar sakte',
//         });
//       }
//     }

//     // Don't allow changing company_id during update
//     const { company_id, ...updateData } = req.body;

//     const site = await Site.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { returnDocument: 'after' }
//     ).populate('company_id', 'name code');

//     return res.status(200).json({
//       success: true,
//       message: 'Site update ho gayi',
//       data: site,
//     });
//   } catch (error) {
//     console.log('updateSite error:', error.message);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// // ════════════════════════════════════════════
// // DELETE SITE (Soft-delete, Company-protected)
// // ════════════════════════════════════════════
// const deleteSite = async (req, res) => {
//   try {
//     const targetSite = await Site.findById(req.params.id);
//     if (!targetSite) {
//       return res.status(404).json({ success: false, message: 'Site nahi mili' });
//     }

//     // 🆕 Company check
//     if (req.employee.role !== 'super_admin') {
//       const myCompanyId = req.employee.company_id?._id?.toString()
//                        || req.employee.company_id?.toString();
//       const targetCompanyId = targetSite.company_id?.toString();

//       if (myCompanyId !== targetCompanyId) {
//         return res.status(403).json({
//           success: false,
//           message: 'Doosri company ki site delete nahi kar sakte',
//         });
//       }
//     }

//     await Site.findByIdAndUpdate(req.params.id, { is_active: false });

//     return res.status(200).json({
//       success: true,
//       message: 'Site delete ho gayi',
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message,
//     });
//   }
// };

// module.exports = { getAllSites, addSite, updateSite, deleteSite };






//////////////////////////////////




// controllers/siteController.js

const Site = require('../models/Site');

// ════════════════════════════════════════════
// GET ALL SITES (Company-filtered)
// ════════════════════════════════════════════
const getAllSites = async (req, res) => {
  try {
    const filter = { is_active: true };

    // Super admin → see all sites OR filter by query company_id
    if (req.employee.role === 'super_admin') {
      if (req.query.company_id && req.query.company_id !== 'all') {
        filter.company_id = req.query.company_id;
      }
    } 
    // Admin/others → only own company sites
    else {
      const companyId = req.employee.company_id?._id || req.employee.company_id;
      filter.company_id = companyId;
    }

    const sites = await Site.find(filter)
      .populate('company_id', 'name code')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sites.length,
      data: sites,
    });
  } catch (error) {
    console.log('getAllSites error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════
// ADD SITE
// Super Admin → company_id from body
// Admin → company_id from logged-in admin
// ════════════════════════════════════════════
const addSite = async (req, res) => {
  try {
    const { site_name, type, latitude, longitude, radius, company_id } = req.body;

    // Validation
    if (!site_name || !type || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Site name, type, latitude and longitude are required',
      });
    }

    // Company ID logic
    const finalCompanyId = req.employee.role === 'super_admin'
      ? company_id
      : (req.employee.company_id?._id || req.employee.company_id);

    if (!finalCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Company required',
      });
    }

    const site = await Site.create({
      site_name: site_name.trim(),
      type,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius) || 100,
      company_id: finalCompanyId,
      is_active: true,
    });

    const populatedSite = await Site.findById(site._id)
      .populate('company_id', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Site add ho gayi',
      data: populatedSite,
    });
  } catch (error) {
    console.log('addSite error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════
// UPDATE SITE
// Super Admin → can update any site and can change company_id
// Admin → can update only own company site and cannot change company_id
// ════════════════════════════════════════════
const updateSite = async (req, res) => {
  try {
    const targetSite = await Site.findById(req.params.id);

    if (!targetSite) {
      return res.status(404).json({
        success: false,
        message: 'Site nahi mili',
      });
    }

    // Admin company protection
    if (req.employee.role !== 'super_admin') {
      const myCompanyId =
        req.employee.company_id?._id?.toString() ||
        req.employee.company_id?.toString();

      const targetCompanyId = targetSite.company_id?.toString();

      if (myCompanyId !== targetCompanyId) {
        return res.status(403).json({
          success: false,
          message: 'Doosri company ki site update nahi kar sakte',
        });
      }
    }

    const {
      site_name,
      type,
      latitude,
      longitude,
      radius,
      company_id,
      is_active,
    } = req.body;

    const updateData = {};

    if (site_name !== undefined) updateData.site_name = site_name.trim();
    if (type !== undefined) updateData.type = type;
    if (latitude !== undefined) updateData.latitude = Number(latitude);
    if (longitude !== undefined) updateData.longitude = Number(longitude);
    if (radius !== undefined) updateData.radius = Number(radius);
    if (is_active !== undefined) updateData.is_active = is_active;

    // Only super admin can change company_id
    if (req.employee.role === 'super_admin' && company_id) {
      updateData.company_id = company_id;
    }

    const site = await Site.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after' }
    ).populate('company_id', 'name code');

    return res.status(200).json({
      success: true,
      message: 'Site update ho gayi',
      data: site,
    });
  } catch (error) {
    console.log('updateSite error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════
// DELETE SITE (Soft Delete)
// Super Admin → any site
// Admin → only own company site
// ════════════════════════════════════════════
const deleteSite = async (req, res) => {
  try {
    const targetSite = await Site.findById(req.params.id);

    if (!targetSite) {
      return res.status(404).json({
        success: false,
        message: 'Site nahi mili',
      });
    }

    // Admin company protection
    if (req.employee.role !== 'super_admin') {
      const myCompanyId =
        req.employee.company_id?._id?.toString() ||
        req.employee.company_id?.toString();

      const targetCompanyId = targetSite.company_id?.toString();

      if (myCompanyId !== targetCompanyId) {
        return res.status(403).json({
          success: false,
          message: 'Doosri company ki site delete nahi kar sakte',
        });
      }
    }

    await Site.findByIdAndUpdate(req.params.id, {
      is_active: false,
    });

    return res.status(200).json({
      success: true,
      message: 'Site delete ho gayi',
    });
  } catch (error) {
    console.log('deleteSite error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getAllSites,
  addSite,
  updateSite,
  deleteSite,
};