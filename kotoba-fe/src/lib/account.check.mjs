// Run: node --experimental-strip-types src/lib/account.check.mjs
import assert from "node:assert/strict";
import { examDate, isEmail, isExam, isGoal, isMinutes, isName, jlptSessions } from "./account.ts";

const values = (now, n = 4) => jlptSessions(now, n).map(s => s.value);
assert.deepEqual(values(new Date(2026, 9, 15)), ["2026-12", "2027-07", "2027-12", "2028-07"]);
assert.equal(values(new Date(2026, 6, 3))[0], "2026-07");
assert.equal(values(new Date(2026, 11, 8))[0], "2027-07");
assert.deepEqual(jlptSessions(new Date(2026, 9, 15), 1), [{ value: "2026-12", label: "12/2026" }]);

assert.ok(isEmail("a@b.co") && isEmail("a+b@x.vn"));
for (const bad of ["", "a", "a@b", "a b@c.d", "@b.c", 5, null, `${"a".repeat(250)}@b.co`]) assert.ok(!isEmail(bad), String(bad));

assert.ok(isGoal("N3") && !isGoal("N6") && !isGoal(3));
assert.ok(isMinutes(30) && !isMinutes("30") && !isMinutes(45));
assert.ok(isExam("2027-07") && isExam("unknown") && !isExam("2027-08") && !isExam(202707));

assert.ok(isName("Khanh") && isName("Nguyễn Văn A") && !isName("") && !isName(" a") && !isName("x".repeat(41)) && !isName(5));

assert.equal(examDate("2026-12").toDateString(), new Date(2026, 11, 6).toDateString());
assert.equal(examDate("2027-07").getDate(), 4);
assert.equal(examDate("unknown"), null);
assert.equal(examDate("2027-08"), null);

console.log("account ok");
