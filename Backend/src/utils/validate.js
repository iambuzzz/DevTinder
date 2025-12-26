const validator = require("validator");

function validateSignupData(req) {
  const {
    firstName,
    lastName,
    emailId,
    password,
    age,
    gender,
    mobileNo,
    skillsOrInterests,
    photoURL,
  } = req.body;

  if (!firstName || !emailId || !password) {
    throw new Error("Please enter required fields");
  }

  if (firstName.length < 3 || firstName.length > 30) {
    throw new Error("First name must be 3–30 characters long");
  }

  if (lastName && (lastName.length < 3 || lastName.length > 30)) {
    throw new Error("Last name must be 3–30 characters long");
  }

  // EMAIL
  if (!validator.isEmail(emailId) || emailId.length > 50) {
    throw new Error("Enter a valid email");
  }

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

  if (age !== undefined) {
    if (!Number.isInteger(age) || age < 10 || age > 120) {
      throw new Error("Enter valid age");
    }
  }

  if (gender && !["male", "female", "other"].includes(gender)) {
    throw new Error("Enter valid gender");
  }

  if (mobileNo && !validator.isMobilePhone(mobileNo, "en-IN")) {
    throw new Error("Enter valid mobile number");
  }

  if (skillsOrInterests) {
    if (!Array.isArray(skillsOrInterests)) {
      throw new Error("Skills must be an array of strings");
    }
    if (skillsOrInterests.length > 15) {
      throw new Error("Cannot add more than 15 skills");
    }
    // Check if every item in array is a string and not too long
    const isValid = skillsOrInterests.every(
      (skill) => typeof skill === "string" && skill.length < 50
    );
    if (!isValid) {
      throw new Error("Each skill must be a string and under 50 characters");
    }
  }

  if (photoURL) {
    const isUrlValid = validator.isURL(photoURL);
    if (!isUrlValid) {
      throw new Error("Invalid Photo URL");
    }
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

function validateEditProfileData(req) {
  const allowedEdits = [
    "firstName",
    "lastName",
    "age",
    "gender",
    "mobileNo",
    "skillsOrInterests",
    "photoURL",
  ];

  const requestedFields = Object.keys(req.body);

  const isAllowed = requestedFields.every((field) =>
    allowedEdits.includes(field)
  );

  if (!isAllowed) {
    throw new Error(
      "Invalid edit request: One or more fields are not editable"
    );
  }

  if (
    req.body.firstName &&
    (req.body.firstName.length < 3 || req.body.firstName.length > 30)
  ) {
    throw new Error("First name must be between 3-30 characters");
  }
  if (
    req.body.lastName &&
    (req.body.lastName.length < 3 || req.body.lastName.length > 30)
  ) {
    throw new Error("Last name must be between 3-30 characters");
  }

  if (req.body.age && (req.body.age < 16 || req.body.age > 150)) {
    throw new Error("Age must be between 18 and 150");
  }

  if (
    req.body.gender &&
    !["male", "female", "other"].includes(req.body.gender)
  ) {
    throw new Error("Gender must be male, female, or other");
  }

  if (
    req.body.mobileNo &&
    !validator.isMobilePhone(req.body.mobileNo, "en-IN")
  ) {
    throw new Error("Invalid mobile number");
  }

  if (req.body.photoURL && !validator.isURL(req.body.photoURL)) {
    throw new Error("Invalid photo URL");
  }

  if (req.body.skillsOrInterests) {
    if (!Array.isArray(req.body.skillsOrInterests)) {
      throw new Error("Skills must be an array");
    }
    if (req.body.skillsOrInterests.length > 15) {
      throw new Error("Maximum 15 skills allowed");
    }
    const isValidSkills = req.body.skillsOrInterests.every(
      (skill) =>
        typeof skill === "string" &&
        skill.trim().length > 0 &&
        skill.length < 50
    );
    if (!isValidSkills) {
      throw new Error("Each skill must be a valid string under 50 characters");
    }
  }

  return true;
}

module.exports = {
  validateSignupData,
  validateLoginData,
  validateEditProfileData,
};
