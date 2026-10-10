import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const { buildDiplomaLayout, buildDiplomaPdfStreams, renderDiplomaPagesHtml } = require("../server/diploma-layout");
const { buildTemplateImageObject, getCertificateTemplateImage } = require("../server/certificate-template-image");
const template = readFileSync(new URL("../data/cert-template-inspect/word/media/image1.png", import.meta.url));
assert.equal(createHash("sha256").update(template).digest("hex"), "cc4da1b16174ff0e539196861ad38605dd3741bed99322ee00e3b2c6b5ae7597", "Original institutional artwork unchanged");
assert.throws(() => buildTemplateImageObject(Buffer.from("not a PNG")));
assert.throws(() => buildTemplateImageObject(template.subarray(0, 80)));
const unsupported = Buffer.from(template); unsupported[25] = 6;
assert.throws(() => buildTemplateImageObject(unsupported));
const repo = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(new URL("../server.js", import.meta.url), "utf8");
const extract = name => {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf("\nfunction ", start + 1);
  assert.ok(start >= 0, name);
  return source.slice(start, end < 0 ? undefined : end);
};
const context = vm.createContext({ Buffer });
vm.runInContext(["buildPdfDocument", "escapePdfText", "escapeHtml", "getCourseCertificateSections"].map(extract).join("\n"), context);
context.parseCertificateSections = () => [];
assert.equal(context.getCourseCertificateSections({}).length, 0, "No invented generic curriculum");
assert.equal(context.getCourseCertificateSections({ modules: Array.from({ length: 8 }, (_, i) => ({ title: `M${i}`, lessons: [{title: `L${i}`}] })) }).length, 8);
assert.equal(context.getCourseCertificateSections({ objectives: Array.from({length: 9}, (_, i) => `O${i}`) })[0].items.length, 9);

const settings = { organization: "Asociacion Isocrona Zero", diplomaSignerA: "Direccion de Formacion", diplomaSignerB: "Presidencia de la Asociacion" };
const model = { course: { title: "Rescate en Ascensores", hours: 24 }, member: { name: "Alumno de Prueba" },
  certificateTitle: "CERTIFICADO DE APROVECHAMIENTO", documentId: "DOCUMENTO DE PRUEBA", registryNumber: "IZ-DIP-QA-0001",
  code: "IZ-QA-COURSE-MEMBER", dateRange: "19 de septiembre de 2026 al 22 de septiembre de 2026", city: "Valencia",
  issueDate: "22 de septiembre de 2026", sections: [
    { title: "Seguridad y reconocimiento", items: ["Identificacion de los elementos del ascensor.", "Evaluacion de riesgos y coordinacion del equipo.", "Aseguramiento del area de trabajo."] },
    { title: "Practicas supervisadas", items: ["Procedimiento de liberacion de personas atrapadas.", "Comunicacion y cierre de la intervencion."] }
  ] };
