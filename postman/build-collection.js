// Generates HustleHubPlus.postman_collection.json + environment.
// Run: node postman/build-collection.js
const fs = require("fs");
const path = require("path");

const items = [];
let folder;

function startFolder(name, description) {
  folder = { name, description, item: [] };
  items.push(folder);
}

// req({name, method, url, token, body, pre, tests})
function req({ name, method = "GET", url, token, body, pre, tests }) {
  const item = {
    name,
    request: {
      method,
      header: [],
      url: { raw: "{{baseUrl}}" + url, host: ["{{baseUrl}}"], path: url.split("?")[0].split("/").filter(Boolean), },
    },
    event: [],
  };
  const q = url.split("?")[1];
  if (q) item.request.url.query = q.split("&").map((p) => { const [key, value] = p.split("="); return { key, value }; });
  if (token) item.request.auth = { type: "bearer", bearer: [{ key: "token", value: `{{${token}}}`, type: "string" }] };
  else item.request.auth = { type: "noauth" };
  if (body !== undefined) {
    item.request.header.push({ key: "Content-Type", value: "application/json" });
    item.request.body = { mode: "raw", raw: typeof body === "string" ? body : JSON.stringify(body, null, 2), options: { raw: { language: "json" } } };
  }
  if (pre) item.event.push({ listen: "prerequest", script: { type: "text/javascript", exec: pre.split("\n") } });
  item.event.push({ listen: "test", script: { type: "text/javascript", exec: tests.split("\n") } });
  folder.item.push(item);
}

const status = (code) => `pm.test("Status is ${code}", () => pm.response.to.have.status(${code}));`;
const msg = (re) => `pm.test("Has a clear error message", () => { const j = pm.response.json(); pm.expect(j.message).to.be.a("string").and.match(${re}); });`;

// ---------------------------------------------------------------- 1. AUTH
startFolder("1. Authentication", "Registration, login and the protected profile route. Success AND failure cases.");

