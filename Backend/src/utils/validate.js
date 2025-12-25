const validator = require("validator");

function validateSignupData(req) {
  const { firstName, lastName, emailId, password, age, gender, mobileNo } =
    req.body;

  // REQUIRED FIELDS
  if (!firstName || !emailId || !password) {
    throw new Error("Please enter required fields");
  }

  // FIRST NAME
  if (firstName.length < 4 || firstName.length > 30) {
    throw new Error("First name must be 4–30 characters long");
  }

  // LAST NAME (OPTIONAL)
  if (lastName && (lastName.length < 4 || lastName.length > 30)) {
    throw new Error("Last name must be 4–30 characters long");
  }

  // EMAIL
  if (!validator.isEmail(emailId) || emailId.length > 50) {
    throw new Error("Enter a valid email");
  }

  // PASSWORD
  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    throw new Error("Password must be strong");
  }

  // AGE (OPTIONAL)
  if (age !== undefined) {
    if (!Number.isInteger(age) || age < 10 || age > 120) {
      throw new Error("Enter valid age");
    }
  }

  // GENDER (OPTIONAL)
  if (gender && !["male", "female", "other"].includes(gender)) {
    throw new Error("Enter valid gender");
  }

  // MOBILE NUMBER (OPTIONAL)
  if (mobileNo && !validator.isMobilePhone(mobileNo, "en-IN")) {
    throw new Error("Enter valid mobile number");
  }
}

function validateLoginData(req) {
  const { emailId, password } = req.body;
  if (!emailId || !validator.isEmail(emailId)) {
    throw new Error("Enter valid email ID!");
  }
  if (!password) {
    throw new Error("Enter valid Password!");
  }
}
module.exports = { validateSignupData, validateLoginData };
