// ===============================
// HUSTLEHUB+ REGISTRATION
// ===============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const message = document.getElementById("registerMessage");

    if (password !== confirmPassword) {

        message.textContent = "Passwords do not match.";
        message.style.color = "red";

        return;
    }

    try {

        const response = await fetch("/api/auth/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })

        });

        const data = await response.json();

        if (response.ok) {

            message.textContent = data.message;
            message.style.color = "green";

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "index.html";
            }, 2000);

        } else {

            message.textContent = data.message;
            message.style.color = "red";

        }

    } catch (error) {

        console.error("Registration error:", error);

        message.textContent = "Unable to connect to the server.";
        message.style.color = "red";

    }

});
}

// ===============================
// HUSTLEHUB+ LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const message = document.getElementById("loginMessage");

    message.textContent = "Logging in...";
    message.style.color = "#4b1c71";

    try {

        const response = await fetch("/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })

        });

        const data = await response.json();

        if (response.ok) {

            localStorage.setItem("token", data.token);

            message.textContent = "Login successful!";
            message.style.color = "green";

            setTimeout(() => {

                window.location.href = "dashboard.html";

            }, 1000);

        } else {

            message.textContent = data.message;
            message.style.color = "red";

        }

    } catch (error) {

        console.error("Login error:", error);

        message.textContent = "Unable to connect to the server.";
        message.style.color = "red";

    }

});
}

// ===============================
// HUSTLEHUB+ PROTECTED DASHBOARD
// ===============================

const profile = document.getElementById("profile");
const logoutButton = document.getElementById("logoutButton");

if (profile) {

const token = localStorage.getItem("token");

if (!token) {

    window.location.href = "index.html";

} else {

    fetch("/api/profile", {

        method: "GET",

   headers: {
    "Authorization": "Bearer " + token
}
    })

    .then(async response => {

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.message);

        }

        return data;

    })

    .then(data => {

// textContent (not innerHTML) so a name like <img onerror=...> is shown, not run.
profile.replaceChildren();

const profileLines = [
    ["Access Granted", true],
    ["Welcome, " + data.user.name + "!"],
    ["Email: " + data.user.email],
    ["Role: " + data.user.role],
    ["User ID: " + data.user.id]
];

for (const [text, bold] of profileLines) {
    const p = document.createElement("p");
    if (bold) {
        const strong = document.createElement("strong");
        strong.textContent = text;
        p.appendChild(strong);
    } else {
        p.textContent = text;
    }
    profile.appendChild(p);
}

        const welcomeMessage =
            document.getElementById("welcomeMessage");

        if (welcomeMessage) {

           welcomeMessage.textContent =
    "Welcome back, " + data.user.name + ".";
        }

        const clientSection =
            document.getElementById("clientSection");

        const freelancerSection =
            document.getElementById("freelancerSection");

        const adminSection =
            document.getElementById("adminSection");


        if (data.user.role === "client") {

            if (clientSection) {
                clientSection.style.display = "block";
            }

        }

        if (data.user.role === "freelancer") {

            if (freelancerSection) {
                freelancerSection.style.display = "block";
            }

        }

        if (data.user.role === "admin") {

            if (adminSection) {
                adminSection.style.display = "block";
            }

        }

    })

    .catch(error => {

        console.error("Profile error:", error);

        localStorage.removeItem("token");

        window.location.href = "index.html";

    });

}
}

// ===============================
// LOGOUT
// ===============================

if (logoutButton) {

logoutButton.addEventListener("click", function () {

    localStorage.removeItem("token");

    window.location.href = "index.html";

});
}

// ===============================
// SHOW / HIDE PASSWORD
// (inline onclick handlers are blocked by the Content-Security-Policy)
// ===============================

document.querySelectorAll("[data-toggle-password]").forEach(function (button) {

    button.addEventListener("click", function () {

        const input = document.getElementById(button.dataset.togglePassword);

        if (!input) {
            return;
        }

        const hidden = input.type === "password";

        input.type = hidden ? "text" : "password";
        button.textContent = hidden ? "Hide" : "Show";

    });
    //------------------------------------------------------
   //            Tax Calculation
 //--------------------------------------------------------
const taxBrackets = [
    { limit: 245100, base: 0, rate: 0.18 },
    { limit: 383100, base: 44118, rate: 0.26 },
    { limit: 530200, base: 79998, rate: 0.31 },
    { limit: 695800, base: 125599, rate: 0.36 },
    { limit: 887000, base: 185215, rate: 0.39 },
    { limit: 1878600, base: 259783, rate: 0.41 },
    { limit: Infinity, base: 666339, rate: 0.45 }
];

const taxRebates = {
    under65: 17820,
    age65to74: 27585,
    age75plus: 30834
};

function calculateGrossTax(annualIncome) {
    if (annualIncome <= 0) return 0;

    const index = taxBrackets.findIndex(
        bracket => annualIncome <= bracket.limit
    );

    const bracket = taxBrackets[index];
    const lowerLimit = index === 0
        ? 0
        : taxBrackets[index - 1].limit;

    return bracket.base +
        (annualIncome - lowerLimit) * bracket.rate;
}

function estimateTax(monthlyProfit, ageGroup = "under65") {
    if (!Number.isFinite(monthlyProfit) || monthlyProfit < 0) {
        throw new Error("Enter a valid, non-negative income.");
    }

    const annualIncome = monthlyProfit * 12;

    if (!Number.isFinite(annualIncome)) {
        throw new Error("Income value is too large.");
    }

    const grossTax = calculateGrossTax(annualIncome);
    const rebate = taxRebates[ageGroup];

    if (rebate === undefined) {
        throw new Error("Invalid age group.");
    }

    const estimatedTax = Math.max(0, grossTax - rebate);
    const netIncome = annualIncome - estimatedTax;

    return {
        annualIncome,
        grossTax,
        rebate,
        estimatedTax,
        netIncome,
        effectiveRate: annualIncome > 0
            ? (estimatedTax / annualIncome) * 100
            : 0
    };
}



console.log("Annual income:", result.annualIncome);
console.log("Tax before rebate:", result.grossTax);
console.log("Tax rebate:", result.rebate);
console.log("Estimated tax:", result.estimatedTax);
console.log("Income after tax:", result.netIncome);
console.log("Effective tax rate:", result.effectiveRate.toFixed(2) + "%");
});
