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
    const scanner = new Scanner("Test!\n* H1");
    assertEquals(scanner.scan().render(), "Test!\n# H1");
  });

  await t.step("Markup", () => {
    const scanner = new Scanner("* /italics/ %bold%");
    assertEquals(scanner.scan().render(), "# *italics* **bold**");
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
