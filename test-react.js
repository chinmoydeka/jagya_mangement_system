const assert = require('assert');

// Simulate Laravel response
const axiosError = {
    response: {
        data: {
            errors: {
                email: ["The email has already been taken."]
            }
        }
    }
};

let formErrors = {};
function setFormErrors(val) {
    formErrors = val;
}

try {
    throw axiosError;
} catch (err) {
    if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
    }
}

console.log("formErrors.email:", formErrors.email);
console.log("formErrors.email[0]:", formErrors.email ? formErrors.email[0] : undefined);
