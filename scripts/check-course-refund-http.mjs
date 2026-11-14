import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const dir = mkdtempSync(join(tmpdir(), "iz-refund-http-"));
const port = 31000 + Math.floor(Math.random() * 20000);
const base = `http://127.0.0.1:${port}`;
const email = "refund-admin-qa@example.test";
const password = "RefundQa!2026-Unique";
const seedPath = join(dir, "seed.json");
writeFileSync(seedPath, JSON.stringify({
  accounts: [], members: [{ id:"qa-member", name:"Alumno QA", email:"alumno.qa@example.test" }],
  associates: [], associateApplications: [], courses: [{
    id:"qa-course", title:"Curso QA", capacity:1, enrolledIds:["qa-member"], waitingIds:[],
    enrollmentFee:90, nonMemberEnrollmentFee:90, attendance:{}, evaluations:{}, diplomaReady:[],
    enrollmentSubmissions:[{ id:"qa-enrollment", memberId:"qa-member", participantType:"external",
      amount:90, paymentStatus:"validated", status:"confirmed" }]
  }], activityLog:[], auditLog:[], settings:{ automation:{autoRunOnSave:false,autoPromoteWaitlist:false}, agent:{enabled:false} }
}));
const child = spawn(process.execPath, ["server-entry.js"], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, NODE_ENV:"production", HOST:"127.0.0.1", PORT:String(port),
    IZ_BASE_URL:base, IZ_DATA_DIR:join(dir,"data"), IZ_DEFAULT_STATE_PATH:seedPath,
    IZ_EMAIL_ENABLED:"false", IZ_QA_ISOLATED:"true",
    IZ_RECOVERY_ADMIN_EMAIL:email, IZ_RECOVERY_ADMIN_PASSWORD:password,
    AUTOMATION_INTERVAL_MS:"3600000", DATABASE_URL:"" },
  stdio:["ignore","pipe","pipe"]
});
let logs = "";
child.stdout.on("data", chunk => { logs += chunk.toString(); });
child.stderr.on("data", chunk => { logs += chunk.toString(); });
async function request(path, body, cookie) {
  const response = await fetch(base+path, {
    method:body===undefined?"GET":"POST",
    headers:{"content-type":"application/json", ...(cookie?{cookie}:{})},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const json = await response.json().catch(()=>({}));
  return {status:response.status,json,cookie:response.headers.get("set-cookie")};
}
try {
  let ready = false;
  for (let i=0;i<90;i++) {
    if (child.exitCode !== null) throw Error("Servidor finalizado: "+logs.slice(-1800));
    try { const r = await fetch(base+"/"); if (r.status < 500) {ready=true;break;} } catch {}
    await delay(250);
  }
  assert.ok(ready,"Servidor no arrancó: "+logs.slice(-1800));
  const unauthorized = await request("/api/courses/qa-course/enrollment-submissions/qa-enrollment/cancel",{reason:"QA",refundAmount:90});
  assert.ok([401,403].includes(unauthorized.status),"Baja sin sesión debe ser rechazada: "+JSON.stringify(unauthorized));
  const login = await request("/api/login",{email,password});
  assert.equal(login.status,200,"Login QA: "+JSON.stringify(login.json));
  const cookie = login.cookie?.split(";")[0];
  assert.ok(cookie,"La sesión debe entregar cookie");
  const cancel = await request("/api/courses/qa-course/enrollment-submissions/qa-enrollment/cancel",{reason:"Prueba automatizada QA",refundAmount:90},cookie);
  assert.equal(cancel.status,200,"Baja: "+JSON.stringify(cancel.json));
  assert.equal(cancel.json.refund?.status,"pending");
  const repeat = await request("/api/courses/qa-course/enrollment-submissions/qa-enrollment/cancel",{reason:"Repetida",refundAmount:90},cookie);
  assert.equal(repeat.status,409,"Una baja repetida debe rechazarse");
  const confirm = await request("/api/courses/qa-course/enrollment-submissions/qa-enrollment/refund-confirm",{},cookie);
  assert.equal(confirm.status,200,"Confirmación: "+JSON.stringify(confirm.json));
  const duplicate = await request("/api/courses/qa-course/enrollment-submissions/qa-enrollment/refund-confirm",{},cookie);
  assert.equal(duplicate.status,409,"La segunda devolución debe rechazarse");
  console.log("HTTP autenticado QA: login, permisos, baja, devolución e idempotencia OK");
} finally {
  child.kill("SIGTERM");
  await delay(300);
  rmSync(dir,{recursive:true,force:true});
}