const url = "https://example.test/verify.html?code=" + model.code;
const layout = buildDiplomaLayout(model, settings, url);
assert.equal(layout.length, 2);
assert.ok(layout.every(page => page[0].type === "image"));
assert.ok(!layout[0].some(item => item.text === "CONTENIDOS FORMATIVOS"));
assert.ok(layout[1].some(item => item.text === "CONTENIDOS FORMATIVOS"));
assert.ok(layout[0].some(item => item.text === model.member.name));
assert.ok(layout[0].some(item => item.text === settings.diplomaSignerA));
assert.ok(layout[0].some(item => item.text === settings.diplomaSignerB));
const customSigners = buildDiplomaLayout(model, { diplomaSignerA: "Formacion QA - Responsable", diplomaSignerB: "Presidencia QA - Firmante" }, url);
assert.ok(customSigners[0].some(item => item.text === "Formacion QA - Responsable"));
assert.ok(customSigners[0].some(item => item.text === "Presidencia QA - Firmante"));
assert.ok(layout[1].some(item => item.text?.includes(model.code)));
for (const page of layout) for (const item of page) {
  assert.ok(item.x >= 0 && item.x < 842 && item.y >= 0 && item.y < 595, JSON.stringify(item));
  if (item.type === "text") assert.ok(["#17191c", "#b91c32", "#51565e"].includes(item.color));
}
const streams = buildDiplomaPdfStreams(layout, context.escapePdfText);
for (const stream of streams) {
  const lines = stream.split("\n");
  for (const [index, line] of lines.entries()) if (line.startsWith("BT ")) {
    assert.match(lines[index - 1], / rg$/, "Every text run explicitly resets its fill color");
    assert.notEqual(lines[index - 1], "1.0000 1.0000 1.0000 rg", "Never inherit the white page background");
    assert.ok(!line.includes("undefined"));
  }
}
const pdf = context.buildPdfDocument(streams, { pageWidth: 842, pageHeight: 595, backgroundImage: getCertificateTemplateImage() });
assert.match(pdf.toString("latin1"), /\/Count 2\b/);
assert.equal(pdf.toString("latin1").match(/\/Subtype \/Image/g).length, 1, "Single image object shared by both pages");
assert.equal(pdf.toString("latin1").match(/\/Template Do/g).length, 2);
assert.match(pdf.toString("latin1"), /\/Predictor 15 \/Colors 3/);
const expanded = buildDiplomaLayout({ ...model, sections: [{ title: "Temario completo", items: Array.from({length: 180}, (_, i) => `Contenido ${i}`) }] }, settings, url);
assert.ok(expanded.length > 2);
assert.ok(expanded.flat().some(item => item.text?.includes("Contenido 179")), "No silent curriculum truncation");
assert.ok(expanded.every(page => page.filter(item => item.type === "text").every(item => item.y < 590)));
const empty = buildDiplomaLayout({ ...model, sections: [] }, settings, url);
assert.ok(empty[1].some(item => item.text?.includes("No hay contenidos")));
const html = renderDiplomaPagesHtml(layout, "Certificado", context.escapeHtml);
assert.match(html, /aria-label="Anverso"/);
assert.match(html, /aria-label="Reverso"/);
assert.match(html, /break-after:page/);
assert.match(html, /size:A4 landscape/);
const malicious = buildDiplomaLayout({ ...model, member: {name: '<img src=x onerror="alert(1)">'}, course: {...model.course, title: "Test \u0129 (QA)"} }, settings, url);
const maliciousHtml = renderDiplomaPagesHtml(malicious, "<script>bad</script>", context.escapeHtml);
assert.equal((maliciousHtml.match(/<img /g) || []).length, malicious.length, "Only the fixed institutional background is an image");
assert.ok(!maliciousHtml.includes('<img src=x'));
assert.ok(maliciousHtml.includes("&lt;img"));
assert.ok(!maliciousHtml.includes("<script>bad"));
assert.ok(buildDiplomaPdfStreams(malicious, context.escapePdfText).join("").includes("Test ? \\(QA\\)"));

const root = mkdtempSync(path.join(os.tmpdir(), "iz-diploma-layout-"));
const seed = JSON.parse(readFileSync(new URL("../data/default-state.json", import.meta.url), "utf8"));
const password = randomUUID();
seed.settings = { ...seed.settings, ...settings, automation: { autoRunOnSave: false, autoGenerateDiplomas: false, autoSendDiplomas: false } };
seed.accounts = ["admin", "member", "other"].map(id => ({id, email: `${id}@example.test`, name: id, memberId: `${id}-qa`, role: id === "admin" ? "admin" : "member", password}));
seed.members = seed.accounts.map(a => ({id:a.memberId, name:a.id === "member" ? model.member.name : a.id, email:a.email, dni:model.documentId}));
seed.associates = [];
seed.courses = [{id:"course-qa", ...model.course, startDate:"2026-09-19", endDate:"2026-09-22", certificateCity:model.city,
  diplomaReady:["member-qa"], enrolledIds:["member-qa"], modules:[], objectives:[], diplomaTemplate:"Aprovechamiento",
  certificateContents:model.sections.map(section => `${section.title} | ${section.items.join("; ")}`)}];
