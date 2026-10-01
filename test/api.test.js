const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer } = require("./helpers");

let api, close, models;
const tokens = {};
const ids = {};

before(async () => {
    ({ call: api, close, models } = await startServer());
});

after(() => close());

async function signUp(key, role) {
    const email = `${key}@example.com`;
    const reg = await api("POST", "/api/auth/register", {
        body: { name: `User ${key}`, email, password: "Password1", ...(role ? { role } : {}) }
    });
    assert.equal(reg.status, 201, JSON.stringify(reg.body));
    const login = await api("POST", "/api/auth/login", { body: { email, password: "Password1" } });
    assert.equal(login.status, 200);
    tokens[key] = login.body.token;
    ids[key] = login.body.user.id;
    return login.body;
}

test("register: validation", async () => {
    const bad = (body) => api("POST", "/api/auth/register", { body });
    assert.equal((await bad({})).status, 400);
    assert.equal((await bad({ name: "A", email: "nope", password: "Password1" })).status, 400);
    assert.equal((await bad({ name: "A", email: "a@b.co", password: "short1A" })).status, 400);
    assert.equal((await bad({ name: "A", email: "a@b.co", password: "alllowercase1" })).status, 400);
    assert.equal((await bad({ name: "A", email: "a@b.co", password: "NoNumbersHere" })).status, 400);
    assert.equal((await bad({ name: "A", email: "a@b.co", password: "Password1", role: "admin" })).status, 400, "admin must not be self-assignable");
    assert.equal((await bad({ name: "A", email: "a@b.co", password: "Password1", role: "wizard" })).status, 400);
    assert.equal((await bad({ name: { $ne: 1 }, email: "a@b.co", password: "Password1" })).status, 400);
});

test("register: role defaults to client, freelancer allowed, duplicates rejected", async () => {
    const client = await signUp("client1");
    assert.equal(client.user.role, "client");
    const freelancer = await signUp("free1", "freelancer");
    assert.equal(freelancer.user.role, "freelancer");
    await signUp("free2", "freelancer");
    await signUp("client2", "client");

    const dup = await api("POST", "/api/auth/register", {
        body: { name: "Dup", email: "CLIENT1@example.com", password: "Password1" }
    });
    assert.equal(dup.status, 409);
});

test("login: validation, injection and wrong password", async () => {
    assert.equal((await api("POST", "/api/auth/login", { body: {} })).status, 400, "missing email used to crash with 500");
    assert.equal((await api("POST", "/api/auth/login", { body: { email: { $gt: "" }, password: { $gt: "" } } })).status, 400);
    assert.equal((await api("POST", "/api/auth/login", { body: { email: "client1@example.com", password: "Wrong1234" } })).status, 401);
    assert.equal((await api("POST", "/api/auth/login", { body: { email: "ghost@example.com", password: "Password1" } })).status, 401);
});

test("profile: needs a valid token", async () => {
    assert.equal((await api("GET", "/api/profile")).status, 401);
    const bad = await api("GET", "/api/profile", { token: "garbage" });
    assert.equal(bad.status, 403);
    assert.equal(bad.body.code, "TOKEN_INVALID");
    const ok = await api("GET", "/api/profile", { token: tokens.client1 });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.user.role, "client");
    assert.equal(ok.body.user.password, undefined);
});

test("api: unknown route and bad JSON return JSON errors", async () => {
    const nf = await api("GET", "/api/nope");
    assert.equal(nf.status, 404);
    assert.ok(nf.body.message);
    const bj = await api("POST", "/api/auth/login", { raw: "{not json" });
    assert.equal(bj.status, 400);
});

test("gigs: only freelancers create; input is validated", async () => {
    const gig = { title: "Logo design", description: "Three concepts", category: "Design", price: 350 };

    assert.equal((await api("POST", "/api/gigs", { body: gig })).status, 401);
    assert.equal((await api("POST", "/api/gigs", { body: gig, token: tokens.client1 })).status, 403);

    assert.equal((await api("POST", "/api/gigs", { token: tokens.free1, body: { ...gig, title: "" } })).status, 400);
    assert.equal((await api("POST", "/api/gigs", { token: tokens.free1, body: { ...gig, price: "abc" } })).status, 400);
    assert.equal((await api("POST", "/api/gigs", { token: tokens.free1, body: { ...gig, price: -5 } })).status, 400);
    assert.equal((await api("POST", "/api/gigs", { token: tokens.free1, body: { ...gig, title: "x".repeat(101) } })).status, 400);
    assert.equal((await api("POST", "/api/gigs", { token: tokens.free1, body: { ...gig, title: { $gt: "" } } })).status, 400);

    const created = await api("POST", "/api/gigs", { token: tokens.free1, body: { ...gig, price: "350.50" } });
    assert.equal(created.status, 201);
    assert.equal(created.body.gig.price, 350.5, "numeric strings are accepted and stored as numbers");
    ids.gigA = created.body.gig._id;

    const second = await api("POST", "/api/gigs", {
        token: tokens.free2,
        body: { title: "Math tutoring", description: "Grade 10-12", category: "Education", price: 250 }
    });
    assert.equal(second.status, 201);
    ids.gigB = second.body.gig._id;
});