req({
  name: "Register client - success", method: "POST", url: "/api/auth/register",
  pre: `// unique emails on every run so the collection can be re-run
pm.collectionVariables.set("runId", Date.now());`,
  body: { name: "Test Client", email: "client_{{runId}}@example.com", password: "Password123", role: "client" },
  tests: `${status(201)}
const j = pm.response.json();
pm.test("User returned with role client", () => { pm.expect(j.user.role).to.eql("client"); });
pm.test("Password is never returned", () => { pm.expect(JSON.stringify(j)).to.not.include("Password123"); pm.expect(j.user).to.not.have.property("password"); });`,
});
req({
  name: "Register freelancer - success", method: "POST", url: "/api/auth/register",
  body: { name: "Test Freelancer", email: "freelancer_{{runId}}@example.com", password: "Password123", role: "freelancer" },
  tests: `${status(201)}
pm.test("User returned with role freelancer", () => pm.expect(pm.response.json().user.role).to.eql("freelancer"));`,
});
req({
  name: "Register second freelancer - success", method: "POST", url: "/api/auth/register",
  body: { name: "Other Freelancer", email: "freelancer2_{{runId}}@example.com", password: "Password123", role: "freelancer" },
  tests: status(201),
});
req({
  name: "Register - duplicate email (FAIL case)", method: "POST", url: "/api/auth/register",
  body: { name: "Dup", email: "client_{{runId}}@example.com", password: "Password123" },
  tests: `${status(409)}\n${msg("/already exists/i")}`,
});
req({
  name: "Register - weak password (FAIL case)", method: "POST", url: "/api/auth/register",
  body: { name: "Weak", email: "weak_{{runId}}@example.com", password: "alllowercase" },
  tests: `${status(400)}\n${msg("/password/i")}`,
});
req({
  name: "Register - invalid email (FAIL case)", method: "POST", url: "/api/auth/register",
  body: { name: "Bad", email: "not-an-email", password: "Password123" },
  tests: `${status(400)}\n${msg("/email/i")}`,
});
req({
  name: "Register - cannot self-assign admin (RBAC)", method: "POST", url: "/api/auth/register",
  body: { name: "Sneaky", email: "admin_{{runId}}@example.com", password: "Password123", role: "admin" },
  tests: `${status(400)}\n${msg("/client or freelancer/i")}`,
});
req({
  name: "Login client - success", method: "POST", url: "/api/auth/login",
  body: { email: "client_{{runId}}@example.com", password: "Password123" },
  tests: `${status(200)}
const j = pm.response.json();
pm.test("JWT returned (3 dot-separated parts)", () => pm.expect(j.token.split(".")).to.have.lengthOf(3));
pm.test("User has no password field", () => pm.expect(j.user).to.not.have.property("password"));
pm.collectionVariables.set("clientToken", j.token);
pm.collectionVariables.set("clientId", j.user.id);`,
});
req({
  name: "Login freelancer - success", method: "POST", url: "/api/auth/login",
  body: { email: "freelancer_{{runId}}@example.com", password: "Password123" },
  tests: `${status(200)}
const j = pm.response.json();
pm.test("Role is freelancer", () => pm.expect(j.user.role).to.eql("freelancer"));
pm.collectionVariables.set("freelancerToken", j.token);
pm.collectionVariables.set("freelancerId", j.user.id);`,
});
req({
  name: "Login second freelancer - success", method: "POST", url: "/api/auth/login",
  body: { email: "freelancer2_{{runId}}@example.com", password: "Password123" },
  tests: `${status(200)}\npm.collectionVariables.set("freelancer2Token", pm.response.json().token);`,
});
req({
  name: "Login - wrong password (FAIL case)", method: "POST", url: "/api/auth/login",
  body: { email: "client_{{runId}}@example.com", password: "WrongPass999" },
  tests: `${status(401)}
pm.test("Message does not reveal whether the email exists", () => pm.expect(pm.response.json().message).to.match(/invalid email or password/i));`,
});
req({
  name: "Login - unknown email gives same error (FAIL case)", method: "POST", url: "/api/auth/login",
  body: { email: "ghost_{{runId}}@example.com", password: "Password123" },
  tests: `${status(401)}\npm.test("Same message as wrong password", () => pm.expect(pm.response.json().message).to.match(/invalid email or password/i));`,
});
req({
  name: "Login - missing fields (FAIL case)", method: "POST", url: "/api/auth/login", body: {},
  tests: `${status(400)}\n${msg("/required/i")}`,
});
req({
  name: "Profile - valid token", url: "/api/profile", token: "clientToken",
  tests: `${status(200)}
const j = pm.response.json();
pm.test("Returns the logged-in user", () => { pm.expect(j.user.id).to.eql(pm.collectionVariables.get("clientId")); pm.expect(j.user.role).to.eql("client"); });`,
});
req({
  name: "Profile - no token (FAIL case)", url: "/api/profile",
  tests: `${status(401)}\n${msg("/token is required/i")}`,
});
req({
  name: "Profile - invalid token (FAIL case)", url: "/api/profile", token: "badToken",
  pre: `pm.collectionVariables.set("badToken", "this.is.not-a-real-jwt");`,
  tests: `${status(403)}
pm.test("Marked TOKEN_INVALID", () => pm.expect(pm.response.json().code).to.eql("TOKEN_INVALID"));`,
});

// ---------------------------------------------------------------- 2. GIGS
startFolder("2. Gigs", "Freelancer gig management with RBAC, ownership and validation.");

