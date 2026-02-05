const User = require('../src/models/user.model');

console.log("Verifying User model fields...");

const attributes = User.rawAttributes;
const expectedFields = ['fullName', 'dateOfBirth', 'gender', 'phoneNumber', 'username', 'emailId', 'password', 'isVerified'];

let missing = [];
expectedFields.forEach(field => {
  if (!attributes[field]) {
    missing.push(field);
  } else {
    console.log(`✅ Field '${field}' exists.`);
  }
});

if (missing.length > 0) {
  console.error("❌ Missing fields:", missing);
  process.exit(1);
} else {
  console.log("🎉 All expected fields are present in the User model.");
}
