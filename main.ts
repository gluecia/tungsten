import { Scanner } from "./parse.ts";

const args = Deno.args;

function runFile(filename: string) {
  const contents = Deno.readTextFileSync(filename);
  const fileRoot = filename.split(".tg")[0];

  const scanner = new Scanner(contents);

  Deno.writeTextFileSync(`${fileRoot}.md`, scanner.scan().render());
}

if (args.length === 1) {
  runFile(args[0]);
} else if (args === 0) {
  repl();
} else {
  console.error("Usage: deno task parse <filename>")
}
