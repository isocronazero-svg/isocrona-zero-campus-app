import { spawnSync } from "node:child_process";

const files = [
  "public/aviso.js",
  "public/assets/js/app/main.js",
  "public/assets/js/app/admin/adminContextEnhancer.js",
  "public/assets/js/app/admin/auditEnhancer.js",
  "public/assets/js/app/admin/boardEnhancer.js",
  "public/assets/js/app/admin/membershipFeeYearEnhancer.js",
  "public/assets/js/app/ui/notices.js",
  "public/assets/js/app/ui/mobile-navigation.js",
  "public/assets/js/app/campus/courseFinanceEnhancer.js",
  "public/assets/js/app/campus/coursePricing.js",
  "public/assets/js/app/campus/coursePricingEnhancer.js",
  "public/assets/js/app/campus/courseReservations.js",
  "public/assets/js/app/campus/diplomaPreviewEnhancer.js",
  "public/app.js",
  "public/course-test.js",
  "public/question-bank.js",
  "public/assets/js/app/modules/tests/topicPicker.js",
  "public/assets/js/app/campus/sharedTests.js"
];

let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Frontend syntax check passed.");