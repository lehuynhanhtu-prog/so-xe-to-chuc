var LedgerCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/cloud-core-entry.mjs
  var cloud_core_entry_exports = {};
  __export(cloud_core_entry_exports, {
    assignVehicle: () => assignVehicle,
    attachmentStem: () => attachmentStem,
    attachmentToday: () => attachmentToday,
    mutateHandover: () => mutateHandover,
    normalizeUsername: () => normalizeUsername,
    projection: () => projection,
    rebuildAssignments: () => rebuildAssignments,
    transaction: () => transaction,
    uniqueAttachmentName: () => uniqueAttachmentName,
    validateUsername: () => validateUsername
  });

  // web/identity.mjs
  function normalizeUsername(value) {
    return String(value ?? "").normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/gu, "").trim().replace(/\s+/gu, "_").toLocaleLowerCase("vi");
  }
  function validateUsername(value) {
    const name = normalizeUsername(value);
    if ([...name].length < 3 || [...name].length > 40 || !/^[\p{L}\p{N}_.-]+$/u.test(name)) throw new Error("T\xEAn \u0111\u0103ng nh\u1EADp c\u1EA7n 3\u201340 k\xFD t\u1EF1: ch\u1EEF (c\xF3 th\u1EC3 c\xF3 d\u1EA5u), s\u1ED1, d\u1EA5u ch\u1EA5m, g\u1EA1ch d\u01B0\u1EDBi ho\u1EB7c g\u1EA1ch ngang.");
    return name;
  }

  // web/handovers.mjs
  var fail = (m) => {
    throw new Error(m);
  };
  var clone = (x) => structuredClone(x);
  var stamp = () => (/* @__PURE__ */ new Date()).toISOString();
  function assignmentEvents(db) {
    if (db.assignmentEvents) return clone(db.assignmentEvents);
    return (db.assignments || []).flatMap((a) => [{ id: a.id, kind: "assign", carId: a.carId, toUserId: a.userId, at: a.startedAt, enteredBy: a.assignedBy }, ...a.endedAt ? [{ id: a.id + ":end", kind: "release", carId: a.carId, toUserId: "", at: a.endedAt, enteredBy: a.assignedBy }] : []]);
  }
  function managementEvents(db) {
    const events = new Map(assignmentEvents(db).map((e) => [e.id, e]));
    for (const h of db.handovers || []) events.set(h.id, { id: h.id, kind: "handover", carId: h.carId, fromUserId: h.fromUserId, toUserId: h.toUserId, at: h.at, enteredBy: h.enteredBy });
    return [...events.values()];
  }
  function rebuildAssignments(db) {
    const periods = [], current = /* @__PURE__ */ new Map();
    for (const e of managementEvents(db).sort((a, b) => a.at.localeCompare(b.at) || (({ release: 0, assign: 1, handover: 2 }[a.kind] ?? 1) - ({ release: 0, assign: 1, handover: 2 }[b.kind] ?? 1) || a.id.localeCompare(b.id)))) {
      if (!db.cars.some((c) => c.id === e.carId)) continue;
      const prior = current.get(e.carId);
      if (e.kind === "handover" && prior?.userId !== e.fromUserId) fail("L\u1ECBch b\xE0n giao kh\xF4ng kh\u1EDBp ng\u01B0\u1EDDi qu\u1EA3n l\xFD t\u1EA1i th\u1EDDi \u0111i\u1EC3m " + e.at + ". Ki\u1EC3m tra ph\xE2n c\xF4ng v\xE0 c\xE1c b\xE0n giao tr\u01B0\u1EDBc/sau.");
      if (prior) prior.endedAt = e.at;
      current.delete(e.carId);
      if (e.toUserId) {
        const next = { id: e.id, carId: e.carId, userId: e.toUserId, startedAt: e.at, assignedBy: e.enteredBy, source: e.kind };
        periods.push(next);
        current.set(e.carId, next);
      }
    }
    return periods;
  }
  function assignVehicle(db, u, args) {
    if (!db.cars.some((c) => c.id === args.carId)) fail("Xe kh\xF4ng t\u1ED3n t\u1EA1i.");
    const target = args.userId ? db.users.find((x) => x.id === args.userId && !x.deletedAt) : null;
    if (args.userId && target?.role !== "driver") fail("Ch\u1EC9 ph\xE2n c\xF4ng cho ng\u01B0\u1EDDi qu\u1EA3n l\xFD/l\xE1i xe.");
    const staged = clone(db);
    staged.assignmentEvents = assignmentEvents(db);
    staged.assignmentEvents.push({ id: crypto.randomUUID(), kind: "assign", carId: args.carId, toUserId: target?.id || "", at: stamp(), enteredBy: u.id });
    staged.assignments = rebuildAssignments(staged);
    db.assignmentEvents = staged.assignmentEvents;
    db.assignments = staged.assignments;
    if (target) target.hasAssignments = true;
  }
  function mutateHandover(db, u, args, remove = false) {
    if (u.role !== "admin" && u.role !== "driver") fail("T\xE0i kho\u1EA3n ch\u1EC9 xem kh\xF4ng \u0111\u01B0\u1EE3c ghi b\xE0n giao.");
    const old = args.id ? (db.handovers || []).find((h) => h.id === args.id) : null;
    if (args.id && !old) fail("B\xE0n giao \u0111\xE3 b\u1ECB x\xF3a.");
    if (old && u.role !== "admin" && old.enteredBy !== u.id) fail("Ch\u1EC9 ng\u01B0\u1EDDi nh\u1EADp ho\u1EB7c Admin \u0111\u01B0\u1EE3c s\u1EEDa/x\xF3a b\xE0n giao.");
    if (old && old.version !== args.version) fail("B\xE0n giao \u0111\xE3 thay \u0111\u1ED5i. \u0110\u1ED3ng b\u1ED9 l\u1EA1i tr\u01B0\u1EDBc khi s\u1EEDa.");
    if (remove && !old) fail("B\xE0n giao \u0111\xE3 b\u1ECB x\xF3a.");
    const staged = clone(db);
    staged.assignmentEvents = assignmentEvents(db).filter((e) => e.id !== old?.id);
    staged.handovers = (db.handovers || []).filter((h) => h.id !== old?.id);
    let next;
    if (!remove) {
      if (args.newId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.newId)) fail("M\xE3 b\xE0n giao kh\xF4ng h\u1EE3p l\u1EC7.");
      if (!db.cars.some((c) => c.id === args.carId)) fail("Xe kh\xF4ng t\u1ED3n t\u1EA1i.");
      for (const id2 of [args.fromUserId, args.toUserId]) if (!db.users.some((x) => x.id === id2 && !x.deletedAt && x.role === "driver")) fail("Ch\u1ECDn hai ng\u01B0\u1EDDi qu\u1EA3n l\xFD/l\xE1i xe h\u1EE3p l\u1EC7.");
      if (args.fromUserId === args.toUserId) fail("Ng\u01B0\u1EDDi giao v\xE0 ng\u01B0\u1EDDi nh\u1EADn ph\u1EA3i kh\xE1c nhau.");
      if (!old && u.role === "driver" && u.id !== args.fromUserId && u.id !== args.toUserId) fail("Ch\u1EC9 nh\u1EADp b\xE0n giao m\xECnh tham gia.");
      if (typeof args.at !== "string" || !Number.isFinite(Date.parse(args.at)) || new Date(args.at).toISOString() !== args.at || Date.parse(args.at) > Date.now()) fail("Ng\xE0y gi\u1EDD b\xE0n giao kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u1EDF t\u01B0\u01A1ng lai.");
      if (typeof args.odo !== "number" || !Number.isFinite(args.odo) || args.odo < 0 || args.odo > 1e7) fail("ODO kh\xF4ng h\u1EE3p l\u1EC7.");
      if (typeof args.note !== "string" || args.note.length > 2e3) fail("Ghi ch\xFA t\u1ED1i \u0111a 2.000 k\xFD t\u1EF1.");
      next = { id: old?.id || args.newId || crypto.randomUUID(), carId: args.carId, fromUserId: args.fromUserId, toUserId: args.toUserId, at: args.at, date: args.at.slice(0, 10), odo: args.odo, note: args.note.trim(), enteredBy: old?.enteredBy || u.id, createdAt: old?.createdAt || stamp(), updatedAt: stamp(), version: (old?.version || 0) + 1 };
      if ((db.tombstones || []).some((t) => t.id === next.id) || !old && (db.handovers || []).some((h) => h.id === next.id)) fail("M\xE3 b\xE0n giao \u0111\xE3 d\xF9ng ho\u1EB7c \u0111\xE3 x\xF3a.");
      if (staged.handovers.some((h) => h.carId === next.carId && h.at === next.at)) fail("\u0110\xE3 c\xF3 b\xE0n giao xe n\xE0y t\u1EA1i c\xF9ng th\u1EDDi \u0111i\u1EC3m. Ch\u1ECDn ng\xE0y gi\u1EDD kh\xE1c.");
      staged.handovers.push(next);
    }
    staged.assignments = rebuildAssignments(staged);
    db.handovers = staged.handovers;
    db.assignmentEvents = staged.assignmentEvents;
    db.assignments = staged.assignments;
    for (const a of db.assignments) {
      const target = db.users.find((x) => x.id === a.userId);
      if (target) target.hasAssignments = true;
    }
    if (remove) {
      db.tombstones ?? (db.tombstones = []);
      db.tombstones.push({ id: old.id, version: old.version + 1, at: stamp() });
    }
    return next;
  }

  // web/service.mjs
  var id = () => crypto.randomUUID();
  var now = () => (/* @__PURE__ */ new Date()).toISOString();
  var copy = (x) => structuredClone(x);
  var fail2 = (m) => {
    throw new Error(m);
  };
  var txt = (s, max = 120, empty = false) => {
    if (typeof s !== "string" || s.length > max || !empty && !s.trim()) fail2("Th\xF4ng tin nh\u1EADp thi\u1EBFu ho\u1EB7c qu\xE1 d\xE0i.");
    return s.trim();
  };
  var num = (n, max) => {
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > max) fail2("Gi\xE1 tr\u1ECB s\u1ED1 kh\xF4ng h\u1EE3p l\u1EC7.");
    return n;
  };
  var uuid = (s) => {
    if (typeof s !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) fail2("M\xE3 b\u1EA3n ghi kh\xF4ng h\u1EE3p l\u1EC7.");
    return s;
  };
  var assigned = (db, car) => db.assignments.find((a) => a.carId === car && !a.endedAt)?.userId;
  var manages = (db, u, car) => u.role === "admin" || assigned(db, car) === u.id;
  var user = (db, uid) => db.users.find((u) => u.id === uid && !u.deletedAt) || fail2("T\xE0i kho\u1EA3n \u0111\xE3 b\u1ECB x\xF3a ho\u1EB7c kh\xF4ng thu\u1ED9c t\u1ED5 ch\u1EE9c.");
  var version = (old, v) => {
    if (old && old.version !== v) fail2("B\u1EA3n ghi \u0111\xE3 thay \u0111\u1ED5i. \u0110\u1ED3ng b\u1ED9 l\u1EA1i tr\u01B0\u1EDBc khi s\u1EEDa.");
  };
  var canSee = (db, u, t) => u.role !== "driver" || t.enteredBy === u.id || (t.onBehalf || t.enteredBy !== t.enteredFor) && t.enteredFor === u.id && assigned(db, t.carId) === u.id;
  var canChangeTransaction = (db, u, t) => u.role === "admin" || t.enteredBy === u.id && (t.onBehalf || t.enteredBy !== t.enteredFor || manages(db, u, t.carId));
  var isReminderTransaction = (t) => ["maintenance", "major_maintenance", "parts"].includes(t.category) && (t.repeatKm || t.repeatMonths) || ["insurance", "inspection", "road_fee"].includes(t.category) && t.insuranceExpiry;
  var reminderTransaction = (t) => ({ id: t.id, carId: t.carId, date: t.date, category: t.category, odo: t.odo, description: t.description || "", repeatKm: t.repeatKm || 0, repeatMonths: t.repeatMonths || 0, insuranceProvider: t.insuranceProvider || "", insurancePolicy: t.insurancePolicy || "", insuranceStart: t.insuranceStart || "", insuranceExpiry: t.insuranceExpiry || "", updatedAt: t.updatedAt || "" });
  function attachments(input, old = []) {
    if (!Array.isArray(input) || input.length > 5) fail2("T\u1ED1i \u0111a 5 t\u1EC7p.");
    return input.map((f) => {
      if (f.id) {
        const prior = old.find((x) => x.id === f.id);
        if (!prior) fail2("T\u1EC7p kh\xF4ng thu\u1ED9c b\u1EA3n ghi.");
        return { ...copy(prior), ...f.name ? { name: txt(f.name, 200) } : {}, ...f.originalName ? { originalName: txt(f.originalName, 200) } : {}, ...f.namingDate ? { namingDate: txt(f.namingDate, 10) } : {} };
      }
      if (f.driveFileId) {
        if (typeof f.driveFileId !== "string" || !f.driveFileId || f.driveFileId.length > 200) fail2("M\xE3 t\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7.");
        return { id: f.newId ? uuid(f.newId) : uuid(f.id), name: txt(f.name, 200), type: txt(f.type || "application/octet-stream", 100), size: num(f.size || 0, 2 * 1024 * 1024), driveFileId: f.driveFileId, ...f.originalName ? { originalName: txt(f.originalName, 200) } : {}, ...f.namingDate ? { namingDate: txt(f.namingDate, 10) } : {} };
      }
      if (typeof f.base64 !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(f.base64) || f.base64.length > Math.ceil(2 * 1024 * 1024 / 3) * 4) fail2("T\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c v\u01B0\u1EE3t 2 MB.");
      return { id: f.newId ? uuid(f.newId) : id(), name: txt(f.name, 200), type: txt(f.type || "application/octet-stream", 100), base64: f.base64, size: Math.floor(f.base64.length * 3 / 4) };
    });
  }
  function transaction(db, u, a) {
    if (u.role === "viewer") fail2("T\xE0i kho\u1EA3n ch\u1EC9 xem kh\xF4ng \u0111\u01B0\u1EE3c ghi d\u1EEF li\u1EC7u.");
    const old = a.id ? db.transactions.find((t) => t.id === a.id) : null;
    if (a.id && !old) fail2("Ch\u1EC9 \u0111\u01B0\u1EE3c s\u1EEDa giao d\u1ECBch do m\xECnh nh\u1EADp ho\u1EB7c giao d\u1ECBch \u0111\xE3 b\u1ECB x\xF3a.");
    if (old && !canChangeTransaction(db, u, old)) fail2(old.enteredBy !== u.id ? "Ch\u1EC9 \u0111\u01B0\u1EE3c s\u1EEDa giao d\u1ECBch do m\xECnh nh\u1EADp." : "Ch\u1EC9 \u0111\u01B0\u1EE3c s\u1EEDa giao d\u1ECBch khi \u0111ang qu\u1EA3n l\xFD xe.");
    version(old, a.version);
    const selectedCar = db.cars.find((c) => c.id === a.carId);
    if (!selectedCar) fail2("Xe kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 x\xF3a.");
    const manager = assigned(db, a.carId), enteredFor = a.enteredFor || u.id;
    if (u.role === "driver") {
      if (old && (a.carId !== old.carId || enteredFor !== old.enteredFor || !!a.onBehalf !== !!old.onBehalf)) fail2("Kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1ED5i xe ho\u1EB7c ch\u1EBF \u0111\u1ED9 nh\u1EADp h\u1ED9 c\u1EE7a giao d\u1ECBch \u0111\xE3 l\u01B0u.");
      if (!old && manager === u.id && (a.onBehalf || enteredFor !== u.id)) fail2("Giao d\u1ECBch xe \u0111ang qu\u1EA3n l\xFD kh\xF4ng ph\u1EA3i l\xE0 nh\u1EADp h\u1ED9.");
      if (!old && manager !== u.id && (!manager || !a.onBehalf || enteredFor !== manager)) fail2("Ch\u1EC9 \u0111\u01B0\u1EE3c nh\u1EADp khi \u0111ang qu\u1EA3n l\xFD xe; Nh\u1EADp h\u1ED9 ch\u1EC9 \xE1p d\u1EE5ng cho xe \u0111ang do NSD kh\xE1c qu\u1EA3n l\xFD.");
    }
    if (selectedCar.powerType === "electric" && a.category === "fuel") fail2("Xe \u0111i\u1EC7n kh\xF4ng c\xF3 chi ph\xED \u0111\u1ED5 x\u0103ng.");
    if ((!selectedCar.powerType || selectedCar.powerType === "fuel") && ["charge", "battery_rental"].includes(a.category)) fail2("Chi ph\xED s\u1EA1c xe/thu\xEA pin ch\u1EC9 \xE1p d\u1EE5ng cho xe \u0111i\u1EC7n ho\u1EB7c \u0111i\u1EC7n\u2013x\u0103ng.");
    if (!["fuel", "charge", "battery_rental", "maintenance", "major_maintenance", "parts", "insurance", "inspection", "road_fee", "other"].includes(a.category)) fail2("Lo\u1EA1i chi ph\xED kh\xF4ng h\u1EE3p l\u1EC7.");
    if (typeof a.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(a.date) || !Number.isFinite(Date.parse(a.date)) || new Date(a.date).toISOString().slice(0, 10) !== a.date) fail2("Ng\xE0y kh\xF4ng h\u1EE3p l\u1EC7.");
    user(db, enteredFor);
    const insuranceStart = a.insuranceStart || "", insuranceExpiry = a.insuranceExpiry || "";
    for (const date of [insuranceStart, insuranceExpiry]) if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) fail2("Ng\xE0y hi\u1EC7u l\u1EF1c/h\u1EBFt h\u1EA1n kh\xF4ng h\u1EE3p l\u1EC7.");
    if (insuranceExpiry && (!insuranceStart || insuranceExpiry < insuranceStart)) fail2("Ng\xE0y h\u1EBFt h\u1EA1n ph\u1EA3i t\u1EEB ng\xE0y hi\u1EC7u l\u1EF1c tr\u1EDF \u0111i.");
    const batteryFrom = num(a.batteryFrom || 0, 100), batteryTo = num(a.batteryTo || 0, 100);
    if (a.category === "charge" && batteryTo <= batteryFrom) fail2("Pin sau s\u1EA1c ph\u1EA3i l\u1EDBn h\u01A1n pin tr\u01B0\u1EDBc s\u1EA1c.");
    return { id: old?.id || (a.newId ? uuid(a.newId) : id()), carId: a.carId, date: a.date, category: a.category, amount: num(a.amount, 1e12), odo: num(a.odo, 1e7), description: txt(a.description || "", 1e3, true), fuelPrice: num(a.fuelPrice || 0, 1e9), liters: num(a.liters || 0, 1e6), batteryFrom, batteryTo, repeatKm: num(a.repeatKm || 0, 1e7), repeatMonths: num(a.repeatMonths || 0, 1200), insuranceProvider: txt(a.insuranceProvider || "", 200, true), insurancePolicy: txt(a.insurancePolicy || "", 200, true), insuranceStart, insuranceExpiry, note: txt(a.note || "", 2e3, true), enteredBy: old?.enteredBy || u.id, enteredFor, onBehalf: enteredFor !== (old?.enteredBy || u.id) || !!a.onBehalf || u.role === "driver" && assigned(db, a.carId) !== u.id, createdAt: old?.createdAt || now(), updatedAt: now(), version: (old?.version || 0) + 1, attachments: attachments(a.attachments || [], old?.attachments) };
  }
  function projection(db, u) {
    const transactions = db.transactions.filter((t) => canSee(db, u, t)), handovers = (db.handovers || []).filter((h) => u.role !== "driver" || h.enteredBy === u.id), events = managementEvents(db), cars = new Set([...transactions, ...handovers, ...events.filter((e) => e.toUserId === u.id || e.fromUserId === u.id || assigned(db, e.carId) === u.id)].map((t) => t.carId)), managedCars = new Set(db.cars.filter((c) => assigned(db, c.id) === u.id).map((c) => c.id)), reminderTransactions = u.role === "driver" ? db.transactions.filter((t) => managedCars.has(t.carId) && isReminderTransaction(t)).map(reminderTransaction) : void 0, reminderOdoByCar = u.role === "driver" ? Object.fromEntries([...managedCars].map((carId) => [carId, Math.max(Number(db.cars.find((c) => c.id === carId)?.odo) || 0, ...db.transactions.filter((t) => t.carId === carId).map((t) => Number(t.odo) || 0))])) : void 0;
    return {
      organization: { id: db.id, name: db.name, ownerEmail: db.ownerEmail, deleted: !!db.deletedAt },
      me: { id: u.id, name: u.name, username: u.username, email: u.email, role: u.role, mustChange: false },
      revision: db.revision,
      users: db.users.filter((x) => !x.deletedAt).map((x) => ({ id: x.id, name: x.name, username: x.username, email: x.email, role: x.role, active: !!x.active, editVersion: x.editVersion || 0, journalId: u.role === "admin" ? x.journalId : void 0, viewId: u.role === "admin" ? x.viewId : void 0 })),
      cars: db.cars.filter((c) => u.role !== "driver" || assigned(db, c.id) === u.id || cars.has(c.id)),
      carChoices: db.cars.map((c) => ({ id: c.id, plate: c.plate, name: c.name, powerType: c.powerType || "fuel", assignedUserId: assigned(db, c.id) })),
      transactions,
      ...reminderTransactions ? { reminderTransactions, reminderOdoByCar } : {},
      handovers,
      assignmentEvents: events,
      assignments: copy(db.assignments),
      receipts: copy(db.receipts[u.id] || []),
      tombstones: copy(db.tombstones),
      publishedAt: db.updatedAt
    };
  }

  // web/attachment-names.mjs
  var expenseCategories = Object.freeze({ fuel: "\u0110\u1ED5 x\u0103ng", charge: "S\u1EA1c xe", battery_rental: "Thu\xEA pin", maintenance: "B\u1EA3o d\u01B0\u1EE1ng", major_maintenance: "B\u1EA3o d\u01B0\u1EE1ng c\u1EA5p l\u1EDBn", parts: "Ph\u1EE5 t\xF9ng", insurance: "B\u1EA3o hi\u1EC3m TNDS", inspection: "\u0110\u0103ng ki\u1EC3m", road_fee: "Ph\xED \u0111\u01B0\u1EDDng b\u1ED9", other: "Chi ph\xED kh\xE1c" });
  var clean = (s) => String(s || "").normalize("NFC").replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, "-").replace(/\s+/g, " ").trim().replace(/[. ]+$/g, "");
  function attachmentToday(now2 = /* @__PURE__ */ new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now2), get = (k) => parts.find((p) => p.type === k).value;
    return get("year") + "-" + get("month") + "-" + get("day");
  }
  function attachmentStem({ plate, category, date }) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error("Ng\xE0y \u0111\u1EB7t t\xEAn t\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7.");
    const label = category === "ownership" ? "Gi\u1EA5y ch\u1EE7 quy\u1EC1n" : expenseCategories[category];
    if (!label) throw new Error("Lo\u1EA1i chi ph\xED \u0111\u1EB7t t\xEAn t\u1EC7p kh\xF4ng h\u1EE3p l\u1EC7.");
    const vehicle = clean(plate);
    if (!vehicle) throw new Error("Ch\u01B0a c\xF3 bi\u1EC3n s\u1ED1 xe \u0111\u1EC3 \u0111\u1EB7t t\xEAn t\u1EC7p.");
    return "_" + vehicle + "_" + clean(label) + "_" + date.replaceAll("-", "");
  }
  function attachmentExtension(filename) {
    const match = String(filename || "").match(/\.([a-zA-Z0-9]{1,10})$/);
    return match ? "." + match[1].toLowerCase() : "";
  }
  function matchesAttachmentName(name, stem, original) {
    const ext = attachmentExtension(original);
    if (!name.endsWith(ext)) return false;
    const body = ext ? name.slice(0, -ext.length) : name;
    if (body === stem) return true;
    return body.startsWith(stem + "_") && /^[2-9]\d*$|^1\d+$/.test(body.slice(stem.length + 1));
  }
  function uniqueAttachmentName(stem, original, used = /* @__PURE__ */ new Set(), preferred = "") {
    const ext = attachmentExtension(original);
    if (preferred && matchesAttachmentName(preferred, stem, original) && !used.has(preferred.toLocaleLowerCase("vi-VN"))) return preferred;
    let n = 1, name = stem + ext;
    while (used.has(name.toLocaleLowerCase("vi-VN"))) name = stem + "_" + ++n + ext;
    return name;
  }
  return __toCommonJS(cloud_core_entry_exports);
})();
