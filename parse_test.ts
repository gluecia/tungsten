import { Scanner } from "./parse.ts";
import { assertEquals } from "jsr:@std/assert"

Deno.test("Text", async (t) => {
    await t.step("Single Line", () => {
        const scanner = new Scanner("Test!");
        assertEquals(scanner.scan().render(), "Test!");
    });

    await t.step("Multiple Lines", () => {
        const scanner = new Scanner("Test!\nTest again!");
        assertEquals(scanner.scan().render(), "Test!\nTest again!");
    })
})

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
        assertEquals(scanner.scan().render(), "# H1\n## H2\n### H3")
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