req({
  name: "Create gig - freelancer - success", method: "POST", url: "/api/gigs", token: "freelancerToken",
  body: { title: "Logo design", description: "Three concepts and two revisions", category: "Design", price: 350 },
  tests: `${status(201)}
const g = pm.response.json().gig;
pm.test("Gig is active and owned by the freelancer", () => { pm.expect(g.status).to.eql("active"); pm.expect(g.freelancer).to.eql(pm.collectionVariables.get("freelancerId")); });
pm.test("Price stored as a number", () => pm.expect(g.price).to.eql(350));
pm.collectionVariables.set("gigId", g._id);`,
});
req({
  name: "Create gig - client forbidden (RBAC)", method: "POST", url: "/api/gigs", token: "clientToken",
  body: { title: "Nope", description: "Nope", category: "Design", price: 10 },
  tests: `${status(403)}\n${msg("/permission/i")}`,
});
req({
  name: "Create gig - no token (FAIL case)", method: "POST", url: "/api/gigs",
  body: { title: "Nope", description: "Nope", category: "Design", price: 10 },
  tests: status(401),
});
req({
  name: "Create gig - negative price (validation)", method: "POST", url: "/api/gigs", token: "freelancerToken",
  body: { title: "Bad", description: "Bad", category: "Design", price: -5 },
  tests: `${status(400)}\n${msg("/price/i")}`,
});
req({
  name: "Create gig - missing fields (validation)", method: "POST", url: "/api/gigs", token: "freelancerToken",
  body: { title: "Only a title" },
  tests: `${status(400)}\n${msg("/required/i")}`,
});
req({
  name: "Create gig - NoSQL operator as title (sanitisation)", method: "POST", url: "/api/gigs", token: "freelancerToken",
  body: { title: { "$gt": "" }, description: "x", category: "Design", price: 10 },
  tests: status(400),
});
req({
  name: "List gigs - public", url: "/api/gigs",
  tests: `${status(200)}
const j = pm.response.json();
pm.test("Contains the new gig", () => pm.expect(j.data.map(g => g._id)).to.include(pm.collectionVariables.get("gigId")));
pm.test("Freelancer email is NOT exposed", () => j.data.forEach(g => pm.expect(g.freelancer).to.not.have.property("email")));
pm.test("Freelancer name is shown", () => pm.expect(j.data[0].freelancer.name).to.be.a("string"));`,
});
req({
  name: "List gigs - search and category filter", url: "/api/gigs?search=logo&category=Design",
  tests: `${status(200)}
pm.test("Filter matches the gig", () => pm.expect(pm.response.json().count).to.be.at.least(1));`,
});
req({
  name: "List gigs - search with no match", url: "/api/gigs?search=zzzznomatchzzzz",
  tests: `${status(200)}\npm.test("Empty result", () => pm.expect(pm.response.json().count).to.eql(0));`,
});
req({
  name: "My gigs - freelancer", url: "/api/gigs/mine", token: "freelancerToken",
  tests: `${status(200)}\npm.test("Includes own gig", () => pm.expect(pm.response.json().data.map(g => g._id)).to.include(pm.collectionVariables.get("gigId")));`,
});
req({
  name: "My gigs - client forbidden (RBAC)", url: "/api/gigs/mine", token: "clientToken",
  tests: status(403),
});
req({
  name: "Update gig - owner - success", method: "PUT", url: "/api/gigs/{{gigId}}", token: "freelancerToken",
  body: { price: 400, title: "Premium logo design" },
  tests: `${status(200)}
const g = pm.response.json().gig;
pm.test("Fields updated", () => { pm.expect(g.price).to.eql(400); pm.expect(g.title).to.eql("Premium logo design"); });
pm.collectionVariables.set("gigPrice", g.price);`,
});
req({
  name: "Update gig - another freelancer forbidden (ownership)", method: "PUT", url: "/api/gigs/{{gigId}}", token: "freelancer2Token",
  body: { price: 1 },
  tests: `${status(403)}\n${msg("/own gigs/i")}`,
});
req({
  name: "Update gig - invalid id (validation)", method: "PUT", url: "/api/gigs/not-an-id", token: "freelancerToken",
  body: { price: 1 },
  tests: status(400),
});
req({
  name: "Update gig - invalid status (validation)", method: "PUT", url: "/api/gigs/{{gigId}}", token: "freelancerToken",
  body: { status: "banana" },
  tests: status(400),
});

// ---------------------------------------------------------------- 3. BOOKINGS
startFolder("3. Bookings, transactions and income", "Client booking flow and freelancer income tracking.");

