import { LinkExpr, Scanner } from "./parse.ts";
import { assertEquals } from "jsr:@std/assert";

Deno.test("Text", async (t) => {
  await t.step("Single Line", () => {
    const scanner = new Scanner("Test!");
    assertEquals(scanner.scan().render(), "Test!");
  });

  await t.step("Multiple Lines", () => {
    const scanner = new Scanner("Test!\nTest again!");
    assertEquals(scanner.scan().render(), "Test!\nTest again!");
  });

  await t.step("Markup", () => {
    const scanner = new Scanner(
      "* H1\nHello! This is /italic/ and this is %bold%!",
    );
    assertEquals(
      scanner.scan().render(),
      "# H1\nHello! This is *italic* and this is **bold**!",
    );
  });

  await t.step("Escaping Characters 1", () => {
    const scanner = new Scanner(String.raw`\/not italic\/`);
    assertEquals(scanner.scan().render(), "/not italic/");
  });

  await t.step("Escaping Characters 2", () => {
    const scanner = new Scanner(`\\\\`);
    assertEquals(scanner.scan().render(), "\\");
  });

  await t.step("Unclosed Code", () => {
    const scanner = new Scanner("`hello %world%");
    console.log(scanner.scan());
    assertEquals(scanner.scan().render(), "`hello **world**");
  });

  await t.step("Unclosed Link 1", () => {
    const scanner = new Scanner("[%bold%");
    assertEquals(scanner.scan().render(), "[**bold**");
  });

  await t.step("Unclosed Link 2", () => {
    const scanner = new Scanner("[%bold%|/italic");
    assertEquals(scanner.scan().render(), "[**bold**|*italic*");
  });

  await t.step("Unclosed Code Block", () => {
    const scanner = new Scanner("#\n%bold%");
    assertEquals(scanner.scan().render(), "#\n**bold**");
  });
});

Deno.test("Heading", async (t) => {
  await t.step("H1", () => {
    const scanner = new Scanner("* H1");
    assertEquals(scanner.scan().render(), "# H1");
  });

  await t.step("H2", () => {
    const scanner = new Scanner("** H2");
    assertEquals(scanner.scan().render(), "## H2");
  });

  await t.step("H1, Text, H2", () => {
    const scanner = new Scanner("* H1\nHello!\n** H2");
    assertEquals(scanner.scan().render(), "# H1\nHello!\n## H2");
  });

  await t.step("H1, H2, H3", () => {
    const scanner = new Scanner("* H1\n** H2\n*** H3");
    assertEquals(scanner.scan().render(), "# H1\n## H2\n### H3");
  });

  await t.step("New Line", () => {
    const scanner = new Scanner("Test!\n\n* H1");
    assertEquals(scanner.scan().render(), "Test!\n\n# H1");
  });

  await t.step("Markup", () => {
    const scanner = new Scanner("* /italics/ %bold%");
    assertEquals(scanner.scan().render(), "# *italics* **bold**");
  });

  await t.step("Midline", () => {
    const scanner = new Scanner("test * H1");
    assertEquals(scanner.scan().render(), "test * H1");
  });
});

Deno.test("Links", async (t) => {
  await t.step("Render", () => {
    const expr = new LinkExpr("test", "test.com");
    assertEquals(expr.render(), "[test](test.com)");
  });

  await t.step("Basic Link", () => {
    const scanner = new Scanner("[test|test.com]");
    assertEquals(scanner.scan().render(), "[test](test.com)");
  });

  await t.step("Complex Link", () => {
    const scanner = new Scanner("This is a [test link|test.com/testing]!");
    assertEquals(
      scanner.scan().render(),
      "This is a [test link](test.com/testing)!",
    );
  });
});

Deno.test("Code", async (t) => {
  await t.step("Inline 1", () => {
    const scanner = new Scanner("`test`");
    assertEquals(scanner.scan().render(), "`test`");
  });

  await t.step("Inline 2", () => {
    const scanner = new Scanner("this is a `test`");
    assertEquals(scanner.scan().render(), "this is a `test`");
  });

  await t.step("Inline with Markup 1", () => {
    const scanner = new Scanner("`should not be %bold%`");
    assertEquals(scanner.scan().render(), "`should not be %bold%`");
  });

  await t.step("Inline with Markup 2", () => {
    const scanner = new Scanner("`should not be /italic/`");
    assertEquals(scanner.scan().render(), "`should not be /italic/`");
  });

  await t.step("Block", () => {
    const scanner = new Scanner("#\ntest\n#");
    assertEquals(scanner.scan().render(), "```\ntest\n```");
  });

  await t.step("Block with Language", () => {
    const scanner = new Scanner("#ts\ntest\n#");
    assertEquals(scanner.scan().render(), "```ts\ntest\n```");
  });
});
