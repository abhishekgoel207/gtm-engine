import { loadDemo } from "@/services/demo";

const result = loadDemo();
if (result.ok) {
  console.table(result.summary);
} else {
  console.error(`Seed refused. Nothing was saved. ${result.errors.length} error(s):`);
  for (const error of result.errors) console.error(`- ${error}`);
  process.exitCode = 1;
}
