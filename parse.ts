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
  readonly language: string;
  readonly inner: string;

  constructor(inner: string, language: string) {
    this.inner = inner;
    this.language = language;
  }

  render(): string {
    return `\`\`\`${this.language}\n${this.inner}\n\`\`\``;
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

  scan(): RootExpr {
    while (!this.isAtEnd()) {
      this.exprList.push(this.scanToken());
    }

    return new RootExpr(this.exprList);
  }

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
        if (this.match("`")) {
          this.codeBlock();
        } else {
          return this.inlineCode();
        }
      default:
        return this.string();
    }
  }

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

  private link(): Expr {
    const start = this.current;
    while (this.peek() !== "|" && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) {
      return new RootExpr([new StringExpr("["), new Scanner(this.source.substring(start, this.current)).scan()]);
    }

    const title = this.source.substring(start, this.current);
    this.advance();

    const start2 = this.current;
    while (this.peek() !== "]" && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) {
      return new RootExpr([new StringExpr("["), new Scanner(title).scan(), new StringExpr("|"), new Scanner(this.source.substring(start2, this.current)).scan()]);
    }

    const link = this.source.substring(start2, this.current);
    this.advance();

    return new LinkExpr(title, link);
  }

  private inlineCode(): Expr {
    this.start = this.current - 1;
    while (this.peek() !== "`" && !this.isAtEnd()) {
      const c = this.advance();
      if (c === "\\") {
        this.advance();
      }
    }

    if (this.isAtEnd()) {
      const scanner = new Scanner(this.source.substring(this.start + 1, this.current));
      return new RootExpr([new StringExpr("`"), scanner.scan()]);
    }

    this.advance();

    return new StringExpr(this.source.substring(this.start, this.current));
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";

    return this.source.charAt(this.current);
  }

  private match(char: string): boolean {
    if (this.peek() === char) {
      this.advance();
      return true;
    }

    return false;
  }
}
