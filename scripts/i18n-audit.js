'use strict';

const { readLangMaps } = require('./audit-utils');

function diffKeys(baseKeys, comparisonMap) {
  return baseKeys.filter((key) => !(key in comparisonMap));
}

function main() {
  const { roToEn, roToRu, roToUa } = readLangMaps();
  const roKeys = Object.keys(roToEn).sort();
  const enCount = roKeys.length;
  const ruKeys = Object.keys(roToRu).sort();
  const uaKeys = Object.keys(roToUa).sort();

  const missingInRu = diffKeys(roKeys, roToRu);
  const missingInUa = diffKeys(roKeys, roToUa);
  const extraInRu = ruKeys.filter((key) => !(key in roToEn));
  const extraInUa = uaKeys.filter((key) => !(key in roToEn));

  console.log(`RO source keys: ${enCount}`);
  console.log(`EN translations: ${enCount}`);
  console.log(`RU translations: ${ruKeys.length}`);
  console.log(`UA translations: ${uaKeys.length}`);

  if (missingInRu.length || extraInRu.length) {
    console.error(`RU parity mismatch: ${missingInRu.length} missing, ${extraInRu.length} extra.`);
  }

  if (missingInUa.length || extraInUa.length) {
    console.error(`UA parity mismatch: ${missingInUa.length} missing, ${extraInUa.length} extra.`);
  }

  if (ruKeys.length !== enCount || missingInRu.length || extraInRu.length) {
    process.exit(1);
  }
}

main();