req({
  name: "Book gig - client - success", method: "POST", url: "/api/bookings", token: "clientToken",
  body: { gigId: "{{gigId}}" },
  tests: `${status(201)}
const j = pm.response.json();
pm.test("Booking confirmed for the right amount", () => { pm.expect(j.booking.status).to.eql("confirmed"); pm.expect(j.booking.amount).to.eql(Number(pm.collectionVariables.get("gigPrice"))); });
pm.test("Transaction recorded as successful", () => pm.expect(j.transaction.status).to.eql("successful"));`,
});
req({
  name: "Book gig - freelancer forbidden (RBAC)", method: "POST", url: "/api/bookings", token: "freelancer2Token",
  body: { gigId: "{{gigId}}" },
  tests: status(403),
});
req({
  name: "Book gig - no token (FAIL case)", method: "POST", url: "/api/bookings",
  body: { gigId: "{{gigId}}" },
  tests: status(401),
});
req({
  name: "Book gig - invalid id (validation)", method: "POST", url: "/api/bookings", token: "clientToken",
  body: { gigId: "garbage" },
  tests: status(400),
});
req({
  name: "Book gig - gig does not exist", method: "POST", url: "/api/bookings", token: "clientToken",
  body: { gigId: "64b7f0f0f0f0f0f0f0f0f0f0" },
  tests: status(404),
});
req({
  name: "Client bookings", url: "/api/bookings/client", token: "clientToken",
  tests: `${status(200)}
const j = pm.response.json();
pm.test("Shows the booking with gig and freelancer details", () => { pm.expect(j.count).to.be.at.least(1); pm.expect(j.data[0].gig.title).to.be.a("string"); pm.expect(j.data[0].freelancer.name).to.be.a("string"); });`,
});
req({
  name: "Client bookings - freelancer forbidden (RBAC)", url: "/api/bookings/client", token: "freelancerToken",
  tests: status(403),
});
req({
  name: "Freelancer bookings", url: "/api/bookings/freelancer", token: "freelancerToken",
  tests: `${status(200)}\npm.test("Shows the client who booked", () => pm.expect(pm.response.json().data[0].client.name).to.be.a("string"));`,
});
req({
  name: "Freelancer income", url: "/api/bookings/income", token: "freelancerToken",
  tests: `${status(200)}
const j = pm.response.json();
pm.test("Total income equals the booked price", () => pm.expect(j.totalIncome).to.eql(Number(pm.collectionVariables.get("gigPrice"))));
pm.test("One transaction", () => pm.expect(j.transactionCount).to.eql(1));`,
});
req({
  name: "Other freelancer income is zero (data isolation)", url: "/api/bookings/income", token: "freelancer2Token",
  tests: `${status(200)}\npm.test("Cannot see another freelancer's income", () => pm.expect(pm.response.json().totalIncome).to.eql(0));`,
});
req({
  name: "Income - client forbidden (RBAC)", url: "/api/bookings/income", token: "clientToken",
  tests: status(403),
});

// ---------------------------------------------------------------- 4. DELETE
startFolder("4. Deleting gigs", "A booked gig cannot be deleted; an unbooked one can.");

req({
  name: "Delete gig with bookings - blocked", method: "DELETE", url: "/api/gigs/{{gigId}}", token: "freelancerToken",
  tests: `${status(409)}\n${msg("/bookings/i")}`,
});
req({
  name: "Create a throw-away gig", method: "POST", url: "/api/gigs", token: "freelancer2Token",
  body: { title: "Temporary", description: "Will be deleted", category: "Other", price: 50 },
  tests: `${status(201)}\npm.collectionVariables.set("tempGigId", pm.response.json().gig._id);`,
});
req({
  name: "Delete gig - other freelancer forbidden (ownership)", method: "DELETE", url: "/api/gigs/{{tempGigId}}", token: "freelancerToken",
  tests: status(403),
});
req({
  name: "Delete gig - owner - success", method: "DELETE", url: "/api/gigs/{{tempGigId}}", token: "freelancer2Token",
  tests: status(200),
});
req({
  name: "Delete gig - already gone", method: "DELETE", url: "/api/gigs/{{tempGigId}}", token: "freelancer2Token",
  tests: status(404),
});

