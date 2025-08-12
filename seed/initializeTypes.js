// // seed/initializeTypes.js
// const Type = require('../models/type');

// async function initializeTypes() {
//     const types = ['Student', 'Supervisor', 'Admin', 'Creator'];

//     for (const name of types) {
//         const existing = await Type.findOne({ name });
//         if (!existing) {
//             await Type.create({ name });
//         }
//     }

//     console.log("✅ User types initialized.");
// }

// module.exports = initializeTypes; // <== This is important!
