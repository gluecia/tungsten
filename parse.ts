interface Expr {
  render(): string;
}

export class SurroundExpr implements Expr {
  readonly surroundChar: string;
  readonly inner: Expr;

  constructor(inner: Expr, surroundChar: string) {
    this.inner = inner;
    this.surroundChar = surroundChar;
  }

  render(): string {
    return `${this.surroundChar}${this.inner.render()}${this.surroundChar}`;
  }
}

export class StringExpr implements Expr {
  readonly inner: string;

  constructor(inner: string) {
    this.inner = inner;
  }

  render(): string {
    return this.inner;
  }
}

export class CodeExpr implements Expr {
  readonly inner: string;

  constructor(inner: string) {
    this.inner = inner;
  }

  render(): string {
    return `\`\`\`${this.inner}\`\`\``;
  }
}

export class HeadingExpr implements Expr {
  readonly level: number;
  readonly inner: Expr;

  constructor(inner: Expr, level: number) {
    this.inner = inner;
    this.level = level;
  }

  render(): string {
    let output = "";
    for (let i = 0; i < this.level; i++) {
      output += "#";
    }

    return output + this.inner.render();
  }
}

export class LinkExpr implements Expr {
  readonly title: string;
  readonly link: string;

  constructor(title: string, link: string) {
    this.title = title;
    this.link = link;
  }

  render(): string {
    return `[${this.title}](${this.link})`;
  }
}

class RootExpr implements Expr {
  readonly inner: Expr[];

  constructor(inner: Expr[]) {
    this.inner = inner;
  }

  render(): string {
    return this.inner.reduce((acc, expr) => (acc += expr.render()), "");
  }
}

export class Scanner {
  readonly source: string;
  private current: number = 0;
  private start: number = 0;
  private exprList: Expr[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Parses all the code.
   * @returns The RootExpr of the tree.
   */
  scan(): RootExpr {
    while (!this.isAtEnd()) {
      this.exprList.push(this.scanToken());
    }

    return new RootExpr(this.exprList);
  }

  /**
   * Parses one token.
   * @returns The parsed expression.
   */
  scanToken(): Expr {
    const c = this.advance();

    switch (c) {
      case "*":
        return this.heading();
      case "/":
        return this.surroundExpr("/", "*");
      case "%":
        return this.surroundExpr("%", "**");
      case "[":
        return this.link();
      case "`":
        return this.inlineCode();
      case "#":
        return this.codeBlock();
      default:
        return this.string();
    }
  }

  /**
   * Parses a surrounding expression.
   * @param surroundCharacter The current character surrounding the inner string.
   * @param replaceCharacter The character the surrounding character should be replaced by.
   * @returns A SurroundExpr containing the replaceCharacter and the surrounded string.
   */
  private surroundExpr(
    surroundCharacter: string,
    replaceCharacter: string,
  ): SurroundExpr {
    this.start = this.current;
    while (this.peek() !== surroundCharacter && !this.isAtEnd()) {
      this.advance();
    }

    this.advance();

    const scanner = new Scanner(
      this.source.substring(this.start, this.current - 1),
    );
    const inner = scanner.scan();
    return new SurroundExpr(inner, replaceCharacter);
  }

  /**
   * Parses a heading.
   * @returns A HeadingExpr containing the heading level and the text.
   */
  private heading(): HeadingExpr {
    let headingLevel = 1;
    while (this.peek() === "*" && !this.isAtEnd()) {
      this.advance();
      headingLevel += 1;
    }

    this.start = this.current;

    while (this.peek() !== "\n" && !this.isAtEnd()) {
      this.advance();
    }

    this.advance();

    const scanner = new Scanner(
      this.source.substring(this.start, this.current),
    );
    const inner = scanner.scan();
    return new HeadingExpr(inner, headingLevel);
  }

  /**
   * Parses a string of characters.
   * @returns A StringExpr containing all characters in the string.
   */
  private string(): StringExpr {
    const specialCharacters = /[%\/\[]/;

    this.start = this.current - 1;
    if (this.source.charAt(this.start) === "\\" && !this.isAtEnd()) {
      this.advance();
    } else if (this.source.charAt(this.start) === "\n") {
      return new StringExpr("\n");
    }

    while (!specialCharacters.test(this.peek()) && !this.isAtEnd()) {
      const c = this.advance();

      if (c === "\\" && !this.isAtEnd()) {
        this.advance();
      } else if (c === "\n") {
        break;
      }
    }
    return new StringExpr(
      this.source.substring(this.start, this.current).replace(
        /(\\)(.)/gm,
        "$2",
      ),
    );
  }

  /**
   * Parses a link.
   * @returns A RootExpr if malformed or a LinkExpr if the link is properly formed.
   */
  private link(): RootExpr | LinkExpr {
    const start = this.current;
    while (this.peek() !== "|" && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) {
      return new RootExpr([
        new StringExpr("["),
        new Scanner(this.source.substring(start, this.current)).scan(),
      ]);
    }

    const title = this.source.substring(start, this.current);
    this.advance();

    const start2 = this.current;
    while (this.peek() !== "]" && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) {
      return new RootExpr([
        new StringExpr("["),
        new Scanner(title).scan(),
        new StringExpr("|"),
        new Scanner(this.source.substring(start2, this.current)).scan(),
      ]);
    }

    const link = this.source.substring(start2, this.current);
    this.advance();

    return new LinkExpr(title, link);
  }

  /**
   * Parses an inline code block.
   * @returns A RootExpr if malformed or a StringExpr is the code is properly formed,
   */
  private inlineCode(): Expr {
    this.start = this.current - 1;
    while (this.peek() !== "`" && !this.isAtEnd()) {
      const c = this.advance();
      if (c === "\\") {
        this.advance();
      }
    }

    if (this.isAtEnd()) {
      const scanner = new Scanner(
        this.source.substring(this.start + 1, this.current),
      );
      return new RootExpr([new StringExpr("`"), scanner.scan()]);
    }

    this.advance();

    return new StringExpr(this.source.substring(this.start, this.current));
  }

  /**
   * Parses a code block,
   * @returns A RootExpr if malformed or a CodeExpr if the code is properly formed,
   */
  private codeBlock(): Expr {
    this.start = this.current;

    while (this.peek() != "#" && !this.isAtEnd()) {
      const c = this.advance();

      if (c === "\\" && !this.isAtEnd()) {
        this.advance();
      }
    }

    if (this.isAtEnd()) {
      return new RootExpr([
        new StringExpr("#"),
        new Scanner(this.source.substring(this.start, this.current)).scan(),
      ]);
    }

    this.advance();
    return new CodeExpr(this.source.substring(this.start, this.current - 1));
  }

  /**
   * @returns If the current character is at the end.
   */
  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  /**
   * Consumes one character.
   * @returns The consumed character.
   */
  private advance(): string {
    return this.source.charAt(this.current++);
  }

  /**
   * @returns The next character.
   */
  private peek(): string {
    if (this.isAtEnd()) return "\0";

    return this.source.charAt(this.current);
  }
}