test("gigs: public list shows active gigs, hides emails, supports filters", async () => {
    const list = await api("GET", "/api/gigs");
    assert.equal(list.status, 200);
    assert.equal(list.body.count, 2);
    assert.equal(list.body.data[0].freelancer.email, undefined, "freelancer email must not be public");
    assert.ok(list.body.data[0].freelancer.name);

    assert.equal((await api("GET", "/api/gigs?search=logo")).body.count, 1);
    assert.equal((await api("GET", "/api/gigs?category=education")).body.count, 1);
    assert.equal((await api("GET", "/api/gigs?search=.*")).body.count, 0, "regex characters are escaped");
    assert.equal((await api("GET", "/api/gigs?search[$ne]=x")).status, 200, "operator-style query params are harmless");
});

test("gigs: /mine is freelancer-only and includes inactive gigs", async () => {
    assert.equal((await api("GET", "/api/gigs/mine")).status, 401);
    assert.equal((await api("GET", "/api/gigs/mine", { token: tokens.client1 })).status, 403);
    const mine = await api("GET", "/api/gigs/mine", { token: tokens.free1 });
    assert.equal(mine.status, 200);
    assert.equal(mine.body.count, 1);
    assert.equal(mine.body.data[0]._id, ids.gigA);
});

test("gigs: update enforces ownership and validation", async () => {
    const put = (id, body, token) => api("PUT", `/api/gigs/${id}`, { body, token });

    assert.equal((await put(ids.gigA, { price: 400 }, tokens.free2)).status, 403);
    assert.equal((await put("not-an-id", { price: 400 }, tokens.free1)).status, 400);
    assert.equal((await put("64b7f0f0f0f0f0f0f0f0f0f0", { price: 400 }, tokens.free1)).status, 404);
    assert.equal((await put(ids.gigA, { status: "banana" }, tokens.free1)).status, 400);
    assert.equal((await put(ids.gigA, { price: "free" }, tokens.free1)).status, 400);
    assert.equal((await put(ids.gigA, { title: "   " }, tokens.free1)).status, 400);

    const ok = await put(ids.gigA, { price: 400, title: "Premium logo design" }, tokens.free1);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.gig.price, 400);
    assert.equal(ok.body.gig.title, "Premium logo design");
});

test("bookings: only clients book, active gigs only, creates a transaction", async () => {
    const book = (gigId, token) => api("POST", "/api/bookings", { body: { gigId }, token });

    assert.equal((await book(ids.gigA)).status, 401);
    assert.equal((await book(ids.gigA, tokens.free2)).status, 403, "freelancers cannot book");
    assert.equal((await book("garbage", tokens.client1)).status, 400, "bad id used to be a 500");
    assert.equal((await book(undefined, tokens.client1)).status, 400);
    assert.equal((await book("64b7f0f0f0f0f0f0f0f0f0f0", tokens.client1)).status, 404);

    const ok = await book(ids.gigA, tokens.client1);
    assert.equal(ok.status, 201);
    assert.equal(ok.body.booking.amount, 400);
    assert.equal(ok.body.transaction.status, "successful");
    assert.equal(models.Transaction.__store.length, 1);

    // Deactivated gigs can't be booked.
    await api("PUT", `/api/gigs/${ids.gigB}`, { body: { status: "inactive" }, token: tokens.free2 });
    assert.equal((await book(ids.gigB, tokens.client1)).status, 400);
    assert.equal((await api("GET", "/api/gigs")).body.count, 1, "inactive gig disappears from the marketplace");
    assert.equal((await api("GET", "/api/gigs/mine", { token: tokens.free2 })).body.count, 1, "but stays in the owner's list");
});

test("bookings: lists and freelancer income", async () => {
    const mine = await api("GET", "/api/bookings/client", { token: tokens.client1 });
    assert.equal(mine.status, 200);
    assert.equal(mine.body.count, 1);
    assert.equal(mine.body.data[0].gig.title, "Premium logo design");
    assert.equal(mine.body.data[0].freelancer.name, "User free1");

    assert.equal((await api("GET", "/api/bookings/client", { token: tokens.free1 })).status, 403);
    assert.equal((await api("GET", "/api/bookings/client", { token: tokens.client2 })).body.count, 0);

    const fl = await api("GET", "/api/bookings/freelancer", { token: tokens.free1 });
    assert.equal(fl.body.count, 1);
    assert.equal(fl.body.data[0].client.name, "User client1");

    const income = await api("GET", "/api/bookings/income", { token: tokens.free1 });
    assert.equal(income.body.totalIncome, 400);
    assert.equal(income.body.transactionCount, 1);
    assert.equal((await api("GET", "/api/bookings/income", { token: tokens.free2 })).body.totalIncome, 0);
});

test("gigs: a gig with bookings can't be deleted, others can", async () => {
    const del = (id, token) => api("DELETE", `/api/gigs/${id}`, { token });

    assert.equal((await del(ids.gigA, tokens.free2)).status, 403);
    assert.equal((await del("nope", tokens.free1)).status, 400);
    assert.equal((await del(ids.gigA, tokens.free1)).status, 409);
    assert.equal((await del(ids.gigB, tokens.free2)).status, 200);
    assert.equal((await api("GET", "/api/gigs/mine", { token: tokens.free2 })).body.count, 0);
});
