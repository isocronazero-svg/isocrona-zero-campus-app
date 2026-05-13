const baseUrl = process.env.IZ_BASE_URL || "http://localhost:3210";

async function check(pathname) {
  const url = new URL(pathname, baseUrl).toString();
  const response = await fetch(url);
  return {
    url,
    ok: response.ok,
    status: response.status
  };
}

async function main() {
  const targets = ["/healthz", "/", "/join.html", "/application.html", "/public-live-test.html"];
  const results = [];

  for (const target of targets) {
    try {
      results.push(await check(target));
    } catch (error) {
      results.push({
        url: new URL(target, baseUrl).toString(),
        ok: false,
        status: "ERROR",
        error: error.message
      });
    }
  }

  const failed = results.filter((result) => !result.ok);

  console.log(`Comprobacion rapida de ${baseUrl}`);
  console.log("");
  results.forEach((result) => {
    console.log(
      `${result.ok ? "OK" : "FAIL"} ${result.status} ${result.url}${result.error ? ` | ${result.error}` : ""}`
    );
  });

  if (failed.length) {
    process.exitCode = 1;
  }
}

main();
