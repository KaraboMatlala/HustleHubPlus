// Test harness: runs the REAL Mongoose models (schemas, validation, defaults,
// casting) but swaps the database calls for an in-memory store, so the API
// can be tested without a MongoDB server.
const mongoose = require("mongoose");

process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";

let clock = Date.now();

function matcher(filter = {}) {
    return (doc) =>
        Object.entries(filter).every(([key, value]) => {
            if (key === "$or") return value.some((f) => matcher(f)(doc));
            if (value instanceof RegExp) return value.test(String(doc[key] ?? ""));
            return String(doc[key]) === String(value);
        });
}

function query(run, registry, schemaOwner) {
    let sortSpec = null;
    const populates = [];

    const q = {
        sort(spec) { sortSpec = spec; return q; },
        populate(path, fields) { populates.push({ path, fields }); return q; },
        then(resolve, reject) {
            try {
                let result = run();
                const isArray = Array.isArray(result);
                let list = isArray ? [...result] : result ? [result] : [];

                if (sortSpec) {
                    const [[field, dir]] = Object.entries(sortSpec);
                    list.sort((a, b) => (a[field] > b[field] ? 1 : -1) * dir);
                }

                if (populates.length) {
                    list = list.map((doc) => {
                        const plain = doc.toObject();
                        for (const { path, fields } of populates) {
                            const ref = schemaOwner.schema.path(path).options.ref;
                            const target = registry[ref].__store.find(
                                (d) => String(d._id) === String(doc[path])
                            );
                            if (!target) { plain[path] = null; continue; }
                            const t = target.toObject();
                            if (fields) {
                                const keep = ["_id", ...fields.split(" ")];
                                plain[path] = Object.fromEntries(keep.map((k) => [k, t[k]]));
                            } else {
                                plain[path] = t;
                            }
                        }
                        return plain;
                    });
                }

                resolve(isArray ? list : list[0] ?? null);
            } catch (e) {
                reject(e);
            }
        }
    };
    return q;
}

const registry = {};

function install(Model, uniqueField) {
    const store = (Model.__store = []);
    registry[Model.modelName] = Model;

    Model.prototype.save = async function () {
        await this.validate();

        if (!store.includes(this)) {
            if (uniqueField && store.some((d) => d[uniqueField] === this[uniqueField])) {
                const dup = new Error("E11000 duplicate key");
                dup.code = 11000;
                throw dup;
            }
            this.createdAt = new Date((clock += 1000));
            store.push(this);
        }
        return this;
    };

    Model.create = async (data) => { const d = new Model(data); await d.save(); return d; };
    Model.findById = (id) => query(() => store.find((d) => String(d._id) === String(id)) || null, registry, Model);
    Model.findOne = (f) => query(() => store.find(matcher(f)) || null, registry, Model);
    Model.find = (f) => query(() => store.filter(matcher(f)), registry, Model);
    Model.exists = async (f) => (store.some(matcher(f)) ? { _id: 1 } : null);
    Model.findByIdAndDelete = async (id) => {
        const i = store.findIndex((d) => String(d._id) === String(id));
        return i >= 0 ? store.splice(i, 1)[0] : null;
    };
}

const User = require("../models/User");
const Gig = require("../models/Gig");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");

install(User, "email");
install(Gig);
install(Booking);
install(Transaction);

const app = require("../app");

async function startServer() {
    const server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
    });
    const base = `http://127.0.0.1:${server.address().port}`;

    async function call(method, path, { body, token, raw } = {}) {
        const headers = {};
        if (body !== undefined || raw !== undefined) headers["Content-Type"] = "application/json";
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(base + path, {
            method,
            headers,
            body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined
        });
        let json = null;
        try { json = await res.json(); } catch { /* not JSON */ }
        return { status: res.status, body: json };
    }

    return { call, close: () => server.close(), models: { User, Gig, Booking, Transaction } };
}

module.exports = { startServer };