writeFileSync(path.join(root,"seed.json"), JSON.stringify(seed));
const port = await new Promise(resolve => { const probe = net.createServer(); probe.listen(0,"127.0.0.1",()=>{const port=probe.address().port;probe.close(()=>resolve(port));}); });
const base = `http://127.0.0.1:${port}`;
let child, logs="";
async function login(id) {
  const r = await fetch(base+"/api/login", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:`${id}@example.test`,password})});
  assert.equal(r.status,200); return r.headers.get("set-cookie").split(";")[0];
}
try {
  const env={...process.env,NODE_ENV:"test",DATABASE_URL:"",HOST:"127.0.0.1",PORT:String(port),IZ_DATA_DIR:path.join(root,"data"),IZ_DEFAULT_STATE_PATH:path.join(root,"seed.json"),IZ_BASE_URL:base,
    IZ_BOOTSTRAP_ADMIN_EMAIL:"",IZ_BOOTSTRAP_ADMIN_PASSWORD:"",AUTOMATION_INTERVAL_MS:"86400000"};
  for(const key of Object.keys(env)) if(key.startsWith("SMTP_")) env[key]="";
  child=spawn(process.execPath,["server.js"],{cwd:repo,env,stdio:["ignore","pipe","pipe"]});
  child.stdout.on("data",b=>logs+=b);child.stderr.on("data",b=>logs+=b);
  let ready=false;
  for(let i=0;i<100;i++){try{if((await fetch(base+"/healthz")).ok){ready=true;break;}}catch{} if(child.exitCode!==null)break;await delay(50);}
  assert.ok(ready,logs);
  const route="/api/diplomas/course-qa/member-qa";
  assert.equal((await fetch(base+route+".pdf")).status,401);
  const member=await login("member"),admin=await login("admin"),other=await login("other");
  assert.equal((await fetch(base+route+".pdf",{headers:{Cookie:other}})).status,403);
  for(const cookie of [member,admin]){
    const r=await fetch(base+route+".pdf",{headers:{Cookie:cookie}});
    assert.equal(r.status,200);
    const data=Buffer.from(await r.arrayBuffer());
    assert.match(data.toString("latin1"),/\/Count 2\b/);
    assert.match(data.toString("latin1"),/\/Subtype \/Image/);
    assert.match(data.toString("latin1"),/Rescate en Ascensores/);
  }
  const view=await fetch(base+route,{headers:{Cookie:member}});
  assert.equal(view.status,200);assert.match(await view.text(),/aria-label="Reverso"/);
  const code="IZ-2026-qa-qa";
  const verification=await fetch(base+"/api/verify?code="+code);
  assert.equal(verification.status,200);
  const publicPdf=await fetch(base+"/api/verify/pdf?code="+code);
  assert.equal(publicPdf.status,200);
  assert.match(Buffer.from(await publicPdf.arrayBuffer()).toString("latin1"),/\/Count 2\b/);
  assert.equal((await fetch(base+route+".docx",{headers:{Cookie:member}})).status,200);
  const frontend=readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
  assert.match(frontend,/class="certificate-document-preview"/);
  if(process.env.IZ_QA_DIPLOMA_OUTPUT){
    writeFileSync(process.env.IZ_QA_DIPLOMA_OUTPUT+".pdf",pdf);
    writeFileSync(process.env.IZ_QA_DIPLOMA_OUTPUT+".html",html);
  }
  console.log("Diploma layout checks passed (two sides, contrast, complete curriculum, safe text, preview, ownership and stable verification).");
} finally {
  if(child&&child.exitCode===null) await new Promise(resolve=>{child.once("exit",resolve);child.kill();});
  rmSync(root,{recursive:true,force:true});
}