// ---------------------------------------------------------------- 5. SECURITY
startFolder("5. Security (Helmet, sanitisation, rate limiting)", "Run this folder last: the rate-limit test deliberately triggers the login limiter, which then blocks failed logins from your IP for 15 minutes.");

req({
  name: "Security headers present (Helmet + CSP)", url: "/api/gigs",
  tests: `${status(200)}
pm.test("Content-Security-Policy is set", () => pm.expect(pm.response.headers.get("Content-Security-Policy")).to.include("default-src 'self'"));
pm.test("X-Content-Type-Options is nosniff", () => pm.expect(pm.response.headers.get("X-Content-Type-Options")).to.eql("nosniff"));
pm.test("X-Powered-By is hidden", () => pm.expect(pm.response.headers.has("X-Powered-By")).to.be.false);
pm.test("Frame protection is set", () => pm.expect(pm.response.headers.get("X-Frame-Options")).to.exist);`,
});
req({
  name: "NoSQL injection on login is rejected", method: "POST", url: "/api/auth/login",
  body: '{ "email": { "$gt": "" }, "password": { "$gt": "" } }',
  tests: `${status(400)}\npm.test("Not logged in", () => pm.expect(pm.response.json()).to.not.have.property("token"));`,
});
req({
  name: "Malformed JSON gets a JSON error", method: "POST", url: "/api/auth/login",
  body: "{not json",
  tests: `${status(400)}\npm.test("JSON error body", () => pm.expect(pm.response.json().message).to.match(/invalid json/i));`,
});
req({
  name: "Unknown API route returns JSON 404", url: "/api/does-not-exist",
  tests: `${status(404)}\npm.test("JSON body", () => pm.expect(pm.response.json().message).to.match(/not found/i));`,
});
req({
  name: "Rate limit - repeated failed logins get 429", method: "POST", url: "/api/auth/login",
  body: { email: "client_{{runId}}@example.com", password: "WrongPass999" },
  pre: `// Loops this request until the limiter answers 429 (max 30 tries).
const n = Number(pm.collectionVariables.get("rlCount") || 0);
pm.collectionVariables.set("rlCount", n + 1);`,
  tests: `const n = Number(pm.collectionVariables.get("rlCount"));
if (pm.response.code === 401 && n < 30) {
  postman.setNextRequest(pm.info.requestName);
} else {
  pm.collectionVariables.unset("rlCount");
  pm.test("Limiter kicks in with 429 after repeated failures", () => pm.response.to.have.status(429));
  pm.test("Response has a clear message", () => pm.expect(pm.response.json().message).to.match(/too many/i));
  pm.test("RateLimit headers are sent", () => pm.expect(pm.response.headers.has("RateLimit-Policy") || pm.response.headers.has("RateLimit") || pm.response.headers.has("Retry-After")).to.be.true);
}`,
});

const collection = {
  info: {
    name: "HustleHub+ API Tests",
    description: "Automated API tests for HustleHub+: authentication, RBAC, gigs, bookings, income, validation, sanitisation, Helmet and rate limiting.\n\nRun in order (use the Collection Runner or Newman). Every request has pm.test assertions covering success and failure cases.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: items,
  variable: [
    { key: "baseUrl", value: "https://localhost:4000" },
    ...["runId", "clientToken", "freelancerToken", "freelancer2Token", "clientId", "freelancerId", "gigId", "tempGigId", "gigPrice", "badToken"].map((key) => ({ key, value: "" })),
  ],
};

const environment = {
  id: "hustlehubplus-local", name: "HustleHub+ Local",
  values: [{ key: "baseUrl", value: "https://localhost:4000", type: "default", enabled: true }],
  _postman_variable_scope: "environment",
};

const dir = __dirname;
fs.writeFileSync(path.join(dir, "HustleHubPlus.postman_collection.json"), JSON.stringify(collection, null, 2));
fs.writeFileSync(path.join(dir, "HustleHubPlus.postman_environment.json"), JSON.stringify(environment, null, 2));
const count = items.reduce((n, f) => n + f.item.length, 0);
console.log(`Wrote collection: ${items.length} folders, ${count} requests`);
