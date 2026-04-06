const target = process.env.IZ_HEALTHCHECK_URL || "http://localhost:3210/healthz";

try {
  const response = await fetch(target);
  const body = await response.json();
  if (!response.ok || !body?.ok) {
    console.error(`Healthcheck KO: ${response.status}`);
    process.exit(1);
  }
  console.log(`Healthcheck OK: ${target}`);
  console.log(JSON.stringify(body, null, 2));
} catch (error) {
  console.error(`Healthcheck error: ${error.message || error}`);
  process.exit(1);
}
